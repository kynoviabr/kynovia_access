# Audit, Logs, And Compliance

Kynovia Access treats auditability as a security boundary.

Audit records must describe who acted, what changed, where it happened, when it happened, and why
the platform made or recorded the decision.

## Audit Log Model

`audit_logs` is append-only. Updates and deletes are blocked by database triggers.

The Phase 14 schema expands audit records with:

- event type: operational event, physical command, permission change, data export, security event, or
  system event
- source: application, database trigger, Edge Function, integration, operator, or system
- severity
- occurrence timestamp
- actor user/profile identifiers
- target entity table and id
- correlation id for access-event or command grouping
- retention policy and retention deadline
- redaction status
- optional before/after JSON snapshots
- metadata for event-specific details

## Physical Command Logs

Changes to `gate_commands` are audited by database trigger.

Each insert, update, or delete records:

- command
- status
- provider
- access point
- linked access event
- requested timestamp
- executed timestamp

Physical command audit entries use `event_type = 'physical_command'`.

## Permission Logs

Role and condominium membership changes are audited by database trigger.

The trigger covers:

- `profiles` role or tenant changes
- `condominium_memberships` insert, update, and delete operations

Permission audit entries use `event_type = 'permission_change'` and `severity = 'warning'`.

## Retention

`audit_retention_policies` stores tenant-scoped retention rules by event type.

Retention is not a delete job yet. It is a policy catalog for future automation and compliance
reviews. Records under legal hold or LGPD request review must not be deleted until the responsible
administrator closes the process.

## Export Requests

`audit_log_export_requests` stores audit export workflow requests.

Exports must:

- be scoped by tenant and optionally condominium
- include the requested filters
- write files only to private storage
- expire generated files
- create a `data_export` audit entry when processing is implemented

`audit_log_export_view` exposes export-safe audit columns with `security_invoker = true` so RLS on
`audit_logs` continues to apply.

## LGPD Notes

Audit logs may contain personal or sensitive operational data.

Implementation rules:

- Do not store provider secrets, raw biometric material, or service role credentials in audit
  metadata.
- Prefer identifiers and operational reasons over full personal payloads.
- Use redaction status when a record is under LGPD handling.
- Keep raw provider payloads only when operationally necessary and covered by retention policy.
- Exported files must be private, short-lived, and traceable.

## Access Reports

Access reports should query `access_events`, `gate_commands`, and `audit_log_export_view`.

Reports must preserve tenant and condominium filters, include the date range used, and avoid
bypassing RLS through privileged views or frontend service-role access.
