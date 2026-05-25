import {
  updateCondominiumAction,
  updateOperationalSettingsAction
} from "../actions";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { getCondoAdminContext } from "../../../lib/condominiums/context";
import { requireOperationalModuleAccess } from "../../../lib/operations/modules";

type SearchParams = Promise<{
  onboarding?: string;
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
    return "Informe a estrutura de cadastro das unidades.";
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
  const context = requireOperationalModuleAccess(await getCondoAdminContext(), "settings");
  const params = await searchParams;

  const { condominium } = context;
  const success = statusMessage(params.status);
  const failure = errorMessage(params.status);
  const showOnboarding = params.onboarding === "unit_structure" && !condominium.unitRegistrationMode;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Condo Admin</p>
          <h1>Configuracoes</h1>
          <p className="muted">
            Ajustes simples do ambiente operacional do condominio. Configuracoes avancadas ficam
            ocultas para reduzir risco e complexidade.
          </p>
        </div>
      </header>

      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}
      {showOnboarding ? (
        <section className="onboarding-callout">
          <strong>Primeira configuracao obrigatoria</strong>
          <p>
            Antes de iniciar os cadastros, defina como este condominio identifica suas unidades:
            vertical por bloco, andar e unidade, ou horizontal por quadra, lote, rua e numero.
          </p>
        </section>
      ) : null}

      <section className="admin-grid">
        <div className="admin-section">
          <h2>Dados gerais do condominio</h2>
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
              CNPJ
              <input name="cnpj" defaultValue={condominium.cnpj} required placeholder="00.000.000/0000-00" />
            </label>
            <label>
              CEP
              <input name="postalCode" defaultValue={condominium.postalCode} placeholder="00000-000" />
            </label>
            <label>
              Endereco completo
              <input name="fullAddress" defaultValue={condominium.fullAddress} placeholder="Rua, avenida ou alameda" />
            </label>
            <div className="form-row split">
              <label>
                Numero
                <input name="number" defaultValue={condominium.number} />
              </label>
              <label>
                Complemento
                <input name="complement" defaultValue={condominium.complement} />
              </label>
            </div>
            <div className="form-row split">
              <label>
                Cidade
                <input name="city" defaultValue={condominium.city} />
              </label>
              <label>
                UF
                <input name="state" defaultValue={condominium.state} maxLength={2} />
              </label>
            </div>
            <div className="form-row split">
              <label>
                Telefone
                <input name="phone" defaultValue={condominium.phone} placeholder="(11) 99999-9999" />
              </label>
              <label>
                WhatsApp
                <input name="whatsapp" defaultValue={condominium.whatsapp} placeholder="(11) 99999-9999" />
              </label>
            </div>
            <label>
              E-mail
              <input name="email" type="email" defaultValue={condominium.email} />
            </label>
            <label>
              Slug
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
            <fieldset className="choice-fieldset">
              <legend>Como cadastrar unidades neste condominio?</legend>
              <label className="choice-card">
                <input
                  name="unitRegistrationMode"
                  type="radio"
                  value="vertical"
                  defaultChecked={condominium.unitRegistrationMode === "vertical"}
                  required
                />
                <span>
                  <strong>Condominio vertical</strong>
                  <small>Usar bloco, andar e unidade.</small>
                </span>
              </label>
              <label className="choice-card">
                <input
                  name="unitRegistrationMode"
                  type="radio"
                  value="horizontal"
                  defaultChecked={condominium.unitRegistrationMode === "horizontal"}
                  required
                />
                <span>
                  <strong>Condominio horizontal</strong>
                  <small>Usar quadra, lote, rua e numero.</small>
                </span>
              </label>
            </fieldset>
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
