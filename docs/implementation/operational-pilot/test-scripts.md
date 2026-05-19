# Operational Test Scripts

Each script should be executed in DEV using fictitious pilot data.

## Test 137: Resident Vehicle Entry

Goal: validate active resident vehicle entry.

Steps:

1. Open the gatehouse dashboard.
2. Search for resident vehicle plate `PIL1A01`.
3. Confirm the resident is active and linked to unit `A-101`.
4. Register an entry decision.
5. Confirm an access event exists with decision `allow`.
6. Confirm any gate command remains mock-only.

Expected result: resident vehicle entry is allowed and auditable.

## Test 138: Visitor By QR Code

Goal: validate visitor access using an active invite with QR token hash.

Steps:

1. Open the gatehouse invite validation view.
2. Locate invite for `Visitante QR Piloto`.
3. Use the documented DEV QR payload from the pilot data guide.
4. Confirm the validation result is allowed.
5. Confirm invite usage count and validation history are updated.

Expected result: active QR invite is accepted once and creates an auditable validation.

## Test 139: Visitor By Plate

Goal: validate visitor vehicle entry by authorized plate.

Steps:

1. Search for visitor plate `PIL2B02`.
2. Confirm an active invite exists for the plate.
3. Register vehicle entry.
4. Confirm visitor vehicle stay is active.
5. Confirm visitor parking capacity is not exceeded.

Expected result: visitor plate is accepted and active stay is tracked.

## Test 140: Failure And Denial

Goal: validate safe denial paths.

Steps:

1. Search for blocked plate `BLK3C03`.
2. Confirm blacklist reason is visible to the operator.
3. Attempt manual validation.
4. Confirm decision is denied or routed to manual review.
5. Confirm no real gate command is dispatched.
6. Confirm audit/access event captures the denial reason.

Expected result: blocked plate is denied safely and no hardware action occurs.

## Cross-Test Checks

- Operator can recover from invalid or missing data.
- Every action has a visible status.
- Error states use clear language.
- No test requires production data.
- No test depends on a developer machine outside the documented environment.
