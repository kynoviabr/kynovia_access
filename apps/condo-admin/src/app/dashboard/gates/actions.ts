"use server";

import { isAccessPointKind } from "@kynovia/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requireCondoManager(role: string) {
  if (!["condominium_admin", "syndic", "manager", "doorman_supervisor"].includes(role)) {
    redirect("/dashboard?error=insufficient_role");
  }
}

function redirectToGates(status: string): never {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/gates");
  redirect(`/dashboard/gates?status=${status}`);
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

export async function createAccessPointAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const name = formValue(formData, "name");
  const kind = formValue(formData, "kind");

  if (!condominiumId || !name || !isAccessPointKind(kind)) {
    redirectToGates("missing_access_point_fields");
  }

  const { profile, supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase.from("access_points").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    name,
    kind
  });

  if (error) {
    redirectToGates("create_access_point_failed");
  }

  redirectToGates("access_point_created");
}

export async function updateAccessPointAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const accessPointId = formValue(formData, "accessPointId");
  const name = formValue(formData, "name");
  const kind = formValue(formData, "kind");

  if (!condominiumId || !accessPointId || !name || !isAccessPointKind(kind)) {
    redirectToGates("missing_access_point_fields");
  }

  const { supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase
    .from("access_points")
    .update({ name, kind })
    .eq("id", accessPointId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToGates("update_access_point_failed");
  }

  redirectToGates("access_point_updated");
}

export async function deleteAccessPointAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const accessPointId = formValue(formData, "accessPointId");

  if (!condominiumId || !accessPointId) {
    redirectToGates("missing_access_point_id");
  }

  const { supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase
    .from("access_points")
    .delete()
    .eq("id", accessPointId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToGates("delete_access_point_failed");
  }

  redirectToGates("access_point_deleted");
}
