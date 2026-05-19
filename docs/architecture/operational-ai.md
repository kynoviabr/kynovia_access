# Operational AI

Operational AI is modeled as advisory infrastructure for gatehouse operations.

It does not open gates, deny access, or override `@kynovia/access-engine`. AI output must be treated
as context for operators and administrators.

## Provider Boundary

`@kynovia/integrations` defines provider contracts for:

- deterministic local analysis through `mock_ai`
- future OpenAI Responses API integration through `openai_responses`

The OpenAI provider contract is intentionally configuration-gated. Without `OPENAI_API_KEY` and an
explicit model, it returns a typed configuration failure instead of calling an external service.

Provider credentials and model settings must live in server-side environment variables or Supabase
Edge Function secrets.

## Structured Output

Operational AI responses are expected to be structured data:

- category
- risk level
- risk score
- confidence
- summary
- alert type
- recommendations
- metadata

When a real provider is connected, it should use schema-constrained responses and validate provider
output before writing to the database.

## Risk Engine Boundary

`@kynovia/access-engine` exposes deterministic operational risk assessment for:

- repeated denied attempts
- manual review spikes
- failed gate commands
- blacklist hits
- low-confidence LPR or facial validations
- visitor parking capacity pressure

This risk assessment is not generative AI. It is a stable scoring layer that can be tested and used
as input to an AI provider.

## Database Model

Phase 15 adds:

- `operational_ai_analyses`: classification, summary, confidence, risk score, recommendations, and
  source event references
- `operational_ai_alerts`: actionable operator/admin alerts
- `doorman_assistant_sessions`: scoped assistant conversations for portaria support
- `doorman_assistant_messages`: assistant conversation messages with safety flags

All tables are tenant-aware and condominium-aware.

## Safety Rules

- AI must not make final access decisions.
- AI must not dispatch physical gate commands.
- AI recommendations must be auditable and reviewable.
- AI prompts must not include service role keys, provider tokens, raw biometric material, or
  unnecessary personal data.
- High-risk and critical outputs should create operator review paths, not silent automation.
- Assistant responses should be stored with safety flags and operational context for later audit.

## OpenAI Notes

OpenAI Structured Outputs are the preferred future integration path because they constrain model
responses to a JSON schema. The implementation in this phase only prepares the contracts and
environment variables; it does not add the SDK or perform network calls.
