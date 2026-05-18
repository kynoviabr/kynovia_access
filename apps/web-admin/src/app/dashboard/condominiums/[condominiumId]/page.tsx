import { accessPointKinds } from "@kynovia/database";
import Link from "next/link";
import {
  createAccessPointAction,
  createUnitAction,
  deleteAccessPointAction,
  deleteCondominiumAction,
  deleteUnitAction,
  updateCondominiumAction,
  updateCondominiumSettingsAction,
  updateUnitAction
} from "../actions";
import { requireAuthorizedProfile } from "../../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../../lib/supabase/server";

type PageParams = Promise<{ condominiumId: string }>;
type SearchParams = Promise<{
  error?: string;
  status?: string;
  unit?: string;
}>;

export const dynamic = "force-dynamic";

function formatJson(value: unknown) {
  return JSON.stringify(value ?? {}, null, 2);
}

function accessPointKindLabel(kind: string) {
  const labels: Record<string, string> = {
    other: "Outro",
    pedestrian_gate: "Portao pedestre",
    service_gate: "Portao servico",
    vehicle_gate: "Cancela veicular"
  };

  return labels[kind] ?? kind;
}

export default async function CondominiumDetailPage({
  params,
  searchParams
}: {
  params: PageParams;
  searchParams: SearchParams;
}) {
  const profile = await requireAuthorizedProfile();
  const { condominiumId } = await params;
  const queryParams = await searchParams;
  const unitFilter = queryParams.unit?.trim() ?? "";
  const safeUnitFilter = unitFilter.replace(/[%,]/g, "");
  const supabase = await createServerSupabaseClient();

  const { data: condominium, error: condominiumError } = await supabase
    .from("condominiums")
    .select(
      "id, tenant_id, name, slug, timezone, settings, operational_rules, visitor_parking_capacity, metadata"
    )
    .eq("id", condominiumId)
    .eq("tenant_id", profile.tenantId)
    .maybeSingle();

  let unitsQuery = supabase
    .from("units")
    .select("id, block, number, floor")
    .eq("condominium_id", condominiumId)
    .order("block", { ascending: true })
    .order("number", { ascending: true });

  if (safeUnitFilter) {
    unitsQuery = unitsQuery.or(`block.ilike.%${safeUnitFilter}%,number.ilike.%${safeUnitFilter}%`);
  }

  const [{ data: units, error: unitsError }, { data: accessPoints, error: accessPointsError }] =
    await Promise.all([
      unitsQuery,
      supabase
        .from("access_points")
        .select("id, name, kind")
        .eq("condominium_id", condominiumId)
        .order("name", { ascending: true })
    ]);

  if (condominiumError || !condominium) {
    return (
      <main className="admin-shell">
        <p className="form-error">Condominio nao encontrado ou sem permissao de acesso.</p>
        <Link className="button-link secondary" href="/dashboard/condominiums">
          Voltar para condominios
        </Link>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Gestao administrativa</p>
          <h1>{condominium.name}</h1>
          <p className="muted">
            Configuracoes, regras operacionais, unidades e pontos de acesso deste condominio.
          </p>
        </div>
        <Link className="button-link secondary" href="/dashboard/condominiums">
          Voltar
        </Link>
      </header>

      {queryParams.status ? <p className="form-success">Operacao concluida: {queryParams.status}</p> : null}
      {queryParams.error ? <p className="form-error">Nao foi possivel concluir: {queryParams.error}</p> : null}
      {unitsError ? <p className="form-error">Falha ao carregar unidades.</p> : null}
      {accessPointsError ? <p className="form-error">Falha ao carregar portoes.</p> : null}

      <section className="quick-actions">
        <Link className="button-link" href={`/dashboard/condominiums/${condominium.id}/residents`}>
          Moradores e veiculos
        </Link>
        <Link className="button-link" href={`/dashboard/condominiums/${condominium.id}/visitors`}>
          Visitantes
        </Link>
      </section>

      <section className="admin-grid two-columns">
        <div className="admin-section">
          <h2>Dados do condominio</h2>
          <form className="admin-form" action={updateCondominiumAction}>
            <input name="condominiumId" type="hidden" value={condominium.id} />
            <label>
              Nome
              <input name="name" required defaultValue={condominium.name} />
            </label>
            <label>
              Slug
              <input name="slug" required defaultValue={condominium.slug} />
            </label>
            <label>
              Timezone
              <input name="timezone" required defaultValue={condominium.timezone} />
            </label>
            <button type="submit">Salvar dados</button>
          </form>
        </div>

        <div className="admin-section">
          <h2>Configuracoes e regras</h2>
          <form className="admin-form" action={updateCondominiumSettingsAction}>
            <input name="condominiumId" type="hidden" value={condominium.id} />
            <label>
              Vagas de visitantes
              <input
                name="visitorParkingCapacity"
                min="0"
                type="number"
                defaultValue={condominium.visitor_parking_capacity}
              />
            </label>
            <label>
              Configuracoes JSON
              <textarea name="settings" rows={5} defaultValue={formatJson(condominium.settings)} />
            </label>
            <label>
              Regras operacionais JSON
              <textarea
                name="operationalRules"
                rows={5}
                defaultValue={formatJson(condominium.operational_rules)}
              />
            </label>
            <label>
              Metadados JSON
              <textarea name="metadata" rows={4} defaultValue={formatJson(condominium.metadata)} />
            </label>
            <button type="submit">Salvar configuracoes</button>
          </form>
        </div>
      </section>

      <section className="admin-section">
        <div className="section-heading">
          <div>
            <h2>Unidades</h2>
            <p className="muted">Vinculo direto unidade-condominio com busca por bloco ou numero.</p>
          </div>
          <form className="inline-filter">
            <input name="unit" placeholder="Buscar unidade" defaultValue={unitFilter} />
            <button type="submit">Filtrar</button>
          </form>
        </div>

        <form className="inline-form" action={createUnitAction}>
          <input name="condominiumId" type="hidden" value={condominium.id} />
          <input name="block" placeholder="Bloco" />
          <input name="number" required placeholder="Unidade" />
          <input name="floor" placeholder="Andar" />
          <button type="submit">Adicionar unidade</button>
        </form>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Bloco</th>
                <th>Unidade</th>
                <th>Andar</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {(units ?? []).map((unit) => (
                <tr key={unit.id}>
                  <td>
                    <form id={`unit-${unit.id}`} action={updateUnitAction}>
                      <input name="condominiumId" type="hidden" value={condominium.id} />
                      <input name="unitId" type="hidden" value={unit.id} />
                      <input name="block" defaultValue={unit.block ?? ""} />
                    </form>
                  </td>
                  <td>
                    <input form={`unit-${unit.id}`} name="number" required defaultValue={unit.number} />
                  </td>
                  <td>
                    <input form={`unit-${unit.id}`} name="floor" defaultValue={unit.floor ?? ""} />
                  </td>
                  <td className="action-cell">
                    <button form={`unit-${unit.id}`} type="submit">
                      Salvar
                    </button>
                    <form action={deleteUnitAction}>
                      <input name="condominiumId" type="hidden" value={condominium.id} />
                      <input name="unitId" type="hidden" value={unit.id} />
                      <button className="danger" type="submit">
                        Remover
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-grid two-columns">
        <div className="admin-section">
          <h2>Portoes e cancelas</h2>
          <form className="inline-form" action={createAccessPointAction}>
            <input name="condominiumId" type="hidden" value={condominium.id} />
            <input name="name" required placeholder="Cancela principal" />
            <select name="kind" defaultValue="vehicle_gate">
              {accessPointKinds.map((kind) => (
                <option key={kind} value={kind}>
                  {accessPointKindLabel(kind)}
                </option>
              ))}
            </select>
            <button type="submit">Adicionar</button>
          </form>
          <div className="list-stack">
            {(accessPoints ?? []).map((accessPoint) => (
              <div className="list-row" key={accessPoint.id}>
                <div>
                  <strong>{accessPoint.name}</strong>
                  <span>{accessPointKindLabel(accessPoint.kind)}</span>
                </div>
                <form action={deleteAccessPointAction}>
                  <input name="condominiumId" type="hidden" value={condominium.id} />
                  <input name="accessPointId" type="hidden" value={accessPoint.id} />
                  <button className="danger" type="submit">
                    Remover
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-section">
          <h2>Zona de exclusao</h2>
          <p className="muted">
            A remocao apaga o condominio e registros dependentes por cascata conforme a migration.
          </p>
          <form action={deleteCondominiumAction}>
            <input name="condominiumId" type="hidden" value={condominium.id} />
            <button className="danger" type="submit">
              Remover condominio
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
