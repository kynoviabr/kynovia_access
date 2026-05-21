import { AdminDashboardShell } from "@kynovia/ui";
import Link from "next/link";
import { signOutAction } from "../actions";
import { requireAuthorizedProfile } from "../../lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireAuthorizedProfile();

  return (
    <AdminDashboardShell
      eyebrow="Kynovia Admin"
      title="Backoffice SaaS"
      description="Shell inicial para administracao interna da plataforma, clientes, onboarding e suporte. Fluxos operacionais detalhados dos condominios permanecem fora deste app."
      profile={profile}
      signOutAction={signOutAction}
    >
      <div className="shell-actions">
        <Link className="button-link" href="/dashboard/condominiums">
          Gerenciar condominios
        </Link>
      </div>
    </AdminDashboardShell>
  );
}
