export const auditEventTypes = [
  "operational_event",
  "physical_command",
  "permission_change",
  "data_export",
  "security_event",
  "system_event"
] as const;
export const auditSources = ["application", "database_trigger", "edge_function", "integration", "operator", "system"] as const;
export const auditSeverities = ["debug", "info", "warning", "critical"] as const;
export const auditRetentionPolicies = ["operational", "security", "legal_hold", "lgpd_request"] as const;
export const auditRedactionStatuses = ["none", "pending", "redacted"] as const;
export const auditExportStatuses = ["pending", "processing", "completed", "failed", "expired"] as const;
export const auditExportFormats = ["csv", "json"] as const;

export type AuditEventType = (typeof auditEventTypes)[number];
export type AuditSource = (typeof auditSources)[number];
export type AuditSeverity = (typeof auditSeverities)[number];
export type AuditRetentionPolicy = (typeof auditRetentionPolicies)[number];
export type AuditRedactionStatus = (typeof auditRedactionStatuses)[number];
export type AuditExportStatus = (typeof auditExportStatuses)[number];
export type AuditExportFormat = (typeof auditExportFormats)[number];

export type AuditDateRange = {
  from: string;
  to: string;
};

export function isAuditEventType(value: string): value is AuditEventType {
  return auditEventTypes.includes(value as AuditEventType);
}

export function isAuditSource(value: string): value is AuditSource {
  return auditSources.includes(value as AuditSource);
}

export function isAuditSeverity(value: string): value is AuditSeverity {
  return auditSeverities.includes(value as AuditSeverity);
}

export function isAuditRetentionPolicy(value: string): value is AuditRetentionPolicy {
  return auditRetentionPolicies.includes(value as AuditRetentionPolicy);
}

export function isAuditRedactionStatus(value: string): value is AuditRedactionStatus {
  return auditRedactionStatuses.includes(value as AuditRedactionStatus);
}

export function isAuditExportStatus(value: string): value is AuditExportStatus {
  return auditExportStatuses.includes(value as AuditExportStatus);
}

export function isAuditExportFormat(value: string): value is AuditExportFormat {
  return auditExportFormats.includes(value as AuditExportFormat);
}

export function buildAuditLogAction(domain: string, operation: string) {
  return `${normalizeAuditSegment(domain)}.${normalizeAuditSegment(operation)}`;
}

export function normalizeAuditSegment(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function normalizeAuditDateRange(from: string, to: string): AuditDateRange | null {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    return null;
  }

  if (fromDate.getTime() > toDate.getTime()) {
    return null;
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString()
  };
}

export function calculateRetentionUntil(occurredAt: string, retentionDays: number) {
  const occurredAtDate = new Date(occurredAt);

  if (Number.isNaN(occurredAtDate.getTime()) || retentionDays <= 0) {
    return null;
  }

  occurredAtDate.setUTCDate(occurredAtDate.getUTCDate() + retentionDays);

  return occurredAtDate.toISOString().slice(0, 10);
}

export function buildAuditExportFilename({
  condominiumId,
  format,
  from,
  tenantId,
  to
}: {
  tenantId: string;
  condominiumId?: string | null;
  from: string;
  to: string;
  format: AuditExportFormat;
}) {
  const range = normalizeAuditDateRange(from, to);
  const safeTenant = normalizeAuditSegment(tenantId);
  const safeCondominium = condominiumId ? normalizeAuditSegment(condominiumId) : "all-condominiums";
  const suffix = range
    ? `${range.from.slice(0, 10)}_${range.to.slice(0, 10)}`
    : "invalid-range";

  return `audit_${safeTenant}_${safeCondominium}_${suffix}.${format}`;
}
