import Link from "next/link";
import { redirect } from "next/navigation";
import { createUnitAction, deleteUnitAction, updateUnitAction } from "../actions";
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

  if (status?.includes("failed") || status?.startsWith("missing")) {
    return null;
  }

  return status ? `Operacao concluida: ${status}` : null;
}

function errorMessage(status?: string) {
  if (status === "missing_unit_fields") {
    return "Informe ao menos o numero da unidade.";
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

  return status?.includes("failed") ? `Nao foi possivel concluir: ${status}` : null;
}

export default async function UnitsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuthorizedProfile();
  const context = requireOperationalModuleAccess(await getCondoAdminContext(), "units");
  const params = await searchParams;

  const { condominium } = context;
  const configuredUnitMode = condominium.unitRegistrationMode;
  if (!configuredUnitMode) {
    redirect("/dashboard/settings?onboarding=unit_structure");
  }

  const isHorizontal = configuredUnitMode === "horizontal";
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

      <section className="admin-grid">
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
                          value={configuredUnitMode}
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
          <form className="admin-form" action={createUnitAction}>
            <input type="hidden" name="condominiumId" value={condominium.id} />
            <input
              type="hidden"
              name="unitRegistrationMode"
              value={configuredUnitMode}
            />
            <label>
              {isHorizontal ? "Quadra" : "Bloco"}
              <input name="block" placeholder={isHorizontal ? "Quadra A" : "A"} />
            </label>
            <label>
              {isHorizontal ? "Lote" : "Unidade"}
              <input name="number" required placeholder={isHorizontal ? "12" : "101"} />
            </label>
            {isHorizontal ? (
              <div className="form-row split">
                <label>
                  Rua
                  <input name="street" placeholder="Rua das Palmeiras" />
                </label>
                <label>
                  Numero
                  <input name="addressNumber" placeholder="120" />
                </label>
              </div>
            ) : (
              <label>
                Andar
                <input name="floor" placeholder="1" />
              </label>
            )}
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
