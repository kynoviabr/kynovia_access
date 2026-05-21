import Link from "next/link";
import { AdminDashboardShell } from "@kynovia/ui";
import { signOutAction } from "../actions";
import { requireAuthorizedProfile } from "../../lib/auth/session";
import { getCondoAdminContext } from "../../lib/condominiums/context";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const profile = await requireAuthorizedProfile();
  const context = await getCondoAdminContext();
  const condominium = context?.condominium ?? null;

  return (
    <AdminDashboardShell
      eyebrow="Condo Admin"
      title={condominium ? condominium.name : "Administracao do condominio"}
      description="Portal do administrador do condominio para gestao operacional do proprio ambiente."
      profile={profile}
      signOutAction={signOutAction}
    >
      {condominium ? (
        <section className="quick-actions">
          <Link className="module-card" href="/dashboard/settings">
            <span>Configuracoes</span>
            <strong>Dados basicos, timezone e capacidade de vagas visitantes.</strong>
          </Link>
          <Link className="module-card" href="/dashboard/units">
            <span>Unidades</span>
            <strong>Cadastro operacional de apartamentos, casas, blocos e andares.</strong>
          </Link>
          <Link className="module-card" href="/dashboard/residents">
            <span>Moradores</span>
            <strong>Moradores, vinculos com unidades e veiculos autorizados.</strong>
          </Link>
        </section>
      ) : (
        <p className="form-error">
          Nenhum condominio ativo foi encontrado para este perfil. Solicite o vinculo de
          implantacao ao suporte Kynovia.
        </p>
      )}
    </AdminDashboardShell>
  );
}
