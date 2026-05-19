export const integrationProviders = [
  "whatsapp",
  "email",
  "sms",
  "webhook",
  "mock_gate",
  "http_relay",
  "mock_lpr",
  "plate_recognizer"
] as const;
export const gateCommandNames = ["open", "close", "hold_open", "lock"] as const;
export const gateCommandStatuses = ["pending", "sent", "confirmed", "failed", "cancelled"] as const;
export const gateCommandFailureCodes = [
  "missing_configuration",
  "timeout",
  "http_error",
  "provider_error",
  "invalid_command"
] as const;
export const lprProviders = ["mock_lpr", "plate_recognizer"] as const;
export const lprEventTypes = ["plate_detected", "low_confidence_review", "provider_error"] as const;
export const lprConfidenceLevels = ["accepted", "manual_review"] as const;
export const lprFailureCodes = [
  "missing_configuration",
  "timeout",
  "http_error",
  "provider_error",
  "invalid_payload",
  "no_plate_detected"
] as const;

export type IntegrationProvider = (typeof integrationProviders)[number];
export type GateCommandName = (typeof gateCommandNames)[number];
export type GateCommandStatus = (typeof gateCommandStatuses)[number];
export type GateCommandFailureCode = (typeof gateCommandFailureCodes)[number];
export type LprProviderName = (typeof lprProviders)[number];
export type LprEventType = (typeof lprEventTypes)[number];
export type LprConfidenceLevel = (typeof lprConfidenceLevels)[number];
export type LprFailureCode = (typeof lprFailureCodes)[number];

export type IntegrationEvent = {
  id: string;
  tenantId: string;
  provider: IntegrationProvider;
  occurredAt: string;
};

export type LprWebhookRequest = {
  id: string;
  tenantId: string;
  condominiumId: string;
  accessPointId: string;
  provider: LprProviderName;
  occurredAt: string;
  direction?: "entry" | "exit" | null;
  payload: unknown;
};

export type LprPlateCandidate = {
  rawPlate: string;
  normalizedPlate: string;
  confidence: number;
  country?: string | null;
  region?: string | null;
};

export type LprReading = {
  id: string;
  tenantId: string;
  condominiumId: string;
  accessPointId: string;
  provider: LprProviderName;
  occurredAt: string;
  eventType: Exclude<LprEventType, "provider_error">;
  candidate: LprPlateCandidate | null;
  confidenceLevel: LprConfidenceLevel;
  requiresManualReview: boolean;
  minConfidence: number;
  direction?: "entry" | "exit" | null;
  rawPayload?: unknown;
};

export type LprFailure = {
  id: string;
  tenantId: string;
  condominiumId: string;
  accessPointId: string;
  provider: LprProviderName;
  occurredAt: string;
  eventType: "provider_error";
  errorCode: LprFailureCode;
  message: string;
  rawPayload?: unknown;
};

export type LprWebhookResult = LprReading | LprFailure;

export type LprProvider = {
  readonly provider: LprProviderName;
  parseWebhook: (request: LprWebhookRequest) => Promise<LprWebhookResult>;
};

export type LprAccessSubject = {
  type: "resident_vehicle" | "visitor_vehicle" | "unknown";
  plate: string | null;
  confidence: number | null;
  requiresManualReview: boolean;
  provider: LprProviderName;
  readingId: string;
};

export type PlateRecognizerConfig = {
  minConfidence?: number;
};

type PlateRecognizerResult = {
  plate?: unknown;
  score?: unknown;
  candidates?: Array<{
    plate?: unknown;
    score?: unknown;
  }>;
  region?: {
    code?: unknown;
  };
  vehicle?: {
    score?: unknown;
  };
};

type PlateRecognizerPayload = {
  results?: PlateRecognizerResult[];
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

export function isLprProvider(value: string): value is LprProviderName {
  return lprProviders.includes(value as LprProviderName);
}

export function isLprEventType(value: string): value is LprEventType {
  return lprEventTypes.includes(value as LprEventType);
}

export function isLprConfidenceLevel(value: string): value is LprConfidenceLevel {
  return lprConfidenceLevels.includes(value as LprConfidenceLevel);
}

export function isLprFailureCode(value: string): value is LprFailureCode {
  return lprFailureCodes.includes(value as LprFailureCode);
}

export function normalizeBrazilianPlate(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}

export function isBrazilianPlateFormat(value: string) {
  const normalized = normalizeBrazilianPlate(value);

  return /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/.test(normalized);
}

export function classifyLprConfidence(confidence: number, minConfidence = 0.85): LprConfidenceLevel {
  return confidence >= minConfidence ? "accepted" : "manual_review";
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

function lprFailure(
  request: LprWebhookRequest,
  errorCode: LprFailureCode,
  message: string,
  rawPayload?: unknown
): LprFailure {
  return {
    id: request.id,
    tenantId: request.tenantId,
    condominiumId: request.condominiumId,
    accessPointId: request.accessPointId,
    provider: request.provider,
    occurredAt: request.occurredAt,
    eventType: "provider_error",
    errorCode,
    message,
    rawPayload
  };
}

function buildLprReading({
  candidate,
  minConfidence,
  request
}: {
  candidate: LprPlateCandidate | null;
  minConfidence: number;
  request: LprWebhookRequest;
}): LprReading {
  const confidenceLevel = candidate ? classifyLprConfidence(candidate.confidence, minConfidence) : "manual_review";

  return {
    id: request.id,
    tenantId: request.tenantId,
    condominiumId: request.condominiumId,
    accessPointId: request.accessPointId,
    provider: request.provider,
    occurredAt: request.occurredAt,
    eventType: candidate && confidenceLevel === "accepted" ? "plate_detected" : "low_confidence_review",
    candidate,
    confidenceLevel,
    requiresManualReview: confidenceLevel === "manual_review",
    minConfidence,
    direction: request.direction ?? null,
    rawPayload: request.payload
  };
}

function bestPlateRecognizerCandidate(payload: PlateRecognizerPayload): PlateRecognizerResult | null {
  const results = payload.results ?? [];

  return results.reduce<PlateRecognizerResult | null>((best, current) => {
    const currentScore = typeof current.score === "number" ? current.score : 0;
    const bestScore = best && typeof best.score === "number" ? best.score : 0;

    return currentScore > bestScore ? current : best;
  }, null);
}

function plateFromRecognizerResult(result: PlateRecognizerResult): string | null {
  if (typeof result.plate === "string") {
    return result.plate;
  }

  const candidate = result.candidates?.find((item) => typeof item.plate === "string");

  return typeof candidate?.plate === "string" ? candidate.plate : null;
}

function confidenceFromRecognizerResult(result: PlateRecognizerResult): number {
  if (typeof result.score === "number") {
    return result.score;
  }

  const candidate = result.candidates?.find((item) => typeof item.score === "number");

  return typeof candidate?.score === "number" ? candidate.score : 0;
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

export function createMockLprProvider({
  confidence = 0.97,
  minConfidence = 0.85,
  plate = "ABC1D23"
}: {
  confidence?: number;
  minConfidence?: number;
  plate?: string;
} = {}): LprProvider {
  return {
    provider: "mock_lpr",
    async parseWebhook(request) {
      if (!request.id || !request.tenantId || !request.condominiumId || !request.accessPointId) {
        return lprFailure(request, "invalid_payload", "Leitura LPR sem contexto operacional obrigatorio.", request.payload);
      }

      const normalizedPlate = normalizeBrazilianPlate(plate);

      return buildLprReading({
        request,
        minConfidence,
        candidate: {
          rawPlate: plate,
          normalizedPlate,
          confidence,
          country: "BR",
          region: null
        }
      });
    }
  };
}

export function createPlateRecognizerProvider({ minConfidence = 0.85 }: PlateRecognizerConfig = {}): LprProvider {
  return {
    provider: "plate_recognizer",
    async parseWebhook(request) {
      if (!request.id || !request.tenantId || !request.condominiumId || !request.accessPointId) {
        return lprFailure(request, "invalid_payload", "Webhook LPR sem contexto operacional obrigatorio.", request.payload);
      }

      if (!request.payload || typeof request.payload !== "object") {
        return lprFailure(request, "invalid_payload", "Payload Plate Recognizer invalido.", request.payload);
      }

      const best = bestPlateRecognizerCandidate(request.payload as PlateRecognizerPayload);

      if (!best) {
        return lprFailure(request, "no_plate_detected", "Plate Recognizer nao retornou placas.", request.payload);
      }

      const rawPlate = plateFromRecognizerResult(best);

      if (!rawPlate) {
        return lprFailure(request, "no_plate_detected", "Plate Recognizer retornou leitura sem placa.", request.payload);
      }

      const normalizedPlate = normalizeBrazilianPlate(rawPlate);
      const confidence = confidenceFromRecognizerResult(best);

      return buildLprReading({
        request,
        minConfidence,
        candidate: {
          rawPlate,
          normalizedPlate,
          confidence,
          country: "BR",
          region: typeof best.region?.code === "string" ? best.region.code : null
        }
      });
    }
  };
}

export function buildLprAccessSubject(reading: LprWebhookResult): LprAccessSubject {
  if (reading.eventType === "provider_error") {
    return {
      type: "unknown",
      plate: null,
      confidence: null,
      requiresManualReview: true,
      provider: reading.provider,
      readingId: reading.id
    };
  }

  const plate = reading.candidate?.normalizedPlate ?? null;

  return {
    type: plate && !reading.requiresManualReview ? "visitor_vehicle" : "unknown",
    plate,
    confidence: reading.candidate?.confidence ?? null,
    requiresManualReview: reading.requiresManualReview || !plate,
    provider: reading.provider,
    readingId: reading.id
  };
}

export function buildLprEventAuditMetadata(reading: LprWebhookResult) {
  if (reading.eventType === "provider_error") {
    return {
      provider: reading.provider,
      eventType: reading.eventType,
      errorCode: reading.errorCode,
      message: reading.message
    };
  }

  return {
    provider: reading.provider,
    eventType: reading.eventType,
    plate: reading.candidate?.normalizedPlate ?? null,
    confidence: reading.candidate?.confidence ?? null,
    confidenceLevel: reading.confidenceLevel,
    requiresManualReview: reading.requiresManualReview,
    minConfidence: reading.minConfidence
  };
}
