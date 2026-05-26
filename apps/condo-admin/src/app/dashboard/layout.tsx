import { redirect } from "next/navigation";
import { signOutAction } from "../actions";
import { requireAuthorizedProfile } from "../../lib/auth/session";
import { getCondoAdminContext } from "../../lib/condominiums/context";
import { getAllowedOperationalModules } from "../../lib/operations/modules";
import { DashboardNav } from "./DashboardNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await requireAuthorizedProfile();
  const context = await getCondoAdminContext();

  if (!context?.condominium) {
    redirect("/access-denied?app=condo-admin");
  }

  const modules = getAllowedOperationalModules(profile.role);
  const condominium = context.condominium;

  return (
    <div className="condo-layout">
      <aside className="condo-sidebar">
        <div className="condo-sidebar-brand">
          <span className="condo-brand-mark" aria-hidden="true">
            {condominium.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <strong>{condominium.name}</strong>
            <span>Gestao operacional</span>
          </div>
        </div>

        <DashboardNav modules={modules} />
      </aside>

      <div className="condo-main">
        <header className="condo-topbar">
          <div className="condo-topbar-condominium">
            <span className="condo-topbar-logo" aria-hidden="true">
              {condominium.name.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <span>Condominio ativo</span>
              <strong>{condominium.name}</strong>
            </div>
          </div>

          <form action={signOutAction}>
            <button className="secondary" type="submit">
              Sair
            </button>
          </form>
        </header>

        <main className="condo-content">{children}</main>
      </div>
    </div>
  );
}
