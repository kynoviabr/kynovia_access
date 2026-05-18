export type AccessDecision = "allow" | "deny" | "review";

export type AccessEvaluationInput = {
  tenantId: string;
  condominiumId: string;
  subjectId: string;
  requestedAt: string;
};

export type AccessEvaluationResult = {
  decision: AccessDecision;
  reason: string;
};
