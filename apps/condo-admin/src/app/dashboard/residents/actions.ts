"use server";

import {
  isLikelyBrazilianPlate,
  isResidentStatus,
  isResidentUnitRelationship,
  normalizeBrazilianPlate,
  normalizeNullableText,
  normalizePhone
} from "@kynovia/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function formBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function requireCondoManager(role: string) {
  if (!["condominium_admin", "syndic", "manager", "resident_manager"].includes(role)) {
    redirect("/dashboard?error=insufficient_role");
  }
}

function residentsPath() {
  return "/dashboard/residents";
}

function redirectToResidents(status: string) {
  revalidatePath("/dashboard");
  revalidatePath(residentsPath());
  redirect(`${residentsPath()}?status=${status}`);
}

function statusFields(status: string, blockReason: string) {
  return {
    block_reason: status === "blocked" ? normalizeNullableText(blockReason) : null,
    blocked_at: status === "blocked" ? new Date().toISOString() : null,
    status
  };
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

export async function createResidentAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const fullName = formValue(formData, "fullName");
  const status = formValue(formData, "status") || "active";
  const unitId = formValue(formData, "unitId");
  const relationship = formValue(formData, "relationship") || "resident";

  if (
    !condominiumId ||
    !fullName ||
    !unitId ||
    !isResidentStatus(status) ||
    !isResidentUnitRelationship(relationship)
  ) {
    redirectToResidents("missing_resident_fields");
  }

  const { profile, supabase } = await ensureCondominiumAccess(condominiumId);
  const { data: resident, error } = await supabase
    .from("residents")
    .insert({
      tenant_id: profile.tenantId,
      condominium_id: condominiumId,
      full_name: fullName,
      document: normalizeNullableText(formValue(formData, "document")),
      phone: normalizeNullableText(normalizePhone(formValue(formData, "phone"))),
      email: normalizeNullableText(formValue(formData, "email")),
      ...statusFields(status, formValue(formData, "blockReason"))
    })
    .select("id")
    .single();

  const residentId = resident?.id ?? "";
  if (error || !residentId) {
    redirectToResidents("create_resident_failed");
  }

  const { error: linkError } = await supabase.from("resident_units").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    resident_id: residentId,
    unit_id: unitId,
    relationship,
    is_primary: true
  });

  if (linkError) {
    redirectToResidents("link_unit_failed");
  }

  redirectToResidents("resident_created");
}

export async function updateResidentAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const residentId = formValue(formData, "residentId");
  const fullName = formValue(formData, "fullName");
  const status = formValue(formData, "status");

  if (!condominiumId || !residentId || !fullName || !isResidentStatus(status)) {
    redirectToResidents("missing_resident_fields");
  }

  const { supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase
    .from("residents")
    .update({
      full_name: fullName,
      document: normalizeNullableText(formValue(formData, "document")),
      phone: normalizeNullableText(normalizePhone(formValue(formData, "phone"))),
      email: normalizeNullableText(formValue(formData, "email")),
      ...statusFields(status, formValue(formData, "blockReason"))
    })
    .eq("id", residentId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToResidents("update_resident_failed");
  }

  redirectToResidents("resident_updated");
}

export async function deleteResidentAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const residentId = formValue(formData, "residentId");

  if (!condominiumId || !residentId) {
    redirectToResidents("missing_resident_id");
  }

  const { supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase
    .from("residents")
    .delete()
    .eq("id", residentId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToResidents("delete_resident_failed");
  }

  redirectToResidents("resident_deleted");
}

export async function linkResidentUnitAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const residentId = formValue(formData, "residentId");
  const unitId = formValue(formData, "unitId");
  const relationship = formValue(formData, "relationship") || "resident";

  if (!condominiumId || !residentId || !unitId || !isResidentUnitRelationship(relationship)) {
    redirectToResidents("missing_unit_link_fields");
  }

  const { profile, supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase.from("resident_units").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    resident_id: residentId,
    unit_id: unitId,
    relationship,
    is_primary: formBoolean(formData, "isPrimary")
  });

  if (error) {
    redirectToResidents("link_unit_failed");
  }

  redirectToResidents("unit_linked");
}

export async function unlinkResidentUnitAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const residentUnitId = formValue(formData, "residentUnitId");

  if (!condominiumId || !residentUnitId) {
    redirectToResidents("missing_unit_link_id");
  }

  const { supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase
    .from("resident_units")
    .delete()
    .eq("id", residentUnitId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToResidents("unlink_unit_failed");
  }

  redirectToResidents("unit_unlinked");
}

export async function createResidentVehicleAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const residentId = formValue(formData, "residentId");
  const plate = normalizeBrazilianPlate(formValue(formData, "plate"));

  if (!condominiumId || !residentId || !isLikelyBrazilianPlate(plate)) {
    redirectToResidents("invalid_vehicle_plate");
  }

  const { profile, supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase.from("resident_vehicles").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    resident_id: residentId,
    plate,
    label: normalizeNullableText(formValue(formData, "label"))
  });

  if (error) {
    redirectToResidents("create_vehicle_failed");
  }

  redirectToResidents("vehicle_created");
}

export async function updateResidentVehicleAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const vehicleId = formValue(formData, "vehicleId");
  const plate = normalizeBrazilianPlate(formValue(formData, "plate"));
  const status = formValue(formData, "status");

  if (!condominiumId || !vehicleId || !isLikelyBrazilianPlate(plate) || !isResidentStatus(status)) {
    redirectToResidents("invalid_vehicle_fields");
  }

  const { supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase
    .from("resident_vehicles")
    .update({
      label: normalizeNullableText(formValue(formData, "label")),
      plate,
      ...statusFields(status, formValue(formData, "blockReason"))
    })
    .eq("id", vehicleId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToResidents("update_vehicle_failed");
  }

  redirectToResidents("vehicle_updated");
}

export async function deleteResidentVehicleAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const vehicleId = formValue(formData, "vehicleId");

  if (!condominiumId || !vehicleId) {
    redirectToResidents("missing_vehicle_id");
  }

  const { supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase
    .from("resident_vehicles")
    .delete()
    .eq("id", vehicleId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToResidents("delete_vehicle_failed");
  }

  redirectToResidents("vehicle_deleted");
}
