# License Plate Recognition

License Plate Recognition (LPR) is modeled as a provider boundary in `@kynovia/integrations`.

The package parses provider webhooks, normalizes plates, classifies confidence, and produces an
access subject that can later be evaluated by `@kynovia/access-engine`.

## Providers

- `mock_lpr`: deterministic provider for local development, tests, demos, and CI.
- `plate_recognizer`: adapter for Plate Recognizer webhook payloads.

No provider secret is stored in code. Future inbound webhook authentication must be configured
through server-side environment variables or Supabase Edge Function secrets.

## Reading Contract

An LPR webhook request includes:

- event id
- tenant id
- condominium id
- access point id
- provider
- occurrence timestamp
- optional direction: `entry` or `exit`
- raw provider payload

The parser returns either an LPR reading or an auditable provider failure.

## Plate Normalization

Plates are normalized by:

- removing accents
- removing non-alphanumeric characters
- uppercasing the result

The Brazilian format guard accepts both legacy and Mercosul formats through the normalized pattern
`AAA9A99` / `AAA9999`.

## Confidence Policy

Each provider has a minimum confidence threshold. The default threshold is `0.85`.

- `accepted`: confidence is equal to or above the threshold.
- `manual_review`: confidence is below the threshold or no usable plate was found.

Low-confidence readings must not trigger automatic gate commands. They are converted into
`unknown` access subjects and require operator review in the gatehouse flow.

## Access Engine Boundary

`@kynovia/integrations` does not decide whether access is allowed.

The LPR adapter builds an access subject with:

- subject type
- normalized plate
- confidence
- provider
- reading id
- manual review flag

Application services or Edge Functions are responsible for loading resident vehicles, invitations,
blacklists, and occupancy data before calling `@kynovia/access-engine`.

## Persistence Expectations

Future database writes should persist:

- raw reading metadata
- normalized plate
- confidence score
- provider name
- access point
- manual review requirement
- linked access event, when created

Provider payloads may contain sensitive operational metadata. Persist only the fields required for
audit and troubleshooting, and keep retention aligned with LGPD policies.
