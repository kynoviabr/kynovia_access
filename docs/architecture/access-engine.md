# Access Engine

The access engine is a pure TypeScript policy evaluator for operational access decisions.

It does not read from Supabase directly. Apps and future Edge Functions must assemble the required
context from trusted sources and pass it to `evaluateAccess`.

## Decision Contract

`evaluateAccess(context)` returns:

- `result`: `allow`, `deny`, or `manual_review`.
- `reason`: stable machine-readable reason.
- `message`: operator-facing explanation.
- `matchedRule`: rule identifier used for audit and tests.
- `metadata`: optional structured details.

## Rule Order

The default rule order is intentionally conservative:

1. Blacklisted plate denies access before any allow rule.
2. Resident vehicle allows only active resident plus active vehicle.
3. Invite status and validity window deny or request review before allowing.
4. Occupancy checks request manual review for active stay or full visitor parking.
5. Valid QR Code allows when invite context and token validation are present.
6. Valid plate invite allows visitor vehicle entry.
7. Missing or unknown context falls back to `manual_review`.

## Implemented Stories

- Resident vehicle rule.
- Valid invite rule.
- Valid QR Code rule.
- Blacklist rule.
- `manual_review` result for uncertain states.
- Unit tests for default and custom rule ordering.

## Integration Boundary

The engine is deterministic and side-effect free. It must not:

- Query the database.
- Mutate invite usage counters.
- Create access events.
- Trigger gates or integrations.
- Read secrets or environment variables.

Those actions belong to apps, Supabase Edge Functions, or integration providers after the engine
returns a decision.
