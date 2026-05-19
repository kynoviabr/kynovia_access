# Facial Biometrics

Facial biometrics are modeled as a provider boundary in `@kynovia/integrations`.

The package defines enrollment, consent, validation, liveness, blacklist, and audit contracts. It
does not store biometric templates, call a real provider, or decide final access authorization.

## Providers

- `mock_facial`: deterministic provider for local development, tests, demos, and CI.
- `facial_provider`: generic contract for future facial recognition providers.

Provider credentials, webhook secrets, and template encryption material must live only in
server-side environment variables or Supabase Edge Function secrets.

## Consent Boundary

Facial enrollment requires explicit consent.

The consent contract includes:

- subject id
- status: `granted`, `revoked`, or `expired`
- grant timestamp
- optional expiration timestamp
- optional revoke timestamp
- legal basis: `explicit_consent`
- consent text/version identifier

Enrollment and validation must fail or route to manual review when consent is missing, revoked, or
expired.

## Enrollment Contract

Enrollment requests include:

- tenant id
- condominium id
- subject id
- provider
- consent
- secure image reference
- optional metadata

The integration contract returns a provider subject id and consent id when enrollment succeeds. The
image reference must point to controlled private storage; raw image bytes should not be passed
through frontend code or committed to the repository.

## Validation Contract

Validation requests include:

- tenant id
- condominium id
- access point id
- provider
- occurrence timestamp
- direction: `entry` or `exit`
- subject/provider subject ids when known
- consent
- minimum confidence and liveness thresholds
- blacklist state
- raw provider payload

The validation result is one of:

- `matched`: confidence and liveness pass, consent is valid, and no blacklist is active.
- `manual_review`: consent, confidence, liveness, or payload quality requires operator review.
- `denied`: facial blacklist blocks access.

## Liveness And Anti-Spoofing

Liveness is a first-class validation score. A facial match without sufficient liveness must not
trigger an automatic gate command.

The default thresholds are:

- minimum confidence: `0.90`
- minimum liveness score: `0.85`

Each condominium may later override these thresholds through server-side configuration.

## Access Engine Boundary

`@kynovia/integrations` does not return an `allow` decision. It only returns a biometric validation
outcome and audit metadata.

Application services or Edge Functions are responsible for loading tenant context, subject records,
resident/visitor relationships, blacklist state, and calling `@kynovia/access-engine` with the final
operational context.

## Persistence Expectations

Future database writes should persist:

- consent records and versions
- provider subject id, never raw provider secrets
- enrollment audit metadata
- validation result
- confidence and liveness score
- blacklist reason when applicable
- linked access event, when created

Biometric templates and raw images are sensitive personal data. Persist only what is operationally
necessary, encrypt private references, and align retention with LGPD documentation.
