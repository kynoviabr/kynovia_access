import { signOutAction } from "../actions";
import { requireAuthorizedProfile } from "../../lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireAuthorizedProfile();

  return (
    <main className="app-page">
      <section className="app-panel">
        <p className="eyebrow">Condo Admin</p>
        <h1>Administracao do condominio</h1>
        <p className="muted">
          Shell inicial para a gestao operacional de um unico condominio cliente. As telas de
          moradores, unidades, visitantes, veiculos e configuracoes serao migradas em PRs separados.
        </p>
        <dl className="profile-list">
          <div>
            <dt>Usuario</dt>
            <dd>{profile.fullName}</dd>
          </div>
          <div>
            <dt>Perfil</dt>
            <dd>{profile.role}</dd>
          </div>
          <div>
            <dt>Tenant</dt>
            <dd>{profile.tenantId}</dd>
          </div>
        </dl>
        <form action={signOutAction} className="shell-actions">
          <button className="secondary" type="submit">
            Sair
          </button>
        </form>
      </section>
    </main>
  );
}
