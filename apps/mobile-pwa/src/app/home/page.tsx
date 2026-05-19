import { signOutAction } from "../actions";
import Link from "next/link";
import { requireAuthorizedProfile } from "../../lib/auth/session";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const profile = await requireAuthorizedProfile();

  return (
    <main className="app-page">
      <section className="app-panel">
        <p className="eyebrow">Kynovia Access</p>
        <h1>Morador</h1>
        <p className="muted">Sessao autenticada e autorizada para o app do morador.</p>
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
        <div className="quick-actions">
          <Link className="button-link" href="/home/invites">
            Convites digitais
          </Link>
        </div>
        <form action={signOutAction}>
          <button type="submit">Sair</button>
        </form>
      </section>
    </main>
  );
}
