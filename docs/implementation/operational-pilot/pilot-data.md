# Pilot Data Guide

The DEV pilot seed uses fictitious data only.

## Tenant And Condominium

- Tenant: Kynovia Demo
- Condominium: Residencial Piloto Aurora
- Slug: `residencial-piloto-aurora`
- Timezone: `America/Sao_Paulo`

## Units

| Unit | Purpose |
| --- | --- |
| A-101 | Active resident with resident vehicle |
| A-102 | Resident creating QR invite |
| B-201 | Resident authorizing visitor plate |

## Plates

| Plate | Scenario |
| --- | --- |
| PIL1A01 | Active resident vehicle |
| PIL2B02 | Authorized visitor plate |
| BLK3C03 | Blocked plate denial |

## QR Invite

The seed stores only a fake token hash. Testers should use the application validation flow rather
than a real QR secret.

- Visitor: Visitante QR Piloto
- Plate: none
- Invite type: single
- QR token hash: `dev-pilot-qr-token-hash`

## Safety

- No record represents a real person.
- No document number, phone, plate, or email should be reused from production.
- Seed data is for DEV validation only.
