"use server";

import { parseInviteQrPayload } from "@kynovia/database";
import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

type InviteValidationResult =
  | "allowed"
  | "cancelled"
  | "expired"
  | "invalid"
  | "not_started"
  | "usage_limit_reached";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function hashInviteToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function validationRedirect(result: InviteValidationResult, inviteId?: string): never {
  revalidatePath("/dashboard/invites");
  const params = new URLSearchParams({ result });

  if (inviteId) {
    params.set("invite", inviteId);
  }

  redirect(`/dashboard/invites?${params.toString()}`);
}

export async function validateInviteQrAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  const parsed = parseInviteQrPayload(formValue(formData, "qrPayload"));

  if (!parsed) {
    validationRedirect("invalid");
  }

  const supabase = await createServerSupabaseClient();
  const { data: invite } = await supabase
    .from("access_invites")
    .select(
      "id, tenant_id, condominium_id, starts_at, expires_at, max_uses, use_count, status, visitor_name"
    )
    .eq("id", parsed.inviteId)
    .eq("qr_token_hash", hashInviteToken(parsed.token))
    .maybeSingle();

  if (!invite) {
    validationRedirect("invalid");
  }

  const now = Date.now();
  let result: InviteValidationResult = "allowed";
  let reason = `Convite valido para ${invite.visitor_name}.`;

  if (invite.status === "cancelled") {
    result = "cancelled";
    reason = "Convite cancelado.";
  } else if (invite.status !== "active") {
    result = "invalid";
    reason = `Convite com status ${invite.status}.`;
  } else if (new Date(invite.starts_at).getTime() > now) {
    result = "not_started";
    reason = "Convite ainda nao esta vigente.";
  } else if (new Date(invite.expires_at).getTime() < now) {
    result = "expired";
    reason = "Convite expirado.";
  } else if (invite.use_count >= invite.max_uses) {
    result = "usage_limit_reached";
    reason = "Limite de usos atingido.";
  }

  if (result === "allowed") {
    const nextUseCount = invite.use_count + 1;
    const nextStatus = nextUseCount >= invite.max_uses ? "used" : "active";

    await supabase
      .from("access_invites")
      .update({ use_count: nextUseCount, status: nextStatus })
      .eq("id", invite.id)
      .eq("use_count", invite.use_count);
  }

  await supabase.from("access_invite_validations").insert({
    tenant_id: invite.tenant_id,
    condominium_id: invite.condominium_id,
    invite_id: invite.id,
    validated_by: profile.id,
    result,
    reason
  });

  validationRedirect(result, invite.id);
}
