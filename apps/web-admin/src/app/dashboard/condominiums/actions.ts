"use server";

import { randomUUID } from "node:crypto";
import {
  isAccessPointKind,
  normalizeNullableText,
  normalizeSlug,
  parseJsonObject,
  parseNonNegativeInteger
} from "@kynovia/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function requireCondominiumManager(role: string) {
  if (!["platform_admin", "tenant_admin"].includes(role)) {
    redirect("/dashboard/condominiums?error=insufficient_role");
  }
}

function redirectToCondominium(condominiumId: string, status: string) {
  revalidatePath("/dashboard/condominiums");
  revalidatePath(`/dashboard/condominiums/${condominiumId}`);
  redirect(`/dashboard/condominiums/${condominiumId}?status=${status}`);
}

export async function createCondominiumAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requireCondominiumManager(profile.role);

  const name = formValue(formData, "name");
  const slug = formValue(formData, "slug") || normalizeSlug(name);
  const timezone = formValue(formData, "timezone") || "America/Sao_Paulo";

  if (!name || !slug) {
    redirect("/dashboard/condominiums?error=missing_condominium_fields");
  }

  const supabase = await createServerSupabaseClient();
  const condominiumId = randomUUID();
  const { error } = await supabase
    .from("condominiums")
    .insert({
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
  redirect(`/dashboard/condominiums/${condominiumId}?status=condominium_created`);
}

export async function updateCondominiumAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requireCondominiumManager(profile.role);

  const condominiumId = formValue(formData, "condominiumId");
  const name = formValue(formData, "name");
  const slug = formValue(formData, "slug") || normalizeSlug(name);
  const timezone = formValue(formData, "timezone") || "America/Sao_Paulo";

  if (!condominiumId || !name || !slug) {
    redirect("/dashboard/condominiums?error=missing_condominium_fields");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("condominiums")
    .update({ name, slug, timezone })
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId);

  if (error) {
    redirectToCondominium(condominiumId, "update_condominium_failed");
  }

  redirectToCondominium(condominiumId, "condominium_updated");
}

export async function updateCondominiumSettingsAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requireCondominiumManager(profile.role);

  const condominiumId = formValue(formData, "condominiumId");
  const visitorParkingCapacity = parseNonNegativeInteger(
    formValue(formData, "visitorParkingCapacity")
  );

  if (!condominiumId) {
    redirect("/dashboard/condominiums?error=missing_condominium_id");
  }

  let settings;
  let operationalRules;
  let metadata;

  try {
    settings = parseJsonObject(formValue(formData, "settings"));
    operationalRules = parseJsonObject(formValue(formData, "operationalRules"));
    metadata = parseJsonObject(formValue(formData, "metadata"));
  } catch {
    redirectToCondominium(condominiumId, "invalid_json");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("condominiums")
    .update({
      settings,
      operational_rules: operationalRules,
      visitor_parking_capacity: visitorParkingCapacity,
      metadata
    })
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId);

  if (error) {
    redirectToCondominium(condominiumId, "update_settings_failed");
  }

  redirectToCondominium(condominiumId, "settings_updated");
}

export async function deleteCondominiumAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requireCondominiumManager(profile.role);

  const condominiumId = formValue(formData, "condominiumId");

  if (!condominiumId) {
    redirect("/dashboard/condominiums?error=missing_condominium_id");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("condominiums")
    .delete()
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId);

  if (error) {
    redirectToCondominium(condominiumId, "delete_condominium_failed");
  }

  revalidatePath("/dashboard/condominiums");
  redirect("/dashboard/condominiums?status=condominium_deleted");
}

export async function createUnitAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  const condominiumId = formValue(formData, "condominiumId");
  const number = formValue(formData, "number");

  if (!condominiumId || !number) {
    redirectToCondominium(condominiumId, "missing_unit_fields");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("units").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    block: normalizeNullableText(formValue(formData, "block")),
    number,
    floor: normalizeNullableText(formValue(formData, "floor"))
  });

  if (error) {
    redirectToCondominium(condominiumId, "create_unit_failed");
  }

  redirectToCondominium(condominiumId, "unit_created");
}

export async function updateUnitAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const unitId = formValue(formData, "unitId");
  const number = formValue(formData, "number");

  if (!condominiumId || !unitId || !number) {
    redirectToCondominium(condominiumId, "missing_unit_fields");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("units")
    .update({
      block: normalizeNullableText(formValue(formData, "block")),
      number,
      floor: normalizeNullableText(formValue(formData, "floor"))
    })
    .eq("id", unitId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToCondominium(condominiumId, "update_unit_failed");
  }

  redirectToCondominium(condominiumId, "unit_updated");
}

export async function deleteUnitAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const unitId = formValue(formData, "unitId");

  if (!condominiumId || !unitId) {
    redirectToCondominium(condominiumId, "missing_unit_id");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("units")
    .delete()
    .eq("id", unitId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToCondominium(condominiumId, "delete_unit_failed");
  }

  redirectToCondominium(condominiumId, "unit_deleted");
}

export async function createAccessPointAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  const condominiumId = formValue(formData, "condominiumId");
  const name = formValue(formData, "name");
  const kind = formValue(formData, "kind");

  if (!condominiumId || !name || !isAccessPointKind(kind)) {
    redirectToCondominium(condominiumId, "missing_access_point_fields");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("access_points").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    name,
    kind
  });

  if (error) {
    redirectToCondominium(condominiumId, "create_access_point_failed");
  }

  redirectToCondominium(condominiumId, "access_point_created");
}

export async function deleteAccessPointAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const accessPointId = formValue(formData, "accessPointId");

  if (!condominiumId || !accessPointId) {
    redirectToCondominium(condominiumId, "missing_access_point_id");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("access_points")
    .delete()
    .eq("id", accessPointId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToCondominium(condominiumId, "delete_access_point_failed");
  }

  redirectToCondominium(condominiumId, "access_point_deleted");
}
