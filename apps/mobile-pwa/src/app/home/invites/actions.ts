"use server";

import {
  isInviteType,
  isLikelyBrazilianPlate,
  normalizeBrazilianPlate,
  normalizeInviteUsageLimit,
  normalizeNullableText,
  normalizePhone
} from "@kynovia/database";
import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toIsoDateTime(value: string, fallback: Date) {
  if (!value) {
    return fallback.toISOString();
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback.toISOString() : parsed.toISOString();
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function getResidentUnitContext(unitId: string) {
  const profile = await requireAuthorizedProfile();
  const supabase = await createServerSupabaseClient();

  const { data: resident } = await supabase
    .from("residents")
    .select("id, tenant_id, condominium_id, status")
    .eq("profile_id", profile.id)
    .eq("tenant_id", profile.tenantId)
    .maybeSingle();

  if (!resident || resident.status !== "active") {
    redirect("/home/invites?error=resident_not_active");
  }

  const { data: residentUnit } = await supabase
    .from("resident_units")
    .select("unit_id")
    .eq("resident_id", resident.id)
    .eq("unit_id", unitId)
    .eq("condominium_id", resident.condominium_id)
    .maybeSingle();

  if (!residentUnit) {
    redirect("/home/invites?error=unit_not_allowed");
  }

  return { profile, resident, unitId };
}

export async function createInviteAction(formData: FormData) {
  const unitId = formValue(formData, "unitId");
  const visitorName = formValue(formData, "visitorName");
  const startsAt = formValue(formData, "startsAt");
  const expiresAt = formValue(formData, "expiresAt");
  const plateInput = formValue(formData, "plate");
  const inviteTypeInput = formValue(formData, "inviteType");
  const inviteType = isInviteType(inviteTypeInput) ? inviteTypeInput : "single";
  const plate = plateInput ? normalizeBrazilianPlate(plateInput) : null;

  if (!unitId || !visitorName || !expiresAt) {
    redirect("/home/invites?error=missing_invite_fields");
  }

  const now = new Date();
  const startIso = toIsoDateTime(startsAt, now);
  const expiresIso = toIsoDateTime(expiresAt, new Date(now.getTime() + 60 * 60 * 1000));

  if (new Date(expiresIso).getTime() <= new Date(startIso).getTime()) {
    redirect("/home/invites?error=invalid_invite_window");
  }

  if (plate && !isLikelyBrazilianPlate(plate)) {
    redirect("/home/invites?error=invalid_plate");
  }

  const { profile, resident } = await getResidentUnitContext(unitId);
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashInviteToken(token);
  const supabase = await createServerSupabaseClient();
  const { data: invite, error } = await supabase
    .from("access_invites")
    .insert({
      tenant_id: profile.tenantId,
      condominium_id: resident.condominium_id,
      unit_id: unitId,
      resident_id: resident.id,
      visitor_name: visitorName,
      visitor_phone: normalizeNullableText(normalizePhone(formValue(formData, "visitorPhone"))),
      plate,
      starts_at: startIso,
      expires_at: expiresIso,
      max_uses: normalizeInviteUsageLimit(formValue(formData, "maxUses")),
      invite_type: inviteType,
      recurrence_rule:
        inviteType === "recurring" ? normalizeNullableText(formValue(formData, "recurrenceRule")) : null,
      qr_token_hash: tokenHash,
      qr_token_expires_at: expiresIso
    })
    .select("id")
    .single();

  if (error || !invite) {
    redirect("/home/invites?error=create_invite_failed");
  }

  revalidatePath("/home/invites");
  redirect(`/home/invites?status=invite_created&created=${invite.id}&token=${token}`);
}

export async function cancelInviteAction(formData: FormData) {
  const inviteId = formValue(formData, "inviteId");
  const unitId = formValue(formData, "unitId");

  if (!inviteId || !unitId) {
    redirect("/home/invites?error=missing_invite_id");
  }

  const { profile } = await getResidentUnitContext(unitId);
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("access_invites")
    .update({
      status: "cancelled",
      cancelled_by: profile.id,
      cancelled_at: new Date().toISOString()
    })
    .eq("id", inviteId)
    .eq("unit_id", unitId)
    .eq("status", "active");

  if (error) {
    redirect("/home/invites?error=cancel_invite_failed");
  }

  revalidatePath("/home/invites");
  redirect("/home/invites?status=invite_cancelled");
}
