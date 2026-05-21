import { AdminDashboardShell } from "@kynovia/ui";
import { signOutAction } from "../actions";
import { requireAuthorizedProfile } from "../../lib/auth/session";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireAuthorizedProfile();

  return (
    <AdminDashboardShell
      eyebrow="Condo Admin"
      title="Administracao do condominio"
      description="Shell inicial para a gestao operacional de um unico condominio cliente. As telas de moradores, unidades, visitantes, veiculos e configuracoes serao migradas em PRs separados."
      profile={profile}
      signOutAction={signOutAction}
    />
  );
}
