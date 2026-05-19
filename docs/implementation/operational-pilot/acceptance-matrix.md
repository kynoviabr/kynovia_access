# Acceptance Matrix

| Story | Scenario | Acceptance Criteria | Evidence |
| --- | --- | --- | --- |
| STORY 133 | Pilot condominium defined | DEV pilot condominium, units, access points, and roles are documented | Pilot plan |
| STORY 134 | Operational test plan | Resident, QR, plate, and denial tests are documented | Test scripts |
| STORY 135 | Implantation checklist | Environment, database, app, operations, and safety checks exist | Checklist |
| STORY 136 | Realistic DEV data | Seed contains fictitious pilot residents, visitors, plates, invites, events, alerts | `supabase/seed.sql` |
| STORY 137 | Resident entry | Active resident vehicle can be validated and audited | Test evidence |
| STORY 138 | Visitor QR | Active QR invite can be validated and audited | Test evidence |
| STORY 139 | Visitor plate | Authorized visitor plate can enter and create active stay | Test evidence |
| STORY 140 | Failure/denial | Blocked plate or invalid access does not trigger hardware | Test evidence |
| STORY 141 | Gatehouse feedback | Operator friction, clarity, and missing states are recorded | Feedback notes |
| STORY 142 | Resident feedback | Invite creation, mobile usability, and trust feedback are recorded | Feedback notes |
| STORY 143 | Post-pilot adjustments | Issues are grouped by severity and owner | Post-pilot report |
| STORY 144 | Roadmap decision | Continue, repeat, or pause decision is documented | Approved report |

## Go Criteria

- All critical test scripts pass.
- No real hardware or production data was used.
- No critical security issue remains open.
- Gatehouse operator can explain the next action for each tested state.
- Resident flow feedback does not reveal blocking confusion.

## No-Go Criteria

- Security Advisor reports unresolved security lint.
- Tenant isolation concern appears.
- Any real personal data is used by mistake.
- Any workflow requires undocumented manual database edits.
- Operator cannot distinguish allow, deny, and manual review outcomes.
