import Link from "next/link";
import { createCondominiumAction, createCondominiumAdminAction } from "../actions";
import { ClientRegistrationFields, RequiredLabel } from "../ClientRegistrationFields";
import { requireAuthorizedProfile } from "../../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

type SearchParams = Promise<{
  created?: string;
  error?: string;
  status?: string;
}>;

export const dynamic = "force-dynamic";

function statusMessage(status?: string) {
  if (status === "condominium_created") {
    return "Condominio criado. Agora crie o acesso do administrador do cliente.";
  }

  if (status === "admin_created" || status === "admin_created_email_sent") {
    return "Acesso do administrador criado e e-mail enviado ao cliente.";
  }

  if (status === "admin_created_email_not_configured") {
    return "Acesso do administrador criado. Configure EMAIL_PROVIDER=resend, EMAIL_FROM e RESEND_API_KEY para enviar e-mail automaticamente.";
  }

  if (status === "admin_created_email_failed") {
    return "Acesso do administrador criado, mas o envio do e-mail falhou. Confira a configuracao do provedor de e-mail.";
  }

  return status ? `Operacao concluida: ${status}` : null;
}

function errorMessage(error?: string) {
  const messages: Record<string, string> = {
    condominium_not_found: "Condominio nao encontrado para o tenant atual.",
    create_admin_auth_failed: "Nao foi possivel criar o usuario de acesso. Verifique se o e-mail ja existe.",
    create_admin_membership_failed: "Perfil criado, mas nao foi possivel vincular o administrador ao condominio.",
    create_admin_profile_failed: "Usuario criado, mas nao foi possivel criar o perfil do administrador.",
    create_condominium_failed: "Nao foi possivel criar o condominio.",
    duplicate_cnpj: "Ja existe um condominio cliente cadastrado com este CNPJ.",
    insufficient_role: "Seu perfil nao possui permissao para criar condominios.",
    invalid_admin_credentials: "Informe um e-mail valido e uma senha temporaria com pelo menos 10 caracteres.",
    invalid_client_fields: "Preencha CNPJ, e-mail, telefone, endereco, UF, CEP e timezone em formato valido.",
    missing_admin_fields: "Informe condominio, nome, e-mail e senha temporaria do administrador.",
    missing_condominium_fields: "Informe nome e slug valido para criar o condominio.",
    service_role_missing: "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para criar usuarios de clientes."
  };

  return error ? messages[error] ?? `Nao foi possivel concluir: ${error}` : null;
}

export default async function NewCondominiumPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireAuthorizedProfile();
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: condominiums, error } = await supabase
    .from("condominiums")
    .select("id, name")
    .eq("tenant_id", profile.tenantId)
    .order("name", { ascending: true });
  const success = statusMessage(params.status);
  const failure = errorMessage(params.error);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Kynovia Admin</p>
          <h1>Novo cliente</h1>
          <p className="muted">
            Cadastro comercial do condominio cliente e provisionamento do primeiro administrador.
          </p>
        </div>
        <Link className="button-link secondary" href="/dashboard/condominiums">
          Voltar para clientes
        </Link>
      </header>

      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}
      {error ? <p className="form-error">Falha ao carregar condominios.</p> : null}

      <section className="admin-grid onboarding-grid">
        <div className="admin-stack">
          <div className="admin-section">
            <h2>Novo condominio cliente</h2>
            <p className="muted">
              Cria o registro base para implantacao. Configuracoes operacionais serao tratadas no
              Condo Admin.
            </p>
            <form className="admin-form" action={createCondominiumAction}>
              <label>
                <RequiredLabel>Nome</RequiredLabel>
                <input name="name" required placeholder="Residencial Aurora" />
              </label>
              <label>
                <RequiredLabel>Slug</RequiredLabel>
                <input name="slug" required placeholder="residencial-aurora" />
              </label>
              <ClientRegistrationFields />
              <button type="submit">Criar condominio</button>
            </form>
          </div>

          <div className="admin-section">
            <h2>Acesso do cliente</h2>
            <p className="muted">
              Crie o primeiro administrador do condominio. Esse usuario acessa o Condo Admin para
              configurar unidades, moradores, visitantes, portoes e operacao diaria.
            </p>
            <form className="admin-form" action={createCondominiumAdminAction}>
              <label>
                <RequiredLabel>Condominio</RequiredLabel>
                <select name="condominium_id" required defaultValue={params.created ?? ""}>
                  <option value="">Selecione um condominio</option>
                  {(condominiums ?? []).map((condominium) => (
                    <option key={condominium.id} value={condominium.id}>
                      {condominium.name}
                    </option>
                  ))}
                </select>
              </label>
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
                <input
                  name="temporary_password"
                  type="password"
                  required
                  minLength={10}
                  placeholder="Defina uma senha temporaria"
                />
              </label>
              <button type="submit">Criar acesso do cliente</button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
