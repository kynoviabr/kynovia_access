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
