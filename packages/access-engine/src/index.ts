export const accessDecisionResults = ["allow", "deny", "manual_review"] as const;
export const accessSubjectTypes = ["resident_vehicle", "visitor_vehicle", "qr_code", "unknown"] as const;
export const accessDirections = ["entry", "exit"] as const;
export const accessDecisionReasons = [
  "resident_vehicle_allowed",
  "valid_invite_allowed",
  "valid_qr_allowed",
  "blacklisted_plate_denied",
  "blocked_resident_denied",
  "expired_invite_denied",
  "cancelled_invite_denied",
  "usage_limit_denied",
  "not_started_invite_review",
  "active_stay_review",
  "parking_full_review",
  "missing_context_review",
  "unknown_subject_review"
] as const;
export const operationalRiskLevels = ["low", "medium", "high", "critical"] as const;
export const operationalRiskReasons = [
  "normal_activity",
  "repeated_denials",
  "manual_review_spike",
  "hardware_failures",
  "possible_fraud",
  "capacity_pressure"
] as const;

export type AccessDecisionResult = (typeof accessDecisionResults)[number];
export type AccessSubjectType = (typeof accessSubjectTypes)[number];
export type AccessDirection = (typeof accessDirections)[number];
export type AccessDecisionReason = (typeof accessDecisionReasons)[number];
export type OperationalRiskLevel = (typeof operationalRiskLevels)[number];
export type OperationalRiskReason = (typeof operationalRiskReasons)[number];

export type AccessPolicyContext = {
  tenantId: string;
  condominiumId: string;
  evaluatedAt: string;
  direction: AccessDirection;
  subject: {
    type: AccessSubjectType;
    plate?: string | null;
    qrTokenValid?: boolean;
  };
  residentVehicle?: {
    status: "active" | "blocked" | "inactive";
    residentStatus: "active" | "blocked" | "inactive";
  } | null;
  invite?: {
    status: "active" | "cancelled" | "expired" | "used";
    startsAt: string;
    expiresAt: string;
    maxUses: number;
    useCount: number;
    plate?: string | null;
    qrTokenValid?: boolean;
  } | null;
  plateBlacklist?: {
    active: boolean;
    reason?: string | null;
  } | null;
  occupancy?: {
    hasActiveStay?: boolean;
    visitorParkingCapacity?: number;
    activeVisitorVehicles?: number;
  } | null;
};

export type AccessDecision = {
  result: AccessDecisionResult;
  reason: AccessDecisionReason;
  message: string;
  matchedRule: string;
  metadata?: Record<string, string | number | boolean | null>;
};

export type AccessRule = {
  id: string;
  evaluate: (context: AccessPolicyContext) => AccessDecision | null;
};

export type OperationalRiskContext = {
  tenantId: string;
  condominiumId: string;
  evaluatedAt: string;
  deniedAttempts24h?: number;
  manualReviews24h?: number;
  failedGateCommands1h?: number;
  blacklistHits24h?: number;
  activeVisitorVehicles?: number;
  visitorParkingCapacity?: number;
  lowConfidenceReads24h?: number;
};

export type OperationalRiskAssessment = {
  level: OperationalRiskLevel;
  score: number;
  reasons: OperationalRiskReason[];
  summary: string;
  recommendedAction: "monitor" | "manual_review" | "notify_admin" | "create_occurrence";
  metadata: Record<string, string | number | boolean | null>;
};

export function isAccessDecisionResult(value: string): value is AccessDecisionResult {
  return accessDecisionResults.includes(value as AccessDecisionResult);
}

export function isAccessSubjectType(value: string): value is AccessSubjectType {
  return accessSubjectTypes.includes(value as AccessSubjectType);
}

export function isAccessDirection(value: string): value is AccessDirection {
  return accessDirections.includes(value as AccessDirection);
}

export function isAccessDecisionReason(value: string): value is AccessDecisionReason {
  return accessDecisionReasons.includes(value as AccessDecisionReason);
}

export function isOperationalRiskLevel(value: string): value is OperationalRiskLevel {
  return operationalRiskLevels.includes(value as OperationalRiskLevel);
}

export function isOperationalRiskReason(value: string): value is OperationalRiskReason {
  return operationalRiskReasons.includes(value as OperationalRiskReason);
}

function decision({
  matchedRule,
  message,
  metadata,
  reason,
  result
}: {
  matchedRule: string;
  message: string;
  metadata?: AccessDecision["metadata"];
  reason: AccessDecisionReason;
  result: AccessDecisionResult;
}): AccessDecision {
  return { result, reason, message, matchedRule, metadata };
}

function timestamp(value: string) {
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? null : parsed;
}

function isInviteWithinWindow(invite: NonNullable<AccessPolicyContext["invite"]>, evaluatedAt: string) {
  const now = timestamp(evaluatedAt);
  const startsAt = timestamp(invite.startsAt);
  const expiresAt = timestamp(invite.expiresAt);

  if (now === null || startsAt === null || expiresAt === null) {
    return "invalid";
  }

  if (startsAt > now) {
    return "not_started";
  }

  if (expiresAt < now) {
    return "expired";
  }

  return "valid";
}

function riskLevel(score: number): OperationalRiskLevel {
  if (score >= 90) {
    return "critical";
  }

  if (score >= 70) {
    return "high";
  }

  if (score >= 40) {
    return "medium";
  }

  return "low";
}

function clampRiskScore(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function assessOperationalRisk(context: OperationalRiskContext): OperationalRiskAssessment {
  const deniedAttempts = context.deniedAttempts24h ?? 0;
  const manualReviews = context.manualReviews24h ?? 0;
  const failedCommands = context.failedGateCommands1h ?? 0;
  const blacklistHits = context.blacklistHits24h ?? 0;
  const lowConfidenceReads = context.lowConfidenceReads24h ?? 0;
  const capacity = context.visitorParkingCapacity ?? 0;
  const activeVehicles = context.activeVisitorVehicles ?? 0;
  const parkingUsagePercent = capacity > 0 ? Math.round((activeVehicles / capacity) * 100) : 0;
  const reasons: OperationalRiskReason[] = [];

  if (deniedAttempts >= 3) {
    reasons.push("repeated_denials");
  }

  if (manualReviews >= 5 || lowConfidenceReads >= 3) {
    reasons.push("manual_review_spike");
  }

  if (failedCommands > 0) {
    reasons.push("hardware_failures");
  }

  if (blacklistHits > 0 || deniedAttempts >= 5) {
    reasons.push("possible_fraud");
  }

  if (parkingUsagePercent >= 90) {
    reasons.push("capacity_pressure");
  }

  if (reasons.length === 0) {
    reasons.push("normal_activity");
  }

  const score = clampRiskScore(
    deniedAttempts * 10
    + manualReviews * 4
    + failedCommands * 18
    + blacklistHits * 25
    + lowConfidenceReads * 6
    + (parkingUsagePercent >= 90 ? 12 : 0)
  );
  const level = riskLevel(score);
  const recommendedAction = level === "critical"
    ? "notify_admin"
    : level === "high"
      ? "create_occurrence"
      : level === "medium"
        ? "manual_review"
        : "monitor";

  return {
    level,
    score,
    reasons,
    summary: `Risco operacional ${level} com score ${score}.`,
    recommendedAction,
    metadata: {
      deniedAttempts24h: deniedAttempts,
      manualReviews24h: manualReviews,
      failedGateCommands1h: failedCommands,
      blacklistHits24h: blacklistHits,
      lowConfidenceReads24h: lowConfidenceReads,
      parkingUsagePercent
    }
  };
}

export const defaultAccessRules: AccessRule[] = [
  {
    id: "blacklisted-plate",
    evaluate(context) {
      if (!context.plateBlacklist?.active) {
        return null;
      }

      return decision({
        result: "deny",
        reason: "blacklisted_plate_denied",
        matchedRule: "blacklisted-plate",
        message: context.plateBlacklist.reason ?? "Placa bloqueada para acesso.",
        metadata: { plate: context.subject.plate ?? null }
      });
    }
  },
  {
    id: "resident-vehicle",
    evaluate(context) {
      if (context.subject.type !== "resident_vehicle" || !context.residentVehicle) {
        return null;
      }

      if (context.residentVehicle.status === "blocked" || context.residentVehicle.residentStatus === "blocked") {
        return decision({
          result: "deny",
          reason: "blocked_resident_denied",
          matchedRule: "resident-vehicle",
          message: "Morador ou veiculo bloqueado.",
          metadata: {
            vehicleStatus: context.residentVehicle.status,
            residentStatus: context.residentVehicle.residentStatus
          }
        });
      }

      if (context.residentVehicle.status === "active" && context.residentVehicle.residentStatus === "active") {
        return decision({
          result: "allow",
          reason: "resident_vehicle_allowed",
          matchedRule: "resident-vehicle",
          message: "Veiculo de morador ativo autorizado.",
          metadata: { plate: context.subject.plate ?? null }
        });
      }

      return decision({
        result: "manual_review",
        reason: "missing_context_review",
        matchedRule: "resident-vehicle",
        message: "Status do morador ou veiculo exige revisao manual."
      });
    }
  },
  {
    id: "invite-status",
    evaluate(context) {
      const invite = context.invite;

      if (!invite) {
        return null;
      }

      if (invite.status === "cancelled") {
        return decision({
          result: "deny",
          reason: "cancelled_invite_denied",
          matchedRule: "invite-status",
          message: "Convite cancelado."
        });
      }

      if (invite.status === "expired") {
        return decision({
          result: "deny",
          reason: "expired_invite_denied",
          matchedRule: "invite-status",
          message: "Convite expirado."
        });
      }

      if (invite.status === "used" || invite.useCount >= invite.maxUses) {
        return decision({
          result: "deny",
          reason: "usage_limit_denied",
          matchedRule: "invite-status",
          message: "Limite de uso do convite atingido.",
          metadata: { useCount: invite.useCount, maxUses: invite.maxUses }
        });
      }

      const windowState = isInviteWithinWindow(invite, context.evaluatedAt);

      if (windowState === "expired") {
        return decision({
          result: "deny",
          reason: "expired_invite_denied",
          matchedRule: "invite-status",
          message: "Janela de validade do convite expirou."
        });
      }

      if (windowState === "not_started") {
        return decision({
          result: "manual_review",
          reason: "not_started_invite_review",
          matchedRule: "invite-status",
          message: "Convite ainda nao esta vigente."
        });
      }

      if (windowState === "invalid") {
        return decision({
          result: "manual_review",
          reason: "missing_context_review",
          matchedRule: "invite-status",
          message: "Janela de validade do convite nao pode ser avaliada."
        });
      }

      return null;
    }
  },
  {
    id: "visitor-occupancy",
    evaluate(context) {
      if (!context.occupancy || context.direction !== "entry") {
        return null;
      }

      if (context.occupancy.hasActiveStay) {
        return decision({
          result: "manual_review",
          reason: "active_stay_review",
          matchedRule: "visitor-occupancy",
          message: "Visitante ja possui permanencia ativa."
        });
      }

      const capacity = context.occupancy.visitorParkingCapacity ?? 0;
      const activeVehicles = context.occupancy.activeVisitorVehicles ?? 0;

      if (capacity > 0 && activeVehicles >= capacity) {
        return decision({
          result: "manual_review",
          reason: "parking_full_review",
          matchedRule: "visitor-occupancy",
          message: "Vagas de visitantes esgotadas.",
          metadata: { capacity, activeVehicles }
        });
      }

      return null;
    }
  },
  {
    id: "valid-qr",
    evaluate(context) {
      if (context.subject.type !== "qr_code" || !context.invite) {
        return null;
      }

      if (context.subject.qrTokenValid || context.invite.qrTokenValid) {
        return decision({
          result: "allow",
          reason: "valid_qr_allowed",
          matchedRule: "valid-qr",
          message: "QR Code valido autorizado."
        });
      }

      return decision({
        result: "manual_review",
        reason: "missing_context_review",
        matchedRule: "valid-qr",
        message: "QR Code sem confirmacao de validade."
      });
    }
  },
  {
    id: "valid-invite-plate",
    evaluate(context) {
      if (context.subject.type !== "visitor_vehicle" || !context.invite) {
        return null;
      }

      return decision({
        result: "allow",
        reason: "valid_invite_allowed",
        matchedRule: "valid-invite-plate",
        message: "Convite valido autorizado para acesso por placa.",
        metadata: { plate: context.subject.plate ?? context.invite.plate ?? null }
      });
    }
  }
];

export function evaluateAccess(
  context: AccessPolicyContext,
  rules: readonly AccessRule[] = defaultAccessRules
): AccessDecision {
  for (const rule of rules) {
    const result = rule.evaluate(context);

    if (result) {
      return result;
    }
  }

  return decision({
    result: "manual_review",
    reason: context.subject.type === "unknown" ? "unknown_subject_review" : "missing_context_review",
    matchedRule: "fallback-manual-review",
    message: "Contexto insuficiente para decisao automatica."
  });
}
