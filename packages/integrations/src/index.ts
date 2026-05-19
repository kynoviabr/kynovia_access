export const integrationProviders = ["whatsapp", "email", "sms", "webhook", "mock_gate", "http_relay"] as const;
export const gateCommandNames = ["open", "close", "hold_open", "lock"] as const;
export const gateCommandStatuses = ["pending", "sent", "confirmed", "failed", "cancelled"] as const;
export const gateCommandFailureCodes = [
  "missing_configuration",
  "timeout",
  "http_error",
  "provider_error",
  "invalid_command"
] as const;

export type IntegrationProvider = (typeof integrationProviders)[number];
export type GateCommandName = (typeof gateCommandNames)[number];
export type GateCommandStatus = (typeof gateCommandStatuses)[number];
export type GateCommandFailureCode = (typeof gateCommandFailureCodes)[number];

export type IntegrationEvent = {
  id: string;
  tenantId: string;
  provider: IntegrationProvider;
  occurredAt: string;
};

export type GateCommandRequest = {
  id: string;
  tenantId: string;
  condominiumId: string;
  accessPointId: string;
  command: GateCommandName;
  provider: "mock_gate" | "http_relay";
  requestedAt: string;
  requestedBy?: string | null;
  accessEventId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type GateCommandSuccess = {
  status: "confirmed";
  provider: GateCommandRequest["provider"];
  providerCommandId: string;
  executedAt: string;
  message: string;
  rawResponse?: unknown;
};

export type GateCommandFailure = {
  status: "failed";
  provider: GateCommandRequest["provider"];
  failedAt: string;
  errorCode: GateCommandFailureCode;
  message: string;
  rawResponse?: unknown;
};

export type GateCommandDispatchResult = GateCommandSuccess | GateCommandFailure;

export type GateIntegrationProvider = {
  readonly provider: GateCommandRequest["provider"];
  dispatch: (request: GateCommandRequest) => Promise<GateCommandDispatchResult>;
};

export type HttpRelayConfig = {
  endpointUrl: string;
  apiKey?: string;
  timeoutMs?: number;
  relayId?: string;
};

export type HttpClient = (
  url: string,
  init: {
    body: string;
    headers: Record<string, string>;
    method: "POST";
    signal: AbortSignal;
  }
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
}>;

export function isIntegrationProvider(value: string): value is IntegrationProvider {
  return integrationProviders.includes(value as IntegrationProvider);
}

export function isGateCommandName(value: string): value is GateCommandName {
  return gateCommandNames.includes(value as GateCommandName);
}

export function isGateCommandStatus(value: string): value is GateCommandStatus {
  return gateCommandStatuses.includes(value as GateCommandStatus);
}

export function isGateCommandFailureCode(value: string): value is GateCommandFailureCode {
  return gateCommandFailureCodes.includes(value as GateCommandFailureCode);
}

function nowIso() {
  return new Date().toISOString();
}

function failure(
  request: GateCommandRequest,
  errorCode: GateCommandFailureCode,
  message: string,
  rawResponse?: unknown
): GateCommandFailure {
  return {
    status: "failed",
    provider: request.provider,
    failedAt: nowIso(),
    errorCode,
    message,
    rawResponse
  };
}

function validateGateCommandRequest(request: GateCommandRequest): GateCommandFailure | null {
  if (!isGateCommandName(request.command)) {
    return failure(request, "invalid_command", `Comando de portao invalido: ${request.command}.`);
  }

  if (!request.id || !request.tenantId || !request.condominiumId || !request.accessPointId) {
    return failure(request, "invalid_command", "Comando de portao sem contexto operacional obrigatorio.");
  }

  return null;
}

export function createMockGateProvider({
  shouldFail = false
}: {
  shouldFail?: boolean;
} = {}): GateIntegrationProvider {
  return {
    provider: "mock_gate",
    async dispatch(request) {
      const invalid = validateGateCommandRequest(request);

      if (invalid) {
        return invalid;
      }

      if (shouldFail) {
        return failure(request, "provider_error", "Provider mock configurado para falhar.");
      }

      return {
        status: "confirmed",
        provider: "mock_gate",
        providerCommandId: `mock-${request.id}`,
        executedAt: nowIso(),
        message: `Comando ${request.command} confirmado pelo provider mock.`,
        rawResponse: {
          accessPointId: request.accessPointId,
          command: request.command
        }
      };
    }
  };
}

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

async function safeJson(response: Awaited<ReturnType<HttpClient>>) {
  try {
    return await response.json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

export function createHttpRelayProvider(config: HttpRelayConfig, client: HttpClient = fetch): GateIntegrationProvider {
  return {
    provider: "http_relay",
    async dispatch(request) {
      const invalid = validateGateCommandRequest(request);

      if (invalid) {
        return invalid;
      }

      if (!config.endpointUrl) {
        return failure(request, "missing_configuration", "HTTP Relay sem endpoint configurado.");
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), config.timeoutMs ?? 5000);

      try {
        const response = await client(config.endpointUrl, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {})
          },
          body: JSON.stringify({
            relayId: config.relayId ?? request.accessPointId,
            command: request.command,
            commandId: request.id,
            accessPointId: request.accessPointId,
            condominiumId: request.condominiumId,
            tenantId: request.tenantId,
            metadata: request.metadata ?? {}
          })
        });
        const payload = await safeJson(response);

        if (!response.ok) {
          return failure(
            request,
            "http_error",
            `HTTP Relay respondeu com status ${response.status}.`,
            payload
          );
        }

        return {
          status: "confirmed",
          provider: "http_relay",
          providerCommandId: `http-${request.id}`,
          executedAt: nowIso(),
          message: "Comando confirmado pelo HTTP Relay.",
          rawResponse: payload
        };
      } catch (error) {
        return failure(
          request,
          isAbortError(error) ? "timeout" : "provider_error",
          isAbortError(error) ? "HTTP Relay excedeu o tempo limite." : "Falha ao acionar HTTP Relay.",
          error instanceof Error ? { name: error.name, message: error.message } : null
        );
      } finally {
        clearTimeout(timeout);
      }
    }
  };
}

export function buildGateCommandAuditMetadata(result: GateCommandDispatchResult) {
  return {
    provider: result.provider,
    status: result.status,
    message: result.message,
    ...(result.status === "confirmed"
      ? { providerCommandId: result.providerCommandId, executedAt: result.executedAt }
      : { errorCode: result.errorCode, failedAt: result.failedAt })
  };
}
