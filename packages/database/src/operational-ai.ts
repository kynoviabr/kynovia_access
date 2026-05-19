export const operationalAiProviders = ["mock_ai", "openai_responses"] as const;
export const operationalAiEventSources = ["access_event", "gate_command", "occurrence", "lpr", "facial", "manual_note"] as const;
export const operationalAiCategories = [
  "normal_operation",
  "visitor_exception",
  "denied_access",
  "hardware_failure",
  "possible_fraud",
  "security_risk"
] as const;
export const operationalAiRiskLevels = ["low", "medium", "high", "critical"] as const;
export const operationalAiAlertTypes = [
  "operator_attention",
  "repeated_denials",
  "capacity_pressure",
  "possible_fraud",
  "hardware_attention"
] as const;
export const operationalAiAlertStatuses = ["open", "acknowledged", "resolved", "dismissed"] as const;
export const doormanAssistantRoles = ["operator", "assistant", "system"] as const;
export const doormanAssistantSessionStatuses = ["open", "closed"] as const;

export type OperationalAiProvider = (typeof operationalAiProviders)[number];
export type OperationalAiEventSource = (typeof operationalAiEventSources)[number];
export type OperationalAiCategory = (typeof operationalAiCategories)[number];
export type OperationalAiRiskLevel = (typeof operationalAiRiskLevels)[number];
export type OperationalAiAlertType = (typeof operationalAiAlertTypes)[number];
export type OperationalAiAlertStatus = (typeof operationalAiAlertStatuses)[number];
export type DoormanAssistantRole = (typeof doormanAssistantRoles)[number];
export type DoormanAssistantSessionStatus = (typeof doormanAssistantSessionStatuses)[number];

export function isOperationalAiProvider(value: string): value is OperationalAiProvider {
  return operationalAiProviders.includes(value as OperationalAiProvider);
}

export function isOperationalAiEventSource(value: string): value is OperationalAiEventSource {
  return operationalAiEventSources.includes(value as OperationalAiEventSource);
}

export function isOperationalAiCategory(value: string): value is OperationalAiCategory {
  return operationalAiCategories.includes(value as OperationalAiCategory);
}

export function isOperationalAiRiskLevel(value: string): value is OperationalAiRiskLevel {
  return operationalAiRiskLevels.includes(value as OperationalAiRiskLevel);
}

export function isOperationalAiAlertType(value: string): value is OperationalAiAlertType {
  return operationalAiAlertTypes.includes(value as OperationalAiAlertType);
}

export function isOperationalAiAlertStatus(value: string): value is OperationalAiAlertStatus {
  return operationalAiAlertStatuses.includes(value as OperationalAiAlertStatus);
}

export function isDoormanAssistantRole(value: string): value is DoormanAssistantRole {
  return doormanAssistantRoles.includes(value as DoormanAssistantRole);
}

export function isDoormanAssistantSessionStatus(value: string): value is DoormanAssistantSessionStatus {
  return doormanAssistantSessionStatuses.includes(value as DoormanAssistantSessionStatus);
}

export function normalizeRiskScore(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
}

export function riskLevelFromScore(value: number): OperationalAiRiskLevel {
  const score = normalizeRiskScore(value);

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
