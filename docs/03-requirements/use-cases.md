# Use-case specifications

## UC-01 · Submit and complete a return

**Primary actor:** customer service. Supporting actors: independent manager, store associate, finance. **Trigger:** customer requests an online-order return. **Preconditions:** paid seeded order, identified synthetic actor, supported store and reason, eligible delivery date. **Success guarantee:** accepted units are paid at original allocated net value and request is COMPLETED with audit evidence. **Minimum guarantee:** invalid operations do not partially reserve units or create payments.

### Main success flow

1. CS retrieves original order, unit availability and paid values (FR-001).
2. CS selects line, quantity, store and reason; the system previews eligibility and amount without side effects (FR-002/006).
3. CS submits; the system rechecks and atomically reserves available units (FR-003).
4. Where BR-005 requires it, a different manager records approval and reason (FR-004).
5. Store staff records passed inspection; the system marks ACCEPTED and proposed inventory disposition (FR-005).
6. Finance submits a logical refund using an idempotency key (FR-007).
7. Mock provider confirms success; system marks refund SUCCEEDED and return COMPLETED, preserving audit (FR-008/012).

### Alternatives and exceptions

2a. Late, future-delivered or excluded product: explain eligibility error; create nothing. 2b. Invalid quantity/line: return input error. 3a. Availability changed since preview: conflict, re-read order and preview again. 3b. Concurrent request: one valid reservation wins; no over-allocation. 4a. Self or unauthorized approval: deny. 4b. Rejection: release units and record reason. Before inspection, requester or manager may cancel and release (FR-010). 5a. Goods discrepancy: DISPUTED, quarantine candidate, payment blocked; physical resolution is beyond v1.0. 6a. Exact repeated key: return original IDs/result. 6b. Different request for same logical refund: conflict. 7a. Unknown/pending: continue UC-02. 7b. Definitive failure: guarded retry under the same logical instruction.

## UC-02 · Resolve uncertain payment

**Primary actor:** finance; supporting actor: mock provider. **Trigger:** UNKNOWN or PENDING outcome. **Preconditions:** one existing refund and matching attempt/provider reference. **Success guarantee:** a confirmed result updates existing attempt and logical refund; confirmed success completes return. **Minimum guarantee:** no blind second payout.

1. Finance sees the unresolved queue and current attempt.
2. Obtain authoritative confirmation in a real system; the demo explicitly simulates a provider event.
3. System checks provider role, event ID, attempt ID, reference and confirmed status.
4. Apply the event once. Success closes; failure allows controlled retry; no confirmation leaves case open.

Alternative: duplicate same event is acknowledged. Changed payload under same event ID conflicts. Mismatched reference conflicts. Event on a terminal attempt is recorded as ignored. The mock terminal-failure assumption must be revalidated before any real-provider integration.

Related: [rules](business-rules.md), [acceptance cases](../06-uat-and-traceability/uat-scenarios.md).
