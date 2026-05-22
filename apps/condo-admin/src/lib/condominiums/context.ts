import type { AuthProfile } from "@kynovia/auth";
import { getCurrentProfile } from "../auth/session";
import { createServerSupabaseClient } from "../supabase/server";

export type ActiveCondominium = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  visitorParkingCapacity: number;
};

export type CondoAdminContext = {
  condominium: ActiveCondominium | null;
  profile: AuthProfile;
};

type CondominiumRow = {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  visitor_parking_capacity: number;
};

const condoAdminMembershipRoles = [
  "condominium_admin",
  "syndic",
  "manager",
  "doorman_supervisor",
  "resident_manager"
];

function mapCondominium(row: CondominiumRow): ActiveCondominium {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    timezone: row.timezone,
    visitorParkingCapacity: row.visitor_parking_capacity
  };
}

export async function getCondoAdminContext(): Promise<CondoAdminContext | null> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  const supabase = await createServerSupabaseClient();
  let condominiumId: string | null = null;

  if (condoAdminMembershipRoles.includes(profile.role)) {
    const { data: membership } = await supabase
      .from("condominium_memberships")
      .select("condominium_id")
      .eq("profile_id", profile.id)
      .eq("tenant_id", profile.tenantId)
      .in("role", condoAdminMembershipRoles)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    condominiumId = membership?.condominium_id ?? null;
  }

  let query = supabase
    .from("condominiums")
    .select("id, name, slug, timezone, visitor_parking_capacity")
    .eq("tenant_id", profile.tenantId)
    .order("name", { ascending: true })
    .limit(1);

  if (condominiumId) {
    query = query.eq("id", condominiumId);
  }

  const { data: condominium } = await query.maybeSingle();

  return {
    condominium: condominium ? mapCondominium(condominium) : null,
    profile
  };
}
