import {
  canAccessApp,
  getDeniedRedirectPath,
  parseUserRole,
  type AuthProfile
} from "@kynovia/auth";
import { redirect } from "next/navigation";
import { appSurface } from "./config";
import { createServerSupabaseClient } from "../supabase/server";

export async function getCurrentProfile(): Promise<AuthProfile | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, tenant_id, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const role = parseUserRole(profile?.role);

  if (!profile || !role) {
    return null;
  }

  return {
    id: profile.id,
    tenantId: profile.tenant_id,
    fullName: profile.full_name,
    role
  };
}

export async function requireAuthorizedProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (!canAccessApp(profile.role, appSurface)) {
    redirect(getDeniedRedirectPath(appSurface, profile.role));
  }

  return profile;
}
