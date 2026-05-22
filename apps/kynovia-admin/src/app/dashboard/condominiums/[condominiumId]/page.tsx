import Link from "next/link";
import { KynoviaAdminShell } from "../../_components/KynoviaAdminShell";
import { ClientRegistrationFields, RequiredLabel } from "../ClientRegistrationFields";
import { ContractMetadataFields } from "../ContractMetadataFields";
import { ScrollToTopOnStatus } from "../ScrollToTopOnStatus";
import { ScrollToTopSubmitButton } from "../ScrollToTopSubmitButton";
import { requireAuthorizedProfile } from "../../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import { clientFromMetadata } from "../../../../lib/customers/metadata";
import {
  createCondominiumAdminFromDetailAction,
  removeCondominiumAdminAction,
  updateCondominiumAdminAction,
  updateCondominiumClientAction
} from "../actions";

type PageParams = Promise<{ condominiumId: string }>;
type SearchParams = Promise<{ error?: string; status?: string }>;

type AdminMembership = {
  id: string;
  profile_id: string;
  created_at: string;
  profile?: {
    email?: string;
    full_name: string;
    role: string;
    whatsapp?: string | null;
  };
};

export const dynamic = "force-dynamic";

function statusMessage(status?: string) {
  if (status === "client_updated") {
    return "Dados cadastrais do cliente atualizados.";
  }

  if (status === "admin_created" || status === "admin_created_email_sent") {
    return "Administrador do cliente criado e e-mail enviado.";
  }

  if (status === "admin_created_email_not_configured") {
    return "Administrador criado. Configure EMAIL_PROVIDER=resend, EMAIL_FROM e RESEND_API_KEY para enviar e-mail automaticamente.";
  }

  if (status === "admin_created_email_failed") {
    return "Administrador criado, mas o envio do e-mail falhou. Confira a configuracao do provedor de e-mail.";
  }

  if (status === "admin_updated") {
    return "Administrador atualizado.";
  }

  if (status === "admin_removed") {
    return "Administrador removido do condominio.";
  }

  return status ? `Operacao concluida: ${status}` : null;
}

function errorMessage(error?: string) {
  const messages: Record<string, string> = {
    admin_not_found: "Administrador nao encontrado para este condominio.",
    condominium_not_found: "Condominio nao encontrado.",
    create_admin_auth_failed: "Nao foi possivel criar o usuario de acesso. Verifique se o e-mail ja existe.",
    create_admin_membership_failed: "Perfil criado, mas nao foi possivel vincular o administrador ao condominio.",
    create_admin_profile_failed: "Usuario criado, mas nao foi possivel criar o perfil do administrador.",
    duplicate_cnpj: "Ja existe um condominio cliente cadastrado com este CNPJ.",
    invalid_admin_credentials: "Informe e-mail, WhatsApp e senha temporaria validos.",
    invalid_client_fields: "Revise CNPJ, e-mail, telefones, CEP, UF, contrato, valor mensal e timezone.",
    last_admin_removal_blocked: "Nao e possivel remover o ultimo administrador do condominio.",
    missing_admin_fields: "Informe todos os campos obrigatorios do administrador.",
    missing_condominium_fields: "Informe nome e slug valido para o condominio.",
    remove_admin_failed: "Nao foi possivel remover o administrador.",
    service_role_missing: "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para administrar acessos.",
    update_admin_auth_failed: "Nao foi possivel atualizar e-mail ou senha do administrador.",
    update_admin_failed: "Nao foi possivel atualizar o administrador.",
    update_condominium_failed: "Nao foi possivel atualizar os dados do cliente."
  };

  return error ? messages[error] ?? `Nao foi possivel concluir: ${error}` : null;
}

async function getAdminAuthProfiles(profileIds: string[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return new Map<string, { email: string; whatsapp: string | null }>();
  }

  const entries = await Promise.all(
    profileIds.map(async (profileId) => {
      const response = await fetch(`${url}/auth/v1/admin/users/${profileId}`, {
        cache: "no-store",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`
        }
      });

      if (!response.ok) {
        return null;
      }

      const data = (await response.json()) as {
        email?: string;
        user?: { email?: string; user_metadata?: { whatsapp?: string | null } };
        user_metadata?: { whatsapp?: string | null };
      };
      return [
        profileId,
        {
          email: data.email ?? data.user?.email ?? "",
          whatsapp: data.user_metadata?.whatsapp ?? data.user?.user_metadata?.whatsapp ?? null
        }
      ] as const;
    })
  );

  return new Map(
    entries.filter(
      (entry): entry is readonly [string, { email: string; whatsapp: string | null }] =>
        Boolean(entry)
    )
  );
}

export default async function CondominiumDetailPage({
  params,
  searchParams
}: {
  params: PageParams;
  searchParams: SearchParams;
}) {
  const profile = await requireAuthorizedProfile();
  const { condominiumId } = await params;
  const query = await searchParams;
  const supabase = await createServerSupabaseClient();

  const { data: condominium, error: condominiumError } = await supabase
    .from("condominiums")
    .select("id, tenant_id, name, slug, timezone, visitor_parking_capacity, metadata, created_at")
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId)
    .single();

  if (condominiumError || !condominium) {
    return (
      <main className="admin-shell">
        <p className="eyebrow">Kynovia Admin</p>
        <h1>Condominio nao encontrado</h1>
        <Link className="button-link secondary" href="/dashboard/condominiums">
          Voltar
        </Link>
      </main>
    );
  }

  const { data: membershipsData } = await supabase
    .from("condominium_memberships")
    .select("id, profile_id, created_at")
    .eq("condominium_id", condominium.id)
    .eq("tenant_id", profile.tenantId)
    .eq("role", "condominium_admin")
    .order("created_at", { ascending: true });

  const profileIds = (membershipsData ?? []).map((membership) => membership.profile_id);
  const { data: profilesData } = profileIds.length
    ? await supabase.from("profiles").select("id, full_name, role").in("id", profileIds)
    : { data: [] };
  const adminAuthById = await getAdminAuthProfiles(profileIds);
  const profilesById = new Map((profilesData ?? []).map((item) => [item.id, item]));
  const admins: AdminMembership[] = (membershipsData ?? []).map((membership) => ({
    ...membership,
    profile: {
      email: adminAuthById.get(membership.profile_id)?.email ?? "",
      full_name: profilesById.get(membership.profile_id)?.full_name ?? "Administrador sem perfil",
      role: profilesById.get(membership.profile_id)?.role ?? "condominium_admin",
      whatsapp: adminAuthById.get(membership.profile_id)?.whatsapp ?? null
    }
  }));
  const client = clientFromMetadata(condominium.metadata);
  const address = client.address ?? {};
  const contract = client.contract ?? {};
  const success = statusMessage(query.status);
  const failure = errorMessage(query.error);

  return (
    <KynoviaAdminShell
      active="customers"
      title={client.trade_name || condominium.name}
      description="Dados comerciais e acessos administrativos do cliente. Configuracoes operacionais continuam no Condo Admin."
      profile={profile}
    >
      <ScrollToTopOnStatus />
      <div className="page-actions">
        <Link className="button-link secondary" href="/dashboard/condominiums">
          Voltar para clientes
        </Link>
      </div>

      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}

      <form className="admin-form customer-form" action={updateCondominiumClientAction}>
        <input name="condominium_id" type="hidden" value={condominium.id} />
        <section className="admin-section">
          <h2>Dados Gerais</h2>
          <label>
            <RequiredLabel>Slug</RequiredLabel>
            <input name="slug" required defaultValue={condominium.slug} />
          </label>
          <ClientRegistrationFields
            addressCity={address.city ?? ""}
            addressComplement={address.complement ?? ""}
            addressLine={address.line ?? ""}
            addressNumber={address.number ?? ""}
            addressPostalCode={address.postal_code ?? ""}
            addressState={address.state ?? ""}
            clientCnpj={client.cnpj ?? ""}
            clientEmail={client.email ?? ""}
            clientPhone={client.phone ?? ""}
            clientWhatsapp={client.whatsapp ?? client.phone ?? ""}
            contact1Name={client.contact_1?.name ?? ""}
            contact1Whatsapp={client.contact_1?.whatsapp ?? ""}
            contact2Name={client.contact_2?.name ?? ""}
            contact2Whatsapp={client.contact_2?.whatsapp ?? ""}
            legalName={client.legal_name ?? ""}
            showContractFields={false}
            timezone={condominium.timezone}
            tradeName={client.trade_name ?? condominium.name}
          />
        </section>

        <section className="admin-section">
          <h2>Dados do Contrato</h2>
          <ContractMetadataFields
            documentsStatus={contract.documents_status ?? "pending"}
            expiresAt={contract.expires_at ?? ""}
            monthlyValue={contract.monthly_value ?? ""}
            number={contract.number ?? ""}
          />
        </section>

        <ScrollToTopSubmitButton>Salvar dados do cliente</ScrollToTopSubmitButton>
      </form>

      <section className="admin-grid detail-grid">
        <div className="admin-stack">
          <div className="admin-section">
            <h2>Novo administrador</h2>
            <form className="admin-form" action={createCondominiumAdminFromDetailAction}>
              <input name="condominium_id" type="hidden" value={condominium.id} />
              <label>
                <RequiredLabel>Nome completo</RequiredLabel>
                <input name="full_name" required placeholder="Mariana Oliveira" />
              </label>
              <label>
                <RequiredLabel>E-mail</RequiredLabel>
                <input name="email" type="email" required placeholder="admin@cliente.com.br" />
              </label>
              <label>
                <RequiredLabel>WhatsApp</RequiredLabel>
                <input
                  name="admin_whatsapp"
                  required
                  inputMode="tel"
                  pattern="\(\d{2}\) \d{5}-\d{4}"
                  placeholder="(XX) XXXXX-XXXX"
                />
              </label>
              <button type="submit">Criar administrador</button>
            </form>
          </div>
        </div>

        <div className="admin-stack">
          <div className="admin-section">
            <h2>Administradores</h2>
            <div className="admin-list">
              {admins.map((admin) => (
                <div className="admin-list-item" key={admin.id}>
                  <form className="inline-admin-form" action={updateCondominiumAdminAction}>
                    <input name="condominium_id" type="hidden" value={condominium.id} />
                    <input name="profile_id" type="hidden" value={admin.profile_id} />
                    <label>
                      <RequiredLabel>Nome</RequiredLabel>
                      <input
                        name="full_name"
                        required
                        defaultValue={admin.profile?.full_name ?? "Administrador sem perfil"}
                      />
                    </label>
                    <label>
                      <RequiredLabel>E-mail</RequiredLabel>
                      <input name="email" type="email" required defaultValue={admin.profile?.email ?? ""} />
                    </label>
                    <label>
                      WhatsApp
                      <input
                        name="admin_whatsapp"
                        inputMode="tel"
                        pattern="\(\d{2}\) \d{5}-\d{4}"
                        placeholder="(XX) XXXXX-XXXX"
                        defaultValue={admin.profile?.whatsapp ?? ""}
                      />
                    </label>
                    <label>
                      Nova senha
                      <input
                        name="password"
                        type="password"
                        minLength={10}
                        placeholder="Preencha apenas se quiser trocar"
                      />
                    </label>
                    <button type="submit">Alterar</button>
                  </form>
                  <form action={removeCondominiumAdminAction}>
                    <input name="condominium_id" type="hidden" value={condominium.id} />
                    <input name="membership_id" type="hidden" value={admin.id} />
                    <button className="danger" type="submit">
                      Remover acesso
                    </button>
                  </form>
                </div>
              ))}
            </div>
            {!admins.length ? <p className="muted">Nenhum administrador vinculado.</p> : null}
          </div>
        </div>
      </section>
    </KynoviaAdminShell>
  );
}
