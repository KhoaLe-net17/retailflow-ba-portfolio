# CR-001 · Add product exchanges

**Type:** simulated change-analysis exercise. **Status:** analyzed, deferred; not implemented. **Source:** hypothetical sponsor request; no actual sponsor meeting. **Current baseline:** v1.0 excludes exchanges.

## Proposed change and business rationale

Allow a customer to replace a returned item with another size instead of taking a refund. Potential value is reduced purchase friction; no retention or revenue improvement is measured.

## Impact assessment

| Area | Impact | Existing artifacts affected |
| --- | --- | --- |
| Scope/process | New exchange branch, stock reservation, acceptance and failed-exchange recovery | UC-01; to-be-returns.bpmn; scope exclusions |
| Rules | Price difference, discount transfer, stock shortages, exchange eligibility and mixed return/exchange cases | BR-002/003/004/007/012 |
| Requirements/UI | Exchange selection, replacement availability and price confirmation | FR-002/003/005/006/011; SCR-01/02/03 |
| Data/API | Exchange instruction, replacement order lines, additional inventory contracts | order_units; return_units; OpenAPI request/response schemas |
| Validation | Same-price, higher/lower-price, out-of-stock, concurrent stock and rollback scenarios | New tests beyond UAT-01–37; update RTM |
| Operations | Warehouse/store responsibilities and settlement of differences | Role matrix and finance reconciliation |

## Options and recommendation

A: Add exchanges now; expands scope and needs new inventory and settlement decisions. B: Keep refund-only v1.0 and analyze exchanges as a separate increment. Select B for this case study to protect the complete, verifiable return/refund slice. This is a portfolio scope decision, not stakeholder approval.

## Before accepting a future increment

Define price/discount/tax treatment, reserve replacement stock atomically, clarify partial failure recovery and ownership, update requirements/contract/models, and add acceptance tests. Estimate only after these questions are resolved; no invented cost or delivery commitment is supplied.
