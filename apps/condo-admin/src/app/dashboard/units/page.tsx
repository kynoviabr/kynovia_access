import Link from "next/link";
import { redirect } from "next/navigation";
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
  const inferredUnitMode = units.map(unitRegistrationMode).find(Boolean) ?? null;
  const activeUnitMode = configuredUnitMode ?? inferredUnitMode;

  if (!activeUnitMode) {
    redirect("/dashboard/settings?onboarding=unit_structure");
  }

  const isHorizontal = activeUnitMode === "horizontal";
  const createFormClassName = isHorizontal
    ? "unit-create-form unit-create-form-horizontal"
    : "unit-create-form unit-create-form-vertical";
  const success = statusMessage(params.status);
  const failure = errorMessage(params.status);

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
          <form className={createFormClassName} action={createUnitAction}>
            <input type="hidden" name="condominiumId" value={condominium.id} />
            <input type="hidden" name="unitRegistrationMode" value={activeUnitMode} />
            {isHorizontal ? (
              <>
                <label>
                  Quadra
                  <input maxLength={2} name="horizontalBlock" placeholder="Ex.: A" />
                </label>
                <label>
                  Lote
                  <input maxLength={3} name="horizontalNumber" placeholder="Ex.: 30" required />
                </label>
                <label>
                  Endereco
                  <input name="street" placeholder="Rua, avenida ou alameda" />
                </label>
                <label>
                  Numero
                  <input maxLength={5} name="addressNumber" placeholder="Ex.: 31" />
                </label>
                <label>
                  Complemento
                  <input maxLength={4} name="complement" placeholder="Ex.: F1" />
                </label>
                <button type="submit">Adicionar unidade</button>
              </>
            ) : (
              <>
                <label>
                  Bloco
                  <input name="verticalBlock" placeholder="Ex.: Torre A" />
                </label>
                <label>
                  Andar
                  <input name="verticalFloor" placeholder="Ex.: 12" />
                </label>
                <label>
                  Unidade
                  <input name="verticalNumber" placeholder="Ex.: 1204" required />
                </label>
                <label>
                  Complemento
                  <input name="complement" placeholder="Observacao interna" />
                </label>
                <button type="submit">Adicionar unidade</button>
              </>
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
                  <th>{isHorizontal ? "Lote" : "Andar"}</th>
                  <th>{isHorizontal ? "Endereco" : "Unidade"}</th>
                  {isHorizontal ? <th>Numero</th> : null}
                  <th>Complemento</th>
                  <th>Salvar</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => {
                  const rowMode = configuredUnitMode ?? unitRegistrationMode(unit);
                  const rowIsHorizontal = (rowMode ?? activeUnitMode) === "horizontal";

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
                      <td colSpan={rowIsHorizontal ? 6 : 5}>
                        <form
                          className={
                            rowIsHorizontal
                              ? "unit-row-form unit-row-form-horizontal"
                              : "unit-row-form unit-row-form-vertical"
                          }
                          action={updateUnitAction}
                        >
                          <input type="hidden" name="condominiumId" value={condominium.id} />
                          <input type="hidden" name="unitId" value={unit.id} />
                          <input
                            type="hidden"
                            name="unitRegistrationMode"
                            value={rowMode ?? activeUnitMode}
                          />
                          <input
                            name="block"
                            defaultValue={unit.block ?? ""}
                            maxLength={rowIsHorizontal ? 2 : undefined}
                            placeholder={rowIsHorizontal ? "Quadra" : "Bloco"}
                            aria-label={rowIsHorizontal ? "Quadra" : "Bloco"}
                          />
                          {rowIsHorizontal ? (
                            <>
                              <input
                                name="number"
                                defaultValue={unit.number}
                                maxLength={3}
                                placeholder="Lote"
                                aria-label="Lote"
                                required
                              />
                              <input
                                name="street"
                                defaultValue={metadataValue(unit, "street")}
                                placeholder="Endereco"
                                aria-label="Endereco"
                              />
                              <input
                                name="addressNumber"
                                defaultValue={metadataValue(unit, "addressNumber")}
                                maxLength={5}
                                placeholder="Numero"
                                aria-label="Numero"
                              />
                            </>
                          ) : (
                            <>
                              <input
                                name="floor"
                                defaultValue={unit.floor ?? ""}
                                placeholder="Andar"
                                aria-label="Andar"
                              />
                              <input
                                name="number"
                                defaultValue={unit.number}
                                placeholder="Unidade"
                                aria-label="Unidade"
                                required
                              />
                            </>
                          )}
                          <input
                            name="complement"
                            defaultValue={metadataValue(unit, "complement")}
                            maxLength={4}
                            placeholder="Complemento"
                            aria-label="Complemento"
                          />
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
