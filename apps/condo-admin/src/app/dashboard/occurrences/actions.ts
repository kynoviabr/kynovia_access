"use server";

import {
  isOccurrenceSeverity,
  isOccurrenceStatus,
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
  if (!["condominium_admin", "syndic", "manager", "doorman_supervisor"].includes(role)) {
    redirect("/dashboard?error=insufficient_role");
  }
}

function redirectToOccurrences(status: string): never {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/occurrences");
  redirect(`/dashboard/occurrences?status=${status}`);
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

export async function createOccurrenceAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const title = formValue(formData, "title");
  const severity = formValue(formData, "severity") || "medium";

  if (!condominiumId || !title || !isOccurrenceSeverity(severity)) {
    redirectToOccurrences("missing_occurrence_fields");
  }

  const { profile, supabase } = await ensureCondominiumAccess(condominiumId);
  const { error } = await supabase.from("gatehouse_occurrences").insert({
    tenant_id: profile.tenantId,
    condominium_id: condominiumId,
    title,
    description: normalizeNullableText(formValue(formData, "description")),
    severity,
    status: "open",
    created_by: profile.id
  });

  if (error) {
    redirectToOccurrences("create_occurrence_failed");
  }

  redirectToOccurrences("occurrence_created");
}

export async function updateOccurrenceAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominiumId");
  const occurrenceId = formValue(formData, "occurrenceId");
  const title = formValue(formData, "title");
  const severity = formValue(formData, "severity");
  const status = formValue(formData, "status");

  if (
    !condominiumId ||
    !occurrenceId ||
    !title ||
    !isOccurrenceSeverity(severity) ||
    !isOccurrenceStatus(status)
  ) {
    redirectToOccurrences("missing_occurrence_fields");
  }

  const { profile, supabase } = await ensureCondominiumAccess(condominiumId);
  const isClosed = status === "resolved" || status === "dismissed";
  const { error } = await supabase
    .from("gatehouse_occurrences")
    .update({
      title,
      description: normalizeNullableText(formValue(formData, "description")),
      severity,
      status,
      resolved_at: isClosed ? new Date().toISOString() : null,
      resolved_by: isClosed ? profile.id : null
    })
    .eq("id", occurrenceId)
    .eq("condominium_id", condominiumId);

  if (error) {
    redirectToOccurrences("update_occurrence_failed");
  }

  redirectToOccurrences("occurrence_updated");
}
