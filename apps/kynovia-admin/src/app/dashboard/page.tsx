import { AdminDashboardShell } from "@kynovia/ui";
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
    />
  );
}
