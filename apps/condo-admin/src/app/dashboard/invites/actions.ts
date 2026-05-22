"use server";

import {
  isLikelyBrazilianPlate,
  normalizeBrazilianPlate,
  normalizeNullableText
} from "@kynovia/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requireCondoManager(role: string) {
  if (
    ![
      "tenant_admin",
      "condominium_admin",
      "syndic",
      "manager",
      "doorman_supervisor",
      "resident_manager"
    ].includes(role)
  ) {
    redirect("/dashboard?error=insufficient_role");
  }
}

function invitesPath() {
  return "/dashboard/invites";
}

function redirectToInvites(status: string): never {
  revalidatePath("/dashboard");
  revalidatePath(invitesPath());
  redirect(`${invitesPath()}?status=${status}`);
}

async function ensureCondominiumAccess(condominiumId: string) {
  const profile = await requireAuthorizedProfile();
  requireCondoManager(profile.role);

  const supabase = await createServerSupabaseClient();
  const { data: condominium } = await supabase
    .from("condominiums")
    .select("id")
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId)
    .maybeSingle();

  if (!condominium) {
    redirect("/dashboard?error=condominium_access_denied");
  }

  return { profile, supabase };
}

export async function upsertPlateBlacklistAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const plate = normalizeBrazilianPlate(formValue(formData, "plate"));
  const reason = normalizeNullableText(formValue(formData, "reason"));

  if (!condominiumId || !isLikelyBrazilianPlate(plate)) {
    redirectToInvites("invalid_plate");
  }

  const { profile, supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase.from("vehicle_plate_blacklist").upsert(
    {
      tenant_id: profile.tenantId,
      condominium_id: condominiumId,
      plate,
      reason,
      status: "active",
      created_by: profile.id
    },
    { onConflict: "condominium_id,plate" }
  );

  if (error) {
    redirectToInvites("blacklist_save_failed");
  }

  redirectToInvites("blacklist_saved");
}

export async function disablePlateBlacklistAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const blacklistId = formValue(formData, "blacklistId");

  if (!condominiumId || !blacklistId) {
    redirectToInvites("missing_blacklist_id");
  }

  const { supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase
    .from("vehicle_plate_blacklist")
    .update({ status: "inactive" })
    .eq("id", blacklistId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToInvites("blacklist_disable_failed");
  }

  redirectToInvites("blacklist_disabled");
}
