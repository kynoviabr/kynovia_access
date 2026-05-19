import { describe, expect, it } from "vitest";
import {
  buildGateCommandAuditMetadata,
  createHttpRelayProvider,
  createMockGateProvider,
  isGateCommandFailureCode,
  isGateCommandName,
  isGateCommandStatus,
  isIntegrationProvider,
  type GateCommandRequest,
  type HttpClient,
  type IntegrationEvent,
  type IntegrationProvider
} from "./index";

const command = {
  id: "command_123",
  tenantId: "tenant_123",
  condominiumId: "condominium_123",
  accessPointId: "access_point_123",
  command: "open",
  provider: "mock_gate",
  requestedAt: "2026-05-18T00:00:00.000Z",
  requestedBy: "profile_123",
  accessEventId: "event_123"
} satisfies GateCommandRequest;

describe("@kynovia/integrations", () => {
  it("supports typed integration providers and events", () => {
    const provider = "webhook" satisfies IntegrationProvider;
    const event = {
      id: "event_123",
      tenantId: "tenant_123",
      provider: "email",
      occurredAt: "2026-05-18T00:00:00.000Z"
    } satisfies IntegrationEvent;

    expect(provider).toBe("webhook");
    expect(event.provider).toBe("email");
    expect(isIntegrationProvider("http_relay")).toBe(true);
  });

  it("validates gate command contracts", () => {
    expect(isGateCommandName("open")).toBe(true);
    expect(isGateCommandName("unlock")).toBe(false);
    expect(isGateCommandStatus("confirmed")).toBe(true);
    expect(isGateCommandStatus("queued")).toBe(false);
    expect(isGateCommandFailureCode("timeout")).toBe(true);
  });

  it("confirms commands with the mock gate provider", async () => {
    const result = await createMockGateProvider().dispatch(command);

    expect(result.status).toBe("confirmed");
    expect(result.provider).toBe("mock_gate");
    expect(result.message).toContain("confirmado");
  });

  it("fails deterministically with a failing mock provider", async () => {
    const result = await createMockGateProvider({ shouldFail: true }).dispatch(command);

    expect(result.status).toBe("failed");
    expect(result.provider).toBe("mock_gate");
    if (result.status === "failed") {
      expect(result.errorCode).toBe("provider_error");
    }
  });

  it("dispatches HTTP relay commands with authorization and payload", async () => {
    const calls: Array<{ body: string; headers: Record<string, string>; url: string }> = [];
    const client: HttpClient = async (url, init) => {
      calls.push({ url, body: init.body, headers: init.headers });

      return {
        ok: true,
        status: 200,
        async json() {
          return { ok: true };
        },
        async text() {
          return "ok";
        }
      };
    };
    const result = await createHttpRelayProvider(
      { endpointUrl: "https://relay.example.test/open", apiKey: "test-key", relayId: "relay-1" },
      client
    ).dispatch({ ...command, provider: "http_relay" });

    expect(result.status).toBe("confirmed");
    expect(calls).toHaveLength(1);
    expect(calls[0]?.headers.Authorization).toBe("Bearer test-key");
    expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({
      relayId: "relay-1",
      command: "open",
      commandId: "command_123"
    });
  });

  it("maps HTTP relay failures and missing config", async () => {
    const failingClient: HttpClient = async () => ({
      ok: false,
      status: 503,
      async json() {
        return { error: "offline" };
      },
      async text() {
        return "offline";
      }
    });
    const missing = await createHttpRelayProvider({ endpointUrl: "" }).dispatch({
      ...command,
      provider: "http_relay"
    });
    const failed = await createHttpRelayProvider({ endpointUrl: "https://relay.example.test" }, failingClient).dispatch({
      ...command,
      provider: "http_relay"
    });

    expect(missing.status).toBe("failed");
    expect(failed.status).toBe("failed");
    if (missing.status === "failed" && failed.status === "failed") {
      expect(missing.errorCode).toBe("missing_configuration");
      expect(failed.errorCode).toBe("http_error");
    }
  });

  it("builds audit metadata for command results", async () => {
    const success = await createMockGateProvider().dispatch(command);
    const failure = await createMockGateProvider({ shouldFail: true }).dispatch(command);

    expect(buildGateCommandAuditMetadata(success)).toMatchObject({
      provider: "mock_gate",
      status: "confirmed"
    });
    expect(buildGateCommandAuditMetadata(failure)).toMatchObject({
      provider: "mock_gate",
      status: "failed",
      errorCode: "provider_error"
    });
  });
});
