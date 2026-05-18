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
- `residents`: residents scoped to a condominium.
- `resident_units`: resident-to-unit relationships.
- `resident_vehicles`: resident vehicles, unique by condominium and plate.
- `visitors`: visitor records scoped to a condominium.
- `visitor_vehicles`: visitor vehicle plates.
- `visitor_unit_visits`: visitor history linked to a condominium unit.

## Access Control

- `access_points`: gatehouse, gate, pedestrian entry, or future physical access points.
- `access_invites`: visitor authorization window, optional plate, usage limits, and status.
- `access_events`: access decisions such as allow, deny, or manual review.
- `gate_commands`: physical command queue for gates and relays.

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
