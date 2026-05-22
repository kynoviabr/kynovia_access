import Link from "next/link";
import { KynoviaAdminShell } from "../_components/KynoviaAdminShell";
import { CondominiumSelector } from "./CondominiumSelector";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";
import { clientFromMetadata } from "../../../lib/customers/metadata";

type SearchParams = Promise<{
  error?: string;
  status?: string;
}>;

type CondominiumSummary = {
  id: string;
  metadata: unknown;
  name: string;
  slug: string;
};

export const dynamic = "force-dynamic";

function statusMessage(status?: string) {
  if (status === "condominium_created" || status === "admin_created_email_sent") {
    return "Cliente cadastrado e acesso administrativo provisionado.";
  }

  if (status === "admin_created_email_not_configured") {
    return "Cliente cadastrado. Configure o provedor de e-mail para enviar credenciais automaticamente.";
  }

  if (status === "admin_created_email_failed") {
    return "Cliente cadastrado, mas o envio do e-mail falhou. Confira a configuracao do provedor.";
  }

  return status ? `Operacao concluida: ${status}` : null;
}

function errorMessage(error?: string) {
  const messages: Record<string, string> = {
    create_admin_auth_failed: "Nao foi possivel criar o usuario de acesso. Verifique se o e-mail ja existe.",
    create_admin_membership_failed: "Perfil criado, mas nao foi possivel vincular o administrador ao cliente.",
    create_admin_profile_failed: "Usuario criado, mas nao foi possivel criar o perfil do administrador.",
    create_condominium_failed: "Nao foi possivel criar o cliente.",
    duplicate_cnpj: "Ja existe um cliente cadastrado com este CNPJ.",
    insufficient_role: "Seu perfil nao possui permissao para gerenciar clientes.",
    invalid_admin_credentials: "Informe nome, e-mail e WhatsApp validos para o administrador.",
    invalid_client_fields: "Revise CNPJ, e-mail, telefones, CEP, UF, contrato, valor mensal e timezone.",
    missing_admin_fields: "Informe os dados obrigatorios do administrador.",
    missing_condominium_fields: "Informe nome fantasia e slug validos.",
    service_role_missing: "Configure SUPABASE_SERVICE_ROLE_KEY no servidor para criar usuarios de clientes."
  };

  return error ? messages[error] ?? `Nao foi possivel concluir: ${error}` : null;
}

export default async function CondominiumsPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireAuthorizedProfile();
  const params = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: condominiums, error } = await supabase
    .from("condominiums")
    .select("id, name, slug, metadata")
    .eq("tenant_id", profile.tenantId)
    .order("name", { ascending: true });

  const customerOptions = ((condominiums ?? []) as CondominiumSummary[]).map((condominium) => {
    const client = clientFromMetadata(condominium.metadata);

    return {
      cnpj: client.cnpj ?? null,
      id: condominium.id,
      legalName: client.legal_name ?? null,
      name: condominium.name,
      slug: condominium.slug,
      tradeName: client.trade_name ?? condominium.name
    };
  });
  const success = statusMessage(params.status);
  const failure = errorMessage(params.error);

  return (
    <KynoviaAdminShell
      active="customers"
      title="Gestao de Clientes"
      description="Selecione rapidamente um cliente existente ou inicie um novo cadastro comercial."
      profile={profile}
    >
      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}
      {error ? <p className="form-error">Falha ao carregar clientes.</p> : null}

      <section className="customer-toolbar">
        <CondominiumSelector condominiums={customerOptions} />
        <Link className="button-link" href="/dashboard/condominiums/new">
          Novo Cliente
        </Link>
      </section>

      <section className="empty-state">
        <h2>Nenhum cliente selecionado</h2>
        <p className="muted">
          Use a busca acima para abrir a ficha completa de um cliente ou clique em Novo Cliente
          para iniciar um cadastro.
        </p>
      </section>
    </KynoviaAdminShell>
  );
}
