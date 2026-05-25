import Link from "next/link";
import {
  createUnitAction,
  deleteSelectedUnitsAction,
  updateUnitAction
} from "../actions";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { getCondoAdminContext } from "../../../lib/condominiums/context";
import { requireOperationalModuleAccess } from "../../../lib/operations/modules";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

type SearchParams = Promise<{
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

function unitRegistrationMode(unit: Unit) {
  const mode = metadataValue(unit, "registrationMode");
  return mode === "horizontal" || mode === "vertical" ? mode : null;
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
  const activeUnitMode = configuredUnitMode;
  const isHorizontal = activeUnitMode === "horizontal";
  const success = statusMessage(params.status);
  const failure = errorMessage(params.status);
  const isMissingUnitMode = !configuredUnitMode;

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
      {isMissingUnitMode ? (
        <section className="onboarding-callout">
          <strong>Tipo de condominio pendente</strong>
          <p>
            Configure se o condominio e vertical ou horizontal antes de cadastrar unidades.
          </p>
          <Link className="button-link secondary" href="/dashboard/settings?onboarding=unit_structure">
            Configurar em Configuracoes
          </Link>
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

      <section className="admin-section">
          <h2>Unidades cadastradas</h2>
          <p className="muted">
            Cadastre novas unidades, edite dados existentes e remova varias unidades selecionadas
            em uma unica acao.
          </p>
          <form className="unit-create-form" action={createUnitAction}>
            <input type="hidden" name="condominiumId" value={condominium.id} />
            <input type="hidden" name="unitRegistrationMode" value={activeUnitMode ?? ""} />
            {activeUnitMode ? (
              <>
                {isHorizontal ? (
                  <>
                    <input name="horizontalBlock" placeholder="Quadra" />
                    <input name="horizontalNumber" placeholder="Lote" required />
                    <input name="street" placeholder="Rua" />
                    <input name="addressNumber" placeholder="Numero" />
                  </>
                ) : (
                  <>
                    <input name="verticalBlock" placeholder="Bloco" />
                    <input name="verticalFloor" placeholder="Andar" />
                    <input name="verticalNumber" placeholder="Unidade" required />
                  </>
                )}
                <input name="complement" placeholder="Complemento" />
                <button type="submit">Adicionar unidade</button>
              </>
            ) : (
              <div className="empty-state">
                <strong>Escolha o tipo em Configuracoes.</strong>
                <p>Depois disso, o formulario de cadastro de unidades aparece aqui.</p>
              </div>
            )}
          </form>
          <form action={deleteSelectedUnitsAction} id="delete-selected-units">
            <input type="hidden" name="condominiumId" value={condominium.id} />
          </form>
          <div className="bulk-actions">
            <button
              className="secondary"
              disabled={!units.length}
              form="delete-selected-units"
              type="submit"
            >
              Excluir selecionadas
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Selecionar</th>
                  <th>{isHorizontal ? "Quadra" : "Bloco"}</th>
                  <th>{isHorizontal ? "Lote" : "Unidade"}</th>
                  <th>{isHorizontal ? "Rua / Numero" : "Andar"}</th>
                  <th>Salvar</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const rowMode = configuredUnitMode ?? unitRegistrationMode(unit);
                  const rowIsHorizontal = rowMode === "horizontal";

                  return (
                    <tr key={unit.id}>
                      <td>
                        <input
                          aria-label={`Selecionar unidade ${unit.number}`}
                          form="delete-selected-units"
                          name="unitIds"
                          type="checkbox"
                          value={unit.id}
                        />
                      </td>
                      <td colSpan={4}>
                        <form className="unit-row-form" action={updateUnitAction}>
                          <input type="hidden" name="condominiumId" value={condominium.id} />
                          <input type="hidden" name="unitId" value={unit.id} />
                          <input
                            type="hidden"
                            name="unitRegistrationMode"
                            value={rowMode ?? ""}
                          />
                          <input
                            name="block"
                            defaultValue={unit.block ?? ""}
                            placeholder={rowIsHorizontal ? "Quadra" : "Bloco"}
                          />
                          <input name="number" defaultValue={unit.number} required />
                          {rowIsHorizontal ? (
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
                        </form>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {!units.length ? <p className="muted">Nenhuma unidade encontrada.</p> : null}
      </section>
    </main>
  );
}
