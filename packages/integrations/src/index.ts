export const integrationProviders = [
  "whatsapp",
  "email",
  "sms",
  "webhook",
  "mock_gate",
  "http_relay",
  "mock_lpr",
  "plate_recognizer",
  "mock_facial",
  "facial_provider"
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
export const facialProviders = ["mock_facial", "facial_provider"] as const;
export const facialConsentStatuses = ["granted", "revoked", "expired"] as const;
export const facialValidationResults = ["matched", "manual_review", "denied"] as const;
export const facialFailureCodes = [
  "missing_configuration",
  "provider_error",
  "invalid_payload",
  "missing_consent",
  "consent_revoked",
  "consent_expired",
  "low_confidence",
  "liveness_failed",
  "blacklisted_face"
] as const;

export type IntegrationProvider = (typeof integrationProviders)[number];
export type GateCommandName = (typeof gateCommandNames)[number];
export type GateCommandStatus = (typeof gateCommandStatuses)[number];
export type GateCommandFailureCode = (typeof gateCommandFailureCodes)[number];
export type LprProviderName = (typeof lprProviders)[number];
export type LprEventType = (typeof lprEventTypes)[number];
export type LprConfidenceLevel = (typeof lprConfidenceLevels)[number];
export type LprFailureCode = (typeof lprFailureCodes)[number];
export type FacialProviderName = (typeof facialProviders)[number];
export type FacialConsentStatus = (typeof facialConsentStatuses)[number];
export type FacialValidationResult = (typeof facialValidationResults)[number];
export type FacialFailureCode = (typeof facialFailureCodes)[number];

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

export type FacialConsent = {
  id: string;
  subjectId: string;
  status: FacialConsentStatus;
  grantedAt: string;
  expiresAt?: string | null;
  revokedAt?: string | null;
  legalBasis: "explicit_consent";
  version: string;
};

export type FacialEnrollmentRequest = {
  id: string;
  tenantId: string;
  condominiumId: string;
  subjectId: string;
  provider: FacialProviderName;
  requestedAt: string;
  consent: FacialConsent | null;
  imageRef?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
};

export type FacialEnrollmentSuccess = {
  status: "enrolled";
  provider: FacialProviderName;
  providerSubjectId: string;
  enrolledAt: string;
  consentId: string;
  message: string;
  rawResponse?: unknown;
};

export type FacialEnrollmentFailure = {
  status: "failed";
  provider: FacialProviderName;
  failedAt: string;
  errorCode: FacialFailureCode;
  message: string;
  rawResponse?: unknown;
};

export type FacialEnrollmentResult = FacialEnrollmentSuccess | FacialEnrollmentFailure;

export type FacialValidationRequest = {
  id: string;
  tenantId: string;
  condominiumId: string;
  accessPointId: string;
  provider: FacialProviderName;
  occurredAt: string;
  direction?: "entry" | "exit" | null;
  subjectId?: string | null;
  providerSubjectId?: string | null;
  consent?: FacialConsent | null;
  minConfidence?: number;
  minLivenessScore?: number;
  blacklist?: {
    active: boolean;
    reason?: string | null;
  } | null;
  payload: unknown;
};

export type FacialValidationSuccess = {
  id: string;
  tenantId: string;
  condominiumId: string;
  accessPointId: string;
  provider: FacialProviderName;
  occurredAt: string;
  result: "matched";
  confidence: number;
  livenessScore: number;
  requiresManualReview: false;
  providerSubjectId: string;
  subjectId?: string | null;
  consentId: string;
  direction?: "entry" | "exit" | null;
  rawPayload?: unknown;
};

export type FacialValidationReview = {
  id: string;
  tenantId: string;
  condominiumId: string;
  accessPointId: string;
  provider: FacialProviderName;
  occurredAt: string;
  result: "manual_review";
  confidence: number | null;
  livenessScore: number | null;
  requiresManualReview: true;
  reason: FacialFailureCode;
  message: string;
  providerSubjectId?: string | null;
  subjectId?: string | null;
  direction?: "entry" | "exit" | null;
  rawPayload?: unknown;
};

export type FacialValidationDenied = {
  id: string;
  tenantId: string;
  condominiumId: string;
  accessPointId: string;
  provider: FacialProviderName;
  occurredAt: string;
  result: "denied";
  confidence: number | null;
  livenessScore: number | null;
  requiresManualReview: false;
  reason: FacialFailureCode;
  message: string;
  providerSubjectId?: string | null;
  subjectId?: string | null;
  direction?: "entry" | "exit" | null;
  rawPayload?: unknown;
};

export type FacialValidationOutcome =
  | FacialValidationSuccess
  | FacialValidationReview
  | FacialValidationDenied;

export type FacialProvider = {
  readonly provider: FacialProviderName;
  enroll: (request: FacialEnrollmentRequest) => Promise<FacialEnrollmentResult>;
  validate: (request: FacialValidationRequest) => Promise<FacialValidationOutcome>;
};

export type FacialProviderConfig = {
  minConfidence?: number;
  minLivenessScore?: number;
};

export type FacialProviderPayload = {
  match?: {
    providerSubjectId?: unknown;
    subjectId?: unknown;
    confidence?: unknown;
  };
  liveness?: {
    score?: unknown;
    passed?: unknown;
  };
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

export function isFacialProvider(value: string): value is FacialProviderName {
  return facialProviders.includes(value as FacialProviderName);
}

export function isFacialConsentStatus(value: string): value is FacialConsentStatus {
  return facialConsentStatuses.includes(value as FacialConsentStatus);
}

export function isFacialValidationResult(value: string): value is FacialValidationResult {
  return facialValidationResults.includes(value as FacialValidationResult);
}

export function isFacialFailureCode(value: string): value is FacialFailureCode {
  return facialFailureCodes.includes(value as FacialFailureCode);
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

function timestamp(value: string) {
  const parsed = new Date(value).getTime();

  return Number.isNaN(parsed) ? null : parsed;
}

export function hasValidFacialConsent(consent: FacialConsent | null | undefined, evaluatedAt: string) {
  if (!consent) {
    return { valid: false as const, reason: "missing_consent" as const };
  }

  if (consent.status === "revoked" || consent.revokedAt) {
    return { valid: false as const, reason: "consent_revoked" as const };
  }

  if (consent.status === "expired") {
    return { valid: false as const, reason: "consent_expired" as const };
  }

  if (consent.expiresAt) {
    const expiresAt = timestamp(consent.expiresAt);
    const now = timestamp(evaluatedAt);

    if (expiresAt !== null && now !== null && expiresAt < now) {
      return { valid: false as const, reason: "consent_expired" as const };
    }
  }

  return { valid: true as const, consentId: consent.id };
}

function facialEnrollmentFailure(
  request: FacialEnrollmentRequest,
  errorCode: FacialFailureCode,
  message: string,
  rawResponse?: unknown
): FacialEnrollmentFailure {
  return {
    status: "failed",
    provider: request.provider,
    failedAt: nowIso(),
    errorCode,
    message,
    rawResponse
  };
}

function facialReview(
  request: FacialValidationRequest,
  reason: FacialFailureCode,
  message: string,
  {
    confidence = null,
    livenessScore = null,
    providerSubjectId = request.providerSubjectId ?? null,
    rawPayload = request.payload
  }: {
    confidence?: number | null;
    livenessScore?: number | null;
    providerSubjectId?: string | null;
    rawPayload?: unknown;
  } = {}
): FacialValidationReview {
  return {
    id: request.id,
    tenantId: request.tenantId,
    condominiumId: request.condominiumId,
    accessPointId: request.accessPointId,
    provider: request.provider,
    occurredAt: request.occurredAt,
    result: "manual_review",
    confidence,
    livenessScore,
    requiresManualReview: true,
    reason,
    message,
    providerSubjectId,
    subjectId: request.subjectId ?? null,
    direction: request.direction ?? null,
    rawPayload
  };
}

function facialDenied(
  request: FacialValidationRequest,
  reason: FacialFailureCode,
  message: string,
  {
    confidence = null,
    livenessScore = null,
    providerSubjectId = request.providerSubjectId ?? null,
    rawPayload = request.payload
  }: {
    confidence?: number | null;
    livenessScore?: number | null;
    providerSubjectId?: string | null;
    rawPayload?: unknown;
  } = {}
): FacialValidationDenied {
  return {
    id: request.id,
    tenantId: request.tenantId,
    condominiumId: request.condominiumId,
    accessPointId: request.accessPointId,
    provider: request.provider,
    occurredAt: request.occurredAt,
    result: "denied",
    confidence,
    livenessScore,
    requiresManualReview: false,
    reason,
    message,
    providerSubjectId,
    subjectId: request.subjectId ?? null,
    direction: request.direction ?? null,
    rawPayload
  };
}

function confidenceFromFacialPayload(payload: FacialProviderPayload) {
  return typeof payload.match?.confidence === "number" ? payload.match.confidence : null;
}

function livenessFromFacialPayload(payload: FacialProviderPayload) {
  return typeof payload.liveness?.score === "number" ? payload.liveness.score : null;
}

function providerSubjectFromFacialPayload(payload: FacialProviderPayload) {
  return typeof payload.match?.providerSubjectId === "string" ? payload.match.providerSubjectId : null;
}

function subjectFromFacialPayload(payload: FacialProviderPayload) {
  return typeof payload.match?.subjectId === "string" ? payload.match.subjectId : null;
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

export function createMockFacialProvider({
  confidence = 0.97,
  livenessScore = 0.96,
  minConfidence = 0.9,
  minLivenessScore = 0.85,
  providerSubjectId = "mock-face-subject"
}: {
  confidence?: number;
  livenessScore?: number;
  minConfidence?: number;
  minLivenessScore?: number;
  providerSubjectId?: string;
} = {}): FacialProvider {
  return {
    provider: "mock_facial",
    async enroll(request) {
      if (!request.id || !request.tenantId || !request.condominiumId || !request.subjectId) {
        return facialEnrollmentFailure(
          request,
          "invalid_payload",
          "Cadastro facial sem contexto operacional obrigatorio.",
          request.metadata ?? null
        );
      }

      const consent = hasValidFacialConsent(request.consent, request.requestedAt);

      if (!consent.valid) {
        return facialEnrollmentFailure(request, consent.reason, "Consentimento facial invalido para cadastro.");
      }

      return {
        status: "enrolled",
        provider: "mock_facial",
        providerSubjectId: `${providerSubjectId}-${request.subjectId}`,
        enrolledAt: nowIso(),
        consentId: consent.consentId,
        message: "Cadastro facial confirmado pelo provider mock.",
        rawResponse: {
          subjectId: request.subjectId,
          imageRef: request.imageRef ?? null
        }
      };
    },
    async validate(request) {
      if (!request.id || !request.tenantId || !request.condominiumId || !request.accessPointId) {
        return facialReview(request, "invalid_payload", "Validacao facial sem contexto operacional obrigatorio.");
      }

      if (request.blacklist?.active) {
        return facialDenied(
          request,
          "blacklisted_face",
          request.blacklist.reason ?? "Face bloqueada para acesso.",
          { confidence, livenessScore, providerSubjectId }
        );
      }

      const consent = hasValidFacialConsent(request.consent, request.occurredAt);

      if (!consent.valid) {
        return facialReview(request, consent.reason, "Consentimento facial ausente ou invalido.", {
          confidence,
          livenessScore,
          providerSubjectId
        });
      }

      const requiredConfidence = request.minConfidence ?? minConfidence;
      const requiredLiveness = request.minLivenessScore ?? minLivenessScore;

      if (livenessScore < requiredLiveness) {
        return facialReview(request, "liveness_failed", "Liveness facial abaixo do minimo configurado.", {
          confidence,
          livenessScore,
          providerSubjectId
        });
      }

      if (confidence < requiredConfidence) {
        return facialReview(request, "low_confidence", "Confianca facial abaixo do minimo configurado.", {
          confidence,
          livenessScore,
          providerSubjectId
        });
      }

      return {
        id: request.id,
        tenantId: request.tenantId,
        condominiumId: request.condominiumId,
        accessPointId: request.accessPointId,
        provider: "mock_facial",
        occurredAt: request.occurredAt,
        result: "matched",
        confidence,
        livenessScore,
        requiresManualReview: false,
        providerSubjectId,
        subjectId: request.subjectId ?? null,
        consentId: consent.consentId,
        direction: request.direction ?? null,
        rawPayload: request.payload
      };
    }
  };
}

export function createFacialProvider({ minConfidence = 0.9, minLivenessScore = 0.85 }: FacialProviderConfig = {}): FacialProvider {
  return {
    provider: "facial_provider",
    async enroll(request) {
      if (!request.id || !request.tenantId || !request.condominiumId || !request.subjectId) {
        return facialEnrollmentFailure(request, "invalid_payload", "Cadastro facial sem contexto operacional obrigatorio.");
      }

      const consent = hasValidFacialConsent(request.consent, request.requestedAt);

      if (!consent.valid) {
        return facialEnrollmentFailure(request, consent.reason, "Consentimento facial invalido para cadastro.");
      }

      if (!request.imageRef) {
        return facialEnrollmentFailure(request, "invalid_payload", "Cadastro facial sem referencia de imagem segura.");
      }

      return {
        status: "enrolled",
        provider: "facial_provider",
        providerSubjectId: `facial-${request.subjectId}`,
        enrolledAt: nowIso(),
        consentId: consent.consentId,
        message: "Cadastro facial aceito pelo contrato do provider.",
        rawResponse: {
          imageRef: request.imageRef,
          metadata: request.metadata ?? {}
        }
      };
    },
    async validate(request) {
      if (!request.payload || typeof request.payload !== "object") {
        return facialReview(request, "invalid_payload", "Payload facial invalido.", {
          rawPayload: request.payload
        });
      }

      if (request.blacklist?.active) {
        return facialDenied(request, "blacklisted_face", request.blacklist.reason ?? "Face bloqueada para acesso.");
      }

      const consent = hasValidFacialConsent(request.consent, request.occurredAt);

      if (!consent.valid) {
        return facialReview(request, consent.reason, "Consentimento facial ausente ou invalido.");
      }

      const payload = request.payload as FacialProviderPayload;
      const confidence = confidenceFromFacialPayload(payload);
      const livenessScore = livenessFromFacialPayload(payload);
      const providerSubjectId = providerSubjectFromFacialPayload(payload) ?? request.providerSubjectId ?? null;
      const subjectId = subjectFromFacialPayload(payload) ?? request.subjectId ?? null;
      const requiredConfidence = request.minConfidence ?? minConfidence;
      const requiredLiveness = request.minLivenessScore ?? minLivenessScore;

      if (!providerSubjectId || confidence === null || livenessScore === null) {
        return facialReview(request, "invalid_payload", "Payload facial sem match, confianca ou liveness.", {
          confidence,
          livenessScore,
          providerSubjectId
        });
      }

      if (payload.liveness?.passed === false || livenessScore < requiredLiveness) {
        return facialReview(request, "liveness_failed", "Liveness facial nao atingiu o minimo configurado.", {
          confidence,
          livenessScore,
          providerSubjectId
        });
      }

      if (confidence < requiredConfidence) {
        return facialReview(request, "low_confidence", "Confianca facial abaixo do minimo configurado.", {
          confidence,
          livenessScore,
          providerSubjectId
        });
      }

      return {
        id: request.id,
        tenantId: request.tenantId,
        condominiumId: request.condominiumId,
        accessPointId: request.accessPointId,
        provider: "facial_provider",
        occurredAt: request.occurredAt,
        result: "matched",
        confidence,
        livenessScore,
        requiresManualReview: false,
        providerSubjectId,
        subjectId,
        consentId: consent.consentId,
        direction: request.direction ?? null,
        rawPayload: request.payload
      };
    }
  };
}

export function buildFacialValidationAuditMetadata(outcome: FacialValidationOutcome) {
  return {
    provider: outcome.provider,
    result: outcome.result,
    confidence: outcome.confidence,
    livenessScore: outcome.livenessScore,
    requiresManualReview: outcome.requiresManualReview,
    providerSubjectId: outcome.providerSubjectId ?? null,
    subjectId: outcome.subjectId ?? null,
    ...(outcome.result === "matched"
      ? { consentId: outcome.consentId }
      : { reason: outcome.reason, message: outcome.message })
  };
}
