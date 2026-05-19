export const accessDirections = ["entry", "exit"] as const;
export const accessDecisions = ["allow", "deny", "manual_review"] as const;
export const gateCommands = ["open", "close", "hold_open", "lock"] as const;
export const gateCommandStatuses = ["pending", "sent", "confirmed", "failed", "cancelled"] as const;
export const occurrenceSeverities = ["low", "medium", "high", "critical"] as const;
export const occurrenceStatuses = ["open", "resolved", "dismissed"] as const;

export type AccessDirection = (typeof accessDirections)[number];
export type AccessDecision = (typeof accessDecisions)[number];
export type GateCommand = (typeof gateCommands)[number];
export type GateCommandStatus = (typeof gateCommandStatuses)[number];
export type OccurrenceSeverity = (typeof occurrenceSeverities)[number];
export type OccurrenceStatus = (typeof occurrenceStatuses)[number];

export function isAccessDirection(value: string): value is AccessDirection {
  return accessDirections.includes(value as AccessDirection);
}

export function isAccessDecision(value: string): value is AccessDecision {
  return accessDecisions.includes(value as AccessDecision);
}

export function isGateCommand(value: string): value is GateCommand {
  return gateCommands.includes(value as GateCommand);
}

export function isOccurrenceSeverity(value: string): value is OccurrenceSeverity {
  return occurrenceSeverities.includes(value as OccurrenceSeverity);
}

export function isOccurrenceStatus(value: string): value is OccurrenceStatus {
  return occurrenceStatuses.includes(value as OccurrenceStatus);
}
