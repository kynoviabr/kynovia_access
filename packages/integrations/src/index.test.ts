import { describe, expect, it } from "vitest";
import {
  buildFacialValidationAuditMetadata,
  buildGateCommandAuditMetadata,
  buildLprAccessSubject,
  buildLprEventAuditMetadata,
  buildOperationalAiAuditMetadata,
  createFacialProvider,
  createHttpRelayProvider,
  createMockFacialProvider,
  createMockOperationalAiProvider,
  createMockLprProvider,
  createOpenAiResponsesOperationalProvider,
  createMockGateProvider,
  createPlateRecognizerProvider,
  isGateCommandFailureCode,
  isGateCommandName,
  isGateCommandStatus,
  isIntegrationProvider,
  isBrazilianPlateFormat,
  isFacialConsentStatus,
  isFacialFailureCode,
  isFacialProvider,
  isFacialValidationResult,
  isLprConfidenceLevel,
  isLprEventType,
  isLprFailureCode,
  isLprProvider,
  isOperationalAiAlertType,
  isOperationalAiEventCategory,
  isOperationalAiFailureCode,
  isOperationalAiProvider,
  isOperationalAiRiskLevel,
  normalizeBrazilianPlate,
  type FacialConsent,
  type FacialEnrollmentRequest,
  type FacialValidationRequest,
  type GateCommandRequest,
  type HttpClient,
  type IntegrationEvent,
  type IntegrationProvider,
  type LprWebhookRequest,
  type OperationalAiAnalysisRequest
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

const lprWebhook = {
  id: "lpr_event_123",
  tenantId: "tenant_123",
  condominiumId: "condominium_123",
  accessPointId: "access_point_123",
  provider: "plate_recognizer",
  occurredAt: "2026-05-18T00:00:00.000Z",
  direction: "entry",
  payload: {
    results: [
      {
        plate: "abc-1d23",
        score: 0.96,
        region: {
          code: "br"
        }
      }
    ]
  }
} satisfies LprWebhookRequest;

const facialConsent = {
  id: "consent_123",
  subjectId: "resident_123",
  status: "granted",
  grantedAt: "2026-05-18T00:00:00.000Z",
  expiresAt: "2026-12-31T00:00:00.000Z",
  legalBasis: "explicit_consent",
  version: "2026-05"
} satisfies FacialConsent;

const facialEnrollment = {
  id: "facial_enrollment_123",
  tenantId: "tenant_123",
  condominiumId: "condominium_123",
  subjectId: "resident_123",
  provider: "mock_facial",
  requestedAt: "2026-05-18T00:00:00.000Z",
  consent: facialConsent,
  imageRef: "private://facial/resident_123/enrollment.jpg"
} satisfies FacialEnrollmentRequest;

const facialValidation = {
  id: "facial_validation_123",
  tenantId: "tenant_123",
  condominiumId: "condominium_123",
  accessPointId: "access_point_123",
  provider: "mock_facial",
  occurredAt: "2026-05-18T00:00:00.000Z",
  direction: "entry",
  subjectId: "resident_123",
  consent: facialConsent,
  payload: { fixture: true }
} satisfies FacialValidationRequest;

const aiAnalysis = {
  id: "ai_analysis_123",
  tenantId: "tenant_123",
  condominiumId: "condominium_123",
  provider: "mock_ai",
  occurredAt: "2026-05-18T00:00:00.000Z",
  eventSource: "access_event",
  eventId: "access_event_123",
  title: "Tentativas negadas recorrentes",
  description: "Visitante com multiplas tentativas negadas em curto intervalo.",
  signals: [
    { name: "denied_attempts_24h", value: 4 },
    { name: "manual_reviews_24h", value: 2 },
    { name: "blacklist_hit", value: true }
  ]
} satisfies OperationalAiAnalysisRequest;

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
    expect(isIntegrationProvider("plate_recognizer")).toBe(true);
    expect(isIntegrationProvider("mock_facial")).toBe(true);
    expect(isIntegrationProvider("mock_ai")).toBe(true);
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

  it("normalizes and validates Brazilian license plates", () => {
    expect(normalizeBrazilianPlate("abc-1d23")).toBe("ABC1D23");
    expect(normalizeBrazilianPlate(" Ábc 1234 ")).toBe("ABC1234");
    expect(isBrazilianPlateFormat("ABC-1234")).toBe(true);
    expect(isBrazilianPlateFormat("ABC1D23")).toBe(true);
    expect(isBrazilianPlateFormat("AB-123")).toBe(false);
  });

  it("validates LPR contracts", () => {
    expect(isLprProvider("mock_lpr")).toBe(true);
    expect(isLprProvider("camera_vendor")).toBe(false);
    expect(isLprEventType("plate_detected")).toBe(true);
    expect(isLprConfidenceLevel("manual_review")).toBe(true);
    expect(isLprFailureCode("no_plate_detected")).toBe(true);
  });

  it("parses a deterministic mock LPR reading", async () => {
    const result = await createMockLprProvider({ plate: "abc-1d23" }).parseWebhook({
      ...lprWebhook,
      provider: "mock_lpr",
      payload: { fixture: true }
    });

    expect(result.eventType).toBe("plate_detected");
    if (result.eventType !== "provider_error") {
      expect(result.candidate?.normalizedPlate).toBe("ABC1D23");
      expect(result.requiresManualReview).toBe(false);
    }
  });

  it("flags low-confidence LPR readings for manual review", async () => {
    const result = await createMockLprProvider({ confidence: 0.42, minConfidence: 0.85 }).parseWebhook({
      ...lprWebhook,
      provider: "mock_lpr",
      payload: { fixture: true }
    });

    expect(result.eventType).toBe("low_confidence_review");
    if (result.eventType !== "provider_error") {
      expect(result.confidenceLevel).toBe("manual_review");
      expect(result.requiresManualReview).toBe(true);
    }
  });

  it("parses Plate Recognizer payloads and builds access subjects", async () => {
    const result = await createPlateRecognizerProvider({ minConfidence: 0.9 }).parseWebhook(lprWebhook);
    const subject = buildLprAccessSubject(result);

    expect(result.eventType).toBe("plate_detected");
    expect(subject).toMatchObject({
      type: "visitor_vehicle",
      plate: "ABC1D23",
      confidence: 0.96,
      requiresManualReview: false,
      provider: "plate_recognizer",
      readingId: "lpr_event_123"
    });
  });

  it("maps invalid Plate Recognizer payloads to auditable failures", async () => {
    const result = await createPlateRecognizerProvider().parseWebhook({
      ...lprWebhook,
      payload: { results: [] }
    });
    const subject = buildLprAccessSubject(result);
    const audit = buildLprEventAuditMetadata(result);

    expect(result.eventType).toBe("provider_error");
    expect(subject.requiresManualReview).toBe(true);
    expect(audit).toMatchObject({
      provider: "plate_recognizer",
      eventType: "provider_error",
      errorCode: "no_plate_detected"
    });
  });

  it("validates facial biometric contracts", () => {
    expect(isFacialProvider("mock_facial")).toBe(true);
    expect(isFacialProvider("camera_face")).toBe(false);
    expect(isFacialConsentStatus("granted")).toBe(true);
    expect(isFacialValidationResult("matched")).toBe(true);
    expect(isFacialFailureCode("liveness_failed")).toBe(true);
  });

  it("enrolls a face with explicit valid consent using the mock provider", async () => {
    const result = await createMockFacialProvider().enroll(facialEnrollment);

    expect(result.status).toBe("enrolled");
    if (result.status === "enrolled") {
      expect(result.consentId).toBe("consent_123");
      expect(result.providerSubjectId).toContain("resident_123");
    }
  });

  it("rejects facial enrollment without valid consent", async () => {
    const result = await createMockFacialProvider().enroll({
      ...facialEnrollment,
      consent: { ...facialConsent, status: "revoked", revokedAt: "2026-05-18T00:00:00.000Z" }
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errorCode).toBe("consent_revoked");
    }
  });

  it("matches facial validation when confidence and liveness are sufficient", async () => {
    const outcome = await createMockFacialProvider().validate(facialValidation);
    const audit = buildFacialValidationAuditMetadata(outcome);

    expect(outcome.result).toBe("matched");
    expect(outcome.requiresManualReview).toBe(false);
    expect(audit).toMatchObject({
      provider: "mock_facial",
      result: "matched",
      consentId: "consent_123"
    });
  });

  it("routes low confidence and liveness failures to manual review", async () => {
    const lowConfidence = await createMockFacialProvider({ confidence: 0.42 }).validate(facialValidation);
    const lowLiveness = await createMockFacialProvider({ livenessScore: 0.2 }).validate(facialValidation);

    expect(lowConfidence.result).toBe("manual_review");
    expect(lowLiveness.result).toBe("manual_review");
    if (lowConfidence.result === "manual_review" && lowLiveness.result === "manual_review") {
      expect(lowConfidence.reason).toBe("low_confidence");
      expect(lowLiveness.reason).toBe("liveness_failed");
    }
  });

  it("denies blacklisted facial subjects without manual release", async () => {
    const outcome = await createMockFacialProvider().validate({
      ...facialValidation,
      blacklist: { active: true, reason: "Bloqueio operacional" }
    });

    expect(outcome.result).toBe("denied");
    if (outcome.result === "denied") {
      expect(outcome.reason).toBe("blacklisted_face");
    }
  });

  it("parses generic facial provider payloads", async () => {
    const outcome = await createFacialProvider({ minConfidence: 0.9, minLivenessScore: 0.85 }).validate({
      ...facialValidation,
      provider: "facial_provider",
      payload: {
        match: {
          providerSubjectId: "provider_subject_123",
          subjectId: "resident_123",
          confidence: 0.95
        },
        liveness: {
          score: 0.93,
          passed: true
        }
      }
    });

    expect(outcome).toMatchObject({
      result: "matched",
      provider: "facial_provider",
      providerSubjectId: "provider_subject_123",
      confidence: 0.95,
      livenessScore: 0.93
    });
  });

  it("validates operational AI contracts", () => {
    expect(isOperationalAiProvider("mock_ai")).toBe(true);
    expect(isOperationalAiProvider("generic_ai")).toBe(false);
    expect(isOperationalAiEventCategory("possible_fraud")).toBe(true);
    expect(isOperationalAiAlertType("operator_attention")).toBe(true);
    expect(isOperationalAiRiskLevel("critical")).toBe(true);
    expect(isOperationalAiFailureCode("missing_configuration")).toBe(true);
  });

  it("classifies operational events with the mock AI provider", async () => {
    const result = await createMockOperationalAiProvider().analyze(aiAnalysis);
    const audit = buildOperationalAiAuditMetadata(result);

    expect(result.status).toBe("completed");
    if (result.status === "completed") {
      expect(result.category).toBe("possible_fraud");
      expect(result.alertType).toBe("possible_fraud");
      expect(result.recommendations.length).toBeGreaterThan(0);
    }
    expect(audit).toMatchObject({
      provider: "mock_ai",
      status: "completed"
    });
  });

  it("requires configuration for the OpenAI Responses operational provider", async () => {
    const result = await createOpenAiResponsesOperationalProvider().analyze({
      ...aiAnalysis,
      provider: "openai_responses"
    });

    expect(result.status).toBe("failed");
    if (result.status === "failed") {
      expect(result.errorCode).toBe("missing_configuration");
    }
  });
});
