import { describe, expect, it } from "vitest";
import {
  assessOperationalRisk,
  evaluateAccess,
  isAccessDecisionReason,
  isAccessDecisionResult,
  isAccessDirection,
  isOperationalRiskLevel,
  isOperationalRiskReason,
  isAccessSubjectType,
  type AccessPolicyContext
} from "./index";

const baseContext = {
  tenantId: "tenant_123",
  condominiumId: "condominium_123",
  evaluatedAt: "2026-05-18T12:00:00.000Z",
  direction: "entry",
  subject: {
    type: "unknown"
  }
} satisfies AccessPolicyContext;

describe("@kynovia/access-engine", () => {
  it("exports typed contracts for access decisions", () => {
    expect(isAccessDecisionResult("allow")).toBe(true);
    expect(isAccessDecisionResult("review")).toBe(false);
    expect(isAccessDirection("entry")).toBe(true);
    expect(isAccessSubjectType("resident_vehicle")).toBe(true);
    expect(isAccessDecisionReason("valid_invite_allowed")).toBe(true);
    expect(isOperationalRiskLevel("critical")).toBe(true);
    expect(isOperationalRiskReason("possible_fraud")).toBe(true);
  });

  it("allows an active resident vehicle", () => {
    const result = evaluateAccess({
      ...baseContext,
      subject: { type: "resident_vehicle", plate: "ABC1D23" },
      residentVehicle: {
        status: "active",
        residentStatus: "active"
      }
    });

    expect(result.result).toBe("allow");
    expect(result.reason).toBe("resident_vehicle_allowed");
    expect(result.matchedRule).toBe("resident-vehicle");
  });

  it("denies blocked plates before any allow rule", () => {
    const result = evaluateAccess({
      ...baseContext,
      subject: { type: "resident_vehicle", plate: "ABC1D23" },
      plateBlacklist: {
        active: true,
        reason: "Bloqueio administrativo"
      },
      residentVehicle: {
        status: "active",
        residentStatus: "active"
      }
    });

    expect(result.result).toBe("deny");
    expect(result.reason).toBe("blacklisted_plate_denied");
    expect(result.message).toBe("Bloqueio administrativo");
  });

  it("denies cancelled and overused invites", () => {
    const cancelled = evaluateAccess({
      ...baseContext,
      subject: { type: "qr_code", qrTokenValid: true },
      invite: {
        status: "cancelled",
        startsAt: "2026-05-18T10:00:00.000Z",
        expiresAt: "2026-05-18T14:00:00.000Z",
        maxUses: 1,
        useCount: 0,
        qrTokenValid: true
      }
    });
    const overused = evaluateAccess({
      ...baseContext,
      subject: { type: "visitor_vehicle", plate: "XYZ9A87" },
      invite: {
        status: "active",
        startsAt: "2026-05-18T10:00:00.000Z",
        expiresAt: "2026-05-18T14:00:00.000Z",
        maxUses: 1,
        useCount: 1,
        plate: "XYZ9A87"
      }
    });

    expect(cancelled.result).toBe("deny");
    expect(cancelled.reason).toBe("cancelled_invite_denied");
    expect(overused.result).toBe("deny");
    expect(overused.reason).toBe("usage_limit_denied");
  });

  it("allows a valid invite by QR Code or plate", () => {
    const qr = evaluateAccess({
      ...baseContext,
      subject: { type: "qr_code", qrTokenValid: true },
      invite: {
        status: "active",
        startsAt: "2026-05-18T10:00:00.000Z",
        expiresAt: "2026-05-18T14:00:00.000Z",
        maxUses: 2,
        useCount: 0,
        qrTokenValid: true
      }
    });
    const plate = evaluateAccess({
      ...baseContext,
      subject: { type: "visitor_vehicle", plate: "XYZ9A87" },
      invite: {
        status: "active",
        startsAt: "2026-05-18T10:00:00.000Z",
        expiresAt: "2026-05-18T14:00:00.000Z",
        maxUses: 2,
        useCount: 0,
        plate: "XYZ9A87"
      }
    });

    expect(qr.result).toBe("allow");
    expect(qr.reason).toBe("valid_qr_allowed");
    expect(plate.result).toBe("allow");
    expect(plate.reason).toBe("valid_invite_allowed");
  });

  it("returns manual review for future invites, active stays, full parking, or missing context", () => {
    const futureInvite = evaluateAccess({
      ...baseContext,
      subject: { type: "visitor_vehicle", plate: "XYZ9A87" },
      invite: {
        status: "active",
        startsAt: "2026-05-18T13:00:00.000Z",
        expiresAt: "2026-05-18T14:00:00.000Z",
        maxUses: 1,
        useCount: 0,
        plate: "XYZ9A87"
      }
    });
    const activeStay = evaluateAccess({
      ...baseContext,
      subject: { type: "visitor_vehicle", plate: "XYZ9A87" },
      invite: {
        status: "active",
        startsAt: "2026-05-18T10:00:00.000Z",
        expiresAt: "2026-05-18T14:00:00.000Z",
        maxUses: 2,
        useCount: 0,
        plate: "XYZ9A87"
      },
      occupancy: {
        hasActiveStay: true
      }
    });
    const parkingFull = evaluateAccess({
      ...baseContext,
      subject: { type: "visitor_vehicle", plate: "XYZ9A87" },
      invite: {
        status: "active",
        startsAt: "2026-05-18T10:00:00.000Z",
        expiresAt: "2026-05-18T14:00:00.000Z",
        maxUses: 2,
        useCount: 0,
        plate: "XYZ9A87"
      },
      occupancy: {
        visitorParkingCapacity: 3,
        activeVisitorVehicles: 3
      }
    });
    const missing = evaluateAccess(baseContext);

    expect(futureInvite.result).toBe("manual_review");
    expect(futureInvite.reason).toBe("not_started_invite_review");
    expect(activeStay.result).toBe("manual_review");
    expect(activeStay.reason).toBe("active_stay_review");
    expect(parkingFull.result).toBe("manual_review");
    expect(parkingFull.reason).toBe("parking_full_review");
    expect(missing.result).toBe("manual_review");
    expect(missing.reason).toBe("unknown_subject_review");
  });

  it("supports custom rule ordering", () => {
    const result = evaluateAccess(baseContext, [
      {
        id: "custom-deny",
        evaluate() {
          return {
            result: "deny",
            reason: "missing_context_review",
            matchedRule: "custom-deny",
            message: "Custom decision"
          };
        }
      }
    ]);

    expect(result.result).toBe("deny");
    expect(result.matchedRule).toBe("custom-deny");
  });

  it("assesses operational risk from denied attempts, hardware failures, and capacity pressure", () => {
    const result = assessOperationalRisk({
      tenantId: "tenant_123",
      condominiumId: "condominium_123",
      evaluatedAt: "2026-05-18T12:00:00.000Z",
      deniedAttempts24h: 5,
      manualReviews24h: 6,
      failedGateCommands1h: 1,
      blacklistHits24h: 1,
      lowConfidenceReads24h: 3,
      activeVisitorVehicles: 9,
      visitorParkingCapacity: 10
    });

    expect(result.level).toBe("critical");
    expect(result.reasons).toContain("possible_fraud");
    expect(result.reasons).toContain("hardware_failures");
    expect(result.recommendedAction).toBe("notify_admin");
    expect(result.metadata.parkingUsagePercent).toBe(90);
  });
});
