"use server";

import { defaultCondominiumTimezone } from "@kynovia/database";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { brazilStates, brazilTimezones } from "./form-options";

function formValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function condominiumPath(condominiumId?: string) {
  return condominiumId ? `/dashboard/condominiums/${condominiumId}` : "/dashboard/condominiums";
}

function financePath(condominiumId?: string) {
  return condominiumId ? `/dashboard/finance/${condominiumId}` : "/dashboard/finance";
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function isValidCnpjFormat(value: string) {
  const digits = onlyDigits(value);

  if (!/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/.test(value) || digits.length !== 14) {
    return false;
  }

  if (/^(\d)\1{13}$/.test(digits)) {
    return false;
  }

  const calculateDigit = (base: string, weights: number[]) => {
    const sum = weights.reduce((total, weight, index) => total + Number(base[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calculateDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calculateDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(digits[12]) && secondDigit === Number(digits[13]);
}

function isValidPhoneFormat(value: string) {
  return /^\(\d{2}\) \d{5}-\d{4}$/.test(value);
}

function isValidCepFormat(value: string) {
  return /^\d{5}-\d{3}$/.test(value);
}

function isValidBrazilState(value: string) {
  return brazilStates.includes(value as (typeof brazilStates)[number]);
}

function isValidBrazilTimezone(value: string) {
  return brazilTimezones.includes(value as (typeof brazilTimezones)[number]);
}

function getClientFields(formData: FormData) {
  return {
    email: formValue(formData, "client_email").toLowerCase(),
    phone: formValue(formData, "client_phone"),
    cnpj: formValue(formData, "client_cnpj"),
    address: {
      line: formValue(formData, "address_line"),
      number: formValue(formData, "address_number"),
      complement: formValue(formData, "address_complement"),
      city: formValue(formData, "address_city"),
      state: formValue(formData, "address_state").toUpperCase(),
      postal_code: formValue(formData, "address_postal_code")
    }
  };
}

function metadataObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function financeObject(value: unknown): Record<string, unknown> {
  return metadataObject(metadataObject(value).finance);
}

function paymentList(value: unknown) {
  const payments = financeObject(value).payments;
  return Array.isArray(payments) ? payments : [];
}

function moneyValue(value: string) {
  const normalized = value.replace(/\./g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function hasValidClientFields(client: ReturnType<typeof getClientFields>, timezone: string) {
  return (
    client.email.includes("@") &&
    isValidPhoneFormat(client.phone) &&
    isValidCnpjFormat(client.cnpj) &&
    Boolean(client.address.line) &&
    Boolean(client.address.number) &&
    Boolean(client.address.city) &&
    isValidBrazilState(client.address.state) &&
    isValidCepFormat(client.address.postal_code) &&
    isValidBrazilTimezone(timezone)
  );
}

function requirePlatformAdmin(role: string) {
  if (role !== "platform_admin") {
    redirect("/dashboard/condominiums?error=insufficient_role");
  }
}

function getServiceRoleConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

function getCondoAdminUrl() {
  return process.env.NEXT_PUBLIC_CONDO_ADMIN_URL || "http://localhost:3004";
}

function emailHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function sendClientAccessEmail({
  condominiumName,
  email,
  fullName,
  temporaryPassword
}: {
  condominiumName: string;
  email: string;
  fullName: string;
  temporaryPassword: string;
}) {
  const provider = process.env.EMAIL_PROVIDER?.toLowerCase();
  const from = process.env.EMAIL_FROM;
  const resendApiKey = process.env.RESEND_API_KEY;
  const condoAdminUrl = getCondoAdminUrl();

  if (provider !== "resend" || !from || !resendApiKey) {
    return "not_configured" as const;
  }

  const subject = `Acesso ao Kynovia Access - ${condominiumName}`;
  const text = [
    `Olá, ${fullName}.`,
    "",
    `Seu acesso administrativo ao condomínio ${condominiumName} foi criado no Kynovia Access.`,
    "",
    `URL de acesso: ${condoAdminUrl}/login`,
    `E-mail: ${email}`,
    `Senha temporária: ${temporaryPassword}`,
    "",
    "Recomendamos alterar a senha após o primeiro acesso.",
    "",
    "Kynovia"
  ].join("\n");
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827">
      <h1 style="font-size:20px">Acesso ao Kynovia Access</h1>
      <p>Olá, ${emailHtml(fullName)}.</p>
      <p>Seu acesso administrativo ao condomínio <strong>${emailHtml(condominiumName)}</strong> foi criado.</p>
      <ul>
        <li><strong>URL de acesso:</strong> <a href="${emailHtml(condoAdminUrl)}/login">${emailHtml(condoAdminUrl)}/login</a></li>
        <li><strong>E-mail:</strong> ${emailHtml(email)}</li>
        <li><strong>Senha temporária:</strong> ${emailHtml(temporaryPassword)}</li>
      </ul>
      <p>Recomendamos alterar a senha após o primeiro acesso.</p>
      <p>Kynovia</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from,
      to: email,
      subject,
      text,
      html
    })
  });

  return response.ok ? ("sent" as const) : ("failed" as const);
}

async function serviceRoleRequest(path: string, init: RequestInit) {
  const config = getServiceRoleConfig();

  if (!config) {
    redirect("/dashboard/condominiums?error=service_role_missing");
  }

  const headers = new Headers(init.headers);
  headers.set("apikey", config.serviceRoleKey);
  headers.set("Authorization", `Bearer ${config.serviceRoleKey}`);
  headers.set("Content-Type", "application/json");

  return fetch(`${config.url}${path}`, {
    ...init,
    cache: "no-store",
    headers
  });
}

export async function createCondominiumAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requirePlatformAdmin(profile.role);

  const name = formValue(formData, "name");
  const slug = formValue(formData, "slug");
  const timezone = formValue(formData, "timezone") || defaultCondominiumTimezone;
  const client = getClientFields(formData);

  if (!name || !slug) {
    redirect("/dashboard/condominiums/new?error=missing_condominium_fields");
  }

  if (!hasValidClientFields(client, timezone)) {
    redirect("/dashboard/condominiums/new?error=invalid_client_fields");
  }

  const condominiumId = randomUUID();
  const supabase = await createServerSupabaseClient();
  const { data: duplicateCnpj } = await supabase
    .from("condominiums")
    .select("id")
    .eq("tenant_id", profile.tenantId)
    .contains("metadata", { client: { cnpj: client.cnpj } })
    .maybeSingle();

  if (duplicateCnpj) {
    redirect("/dashboard/condominiums/new?error=duplicate_cnpj");
  }

  const { error } = await supabase.from("condominiums").insert({
    id: condominiumId,
    tenant_id: profile.tenantId,
    name,
    slug,
    timezone,
    metadata: { client }
  });

  if (error) {
    redirect("/dashboard/condominiums/new?error=create_condominium_failed");
  }

  revalidatePath("/dashboard/condominiums");
  revalidatePath("/dashboard/condominiums/new");
  redirect(`/dashboard/condominiums/new?status=condominium_created&created=${condominiumId}`);
}

export async function createCondominiumAdminAction(formData: FormData) {
  return createCondominiumAdmin(formData, "/dashboard/condominiums/new");
}

export async function createCondominiumAdminFromDetailAction(formData: FormData) {
  const condominiumId = formValue(formData, "condominium_id");
  return createCondominiumAdmin(formData, condominiumPath(condominiumId));
}

async function createCondominiumAdmin(formData: FormData, returnPath: string) {
  const profile = await requireAuthorizedProfile();
  requirePlatformAdmin(profile.role);

  const condominiumId = formValue(formData, "condominium_id");
  const fullName = formValue(formData, "full_name");
  const email = formValue(formData, "email").toLowerCase();
  const temporaryPassword = formValue(formData, "temporary_password");

  if (!condominiumId || !fullName || !email || !temporaryPassword) {
    redirect(`${returnPath}?error=missing_admin_fields`);
  }

  if (!email.includes("@") || temporaryPassword.length < 10) {
    redirect(`${returnPath}?error=invalid_admin_credentials`);
  }

  const supabase = await createServerSupabaseClient();
  const { data: condominium, error: condominiumError } = await supabase
    .from("condominiums")
    .select("id, name, tenant_id")
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId)
    .single();

  if (condominiumError || !condominium) {
    redirect(`${returnPath}?error=condominium_not_found`);
  }

  const authResponse = await serviceRoleRequest("/auth/v1/admin/users", {
    method: "POST",
    body: JSON.stringify({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    })
  });

  if (!authResponse.ok) {
    redirect(`${returnPath}?error=create_admin_auth_failed`);
  }

  const authUser = (await authResponse.json()) as { id?: string; user?: { id?: string } };
  const profileId = authUser.id ?? authUser.user?.id;

  if (!profileId) {
    redirect(`${returnPath}?error=create_admin_auth_failed`);
  }

  const profileResponse = await serviceRoleRequest("/rest/v1/profiles?on_conflict=id", {
    method: "POST",
    headers: {
      Prefer: "resolution=merge-duplicates"
    },
    body: JSON.stringify({
      id: profileId,
      tenant_id: profile.tenantId,
      full_name: fullName,
      role: "condominium_admin"
    })
  });

  if (!profileResponse.ok) {
    redirect(`${returnPath}?error=create_admin_profile_failed`);
  }

  const membershipResponse = await serviceRoleRequest(
    "/rest/v1/condominium_memberships?on_conflict=condominium_id,profile_id",
    {
      method: "POST",
      headers: {
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({
        tenant_id: profile.tenantId,
        condominium_id: condominium.id,
        profile_id: profileId,
        role: "condominium_admin"
      })
    }
  );

  if (!membershipResponse.ok) {
    redirect(`${returnPath}?error=create_admin_membership_failed`);
  }

  revalidatePath("/dashboard/condominiums");
  revalidatePath("/dashboard/condominiums/new");
  revalidatePath(condominiumPath(condominium.id));
  const emailStatus = await sendClientAccessEmail({
    condominiumName: condominium.name,
    email,
    fullName,
    temporaryPassword
  });
  const status =
    emailStatus === "sent"
      ? "admin_created_email_sent"
      : emailStatus === "failed"
        ? "admin_created_email_failed"
        : "admin_created_email_not_configured";
  redirect(`${returnPath}?status=${status}&created=${condominium.id}`);
}

export async function updateCondominiumClientAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requirePlatformAdmin(profile.role);

  const condominiumId = formValue(formData, "condominium_id");
  const name = formValue(formData, "name");
  const slug = formValue(formData, "slug");
  const timezone = formValue(formData, "timezone") || defaultCondominiumTimezone;
  const client = getClientFields(formData);

  if (!condominiumId || !name || !slug) {
    redirect(`${condominiumPath(condominiumId)}?error=missing_condominium_fields`);
  }

  if (!hasValidClientFields(client, timezone)) {
    redirect(`${condominiumPath(condominiumId)}?error=invalid_client_fields`);
  }

  const metadata = { client };

  const supabase = await createServerSupabaseClient();
  const { data: currentCondominium } = await supabase
    .from("condominiums")
    .select("metadata")
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId)
    .maybeSingle();
  const { data: duplicateCnpj } = await supabase
    .from("condominiums")
    .select("id")
    .eq("tenant_id", profile.tenantId)
    .neq("id", condominiumId)
    .contains("metadata", { client: { cnpj: client.cnpj } })
    .maybeSingle();

  if (duplicateCnpj) {
    redirect(`${condominiumPath(condominiumId)}?error=duplicate_cnpj`);
  }

  const { error } = await supabase
    .from("condominiums")
    .update({
      name,
      slug,
      timezone,
      metadata: {
        ...metadataObject(currentCondominium?.metadata),
        ...metadata
      }
    })
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId);

  if (error) {
    redirect(`${condominiumPath(condominiumId)}?error=update_condominium_failed`);
  }

  revalidatePath("/dashboard/condominiums");
  revalidatePath(condominiumPath(condominiumId));
  redirect(`${condominiumPath(condominiumId)}?status=client_updated`);
}

export async function updateCondominiumFinanceAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requirePlatformAdmin(profile.role);

  const condominiumId = formValue(formData, "condominium_id");
  const submittedAccessStatus = formValue(formData, "access_status") || "active";
  const submittedPaymentStatus = formValue(formData, "payment_status") || "current";
  const inactiveReason = formValue(formData, "inactive_reason");
  const paymentDate = formValue(formData, "payment_date");
  const paymentTime = formValue(formData, "payment_time");
  const amount = moneyValue(formValue(formData, "payment_amount"));
  const paymentMethod = formValue(formData, "payment_method");
  const chargeChannel = formValue(formData, "charge_channel");
  const notes = formValue(formData, "payment_notes");

  if (!condominiumId || !["active", "inactive"].includes(submittedAccessStatus)) {
    redirect(`${financePath(condominiumId)}?error=missing_finance_fields`);
  }

  if (!["current", "overdue"].includes(submittedPaymentStatus)) {
    redirect(`${financePath(condominiumId)}?error=missing_finance_fields`);
  }

  if (paymentDate && (!paymentTime || amount === null || !paymentMethod)) {
    redirect(`${financePath(condominiumId)}?error=missing_payment_fields`);
  }

  const supabase = await createServerSupabaseClient();
  const { data: condominium } = await supabase
    .from("condominiums")
    .select("metadata")
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId)
    .maybeSingle();

  if (!condominium) {
    redirect(`${financePath(condominiumId)}?error=condominium_not_found`);
  }

  const currentMetadata = metadataObject(condominium.metadata);
  const currentFinance = financeObject(condominium.metadata);
  const payments = paymentList(condominium.metadata);
  const paidAt = paymentDate && paymentTime ? `${paymentDate}T${paymentTime}:00` : "";
  const paymentStatus = submittedAccessStatus === "inactive" ? "overdue" : submittedPaymentStatus;
  const accessStatus = paymentStatus === "overdue" ? "inactive" : paymentStatus === "current" ? "active" : submittedAccessStatus;
  const shouldBlock = accessStatus === "inactive" || paymentStatus === "overdue";
  const blockedReason =
    accessStatus === "inactive"
      ? inactiveReason || "Acesso bloqueado pela Kynovia"
      : paymentStatus === "overdue"
        ? "Pagamento em atraso"
        : null;
  const nextPayments = paidAt
    ? [
        {
          id: randomUUID(),
          amount,
          notes: notes || null,
          paid_at: paidAt,
          payment_method: paymentMethod,
          recorded_at: new Date().toISOString()
        },
        ...payments
      ]
    : payments;

  const finance = {
    ...currentFinance,
    access_status: accessStatus,
    billing_status: paymentStatus,
    blocked: shouldBlock,
    blocked_reason: shouldBlock ? blockedReason : null,
    charge_channel: chargeChannel || null,
    last_charge_sent_at: chargeChannel
      ? new Date().toISOString()
      : typeof currentFinance.last_charge_sent_at === "string"
        ? currentFinance.last_charge_sent_at
        : null,
    payments: nextPayments
  };

  const { error } = await supabase
    .from("condominiums")
    .update({
      metadata: {
        ...currentMetadata,
        finance
      }
    })
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId);

  if (error) {
    redirect(`${financePath(condominiumId)}?error=update_finance_failed`);
  }

  revalidatePath("/dashboard/condominiums");
  revalidatePath("/dashboard/finance");
  revalidatePath(financePath(condominiumId));
  revalidatePath(condominiumPath(condominiumId));
  redirect(`${financePath(condominiumId)}?status=finance_updated`);
}

export async function updateCondominiumAdminAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requirePlatformAdmin(profile.role);

  const condominiumId = formValue(formData, "condominium_id");
  const profileId = formValue(formData, "profile_id");
  const fullName = formValue(formData, "full_name");
  const email = formValue(formData, "email").toLowerCase();
  const password = formValue(formData, "password");

  if (!condominiumId || !profileId || !fullName || !email) {
    redirect(`${condominiumPath(condominiumId)}?error=missing_admin_fields`);
  }

  if (!email.includes("@") || (password && password.length < 10)) {
    redirect(`${condominiumPath(condominiumId)}?error=invalid_admin_credentials`);
  }

  const supabase = await createServerSupabaseClient();
  const { data: membership } = await supabase
    .from("condominium_memberships")
    .select("id")
    .eq("condominium_id", condominiumId)
    .eq("profile_id", profileId)
    .eq("tenant_id", profile.tenantId)
    .eq("role", "condominium_admin")
    .single();

  if (!membership) {
    redirect(`${condominiumPath(condominiumId)}?error=admin_not_found`);
  }

  const authPayload: { email: string; password?: string; user_metadata: { full_name: string } } = {
    email,
    user_metadata: {
      full_name: fullName
    }
  };

  if (password) {
    authPayload.password = password;
  }

  const authResponse = await serviceRoleRequest(`/auth/v1/admin/users/${profileId}`, {
    method: "PUT",
    body: JSON.stringify(authPayload)
  });

  if (!authResponse.ok) {
    redirect(`${condominiumPath(condominiumId)}?error=update_admin_auth_failed`);
  }

  const response = await serviceRoleRequest(`/rest/v1/profiles?id=eq.${profileId}`, {
    method: "PATCH",
    headers: {
      Prefer: "return=minimal"
    },
    body: JSON.stringify({
      full_name: fullName
    })
  });

  if (!response.ok) {
    redirect(`${condominiumPath(condominiumId)}?error=update_admin_failed`);
  }

  revalidatePath(condominiumPath(condominiumId));
  redirect(`${condominiumPath(condominiumId)}?status=admin_updated`);
}

export async function removeCondominiumAdminAction(formData: FormData) {
  const profile = await requireAuthorizedProfile();
  requirePlatformAdmin(profile.role);

  const condominiumId = formValue(formData, "condominium_id");
  const membershipId = formValue(formData, "membership_id");

  if (!condominiumId || !membershipId) {
    redirect(`${condominiumPath(condominiumId)}?error=missing_admin_fields`);
  }

  const supabase = await createServerSupabaseClient();
  const { data: memberships } = await supabase
    .from("condominium_memberships")
    .select("id")
    .eq("condominium_id", condominiumId)
    .eq("tenant_id", profile.tenantId)
    .eq("role", "condominium_admin");

  if (!memberships?.some((membership) => membership.id === membershipId)) {
    redirect(`${condominiumPath(condominiumId)}?error=admin_not_found`);
  }

  if (memberships.length <= 1) {
    redirect(`${condominiumPath(condominiumId)}?error=last_admin_removal_blocked`);
  }

  const response = await serviceRoleRequest(
    `/rest/v1/condominium_memberships?id=eq.${membershipId}`,
    {
      method: "DELETE",
      headers: {
        Prefer: "return=minimal"
      }
    }
  );

  if (!response.ok) {
    redirect(`${condominiumPath(condominiumId)}?error=remove_admin_failed`);
  }

  revalidatePath(condominiumPath(condominiumId));
  redirect(`${condominiumPath(condominiumId)}?status=admin_removed`);
}
