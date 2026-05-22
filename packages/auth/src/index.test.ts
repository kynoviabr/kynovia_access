import { describe, expect, it } from "vitest";
import {
  canAccessApp,
  getDeniedRedirectPath,
  getDefaultRedirectPath,
  isUserRole,
  parseUserRole,
  type AuthContext,
  type SessionActor
} from "./index";

describe("@kynovia/auth", () => {
  it("supports a typed authenticated context", () => {
    const actor = {
      id: "user_123",
      email: "operator@example.com",
      tenantId: "tenant_123",
      condominiumId: "condominium_123",
      role: "gatehouse_operator"
    } satisfies SessionActor;

    const context = { actor } satisfies AuthContext;

    expect(context.actor?.tenantId).toBe("tenant_123");
    expect(context.actor?.role).toBe("gatehouse_operator");
  });

  it("supports an anonymous auth context", () => {
    const context = { actor: null } satisfies AuthContext;

    expect(context.actor).toBeNull();
  });

  it("parses supported user roles", () => {
    expect(isUserRole("tenant_admin")).toBe(true);
    expect(isUserRole("syndic")).toBe(true);
    expect(isUserRole("manager")).toBe(true);
    expect(isUserRole("doorman_supervisor")).toBe(true);
    expect(isUserRole("resident_manager")).toBe(true);
    expect(parseUserRole("unknown")).toBeNull();
  });

  it("authorizes users by app surface", () => {
    expect(canAccessApp("tenant_admin", "web-admin")).toBe(true);
    expect(canAccessApp("platform_admin", "kynovia-admin")).toBe(true);
    expect(canAccessApp("tenant_admin", "kynovia-admin")).toBe(false);
    expect(canAccessApp("condominium_admin", "condo-admin")).toBe(true);
    expect(canAccessApp("syndic", "condo-admin")).toBe(true);
    expect(canAccessApp("manager", "condo-admin")).toBe(true);
    expect(canAccessApp("doorman_supervisor", "condo-admin")).toBe(true);
    expect(canAccessApp("resident_manager", "condo-admin")).toBe(true);
    expect(canAccessApp("platform_admin", "condo-admin")).toBe(false);
    expect(canAccessApp("gatehouse_operator", "web-admin")).toBe(false);
    expect(canAccessApp("resident", "mobile-pwa")).toBe(true);
  });

  it("returns deterministic role redirects", () => {
    expect(getDefaultRedirectPath("resident")).toBe("/home");
    expect(getDefaultRedirectPath("platform_admin")).toBe("/dashboard");
    expect(getDeniedRedirectPath("web-admin", "resident")).toBe(
      "/access-denied?app=web-admin&role=resident"
    );
  });
});
