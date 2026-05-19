"use server";

import {
  isLikelyBrazilianPlate,
  normalizeBrazilianPlate,
  normalizeNullableText
} from "@kynovia/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../../../lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function redirectToInvites(condominiumId: string, status: string): never {
  revalidatePath(`/dashboard/condominiums/${condominiumId}/invites`);
  redirect(`/dashboard/condominiums/${condominiumId}/invites?status=${status}`);
}

export async function upsertPlateBlacklistAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  const condominiumId = formValue(formData, "condominiumId");
  const plate = normalizeBrazilianPlate(formValue(formData, "plate"));
  const reason = normalizeNullableText(formValue(formData, "reason"));

  if (!condominiumId || !isLikelyBrazilianPlate(plate)) {
    redirectToInvites(condominiumId, "invalid_plate");
  }

  const supabase = await createServerSupabaseClient();
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
    redirectToInvites(condominiumId, "blacklist_save_failed");
  }

  redirectToInvites(condominiumId, "blacklist_saved");
}

export async function disablePlateBlacklistAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const blacklistId = formValue(formData, "blacklistId");

  if (!condominiumId || !blacklistId) {
    redirectToInvites(condominiumId, "missing_blacklist_id");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("vehicle_plate_blacklist")
    .update({ status: "inactive" })
    .eq("id", blacklistId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToInvites(condominiumId, "blacklist_disable_failed");
  }

  redirectToInvites(condominiumId, "blacklist_disabled");
}
