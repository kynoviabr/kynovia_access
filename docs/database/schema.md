# Database Schema

This document summarizes the foundation schema created for Kynovia Access.

## Tenant Core

- `tenants`: top-level SaaS tenant.
- `condominiums`: condominium/property under a tenant, including timezone, JSON settings,
  JSON operational rules, visitor parking capacity, and metadata.
- `profiles`: authenticated user profile linked to a tenant.
- `condominium_memberships`: profile access to a condominium with an operational role.

## Property Operations

- `units`: condominium units.
- `residents`: residents scoped to a condominium, optionally linked to an authenticated profile for
  resident self-service.
- `resident_units`: resident-to-unit relationships.
- `resident_vehicles`: resident vehicles, unique by condominium and plate.
- `visitors`: visitor records scoped to a condominium.
- `visitor_vehicles`: visitor vehicle plates.
- `visitor_unit_visits`: visitor history linked to a condominium unit.

## Access Control

- `access_points`: gatehouse, gate, pedestrian entry, or future physical access points.
- `access_invites`: visitor authorization window, optional plate, usage limits, QR token hash,
  recurrence metadata, cancellation metadata, and status.
- `access_invite_validations`: history of gatehouse QR validations and their outcomes.
- `vehicle_plate_blacklist`: condominium-scoped blocked visitor plates.
- `visitor_vehicle_accesses`: active and historical visitor vehicle entries/exits by plate.
- `access_events`: access decisions such as allow, deny, or manual review.
- `gate_commands`: physical command queue for gates and relays.
- `gatehouse_occurrences`: doorman operational occurrences with severity and resolution status.

## Compliance

- `audit_logs`: immutable audit records for sensitive actions.

`audit_logs` blocks update and delete operations with a database trigger.

## Multi-Tenant Rule

Every operational record includes:

- `tenant_id`
- `condominium_id`, when the record belongs to a condominium

This supports tenant-wide administration and condominium-level isolation.

## Phase 04 Management Rules

- Tenant admins and platform admins may create, update, and remove condominiums for their tenant.
- Condominium admins and gatehouse operators may manage operational records that already belong to
  condominiums they can operate, such as units and access points.
- Units are always linked to a condominium through `condominium_id` and remain unique by
  `condominium_id`, `block`, and `number`.
- Visitor parking capacity is stored on `condominiums.visitor_parking_capacity` and constrained to
  non-negative values.

## Phase 05 Resident And Visitor Rules

- Residents are scoped by `tenant_id` and `condominium_id`.
- Resident status must be `active`, `inactive`, or `blocked`.
- Blocked residents and resident vehicles may carry a block reason and timestamp.
- Resident vehicles are normalized by plate before write and remain unique per condominium.
- Resident-unit links are stored in `resident_units` and support primary unit markers.
- Visitors are basic contact records scoped to a condominium.
- Visitor history by unit is stored in `visitor_unit_visits`.
- Bulk resident CSV import is planned separately and documented in
  `docs/implementation/resident-csv-import.md`.

## Phase 06 Digital Invite And QR Rules

- Digital invites are stored in `access_invites` and remain tenant-aware through `tenant_id`,
  `condominium_id`, `resident_id`, and `unit_id`.
- Resident self-service requires an active `residents.profile_id` link and an existing
  `resident_units` relationship for the selected unit.
- QR codes store only `qr_token_hash` in the database. The raw token is returned to the resident once
  when the invite is created.
- Invite validity is controlled by `starts_at`, `expires_at`, `qr_token_expires_at`, `max_uses`,
  `use_count`, and `status`.
- Recurrent invites are represented by `invite_type = 'recurring'` and a descriptive
  `recurrence_rule`; scheduling automation is intentionally left for a later operational story.
- Gatehouse validations are recorded in `access_invite_validations` with a normalized result such as
  `allowed`, `expired`, `cancelled`, `not_started`, `usage_limit_reached`, or `invalid`.

## Phase 07 Vehicle Plate Invite Rules

- A digital invite may include an optional normalized Brazilian plate in `access_invites.plate`.
- Plate values must match the normalized Brazilian plate format used by the application helpers.
- Gatehouse operators can validate access by plate without scanning the QR payload.
- A successful plate entry increments `access_invites.use_count` and creates a
  `visitor_vehicle_accesses` active stay.
- A visitor vehicle can have only one active stay per condominium and plate.
- Visitor parking capacity is checked against `condominiums.visitor_parking_capacity`; a value of
  `0` means no capacity limit is enforced.
- Exits are recorded by updating the active `visitor_vehicle_accesses` row with `exited_at`,
  `exit_validated_by`, and `status = 'exited'`.
- `vehicle_plate_blacklist` blocks active plates before invite lookup and records the denied
  validation result.

## Phase 08 Doorman Panel Rules

- The doorman panel reads `access_events` as the operational access queue.
- Events with `decision = 'manual_review'` are treated as pending validation items.
- Manual releases and denials are recorded in `access_events` with `metadata.source = 'doorman_panel'`.
- A manual release can create a `gate_commands` row with provider `mock` and status `pending` when
  an access point is selected.
- Gate status is derived from the latest `gate_commands` row for each `access_point_id`.
- Open doorman incidents are stored in `gatehouse_occurrences` with severity and status fields.
- `gatehouse_occurrences` is tenant-aware through `tenant_id` and condominium-aware through
  `condominium_id`.
