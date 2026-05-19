import Link from "next/link";
import { requireAuthorizedProfile } from "../../../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../../../lib/supabase/server";

type PageParams = Promise<{ condominiumId: string }>;

type Invite = {
  created_at: string;
  expires_at: string;
  id: string;
  invite_type: string;
  max_uses: number;
  status: string;
  unit_id: string | null;
  use_count: number;
  visitor_name: string;
};

type Validation = {
  created_at: string;
  id: string;
  invite_id: string | null;
  reason: string | null;
  result: string;
};

type Unit = {
  block: string | null;
  floor: string | null;
  id: string;
  number: string;
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function unitLabel(unit: Unit | undefined) {
  if (!unit) {
    return "Unidade removida";
  }

  return [unit.block, unit.number, unit.floor ? `${unit.floor} andar` : null]
    .filter(Boolean)
    .join(" / ");
}

export default async function CondominiumInvitesPage({ params }: { params: PageParams }) {
  await requireAuthorizedProfile();
  const { condominiumId } = await params;
  const supabase = await createServerSupabaseClient();

  const [
    { data: condominium },
    { data: invitesData, error: invitesError },
    { data: validationsData, error: validationsError },
    { data: unitsData }
  ] = await Promise.all([
    supabase.from("condominiums").select("id, name").eq("id", condominiumId).maybeSingle(),
    supabase
      .from("access_invites")
      .select("id, unit_id, visitor_name, invite_type, status, expires_at, max_uses, use_count, created_at")
      .eq("condominium_id", condominiumId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("access_invite_validations")
      .select("id, invite_id, result, reason, created_at")
      .eq("condominium_id", condominiumId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("units")
      .select("id, block, number, floor")
      .eq("condominium_id", condominiumId)
      .order("block", { ascending: true })
      .order("number", { ascending: true })
  ]);

  const invites = (invitesData ?? []) as Invite[];
  const validations = (validationsData ?? []) as Validation[];
  const unitsById = new Map(((unitsData ?? []) as Unit[]).map((unit) => [unit.id, unit]));

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">Convites digitais</p>
          <h1>{condominium?.name ?? "Condominio"}</h1>
          <p className="muted">Historico de convites, validade, limites de uso e validacoes da portaria.</p>
        </div>
        <Link className="button-link secondary" href={`/dashboard/condominiums/${condominiumId}`}>
          Voltar
        </Link>
      </header>

      {invitesError ? <p className="form-error">Falha ao carregar convites.</p> : null}
      {validationsError ? <p className="form-error">Falha ao carregar validacoes.</p> : null}

      <section className="admin-section">
        <h2>Convites recentes</h2>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Visitante</th>
                <th>Unidade</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Uso</th>
                <th>Validade</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id}>
                  <td>{invite.visitor_name}</td>
                  <td>{invite.unit_id ? unitLabel(unitsById.get(invite.unit_id)) : "Sem unidade"}</td>
                  <td>{invite.invite_type}</td>
                  <td>{invite.status}</td>
                  <td>
                    {invite.use_count}/{invite.max_uses}
                  </td>
                  <td>{formatDate(invite.expires_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Validacoes recentes</h2>
        <div className="list-stack">
          {validations.map((validation) => (
            <article className="list-row" key={validation.id}>
              <div>
                <strong>{validation.result}</strong>
                <span>
                  {validation.reason ?? "Sem observacao"} · {formatDate(validation.created_at)}
                </span>
              </div>
              {validation.invite_id ? <small>{validation.invite_id}</small> : null}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
