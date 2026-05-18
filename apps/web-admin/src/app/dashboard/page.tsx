import { signOutAction } from "../actions";
import { requireAuthorizedProfile } from "../../lib/auth/session";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireAuthorizedProfile();

  return (
    <main className="app-page">
      <section className="app-panel">
        <p className="eyebrow">Kynovia Access</p>
        <h1>Admin</h1>
        <p className="muted">Sessao autenticada e autorizada para administracao.</p>
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
        <Link className="button-link" href="/dashboard/condominiums">
          Gerenciar condominios
        </Link>
        <form action={signOutAction}>
          <button className="secondary" type="submit">
            Sair
          </button>
        </form>
      </section>
    </main>
  );
}
