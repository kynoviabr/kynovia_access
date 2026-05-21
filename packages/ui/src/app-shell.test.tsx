import { describe, expect, it } from "vitest";
import {
  AccessDeniedShell,
  AdminDashboardShell,
  AppShell,
  LoginShell,
  ProfileSummary,
  ResetPasswordShell,
  ShellPanel
} from "./index";

describe("@kynovia/ui", () => {
  it("exports the AppShell primitive", () => {
    expect(AppShell).toBeTypeOf("function");
  });

  it("exports shared admin shell primitives", () => {
    expect(AccessDeniedShell).toBeTypeOf("function");
    expect(AdminDashboardShell).toBeTypeOf("function");
    expect(LoginShell).toBeTypeOf("function");
    expect(ProfileSummary).toBeTypeOf("function");
    expect(ResetPasswordShell).toBeTypeOf("function");
    expect(ShellPanel).toBeTypeOf("function");
  });
});
