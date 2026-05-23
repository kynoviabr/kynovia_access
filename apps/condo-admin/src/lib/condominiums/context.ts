import type { AuthProfile } from "@kynovia/auth";
import { getCurrentProfile } from "../auth/session";
import { createServerSupabaseClient } from "../supabase/server";

export type ActiveCondominium = {
  city: string;
  cnpj: string;
  complement: string;
  email: string;
  fullAddress: string;
  id: string;
  name: string;
  number: string;
  phone: string;
  postalCode: string;
  slug: string;
  state: string;
  timezone: string;
  visitorParkingCapacity: number;
  whatsapp: string;
};

export type CondoAdminContext = {
  condominium: ActiveCondominium | null;
  profile: AuthProfile;
};

type CondominiumRow = {
  id: string;
  metadata: unknown;
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
  const metadata =
    row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  const value = (key: string) => {
    const item = metadata[key];
    return typeof item === "string" ? item : "";
  };

  return {
    city: value("city"),
    cnpj: value("cnpj"),
    complement: value("complement"),
    email: value("email"),
    fullAddress: value("fullAddress"),
    id: row.id,
    name: row.name,
    number: value("number"),
    phone: value("phone"),
    postalCode: value("postalCode"),
    slug: row.slug,
    state: value("state"),
    timezone: row.timezone,
    visitorParkingCapacity: row.visitor_parking_capacity,
    whatsapp: value("whatsapp")
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
    .select("id, name, slug, timezone, visitor_parking_capacity, metadata")
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
