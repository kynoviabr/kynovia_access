export const userRoles = [
  "platform_admin",
  "tenant_admin",
  "condominium_admin",
  "syndic",
  "manager",
  "doorman_supervisor",
  "resident_manager",
  "gatehouse_operator",
  "resident"
] as const;

export type UserRole = (typeof userRoles)[number];

export type AppSurface =
  | "web-admin"
  | "kynovia-admin"
  | "condo-admin"
  | "web-portaria"
  | "mobile-pwa";

export type SessionActor = {
  id: string;
  email: string;
  tenantId: string;
  condominiumId?: string | null;
  role: UserRole;
};

export type AuthContext = {
  actor: SessionActor | null;
};

export type AuthProfile = {
  id: string;
  tenantId: string;
  condominiumId?: string | null;
  fullName: string;
  role: UserRole;
};

export const appAccessByRole = {
  "web-admin": ["platform_admin", "tenant_admin", "condominium_admin"],
  "kynovia-admin": ["platform_admin"],
  "condo-admin": [
    "condominium_admin",
    "syndic",
    "manager",
    "doorman_supervisor",
    "resident_manager"
  ],
  "web-portaria": ["platform_admin", "tenant_admin", "condominium_admin", "gatehouse_operator"],
  "mobile-pwa": ["resident", "condominium_admin", "tenant_admin", "platform_admin"]
} satisfies Record<AppSurface, readonly UserRole[]>;

export function isUserRole(value: string | null | undefined): value is UserRole {
  return userRoles.includes(value as UserRole);
}

export function parseUserRole(value: string | null | undefined): UserRole | null {
  return isUserRole(value) ? value : null;
}

export function canAccessApp(role: UserRole, app: AppSurface): boolean {
  const allowedRoles: readonly UserRole[] = appAccessByRole[app];
  return allowedRoles.includes(role);
}

export function getDefaultRedirectPath(role: UserRole): string {
  if (role === "gatehouse_operator") {
    return "/dashboard";
  }

  if (role === "resident") {
    return "/home";
  }

  return "/dashboard";
}

export function getDeniedRedirectPath(app: AppSurface, role: UserRole | null): string {
  const params = new URLSearchParams({ app });

  if (role) {
    params.set("role", role);
  }

  return `/access-denied?${params.toString()}`;
}
