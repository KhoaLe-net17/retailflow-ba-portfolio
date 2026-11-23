# Business acceptance scenarios

**Execution:** see actual machine-readable [results](../../evidence/validation-results.json). All cases are synthetic automated reference checks; not stakeholder UAT.

| ID | Scenario | Action / steps | Expected |
| --- | --- | --- | --- |
| UAT-01 | Order lookup | Read O-100 as agent-1. | L-01 has remaining_qty=2 and net_paid_vnd=500000. |
| UAT-02 | Pure preview | Preview 1 unit of L-01. | 250000 VND; zero requests, reservations and payments. |
| UAT-03 | Expired return | Preview O-OLD/L-03. | 422 RETURN_WINDOW; no mutation. |
| UAT-04 | Inclusive cutoff | Preview O-EDGE at exactly its 30-day cutoff, then at +1 millisecond. | Exact cutoff accepted; +1 ms rejected. |
| UAT-05 | Excluded category | Preview O-200/L-05. | 422 CATEGORY_EXCLUDED. |
| UAT-06 | Future delivery | Preview O-FUTURE/L-06. | 422 RETURN_WINDOW. |
| UAT-07 | Atomic reservation | Create L-01 quantity 1; inspect remaining quantity. | APPROVED; 250000 VND; remaining_qty=1. |
| UAT-08 | Over-return | Reserve both L-01 units; submit another one. | 409 RETURN_QUANTITY_EXCEEDED; one return remains. |
| UAT-09 | Multi-line rollback | Submit O-200 with valid L-02 then excluded L-05. | Entire command rejected; U-03 still available. |
| UAT-10 | High-value approval | Create O-200/L-02. | AWAITING_APPROVAL; 900000 VND. |
| UAT-11 | Threshold boundary | Create two L-01 units for 500000 VND. | APPROVED without amount-triggered approval. |
| UAT-12 | Damaged exception | Create one L-01 with DAMAGED; manager approves with reason. | AWAITING_APPROVAL then APPROVED. |
| UAT-13 | Self decision | Manager creates DAMAGED request and attempts to approve it. | 403 SELF_APPROVAL; remains awaiting approval. |
| UAT-14 | Unauthorized approval and release | AGENT tries approval; MANAGER rejects with reason. | Agent denied; rejection releases units. |
| UAT-15 | Accepted inspection | STORE accepts an APPROVED return. | ACCEPTED; audit disposition RESTOCK_CANDIDATE. |
| UAT-16 | Disputed goods | STORE fails inspection; FINANCE tries to pay. | DISPUTED; QUARANTINE; refund blocked; units held. |
| UAT-17 | Wrong inspection state or role | Inspect awaiting-approval request; inspect approved request as AGENT. | 409 INVALID_STATE and 403 FORBIDDEN respectively. |
| UAT-18 | Rounding conservation | Allocate 100001 VND across 3 units; preview each available allocation. | 33334 + 33334 + 33333 = 100001. |
| UAT-19 | Client amount injection | Add amountVnd to a preview body. | 400 UNKNOWN_FIELD; no client-controlled amount. |
| UAT-20 | Successful refund | FINANCE pays an ACCEPTED return. | SUCCEEDED; return COMPLETED; one logical refund and attempt. |
| UAT-21 | Exact command replay | Submit identical refund command twice with same actor and key. | Same refund/attempt IDs; replayed=true; no new attempt. |
| UAT-22 | Conflicting key | Reuse key with changed payload or actor. | 409 IDEMPOTENCY_CONFLICT. |
| UAT-23 | Guarded payment initiation | Attempt payout as AGENT, before inspection, with a missing key, and under a different key for an existing logical refund. | Each command is denied without another payment. |
| UAT-24 | Unknown reconciliation | Create UNKNOWN; confirm matching success with provider event. | UNKNOWN stays ACCEPTED until event; then SUCCEEDED and COMPLETED. |
| UAT-25 | Event replay and conflict | Replay same event, then reuse event ID with a changed outcome. | Replay acknowledged; changed event rejected with EVENT_CONFLICT. |
| UAT-26 | Stale terminal event | After success, send another failure event for the same attempt. | IGNORED_TERMINAL; success and completed return remain. |
| UAT-27 | Wrong provider reference | Send event with another provider reference. | 409 PROVIDER_REFERENCE_MISMATCH; no state change. |
| UAT-28 | Definitive failure retry | Create FAILED then retry SUCCEEDED with new key. | Same refund ID/amount; attempt_no=2; one successful attempt. |
| UAT-29 | Uncertain retry blocked | Try retry on UNKNOWN and PENDING. | 409 RETRY_BLOCKED; original attempt remains. |
| UAT-30 | Cancellation release | Requester cancels APPROVED return before inspection. | CANCELLED; reserved units available again. |
| UAT-31 | Concurrent reservation | Submit two concurrent commands each reserving both L-01 units. | Exactly one succeeds; other conflicts; no over-reservation. |
| UAT-32 | Cancellation authorization and state | Unrelated agent cancels; requester cancels after accepted inspection. | 403 NOT_REQUESTER; 409 INVALID_STATE; reservation retained. |
| UAT-33 | Operational workbench | Read queue after creating return and UNKNOWN refund. | Returns, latest attempt, refund state and audit visible; provider cannot access workbench. |
| UAT-34 | Audit integrity | Complete creation, inspection and payment. | Audit has actor, time, entity, action, transitions; rejected operation adds no success event. |
| UAT-35 | HTTP malformed input | Send malformed JSON, text/plain, missing actor and unknown actor. | 400,415,401,401 with code/message response. |
| UAT-36 | Invalid business input | Try 0/fraction quantity, duplicate line, different-order line, invalid store/reason and extra field. | Documented 400/422 errors; no mutation. |
| UAT-37 | SQL reconciliation | Run all six SQL analyses on clean seed and a successful partial return. | Remaining quantity changes 2 to 1; invariant violation queries return zero rows. |
