import { residentStatuses, residentUnitRelationships } from "@kynovia/database";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  createResidentAction,
  createResidentVehicleAction,
  deleteResidentAction,
  deleteResidentVehicleAction,
  linkResidentUnitAction,
  unlinkResidentUnitAction,
  updateResidentAction,
  updateResidentVehicleAction
} from "./actions";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { getCondoAdminContext } from "../../../lib/condominiums/context";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

type SearchParams = Promise<{ q?: string; status?: string }>;

type Resident = {
  block_reason: string | null;
  document: string | null;
  email: string | null;
  full_name: string;
  id: string;
  phone: string | null;
  status: string;
};

type Unit = {
  block: string | null;
  floor: string | null;
  id: string;
  number: string;
};

type ResidentUnit = {
  id: string;
  is_primary: boolean;
  relationship: string;
  resident_id: string;
  unit_id: string;
};

type ResidentVehicle = {
  block_reason: string | null;
  id: string;
  label: string | null;
  plate: string;
  resident_id: string;
  status: string;
};

export const dynamic = "force-dynamic";

function unitLabel(unit: Unit | undefined) {
  if (!unit) {
    return "Unidade removida";
  }

  return [unit.block, unit.number, unit.floor ? `${unit.floor} andar` : null]
    .filter(Boolean)
    .join(" / ");
}

function optionLabel(value: string) {
  const labels: Record<string, string> = {
    active: "Ativo",
    blocked: "Bloqueado",
    dependent: "Dependente",
    inactive: "Inativo",
    owner: "Proprietario",
    resident: "Morador",
    tenant: "Inquilino"
  };

  return labels[value] ?? value;
}

function sanitizeSearch(value: string) {
  return value.replace(/[%,]/g, "").trim();
}

function statusMessage(status?: string) {
  const labels: Record<string, string> = {
    resident_created: "Morador cadastrado.",
    resident_updated: "Morador atualizado.",
    resident_deleted: "Morador removido.",
    unit_linked: "Unidade vinculada.",
    unit_unlinked: "Vinculo removido.",
    vehicle_created: "Veiculo cadastrado.",
    vehicle_updated: "Veiculo atualizado.",
    vehicle_deleted: "Veiculo removido."
  };

  return status ? labels[status] ?? null : null;
}

function errorMessage(status?: string) {
  const labels: Record<string, string> = {
    create_resident_failed: "Nao foi possivel cadastrar o morador.",
    delete_resident_failed: "Nao foi possivel remover o morador.",
    invalid_vehicle_fields: "Revise placa e status do veiculo.",
    invalid_vehicle_plate: "Informe uma placa brasileira valida.",
    link_unit_failed: "Nao foi possivel vincular a unidade.",
    missing_resident_fields: "Informe os dados obrigatorios do morador.",
    missing_resident_id: "Nao foi possivel identificar o morador.",
    missing_unit_link_fields: "Informe unidade e relacionamento.",
    missing_unit_link_id: "Nao foi possivel identificar o vinculo.",
    missing_vehicle_id: "Nao foi possivel identificar o veiculo.",
    unlink_unit_failed: "Nao foi possivel remover o vinculo.",
    update_resident_failed: "Nao foi possivel atualizar o morador.",
    update_vehicle_failed: "Nao foi possivel atualizar o veiculo.",
    create_vehicle_failed: "Nao foi possivel cadastrar o veiculo.",
    delete_vehicle_failed: "Nao foi possivel remover o veiculo."
  };

  return status ? labels[status] ?? null : null;
}

export default async function ResidentsPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuthorizedProfile();
  const context = await getCondoAdminContext();
  const queryParams = await searchParams;

  if (!context?.condominium) {
    redirect("/dashboard?error=missing_condominium_context");
  }

  const { condominium } = context;
  const searchTerm = queryParams.q?.trim() ?? "";
  const safeSearchTerm = sanitizeSearch(searchTerm);
  const statusFilter = queryParams.status?.trim() ?? "";
  const supabase = await createServerSupabaseClient();

  let residentsQuery = supabase
    .from("residents")
    .select("id, full_name, document, phone, email, status, block_reason")
    .eq("condominium_id", condominium.id)
    .order("full_name", { ascending: true });

  if (safeSearchTerm) {
    residentsQuery = residentsQuery.or(
      `full_name.ilike.%${safeSearchTerm}%,document.ilike.%${safeSearchTerm}%,phone.ilike.%${safeSearchTerm}%`
    );
  }

  if (residentStatuses.includes(statusFilter as (typeof residentStatuses)[number])) {
    residentsQuery = residentsQuery.eq("status", statusFilter);
  }

  const [
    { data: residentsData, error: residentsError },
    { data: unitsData, error: unitsError }
  ] = await Promise.all([
    residentsQuery,
    supabase
      .from("units")
      .select("id, block, number, floor")
      .eq("condominium_id", condominium.id)
      .order("block", { ascending: true })
      .order("number", { ascending: true })
  ]);

  const residents = (residentsData ?? []) as Resident[];
  const units = (unitsData ?? []) as Unit[];
  const residentIds = residents.map((resident) => resident.id);
  const [{ data: residentUnitsData }, { data: vehiclesData }] = residentIds.length
    ? await Promise.all([
        supabase
          .from("resident_units")
          .select("id, resident_id, unit_id, relationship, is_primary")
          .in("resident_id", residentIds),
        supabase
          .from("resident_vehicles")
          .select("id, resident_id, plate, label, status, block_reason")
          .in("resident_id", residentIds)
          .order("plate", { ascending: true })
      ])
    : [{ data: [] }, { data: [] }];

  const residentUnits = (residentUnitsData ?? []) as ResidentUnit[];
  const vehicles = (vehiclesData ?? []) as ResidentVehicle[];
  const unitsById = new Map(units.map((unit) => [unit.id, unit]));
  const success = statusMessage(queryParams.status);
  const failure = errorMessage(queryParams.status);

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Condo Admin</p>
          <h1>Moradores e veiculos</h1>
          <p className="muted">
            Cadastro operacional do {condominium.name}, incluindo vinculos com unidades e placas
            dos moradores.
          </p>
        </div>
        <Link className="button-link secondary" href="/dashboard">
          Voltar
        </Link>
      </header>

      {success ? <p className="form-success">{success}</p> : null}
      {failure ? <p className="form-error">{failure}</p> : null}
      {residentsError ? <p className="form-error">Falha ao carregar moradores.</p> : null}
      {unitsError ? <p className="form-error">Falha ao carregar unidades.</p> : null}

      <section className="toolbar">
        <form className="filter-form">
          <label>
            Buscar
            <input name="q" placeholder="Nome, documento ou telefone" defaultValue={searchTerm} />
          </label>
          <label>
            Status
            <select name="status" defaultValue={statusFilter}>
              <option value="">Todos</option>
              {residentStatuses.map((status) => (
                <option key={status} value={status}>
                  {optionLabel(status)}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">Filtrar</button>
          <Link className="button-link secondary" href="/dashboard/residents">
            Limpar
          </Link>
        </form>
      </section>

      <section className="admin-grid">
        <div className="admin-section">
          <h2>Novo morador</h2>
          <form className="admin-form" action={createResidentAction}>
            <input name="condominiumId" type="hidden" value={condominium.id} />
            <label>
              Nome completo
              <input name="fullName" required placeholder="Maria Silva" />
            </label>
            <label>
              Documento
              <input name="document" placeholder="CPF ou documento interno" />
            </label>
            <label>
              Telefone
              <input name="phone" placeholder="11999990000" />
            </label>
            <label>
              E-mail
              <input name="email" type="email" placeholder="morador@example.com" />
            </label>
            <label>
              Status
              <select name="status" defaultValue="active">
                {residentStatuses.map((status) => (
                  <option key={status} value={status}>
                    {optionLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Motivo do bloqueio
              <input name="blockReason" placeholder="Obrigatorio apenas se bloqueado" />
            </label>
            <button type="submit">Cadastrar morador</button>
          </form>
        </div>

        <div className="admin-section">
          <h2>Escopo desta tela</h2>
          <p className="muted">
            Esta area permite administrar moradores, vinculos com unidades e veiculos do condominio
            ativo. Importacao CSV e aprovacoes avancadas seguem em PRs futuros.
          </p>
        </div>
      </section>

      <section className="admin-section">
        <h2>Moradores cadastrados</h2>
        <div className="list-stack">
          {residents.map((resident) => {
            const links = residentUnits.filter((link) => link.resident_id === resident.id);
            const residentVehicles = vehicles.filter((vehicle) => vehicle.resident_id === resident.id);

            return (
              <article className="management-record" key={resident.id}>
                <form className="record-grid" action={updateResidentAction}>
                  <input name="condominiumId" type="hidden" value={condominium.id} />
                  <input name="residentId" type="hidden" value={resident.id} />
                  <label>
                    Nome
                    <input name="fullName" required defaultValue={resident.full_name} />
                  </label>
                  <label>
                    Documento
                    <input name="document" defaultValue={resident.document ?? ""} />
                  </label>
                  <label>
                    Telefone
                    <input name="phone" defaultValue={resident.phone ?? ""} />
                  </label>
                  <label>
                    E-mail
                    <input name="email" type="email" defaultValue={resident.email ?? ""} />
                  </label>
                  <label>
                    Status
                    <select name="status" defaultValue={resident.status}>
                      {residentStatuses.map((status) => (
                        <option key={status} value={status}>
                          {optionLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Motivo bloqueio
                    <input name="blockReason" defaultValue={resident.block_reason ?? ""} />
                  </label>
                  <button type="submit">Salvar morador</button>
                </form>

                <div className="record-subgrid">
                  <div>
                    <h3>Unidades</h3>
                    <form className="inline-form compact-form" action={linkResidentUnitAction}>
                      <input name="condominiumId" type="hidden" value={condominium.id} />
                      <input name="residentId" type="hidden" value={resident.id} />
                      <select name="unitId" required>
                        <option value="">Unidade</option>
                        {units.map((unit) => (
                          <option key={unit.id} value={unit.id}>
                            {unitLabel(unit)}
                          </option>
                        ))}
                      </select>
                      <select name="relationship" defaultValue="resident">
                        {residentUnitRelationships.map((relationship) => (
                          <option key={relationship} value={relationship}>
                            {optionLabel(relationship)}
                          </option>
                        ))}
                      </select>
                      <label className="checkbox-label">
                        <input name="isPrimary" type="checkbox" />
                        Principal
                      </label>
                      <button type="submit">Vincular</button>
                    </form>
                    <div className="chips">
                      {links.map((link) => (
                        <form className="chip" action={unlinkResidentUnitAction} key={link.id}>
                          <input name="condominiumId" type="hidden" value={condominium.id} />
                          <input name="residentUnitId" type="hidden" value={link.id} />
                          <span>
                            {unitLabel(unitsById.get(link.unit_id))} - {optionLabel(link.relationship)}
                            {link.is_primary ? " - principal" : ""}
                          </span>
                          <button className="secondary compact-button" type="submit">
                            Remover
                          </button>
                        </form>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3>Veiculos</h3>
                    <form className="inline-form compact-form" action={createResidentVehicleAction}>
                      <input name="condominiumId" type="hidden" value={condominium.id} />
                      <input name="residentId" type="hidden" value={resident.id} />
                      <input name="plate" required placeholder="ABC1D23" />
                      <input name="label" placeholder="Descricao" />
                      <button type="submit">Adicionar</button>
                    </form>
                    <div className="list-stack compact-stack">
                      {residentVehicles.map((vehicle) => (
                        <div className="nested-row" key={vehicle.id}>
                          <form className="inline-form compact-form" action={updateResidentVehicleAction}>
                            <input name="condominiumId" type="hidden" value={condominium.id} />
                            <input name="vehicleId" type="hidden" value={vehicle.id} />
                            <input name="plate" required defaultValue={vehicle.plate} />
                            <input name="label" defaultValue={vehicle.label ?? ""} />
                            <select name="status" defaultValue={vehicle.status}>
                              {residentStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {optionLabel(status)}
                                </option>
                              ))}
                            </select>
                            <input name="blockReason" defaultValue={vehicle.block_reason ?? ""} />
                            <button type="submit">Salvar</button>
                          </form>
                          <form action={deleteResidentVehicleAction}>
                            <input name="condominiumId" type="hidden" value={condominium.id} />
                            <input name="vehicleId" type="hidden" value={vehicle.id} />
                            <button className="secondary" type="submit">
                              Remover
                            </button>
                          </form>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <form action={deleteResidentAction}>
                  <input name="condominiumId" type="hidden" value={condominium.id} />
                  <input name="residentId" type="hidden" value={resident.id} />
                  <button className="secondary" type="submit">
                    Remover morador
                  </button>
                </form>
              </article>
            );
          })}
        </div>
        {!residents.length ? <p className="muted">Nenhum morador encontrado.</p> : null}
      </section>
    </main>
  );
}
