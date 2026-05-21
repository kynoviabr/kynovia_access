import Link from "next/link";
import { createCondominiumAction } from "./actions";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

type SearchParams = Promise<{
  created?: string;
  error?: string;
  q?: string;
  status?: string;
  timezone?: string;
}>;

export const dynamic = "force-dynamic";

function sanitizeSearch(value: string) {
  return value.replace(/[%,]/g, "").trim();
}

function statusMessage(status?: string) {
  if (status === "condominium_created") {
    return "Condominio criado para implantacao.";
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

  return error ? `Nao foi possivel concluir: ${error}` : null;
}

export default async function CondominiumsPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requireAuthorizedProfile();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const filterQ = sanitizeSearch(q);
  const timezone = params.timezone?.trim() ?? "";
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("condominiums")
    .select("id, name, slug, timezone, visitor_parking_capacity, created_at")
    .eq("tenant_id", profile.tenantId)
    .order("name", { ascending: true });

  if (filterQ) {
    query = query.or(`name.ilike.%${filterQ}%,slug.ilike.%${filterQ}%`);
  }

  if (timezone) {
    query = query.eq("timezone", timezone);
  }

  const { data: condominiums, error } = await query;
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
        <Link className="button-link secondary" href="/dashboard">
          Voltar
        </Link>
      </header>

      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}
      {error ? <p className="form-error">Falha ao carregar condominios.</p> : null}

      <section className="toolbar">
        <form className="filter-form">
          <label>
            Buscar
            <input name="q" placeholder="Nome ou slug" defaultValue={q} />
          </label>
          <label>
            Timezone
            <input name="timezone" placeholder="America/Sao_Paulo" defaultValue={timezone} />
          </label>
          <button type="submit">Filtrar</button>
          <Link className="button-link secondary" href="/dashboard/condominiums">
            Limpar
          </Link>
        </form>
      </section>

      <section className="admin-grid">
        <div className="admin-section">
          <h2>Condominios cadastrados</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Slug</th>
                  <th>Timezone</th>
                  <th>Vagas visitantes</th>
                  <th>Criado em</th>
                </tr>
              </thead>
              <tbody>
                {(condominiums ?? []).map((condominium) => (
                  <tr key={condominium.id}>
                    <td>{condominium.name}</td>
                    <td>{condominium.slug}</td>
                    <td>{condominium.timezone}</td>
                    <td>{condominium.visitor_parking_capacity}</td>
                    <td>{new Date(condominium.created_at).toLocaleDateString("pt-BR")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!condominiums?.length ? <p className="muted">Nenhum condominio encontrado.</p> : null}
        </div>

        <div className="admin-section">
          <h2>Novo condominio cliente</h2>
          <p className="muted">
            Cria o registro base para implantacao. Configuracoes operacionais serao tratadas no
            Condo Admin em PRs futuros.
          </p>
          <form className="admin-form" action={createCondominiumAction}>
            <label>
              Nome
              <input name="name" required placeholder="Residencial Aurora" />
            </label>
            <label>
              Slug
              <input name="slug" placeholder="residencial-aurora" />
            </label>
            <label>
              Timezone
              <input name="timezone" defaultValue="America/Sao_Paulo" />
            </label>
            <button type="submit">Criar condominio</button>
          </form>
        </div>
      </section>
    </main>
  );
}
