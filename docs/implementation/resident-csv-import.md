# Resident CSV Import

This document records the planned contract for a future resident CSV import flow.

## Status

Planned. Phase 05 prepares the administrative surface and documents the expected
operational contract, but does not implement bulk import yet.

## Expected Flow

1. Tenant admin selects a condominium.
2. Tenant admin uploads a CSV file.
3. The system validates rows before writing any data.
4. The system shows a preview with accepted rows, warnings, and rejected rows.
5. Tenant admin confirms the import.
6. The system creates residents, optional unit links, and optional resident vehicles.
7. The system writes audit logs for the import batch and row counts.

## CSV Columns

Required:

- `full_name`
- `unit_number`

Optional:

- `unit_block`
- `unit_floor`
- `relationship`
- `is_primary`
- `document`
- `phone`
- `email`
- `status`
- `block_reason`
- `vehicle_plate`
- `vehicle_label`
- `vehicle_status`

## Validation Rules

- Every row must be scoped to the selected condominium.
- `status` must be `active`, `inactive`, or `blocked`.
- `relationship` must be `owner`, `tenant`, `dependent`, or `resident`.
- Vehicle plates must be normalized before insert.
- Duplicate resident/unit and vehicle plate conflicts must be shown before import.
- Import must not bypass RLS or expose service role keys to the frontend.

## Out of Scope for Phase 05

- File upload implementation.
- Background jobs.
- Audit log implementation for import batches.
- Partial import execution.
