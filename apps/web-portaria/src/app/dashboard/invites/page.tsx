import Link from "next/link";
import { validateInviteQrAction } from "./actions";
import { requireAuthorizedProfile } from "../../../lib/auth/session";
import { createServerSupabaseClient } from "../../../lib/supabase/server";

type SearchParams = Promise<{
  invite?: string;
  result?: string;
}>;

type InviteValidation = {
  created_at: string;
  id: string;
  invite_id: string | null;
  reason: string | null;
  result: string;
};

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo"
  }).format(new Date(value));
}

function resultLabel(value: string | undefined) {
  const labels: Record<string, string> = {
    allowed: "Acesso liberado",
    cancelled: "Convite cancelado",
    expired: "Convite expirado",
    invalid: "Codigo invalido",
    not_started: "Convite fora do horario",
    usage_limit_reached: "Limite de uso atingido"
  };

  return value ? labels[value] ?? value : null;
}

export default async function InviteValidationPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAuthorizedProfile();
  const queryParams = await searchParams;
  const supabase = await createServerSupabaseClient();
  const { data: validationsData, error } = await supabase
    .from("access_invite_validations")
    .select("id, invite_id, result, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(25);

  const validations = (validationsData ?? []) as InviteValidation[];
  const latestResult = resultLabel(queryParams.result);

  return (
    <main className="operator-shell">
      <header className="operator-header">
        <div>
          <p className="eyebrow">Portaria</p>
          <h1>Validar QR Code</h1>
          <p className="muted">Cole ou leia o payload do QR Code temporario apresentado pelo visitante.</p>
        </div>
        <Link className="button-link secondary" href="/dashboard">
          Voltar
        </Link>
      </header>

      {latestResult ? (
        <section className={`result-banner ${queryParams.result === "allowed" ? "success" : "danger"}`}>
          <strong>{latestResult}</strong>
          {queryParams.invite ? <span>Convite {queryParams.invite}</span> : null}
        </section>
      ) : null}

      <section className="app-panel operator-panel">
        <h2>Leitura do convite</h2>
        <form className="auth-form" action={validateInviteQrAction}>
          <label>
            QR Code
            <input autoFocus name="qrPayload" required placeholder="convite.token" />
          </label>
          <button type="submit">Validar acesso</button>
        </form>
      </section>

      <section className="app-panel operator-panel">
        <h2>Historico recente</h2>
        {error ? <p className="form-error">Falha ao carregar validacoes.</p> : null}
        <div className="list-stack">
          {validations.map((validation) => (
            <article className="list-row" key={validation.id}>
              <div>
                <strong>{resultLabel(validation.result)}</strong>
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
