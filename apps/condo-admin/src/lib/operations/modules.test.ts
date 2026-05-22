import { describe, expect, it } from "vitest";
import { canAccessOperationalModule, getAllowedOperationalModules } from "./modules";

describe("condo-admin operational modules", () => {
  it("exposes all operational modules to condominium administrators", () => {
    const modules = getAllowedOperationalModules("condominium_admin");

    expect(modules.map((module) => module.key)).toEqual([
      "units",
      "residents",
      "vehicles",
      "gates",
      "employees",
      "suppliers",
      "visitors",
      "invites",
      "doorman",
      "occurrences",
      "settings"
    ]);
  });

  it("restricts module access for operational support roles", () => {
    expect(canAccessOperationalModule("doorman_supervisor", "doorman")).toBe(true);
    expect(canAccessOperationalModule("doorman_supervisor", "settings")).toBe(false);
    expect(canAccessOperationalModule("resident_manager", "residents")).toBe(true);
    expect(canAccessOperationalModule("resident_manager", "gates")).toBe(false);
    expect(getAllowedOperationalModules("tenant_admin")).toEqual([]);
  });
});
