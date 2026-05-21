import Link from "next/link";
import { redirect } from "next/navigation";
import {
  updateCondominiumAction,
  updateOperationalSettingsAction
} from "../actions";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { getCondoAdminContext } from "../../../lib/condominiums/context";

type SearchParams = Promise<{
  status?: string;
}>;

export const dynamic = "force-dynamic";

function statusMessage(status?: string) {
  if (status === "condominium_updated") {
    return "Dados do condominio atualizados.";
  }

  if (status === "settings_updated") {
    return "Configuracoes operacionais atualizadas.";
  }

  if (status?.includes("failed") || status?.startsWith("missing")) {
    return null;
  }

  return status ? `Operacao concluida: ${status}` : null;
}

function errorMessage(status?: string) {
  if (status === "missing_condominium_fields") {
    return "Informe o nome do condominio.";
  }

  if (status === "missing_condominium_id") {
    return "Nao foi possivel identificar o condominio ativo.";
  }

  if (status === "update_condominium_failed") {
    return "Nao foi possivel atualizar os dados do condominio.";
  }

  if (status === "update_settings_failed") {
    return "Nao foi possivel atualizar as configuracoes operacionais.";
  }

  return status?.includes("failed") ? `Nao foi possivel concluir: ${status}` : null;
}

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuthorizedProfile();
  const context = await getCondoAdminContext();
  const params = await searchParams;

  if (!context?.condominium) {
    redirect("/dashboard?error=missing_condominium_context");
  }

  const { condominium } = context;
  const success = statusMessage(params.status);
  const failure = errorMessage(params.status);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Condo Admin</p>
          <h1>Configuracoes do condominio</h1>
          <p className="muted">
            Ajustes simples do ambiente operacional do condominio. Configuracoes avancadas ficam
            ocultas para reduzir risco e complexidade.
          </p>
        </div>
        <Link className="button-link secondary" href="/dashboard">
          Voltar
        </Link>
      </header>

      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}

      <section className="admin-grid">
        <div className="admin-section">
          <h2>Dados basicos</h2>
          <p className="muted">
            Nome e timezone usados nos cadastros, convites e operacao da portaria.
          </p>
          <form className="admin-form" action={updateCondominiumAction}>
            <input type="hidden" name="condominiumId" value={condominium.id} />
            <label>
              Nome do condominio
              <input name="name" defaultValue={condominium.name} required />
            </label>
            <label>
              Identificador
              <input value={condominium.slug} readOnly aria-readonly="true" />
            </label>
            <label>
              Timezone
              <input name="timezone" defaultValue={condominium.timezone} required />
            </label>
            <button type="submit">Salvar dados</button>
          </form>
        </div>

        <div className="admin-section">
          <h2>Operacao</h2>
          <p className="muted">
            Parametros diarios expostos ao administrador do condominio. Campos tecnicos em JSON nao
            aparecem nesta tela.
          </p>
          <form className="admin-form" action={updateOperationalSettingsAction}>
            <input type="hidden" name="condominiumId" value={condominium.id} />
            <label>
              Vagas de visitantes
              <input
                min="0"
                name="visitorParkingCapacity"
                type="number"
                defaultValue={condominium.visitorParkingCapacity}
              />
            </label>
            <button type="submit">Salvar operacao</button>
          </form>
        </div>
      </section>
    </main>
  );
}
