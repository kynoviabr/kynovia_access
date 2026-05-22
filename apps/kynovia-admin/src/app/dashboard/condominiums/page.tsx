import Link from "next/link";
import { CondominiumSelector } from "./CondominiumSelector";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

type SearchParams = Promise<{
  created?: string;
  error?: string;
  status?: string;
}>;

type CondominiumSummary = {
  id: string;
  metadata: unknown;
  name: string;
};

type FinanceSummary = {
  access_status?: string | null;
  billing_status?: string | null;
  blocked?: boolean | null;
  blocked_reason?: string | null;
  inactive_reason?: string | null;
};

type CondominiumFinanceSummary = CondominiumSummary & {
  finance: FinanceSummary;
};

export const dynamic = "force-dynamic";

function financeFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return {};
  }

  const finance = (metadata as { finance?: unknown }).finance;
  return finance && typeof finance === "object" && !Array.isArray(finance)
    ? (finance as FinanceSummary)
    : {};
}

function accessStatusLabel(finance: FinanceSummary) {
  if (isInactiveClient(finance)) {
    return "Inativo";
  }

  return "Ativo";
}

function statusReason(finance: FinanceSummary) {
  if (finance.billing_status === "overdue") {
    return finance.blocked_reason ?? "Pagamento em atraso.";
  }

  return finance.blocked_reason ?? finance.inactive_reason ?? "Sem motivo informado.";
}

function isInactiveClient(finance: FinanceSummary) {
  return finance.blocked === true || finance.access_status === "inactive" || finance.billing_status === "overdue";
}

function statusMessage(status?: string) {
  if (status === "condominium_created") {
    return "Condominio criado para implantacao.";
  }

  if (status === "admin_created" || status === "admin_created_email_sent") {
    return "Acesso do administrador do condominio criado e e-mail enviado ao cliente.";
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
  if (error === "missing_condominium_fields") {
    return "Informe nome e slug valido para criar o condominio.";
  }

  if (error === "insufficient_role") {
    return "Seu perfil nao possui permissao para criar condominios.";
  }

  if (error === "create_condominium_failed") {
    return "Nao foi possivel criar o condominio.";
  }

  if (error === "invalid_client_fields") {
    return "Preencha CNPJ, e-mail, telefone, endereco, UF, CEP e timezone em formato valido.";
  }

  if (error === "duplicate_cnpj") {
    return "Ja existe um condominio cliente cadastrado com este CNPJ.";
  }

  if (error === "service_role_missing") {
    return "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para criar usuarios de clientes.";
  }

  if (error === "missing_admin_fields") {
    return "Informe condominio, nome, e-mail e senha temporaria do administrador.";
  }

  if (error === "invalid_admin_credentials") {
    return "Informe um e-mail valido e uma senha temporaria com pelo menos 10 caracteres.";
  }

  if (error === "condominium_not_found") {
    return "Condominio nao encontrado para o tenant atual.";
  }

  if (error === "create_admin_auth_failed") {
    return "Nao foi possivel criar o usuario de acesso. Verifique se o e-mail ja existe.";
  }

  if (error === "create_admin_profile_failed") {
    return "Usuario criado, mas nao foi possivel criar o perfil do administrador.";
  }

  if (error === "create_admin_membership_failed") {
    return "Perfil criado, mas nao foi possivel vincular o administrador ao condominio.";
  }

  return error ? `Nao foi possivel concluir: ${error}` : null;
}

export default async function CondominiumsPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireAuthorizedProfile();
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: condominiums, error } = await supabase
    .from("condominiums")
    .select("id, name, metadata")
    .eq("tenant_id", profile.tenantId)
    .order("name", { ascending: true });

  const summaries: CondominiumFinanceSummary[] = ((condominiums ?? []) as CondominiumSummary[]).map((condominium) => ({
    ...condominium,
    finance: financeFromMetadata(condominium.metadata)
  }));
  const inactiveClients = summaries.filter((condominium) => isInactiveClient(condominium.finance));
  const activeClientItems = summaries.filter((condominium) => !isInactiveClient(condominium.finance));
  const success = statusMessage(params.status);
  const failure = errorMessage(params.error);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Kynovia Admin</p>
          <h1>Clientes e condominios</h1>
          <p className="muted">
            Portfolio SaaS para onboarding e acompanhamento dos condominios clientes. A gestao
            operacional detalhada fica fora deste app.
          </p>
        </div>
        <div className="shell-actions">
          <Link className="button-link" href="/dashboard/condominiums/new">
            Novo cliente
          </Link>
          <Link className="button-link secondary" href="/dashboard/finance">
            Financeiro
          </Link>
          <Link className="button-link secondary" href="/dashboard">
            Voltar
          </Link>
        </div>
      </header>

      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}
      {error ? <p className="form-error">Falha ao carregar condominios.</p> : null}

      <section className="toolbar">
        <CondominiumSelector condominiums={condominiums ?? []} />
      </section>

      <section className="finance-dashboard">
        <div className="metric-card">
          <span>Total de clientes</span>
          <strong>{summaries.length}</strong>
        </div>
        <div className="metric-card">
          <span>Clientes ativos</span>
          <strong>{activeClientItems.length}</strong>
        </div>
        <div className="metric-card">
          <span>Clientes inativos</span>
          <strong>{inactiveClients.length}</strong>
        </div>
      </section>

      <section className="financial-overview-grid">
        <div className="admin-section">
          <h2>Clientes ativos</h2>
          <div className="admin-list">
            {activeClientItems.length ? (
              activeClientItems.map((condominium) => (
                <Link
                  className="financial-client-link financial-client-link-ok"
                  href={`/dashboard/condominiums/${condominium.id}`}
                  key={condominium.id}
                >
                  <strong>{condominium.name}</strong>
                  <span>{accessStatusLabel(condominium.finance)}</span>
                </Link>
              ))
            ) : (
              <p className="muted">Nenhum cliente ativo encontrado.</p>
            )}
          </div>
        </div>

        <div className="admin-section finance-alert-section">
          <h2>Clientes inativos</h2>
          <div className="admin-list">
            {inactiveClients.length ? (
              inactiveClients.map((condominium) => (
                <Link
                  className="financial-client-link"
                  href={`/dashboard/finance/${condominium.id}`}
                  key={condominium.id}
                >
                  <strong>{condominium.name}</strong>
                  <span>{statusReason(condominium.finance)}</span>
                </Link>
              ))
            ) : (
              <p className="muted">Nenhum cliente inativo encontrado.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
