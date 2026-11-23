# User stories and acceptance criteria

**Status:** specified for synthetic reference validation; no external product-owner acceptance.

## US-01

As a agent, I want to retrieve the original paid order and remaining quantity so that I can avoid accepting units already reserved or returned.

**Requirements:** FR-001 · **Priority:** Must

### AC-01 · Order lookup

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Read O-100 as agent-1.
Then L-01 has remaining_qty=2 and net_paid_vnd=500000.
```

## US-02

As a agent, I want to preview eligibility and the paid-value refund so that I can explain the expected amount without initiating a payout.

**Requirements:** FR-002, FR-006 · **Priority:** Must

### AC-02 · Pure preview

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Preview 1 unit of L-01.
Then 250000 VND; zero requests, reservations and payments.
```

### AC-03 · Expired return

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Preview O-OLD/L-03.
Then 422 RETURN_WINDOW; no mutation.
```

### AC-04 · Inclusive cutoff

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Preview O-EDGE at exactly its 30-day cutoff, then at +1 millisecond.
Then Exact cutoff accepted; +1 ms rejected.
```

### AC-05 · Excluded category

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Preview O-200/L-05.
Then 422 CATEGORY_EXCLUDED.
```

### AC-06 · Future delivery

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Preview O-FUTURE/L-06.
Then 422 RETURN_WINDOW.
```

### AC-18 · Rounding conservation

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Allocate 100001 VND across 3 units; preview each available allocation.
Then 33334 + 33334 + 33333 = 100001.
```

### AC-19 · Client amount injection

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Add amountVnd to a preview body.
Then 400 UNKNOWN_FIELD; no client-controlled amount.
```

## US-03

As a agent, I want to submit a validated return and reserve its units so that I can prevent competing requests from using the same purchased units.

**Requirements:** FR-003 · **Priority:** Must

### AC-07 · Atomic reservation

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Create L-01 quantity 1; inspect remaining quantity.
Then APPROVED; 250000 VND; remaining_qty=1.
```

### AC-08 · Over-return

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Reserve both L-01 units; submit another one.
Then 409 RETURN_QUANTITY_EXCEEDED; one return remains.
```

### AC-09 · Multi-line rollback

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Submit O-200 with valid L-02 then excluded L-05.
Then Entire command rejected; U-03 still available.
```

### AC-31 · Concurrent reservation

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Submit two concurrent commands each reserving both L-01 units.
Then Exactly one succeeds; other conflicts; no over-reservation.
```

## US-04

As a manager, I want to review high-value and damaged-item exceptions independently so that I can apply the case-study approval policy consistently.

**Requirements:** FR-004 · **Priority:** Must

### AC-10 · High-value approval

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Create O-200/L-02.
Then AWAITING_APPROVAL; 900000 VND.
```

### AC-11 · Threshold boundary

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Create two L-01 units for 500000 VND.
Then APPROVED without amount-triggered approval.
```

### AC-12 · Damaged exception

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Create one L-01 with DAMAGED; manager approves with reason.
Then AWAITING_APPROVAL then APPROVED.
```

### AC-13 · Self decision

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Manager creates DAMAGED request and attempts to approve it.
Then 403 SELF_APPROVAL; remains awaiting approval.
```

### AC-14 · Unauthorized approval and release

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When AGENT tries approval; MANAGER rejects with reason.
Then Agent denied; rejection releases units.
```

## US-05

As a store, I want to record goods inspection and discrepancies so that I can keep unaccepted goods from proceeding to payment.

**Requirements:** FR-005 · **Priority:** Must

### AC-15 · Accepted inspection

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When STORE accepts an APPROVED return.
Then ACCEPTED; audit disposition RESTOCK_CANDIDATE.
```

### AC-16 · Disputed goods

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When STORE fails inspection; FINANCE tries to pay.
Then DISPUTED; QUARANTINE; refund blocked; units held.
```

### AC-17 · Wrong inspection state or role

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Inspect awaiting-approval request; inspect approved request as AGENT.
Then 409 INVALID_STATE and 403 FORBIDDEN respectively.
```

## US-06

As a finance, I want to submit one idempotent logical refund so that I can avoid duplicate payouts when a command is repeated.

**Requirements:** FR-007 · **Priority:** Must

### AC-20 · Successful refund

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When FINANCE pays an ACCEPTED return.
Then SUCCEEDED; return COMPLETED; one logical refund and attempt.
```

### AC-21 · Exact command replay

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Submit identical refund command twice with same actor and key.
Then Same refund/attempt IDs; replayed=true; no new attempt.
```

### AC-22 · Conflicting key

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Reuse key with changed payload or actor.
Then 409 IDEMPOTENCY_CONFLICT.
```

### AC-23 · Guarded payment initiation

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Attempt payout as AGENT, before inspection, with a missing key, and under a different key for an existing logical refund.
Then Each command is denied without another payment.
```

## US-07

As a finance, I want to reconcile a pending or unknown payment on its existing attempt so that I can resolve uncertainty without paying twice.

**Requirements:** FR-008 · **Priority:** Must

### AC-24 · Unknown reconciliation

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Create UNKNOWN; confirm matching success with provider event.
Then UNKNOWN stays ACCEPTED until event; then SUCCEEDED and COMPLETED.
```

### AC-25 · Event replay and conflict

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Replay same event, then reuse event ID with a changed outcome.
Then Replay acknowledged; changed event rejected with EVENT_CONFLICT.
```

### AC-26 · Stale terminal event

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When After success, send another failure event for the same attempt.
Then IGNORED_TERMINAL; success and completed return remain.
```

### AC-27 · Wrong provider reference

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Send event with another provider reference.
Then 409 PROVIDER_REFERENCE_MISMATCH; no state change.
```

## US-08

As a finance, I want to retry only a definitively failed attempt so that I can recover a failure while preserving the logical refund identity.

**Requirements:** FR-009 · **Priority:** Must

### AC-28 · Definitive failure retry

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Create FAILED then retry SUCCEEDED with new key.
Then Same refund ID/amount; attempt_no=2; one successful attempt.
```

### AC-29 · Uncertain retry blocked

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Try retry on UNKNOWN and PENDING.
Then 409 RETRY_BLOCKED; original attempt remains.
```

## US-09

As a agent, I want to cancel my uninspected return with a reason so that I can release units when the customer changes their request.

**Requirements:** FR-010 · **Priority:** Must

### AC-30 · Cancellation release

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Requester cancels APPROVED return before inspection.
Then CANCELLED; reserved units available again.
```

### AC-32 · Cancellation authorization and state

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Unrelated agent cancels; requester cancels after accepted inspection.
Then 403 NOT_REQUESTER; 409 INVALID_STATE; reservation retained.
```

## US-10

As a finance, I want to review operational statuses and reconciliation analyses so that I can identify unresolved cases and explain follow-up responsibility.

**Requirements:** FR-011, FR-014 · **Priority:** Should

### AC-33 · Operational workbench

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Read queue after creating return and UNKNOWN refund.
Then Returns, latest attempt, refund state and audit visible; provider cannot access workbench.
```

### AC-37 · SQL reconciliation

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Run all six SQL analyses on clean seed and a successful partial return.
Then Remaining quantity changes 2 to 1; invariant violation queries return zero rows.
```

## US-11

As a manager, I want to inspect the audit trail of decisions so that I can trace who changed a case and why.

**Requirements:** FR-012 · **Priority:** Must

### AC-34 · Audit integrity

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Complete creation, inspection and payment.
Then Audit has actor, time, entity, action, transitions; rejected operation adds no success event.
```

## US-12

As a agent, I want to receive specific validation messages so that I can correct an invalid request without losing business consistency.

**Requirements:** FR-013 · **Priority:** Must

### AC-35 · HTTP malformed input

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Send malformed JSON, text/plain, missing actor and unknown actor.
Then 400,415,401,401 with code/message response.
```

### AC-36 · Invalid business input

```gherkin
Given a fresh synthetic fixture and an authorized role unless the case tests denial
When Try 0/fraction quantity, duplicate line, different-order line, invalid store/reason and extra field.
Then Documented 400/422 errors; no mutation.
```
