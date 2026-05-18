# Kynovia Access Design System

This design system adapts the security and gatehouse UI template provided for Kynovia Access.
It is the reference for future product screens, especially the doorman panel, resident PWA,
operational dashboards, access events, visitors, residents, credentials, and reports.

## Product Direction

The UI must help an operator or manager identify risk, pending work, and the next priority action
in less than 3 minutes.

Principles:

1. Operational first: critical information appears at the top.
2. Zero ambiguity: statuses and actions must be unmistakable.
3. Auditable records: history and action trails must always be accessible.
4. Low friction: recurring gatehouse actions must be fast and clear.

## Recommended Modules

1. Operational dashboard
2. Gatehouses, posts, shifts, and events
3. Visitors
4. Residents and units
5. Accesses and credentials
6. Incidents
7. Rounds
8. Reports
9. Settings

## Base Layout

1. Fixed sidebar with icons and labels.
2. Page header with title, short description, and primary CTA.
3. Top filter row for period, location, status, and search.
4. Operational summary KPI cards.
5. Main table or list with quick actions.

## Semantic Palette

Use centralized tokens in shared UI components. Do not hardcode colors per page.

1. `primary`: main action, such as "Register entry".
2. `success`: released or normalized event.
3. `warning`: attention required.
4. `destructive`: blocked, risky, failed, or denied state.
5. `muted`: secondary context.
6. `info`: in analysis, informational, or non-blocking signal.

## Typography

1. H1: module context, such as "Central Gatehouse".
2. H2/H3: operational blocks.
3. Body: records and descriptions.
4. Label: filters and forms.

Prioritize sustained readability for long operational shifts.

## Required Components

1. `PageHeader`
2. `BrandButton`
3. `BrandBadge` for operational statuses
4. KPI `Card`
5. `Table` with status and timestamp columns
6. `Dialog` for quick entry, exit, and incident registration
7. `Drawer` for complete event detail
8. `Toast` for confirmation and error feedback

## Status Vocabulary

1. `Liberado`: `success`
2. `Pendente validacao`: `warning`
3. `Negado`: `destructive`
4. `Em analise`: `info`
5. `Concluido`: `success`
6. `Expirado`: `muted` or `destructive`, depending on risk

## Operational Dashboard Pattern

Top cards:

1. Entries today
2. Exits today
3. Denied accesses
4. Open incidents
5. Critical alerts
6. Average handling time

Main table:

1. Date and time
2. Event type
3. Person or vehicle
4. Location
5. Status
6. Responsible operator
7. Actions

## Gatehouse Form Pattern

Quick registration must include:

1. Type: visitor, contractor, delivery, vehicle, resident, or collaborator
2. Document or identifier
3. Destination, place, or unit
4. Authorizing person
5. Access window
6. Observation

UX rules:

1. Critical fields stay at the top.
2. Validation is inline.
3. Errors are explanatory and close to the form.
4. There is a single clear primary CTA.

## Interface States

1. Loading: skeleton for tables and cards.
2. Empty state: direct action available.
3. Failure: actionable message.
4. Success: toast plus immediate list refresh.

## Alerts And Priority

1. Critical: red, immediate action.
2. High: orange, handle during current shift.
3. Medium: yellow, monitor.
4. Low: blue or gray, informational.

## Accessibility And Operation

1. Keyboard navigation for fast operation.
2. Visible focus on every control.
3. Strong contrast for low-light environments.
4. Short, objective messages.

## Implementation Rules

1. Reuse shared wrappers such as `PageHeader`, `BrandButton`, and `BrandBadge`.
2. Do not hardcode colors per page.
3. Centralize variants in shared components.
4. Define status semantics before building screens.
5. Keep operational screens dense, scannable, and predictable.
6. Avoid marketing-style layouts in authenticated SaaS surfaces.

## Production Readiness Checklist

1. Visual consistency with Kynovia Access UI primitives.
2. Critical flows tested: entry, exit, blocking, incident, approval.
3. Clear success and error feedback.
4. Empty and loading states implemented.
5. Desktop and tablet responsiveness validated.
