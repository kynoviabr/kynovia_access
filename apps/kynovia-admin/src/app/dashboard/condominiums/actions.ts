"use server";

import { defaultCondominiumTimezone, normalizeSlug } from "@kynovia/database";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requirePlatformAdmin(role: string) {
  if (role !== "platform_admin") {
    redirect("/dashboard/condominiums?error=insufficient_role");
  }
}

export async function createCondominiumAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requirePlatformAdmin(profile.role);

  const name = formValue(formData, "name");
  const slug = formValue(formData, "slug") || normalizeSlug(name);
  const timezone = formValue(formData, "timezone") || defaultCondominiumTimezone;

  if (!name || !slug) {
    redirect("/dashboard/condominiums?error=missing_condominium_fields");
  }

  const condominiumId = randomUUID();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("condominiums").insert({
    id: condominiumId,
    tenant_id: profile.tenantId,
    name,
    slug,
    timezone
  });

  if (error) {
    redirect("/dashboard/condominiums?error=create_condominium_failed");
  }

  revalidatePath("/dashboard/condominiums");
  redirect(`/dashboard/condominiums?status=condominium_created&created=${condominiumId}`);
}
