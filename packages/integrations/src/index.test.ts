import { describe, expect, it } from "vitest";
import type { IntegrationEvent, IntegrationProvider } from "./index";

describe("@kynovia/integrations", () => {
  it("supports typed integration providers", () => {
    const provider = "webhook" satisfies IntegrationProvider;

    expect(provider).toBe("webhook");
  });

  it("supports typed integration events", () => {
    const event = {
      id: "event_123",
      tenantId: "tenant_123",
      provider: "email",
      occurredAt: "2026-05-18T00:00:00.000Z"
    } satisfies IntegrationEvent;

    expect(event.provider).toBe("email");
  });
});
