# Business rules · policy 0.1

**Status:** selected case-study baseline for synthetic validation, not retailer approval. **Owner:** Anh Kho. **Date:** 2026-11-23.

These decisions resolve the discovery questions for this bounded demonstrator. They are not legal guidance or actual retailer policies. Business requirements remain subject to external stakeholder validation.

| ID | Selected rule |
| --- | --- |
| BR-001 | A request is eligible from delivered_at through delivered_at + 30 x 24 hours, inclusive. Compare instants; display UTC+7. Future delivery and late requests are rejected. |
| BR-002 | Allocate only unreserved, unreturned units. Reserve units atomically at request creation; keep them reserved through inspection, dispute, payment uncertainty, and completion. |
| BR-003 | Use original line net paid after allocated discounts. Split net paid into integer VND units: floor(net/quantity), with the first remainder ordinals receiving one extra dong. Select lowest available ordinals. No shipping fee refund or new tax calculation. |
| BR-004 | A refund equals the immutable paid values of its reserved units. At most one logical refund per return; each unit can contribute to only one live/completed return. Successful refunds cannot exceed original net paid. |
| BR-005 | Manager approval is required for amount > 500000 VND or reason DAMAGED. Exactly 500000 does not trigger the amount rule. Requester cannot decide their own exception. Other eligible requests are auto-approved by the policy. |
| BR-006 | Persist an idempotency key, actor and operation/payload fingerprint with the payment result in one transaction. Exact replay returns the same IDs and original response; different payload or actor with the same key returns conflict. |
| BR-007 | Only store staff inspect an approved return. Passed inspection produces ACCEPTED and RESTOCK_CANDIDATE; discrepancy produces DISPUTED and QUARANTINE. No inventory movement is executed. Disputed cases cannot be paid. |
| BR-008 | Each successful mutation records entity, actor, action, before/after states, reason or relevant details, and timestamp in the same transaction. Rejected commands do not change business data. |
| BR-009 | Finance alone initiates or retries payments. PENDING/UNKNOWN require reconciliation on the existing attempt, never blind resubmission. A retry is allowed only after definitive FAILED, as another attempt of the same logical refund. |
| BR-010 | Provider events must match attempt and provider reference. Deduplicate event IDs, reject reused IDs with changed content, and ignore subsequent events on terminal attempts without regressing the state. SUCCEEDED completes the return. |
| BR-011 | All lines in a request must belong to one paid order. Duplicate line IDs, non-integer/non-positive quantities, unknown fields, and unknown reasons/stores are invalid. Consumables are excluded. |
| BR-012 | Requester or manager can cancel only before inspection. Rejection or cancellation releases reservations; disputes and payment failures do not. Cancellation after inspection needs a separately analyzed future resolution process. |

## Decision consequences

Immutable unit allocations prevent rounding drift across partial refunds and cancelled reservations. A unique active-unit reservation index and one database transaction protect competing requests. Client previews are advisory; creation recomputes availability.

The mock provider treats FAILED as definitive. A real provider that can later contradict a terminal failure requires a different reconciliation policy before retries are safe. Dispute resolution, physical stock movements, real authentication, provider signatures and production deployment are deliberately not implemented.

Related: [decision log](../07-change-and-evaluation/decision-log.md), [state models](../04-solution-design/state-models.md), [requirements](requirements-catalog.md).
