import Link from "next/link";
import {
  createUnitAction,
  deleteUnitAction,
  updateUnitAction,
  updateUnitRegistrationModeAction
} from "../actions";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { getCondoAdminContext } from "../../../lib/condominiums/context";
import { requireOperationalModuleAccess } from "../../../lib/operations/modules";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

type SearchParams = Promise<{
  onboarding?: string;
  q?: string;
  status?: string;
}>;

export const dynamic = "force-dynamic";

type Unit = {
  block: string | null;
  floor: string | null;
  id: string;
  metadata: unknown;
  number: string;
};

function sanitizeSearch(value: string) {
  return value.replace(/[%,]/g, "").trim();
}

function unitMetadata(unit: Unit) {
  return unit.metadata && typeof unit.metadata === "object" && !Array.isArray(unit.metadata)
    ? (unit.metadata as Record<string, unknown>)
    : {};
}

function metadataValue(unit: Unit, key: string) {
  const value = unitMetadata(unit)[key];
  return typeof value === "string" ? value : "";
}

function statusMessage(status?: string) {
  if (status === "unit_created") {
    return "Unidade criada.";
  }

  if (status === "unit_updated") {
    return "Unidade atualizada.";
  }

  if (status === "unit_deleted") {
    return "Unidade removida.";
  }

  if (status === "unit_structure_updated") {
    return "Tipo de condominio atualizado.";
  }

  if (status?.includes("failed") || status?.startsWith("missing")) {
    return null;
  }

  return status ? `Operacao concluida: ${status}` : null;
}

function errorMessage(status?: string) {
  if (status === "missing_unit_fields") {
    return "Informe ao menos o numero da unidade.";
  }

  if (status === "missing_unit_structure") {
    return "Escolha se o condominio e vertical ou horizontal.";
  }

  if (status === "missing_unit_id") {
    return "Nao foi possivel identificar a unidade.";
  }

  if (status === "create_unit_failed") {
    return "Nao foi possivel criar a unidade.";
  }

  if (status === "update_unit_failed") {
    return "Nao foi possivel atualizar a unidade.";
  }

  if (status === "delete_unit_failed") {
    return "Nao foi possivel remover a unidade.";
  }

  if (status === "unit_structure_failed") {
    return "Nao foi possivel salvar o tipo de condominio.";
  }

  return status?.includes("failed") ? `Nao foi possivel concluir: ${status}` : null;
}

export default async function UnitsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuthorizedProfile();
  const context = requireOperationalModuleAccess(await getCondoAdminContext(), "units");
  const params = await searchParams;

  const { condominium } = context;
  const configuredUnitMode = condominium.unitRegistrationMode;
  const isHorizontal = configuredUnitMode === "horizontal";
  const isVertical = configuredUnitMode === "vertical";
  const q = params.q?.trim() ?? "";
  const filterQ = sanitizeSearch(q);
  const supabase = await createServerSupabaseClient();
  let query = supabase
    .from("units")
    .select("id, block, number, floor, metadata")
    .eq("condominium_id", condominium.id)
    .order("block", { ascending: true })
    .order("number", { ascending: true });

  if (filterQ) {
    query = query.or(`block.ilike.%${filterQ}%,number.ilike.%${filterQ}%,floor.ilike.%${filterQ}%`);
  }

  const { data: unitsData, error } = await query;
  const units = (unitsData ?? []) as Unit[];
  const success = statusMessage(params.status);
  const failure = errorMessage(params.status);
  const showOnboarding = params.onboarding === "unit_structure" && !configuredUnitMode;

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Condo Admin</p>
          <h1>Unidades</h1>
          <p className="muted">
            Cadastro de unidades do {condominium.name}. Esta tela trabalha somente no condominio
            ativo do usuario.
          </p>
        </div>
        <Link className="button-link secondary" href="/dashboard">
          Voltar
        </Link>
      </header>

      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}
      {error ? <p className="form-error">Falha ao carregar unidades.</p> : null}
      {showOnboarding ? (
        <section className="onboarding-callout">
          <strong>Primeira configuracao obrigatoria</strong>
          <p>
            Escolha o tipo de condominio para abrir o formulario correto de unidades e padronizar
            os cadastros de moradores e veiculos.
          </p>
        </section>
      ) : null}

      <section className="toolbar">
        <form className="filter-form">
          <label>
            Buscar
            <input
              name="q"
              placeholder={isHorizontal ? "Quadra, lote ou rua" : "Bloco, unidade ou andar"}
              defaultValue={q}
            />
          </label>
          <button type="submit">Filtrar</button>
          <Link className="button-link secondary" href="/dashboard/units">
            Limpar
          </Link>
        </form>
      </section>

      <section className="admin-grid">
        <div className="admin-section">
          <h2>Tipo de condominio</h2>
          <p className="muted">
            Esta escolha define os campos usados em unidades, moradores e veiculos.
          </p>
          <form className="admin-form unit-mode-form" action={updateUnitRegistrationModeAction}>
            <input type="hidden" name="condominiumId" value={condominium.id} />
            <fieldset className="choice-fieldset">
              <legend>Escolha a estrutura de unidades</legend>
              <label className="choice-card">
                <input
                  name="unitRegistrationMode"
                  type="radio"
                  value="vertical"
                  defaultChecked={isVertical}
                  required
                />
                <span>
                  <strong>Condominio vertical</strong>
                  <small>Usar bloco, andar e unidade.</small>
                </span>
              </label>
              <div className="mode-fields vertical-fields">
                <div className="field-preview">
                  <span>Bloco</span>
                  <span>Andar</span>
                  <span>Unidade</span>
                </div>
              </div>
              <label className="choice-card">
                <input
                  name="unitRegistrationMode"
                  type="radio"
                  value="horizontal"
                  defaultChecked={isHorizontal}
                  required
                />
                <span>
                  <strong>Condominio horizontal</strong>
                  <small>Usar quadra, lote, rua e numero.</small>
                </span>
              </label>
              <div className="mode-fields horizontal-fields">
                <div className="field-preview">
                  <span>Quadra</span>
                  <span>Lote</span>
                  <span>Rua</span>
                  <span>Numero</span>
                </div>
              </div>
            </fieldset>
            <button type="submit">Salvar tipo de condominio</button>
          </form>
        </div>

        <div className="admin-section">
          <h2>Unidades cadastradas</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>{isHorizontal ? "Quadra" : "Bloco"}</th>
                  <th>{isHorizontal ? "Lote" : "Unidade"}</th>
                  <th>{isHorizontal ? "Rua / Numero" : "Andar"}</th>
                  <th>Acoes</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id}>
                    <td colSpan={4}>
                      <form className="inline-form" action={updateUnitAction}>
                        <input type="hidden" name="condominiumId" value={condominium.id} />
                        <input type="hidden" name="unitId" value={unit.id} />
                        <input
                          type="hidden"
                          name="unitRegistrationMode"
                          value={configuredUnitMode ?? ""}
                        />
                        <input
                          name="block"
                          defaultValue={unit.block ?? ""}
                          placeholder={isHorizontal ? "Quadra" : "Bloco"}
                        />
                        <input name="number" defaultValue={unit.number} required />
                        {isHorizontal ? (
                          <>
                            <input
                              name="street"
                              defaultValue={metadataValue(unit, "street")}
                              placeholder="Rua"
                            />
                            <input
                              name="addressNumber"
                              defaultValue={metadataValue(unit, "addressNumber")}
                              placeholder="Numero"
                            />
                          </>
                        ) : (
                          <input name="floor" defaultValue={unit.floor ?? ""} placeholder="Andar" />
                        )}
                        <button type="submit">Salvar</button>
                        <button
                          className="secondary"
                          form={`delete-unit-${unit.id}`}
                          type="submit"
                        >
                          Remover
                        </button>
                      </form>
                      <form action={deleteUnitAction} id={`delete-unit-${unit.id}`}>
                        <input type="hidden" name="condominiumId" value={condominium.id} />
                        <input type="hidden" name="unitId" value={unit.id} />
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!units.length ? <p className="muted">Nenhuma unidade encontrada.</p> : null}
        </div>

        <div className="admin-section">
          <h2>Nova unidade</h2>
          <form className="admin-form unit-mode-form" action={createUnitAction}>
            <input type="hidden" name="condominiumId" value={condominium.id} />
            <fieldset className="choice-fieldset">
              <legend>Tipo para esta unidade</legend>
              <label className="choice-card">
                <input
                  name="unitRegistrationMode"
                  type="radio"
                  value="vertical"
                  defaultChecked={isVertical}
                  required
                />
                <span>
                  <strong>Vertical</strong>
                  <small>Bloco, andar e unidade.</small>
                </span>
              </label>
              <div className="mode-fields vertical-fields">
                <label>
                  Bloco
                  <input name="verticalBlock" placeholder="A" />
                </label>
                <label>
                  Andar
                  <input name="verticalFloor" placeholder="1" />
                </label>
                <label>
                  Unidade
                  <input name="verticalNumber" placeholder="101" />
                </label>
              </div>
              <label className="choice-card">
                <input
                  name="unitRegistrationMode"
                  type="radio"
                  value="horizontal"
                  defaultChecked={isHorizontal}
                  required
                />
                <span>
                  <strong>Horizontal</strong>
                  <small>Quadra, lote, rua e numero.</small>
                </span>
              </label>
              <div className="mode-fields horizontal-fields">
                <label>
                  Quadra
                  <input name="horizontalBlock" placeholder="Quadra A" />
                </label>
                <label>
                  Lote
                  <input name="horizontalNumber" placeholder="12" />
                </label>
                <label>
                  Rua
                  <input name="street" placeholder="Rua das Palmeiras" />
                </label>
                <label>
                  Numero
                  <input name="addressNumber" placeholder="120" />
                </label>
              </div>
            </fieldset>
            <label>
              Complemento
              <input name="complement" placeholder="Observacao interna" />
            </label>
            <button type="submit">Adicionar unidade</button>
          </form>
        </div>
      </section>
    </main>
  );
}
