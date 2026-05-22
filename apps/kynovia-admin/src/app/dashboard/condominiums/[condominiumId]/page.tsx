import Link from "next/link";
import { ClientRegistrationFields, RequiredLabel } from "../ClientRegistrationFields";
import { ScrollToTopOnStatus } from "../ScrollToTopOnStatus";
import { ScrollToTopSubmitButton } from "../ScrollToTopSubmitButton";
import { requireAuthorizedProfile } from "../../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";
import {
  createCondominiumAdminFromDetailAction,
  removeCondominiumAdminAction,
  updateCondominiumAdminAction,
  updateCondominiumClientAction
} from "../actions";

type PageParams = Promise<{ condominiumId: string }>;
type SearchParams = Promise<{ error?: string; status?: string }>;
type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type ClientMetadata = {
  client?: {
    email?: string | null;
    phone?: string | null;
    cnpj?: string | null;
    address?: {
      line?: string | null;
      number?: string | null;
      complement?: string | null;
      city?: string | null;
      state?: string | null;
      postal_code?: string | null;
    } | null;
  } | null;
};

type AdminMembership = {
  id: string;
  profile_id: string;
  created_at: string;
  profile?: {
    email?: string;
    full_name: string;
    role: string;
  };
};

export const dynamic = "force-dynamic";

function asClientMetadata(metadata: Json): ClientMetadata {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as ClientMetadata)
    : {};
}

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
    invalid_admin_credentials: "Informe um e-mail valido e uma senha temporaria com pelo menos 10 caracteres.",
    invalid_client_fields: "Preencha CNPJ, e-mail, telefone, endereco, UF, CEP e timezone em formato valido.",
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

async function getAdminAuthEmails(profileIds: string[]) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return new Map<string, string>();
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

      const data = (await response.json()) as { email?: string; user?: { email?: string } };
      return [profileId, data.email ?? data.user?.email ?? ""] as const;
    })
  );

  return new Map(entries.filter((entry): entry is readonly [string, string] => Boolean(entry)));
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
  const adminEmailsById = await getAdminAuthEmails(profileIds);
  const profilesById = new Map((profilesData ?? []).map((item) => [item.id, item]));
  const admins: AdminMembership[] = (membershipsData ?? []).map((membership) => ({
    ...membership,
    profile: {
      email: adminEmailsById.get(membership.profile_id) ?? "",
      full_name: profilesById.get(membership.profile_id)?.full_name ?? "Administrador sem perfil",
      role: profilesById.get(membership.profile_id)?.role ?? "condominium_admin"
    }
  }));
  const metadata = asClientMetadata(condominium.metadata);
  const client = metadata.client ?? {};
  const address = client.address ?? {};
  const success = statusMessage(query.status);
  const failure = errorMessage(query.error);

  return (
    <main className="admin-shell">
      <ScrollToTopOnStatus />
      <header className="admin-header">
        <div>
          <p className="eyebrow">Kynovia Admin</p>
          <h1>{condominium.name}</h1>
          <p className="muted">
            Dados comerciais e acessos administrativos do cliente. Configuracoes operacionais
            continuam no Condo Admin.
          </p>
        </div>
        <Link className="button-link secondary" href="/dashboard/condominiums">
          Voltar
        </Link>
      </header>

      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}

      <section className="admin-grid detail-grid">
        <div className="admin-stack">
          <div className="admin-section">
            <h2>Dados basicos do cliente</h2>
            <form className="admin-form" action={updateCondominiumClientAction}>
              <input name="condominium_id" type="hidden" value={condominium.id} />
              <label>
                <RequiredLabel>Nome do condominio</RequiredLabel>
                <input name="name" required defaultValue={condominium.name} />
              </label>
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
                timezone={condominium.timezone}
              />
              <ScrollToTopSubmitButton>Salvar dados do cliente</ScrollToTopSubmitButton>
            </form>
          </div>
        </div>

        <div className="admin-stack">
          <div className="admin-section">
            <h2>Novo administrador</h2>
            <form className="admin-form" action={createCondominiumAdminFromDetailAction}>
              <input name="condominium_id" type="hidden" value={condominium.id} />
              <label>
                <RequiredLabel>Nome do administrador</RequiredLabel>
                <input name="full_name" required placeholder="Mariana Oliveira" />
              </label>
              <label>
                <RequiredLabel>E-mail de acesso</RequiredLabel>
                <input name="email" type="email" required placeholder="admin@cliente.com.br" />
              </label>
              <label>
                <RequiredLabel>Senha temporaria</RequiredLabel>
                <input name="temporary_password" type="password" required minLength={10} />
              </label>
              <button type="submit">Criar administrador</button>
            </form>
          </div>

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
                      <RequiredLabel>E-mail de acesso</RequiredLabel>
                      <input name="email" type="email" required defaultValue={admin.profile?.email ?? ""} />
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
    </main>
  );
}
