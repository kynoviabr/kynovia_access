"use server";

import {
  isLikelyBrazilianPlate,
  normalizeBrazilianPlate,
  normalizeNullableText,
  normalizePhone
} from "@kynovia/database";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../../../lib/supabase/server";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function visitorsPath(condominiumId: string) {
  return `/dashboard/condominiums/${condominiumId}/visitors`;
}

function redirectToVisitors(condominiumId: string, status: string) {
  revalidatePath(visitorsPath(condominiumId));
  redirect(`${visitorsPath(condominiumId)}?status=${status}`);
}

export async function createVisitorAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  const condominiumId = formValue(formData, "condominiumId");
  const fullName = formValue(formData, "fullName");

  if (!condominiumId || !fullName) {
    redirectToVisitors(condominiumId, "missing_visitor_fields");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("visitors").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    full_name: fullName,
    document: normalizeNullableText(formValue(formData, "document")),
    phone: normalizeNullableText(normalizePhone(formValue(formData, "phone"))),
    notes: normalizeNullableText(formValue(formData, "notes"))
  });

  if (error) {
    redirectToVisitors(condominiumId, "create_visitor_failed");
  }

  redirectToVisitors(condominiumId, "visitor_created");
}

export async function updateVisitorAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const visitorId = formValue(formData, "visitorId");
  const fullName = formValue(formData, "fullName");

  if (!condominiumId || !visitorId || !fullName) {
    redirectToVisitors(condominiumId, "missing_visitor_fields");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("visitors")
    .update({
      full_name: fullName,
      document: normalizeNullableText(formValue(formData, "document")),
      phone: normalizeNullableText(normalizePhone(formValue(formData, "phone"))),
      notes: normalizeNullableText(formValue(formData, "notes"))
    })
    .eq("id", visitorId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToVisitors(condominiumId, "update_visitor_failed");
  }

  redirectToVisitors(condominiumId, "visitor_updated");
}

export async function deleteVisitorAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const visitorId = formValue(formData, "visitorId");

  if (!condominiumId || !visitorId) {
    redirectToVisitors(condominiumId, "missing_visitor_id");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("visitors")
    .delete()
    .eq("id", visitorId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToVisitors(condominiumId, "delete_visitor_failed");
  }

  redirectToVisitors(condominiumId, "visitor_deleted");
}

export async function createVisitorVehicleAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  const condominiumId = formValue(formData, "condominiumId");
  const visitorId = formValue(formData, "visitorId");
  const plate = normalizeBrazilianPlate(formValue(formData, "plate"));

  if (!condominiumId || !visitorId || !isLikelyBrazilianPlate(plate)) {
    redirectToVisitors(condominiumId, "invalid_visitor_vehicle_plate");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("visitor_vehicles").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    visitor_id: visitorId,
    plate
  });

  if (error) {
    redirectToVisitors(condominiumId, "create_visitor_vehicle_failed");
  }

  redirectToVisitors(condominiumId, "visitor_vehicle_created");
}

export async function deleteVisitorVehicleAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const visitorVehicleId = formValue(formData, "visitorVehicleId");

  if (!condominiumId || !visitorVehicleId) {
    redirectToVisitors(condominiumId, "missing_visitor_vehicle_id");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("visitor_vehicles")
    .delete()
    .eq("id", visitorVehicleId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToVisitors(condominiumId, "delete_visitor_vehicle_failed");
  }

  redirectToVisitors(condominiumId, "visitor_vehicle_deleted");
}

export async function createVisitorUnitVisitAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  const condominiumId = formValue(formData, "condominiumId");
  const visitorId = formValue(formData, "visitorId");
  const unitId = formValue(formData, "unitId");
  const occurredAt = formValue(formData, "occurredAt");

  if (!condominiumId || !visitorId || !unitId) {
    redirectToVisitors(condominiumId, "missing_visit_fields");
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("visitor_unit_visits").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    visitor_id: visitorId,
    unit_id: unitId,
    occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
    notes: normalizeNullableText(formValue(formData, "notes"))
  });

  if (error) {
    redirectToVisitors(condominiumId, "create_visit_failed");
  }

  redirectToVisitors(condominiumId, "visit_created");
}
