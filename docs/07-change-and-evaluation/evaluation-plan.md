# Solution evaluation and limitations

## What can be evaluated now

Rule consistency, state safety, financial conservation on synthetic units, contract shape, reproducible SQL and browser task completion. Actual results are recorded separately; they do not establish business impact.

## Measurement definitions for a real pilot

| Objective | Definition | Required evidence | Caution |
| --- | --- | --- | --- |
| OBJ-01 Visibility | Submission-to-COMPLETED elapsed time for completed returns; report age distribution of unresolved returns separately | Event timestamps, terminal-state definitions, consistent timezone and comparable reporting periods | Completed-only averages hide old unresolved cases. No baseline exists here. |
| OBJ-02 Consistency | Cases matching an agreed policy outcome / all evaluated cases, segmented by exception type | Versioned policy, representative expected outcomes and independent case review | Synthetic tests are not a representative operational sample. |
| OBJ-03 Payment control | Count of excess/duplicate successful refunds; unresolved-payment age by outcome | Original paid units, logical refunds, attempts, provider evidence and reconciliation logs | A zero count in fixtures does not prove all production cases safe. |

## Proposed pilot approach

Obtain business-policy agreement, select a representative bounded cohort, establish baseline definitions, use shadow calculations before any live payout, compare equivalent periods, review exceptions, and monitor controls with finance. Do not claim percentage improvement without comparable data and attribution.

## Known limitations

No real retailer research, stakeholder acceptance, production identity, provider integration, physical inventory posting, durable operational service, load test, penetration test, or externally measured business improvement. Dispute resolution and exchanges are outside v1.0. The fixed clock and in-memory resets are deliberate test fixtures.

## Retrospective

The main analysis challenge was making partial refunds, reserved quantities and unknown payment outcomes agree. Immutable unit values and separate state models make those assumptions explicit and testable. Next evidence to obtain would be real policy interviews and provider failure semantics, followed by durable integration and operational validation.
