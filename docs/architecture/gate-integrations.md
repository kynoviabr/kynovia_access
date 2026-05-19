# Gate Integrations

Gate integrations are modeled as provider contracts in `@kynovia/integrations`.

The package does not read or write Supabase directly. Apps, jobs, or Edge Functions are responsible
for loading `gate_commands`, dispatching them to a provider, and persisting the resulting status.

## Providers

- `mock_gate`: deterministic provider for development, tests, demos, and CI.
- `http_relay`: generic HTTP relay provider for future controlled gateway hardware or relay services.

## Command Contract

A gate command request includes:

- command id
- tenant id
- condominium id
- access point id
- command: `open`, `close`, `hold_open`, or `lock`
- provider: `mock_gate` or `http_relay`
- requested timestamp
- optional requester, access event, and metadata

## Dispatch Result

Providers return one of:

- `confirmed`: command accepted/executed by the provider.
- `failed`: command could not be sent or confirmed.

Failures include stable error codes:

- `missing_configuration`
- `timeout`
- `http_error`
- `provider_error`
- `invalid_command`

## Safety Boundary

The first implementation intentionally avoids direct hardware coupling.

Future dispatch workers must:

- Only dispatch commands created after an authorized access decision.
- Persist provider results back to `gate_commands`.
- Store audit metadata for manual openings and failures.
- Enforce provider secrets through environment variables, never frontend code.
- Use timeout and retry policies appropriate to the physical integration.
