import { describe, expect, it } from "vitest";
import type { AuthContext, SessionActor } from "./index";

describe("@kynovia/auth", () => {
  it("supports a typed authenticated context", () => {
    const actor = {
      id: "user_123",
      email: "operator@example.com",
      tenantId: "tenant_123"
    } satisfies SessionActor;

    const context = { actor } satisfies AuthContext;

    expect(context.actor?.tenantId).toBe("tenant_123");
  });

  it("supports an anonymous auth context", () => {
    const context = { actor: null } satisfies AuthContext;

    expect(context.actor).toBeNull();
  });
});
