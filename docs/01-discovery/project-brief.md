# RetailFlow Project Brief

| Document control | Value |
| --- | --- |
| Document ID | RF-DISC-001 |
| Version | 0.1 |
| Status | Draft |
| Context | Fictional business analysis case study |
| Portfolio owner | [Anh Kho](https://github.com/KhoaLe-net17) |
| Date | 2026-11-23 |
| Evidence status | Scenario assumptions; stakeholder validation pending |

> Historical discovery draft. The later [case-study policy](../03-requirements/business-rules.md) selects assumptions for synthetic validation; the [evidence log](evidence-and-assumptions.md) records their status. This initial brief preserves the starting questions, rather than the current implementation inventory.

## 1. Context

RetailFlow explores returns and refunds for a fictional retailer operating one online sales channel and three physical stores in one market, using VND. The primary scenario is a customer returning an online purchase at a physical store. Customer service, store staff, inventory staff, store managers, and finance need consistent information as the request moves between teams.

This brief defines the initial analysis boundary. It is based on the [repository project scenario](../../README.md), not on interviews, operational records, or an engagement with an actual retailer. A working application is a possible later extension; this case study initially focuses on business analysis artifacts.

## 2. Assumed business problem

Return information is assumed to be distributed across email and spreadsheets. Customer service may need to contact store staff or finance to determine progress. Separate records may lead to unclear ownership, repeated checks, inconsistent eligibility decisions, and difficulty explaining an expected refund to a customer.

Partial returns, discounts, and uncertain payment outcomes introduce further risks: staff could request a quantity already returned, calculate an excessive refund, or submit another payout while the first payment outcome is unknown. These are risks to investigate, not observed incidents. No frequency, processing baseline, financial loss, or improvement has been measured.

## 3. Proposed objectives and measurement

The following three objectives connect the assumed problems to observable outcomes. Measures and evaluation methods are proposals; definitions, baselines, and numeric targets remain open.

| ID | Problem addressed | Proposed outcome | Candidate measure | Data needed and evaluation approach |
| --- | --- | --- | --- | --- |
| OBJ-01 | Teams cannot reliably explain request progress or ownership. | Make the latest business status, responsible role, and next action visible across relevant teams. | Elapsed time from submission to final resolution, with unresolved cases reported separately. | Request IDs, timestamped state changes, responsible roles, and agreed terminal states. Calculate elapsed time for resolved synthetic cases and age for open cases; define a baseline and reporting period before any real-world comparison. |
| OBJ-02 | Separate checks may produce inconsistent eligibility or approval decisions. | Apply an explicitly documented return policy and approval path consistently. | Number of evaluated cases whose decision and reason match the agreed policy, divided by all evaluated cases. | Versioned policy, decision inputs, expected outcomes, recorded decisions, reasons, and approval actors. Compare eligible, ineligible, boundary, and exception scenarios after the policy is defined. |
| OBJ-03 | Partial returns and uncertain payments create risks of excessive or duplicate refunds. | Keep refund decisions traceable and within the permitted balance while resolving uncertain outcomes. | Excess-refund cases, duplicate successful payouts for one logical refund, and age of unresolved payment outcomes, reported separately. | Original paid amounts, discount allocations, returned quantities, refund instruction IDs, payment attempts, provider references, outcomes, and timestamps. Reconcile synthetic cases, including repeated submissions and unknown outcomes, against the agreed rules. |

**Current measurement status:** no baseline, numeric target, executed validation, or business benefit is claimed. Synthetic demonstrations can test the analysis logic but cannot establish production impact.

## 4. Initial scope

### In scope

- Look up an online order, its lines, previous returns, and refundable balances.
- Submit selected items, quantities, return reasons, and the receiving store.
- Assess eligibility against a proposed policy and remaining returnable quantities.
- Specify approval responsibilities, exception handling, and recorded reasons.
- Record receipt, goods inspection, and the proposed inventory disposition.
- Define refund calculation from original payments and discount allocations.
- Model refund submission, confirmed success, confirmed failure, and unknown or pending outcomes using a mock payment service.
- Specify permissions, audit events, and operational views for unresolved cases and reconciliation.

### Boundaries

- One online channel, three stores, one market, and VND only.
- Synthetic customer, order, product, user, and payment data only.
- Order, inventory, and payment integrations are proposed contracts or mocks.
- Return handling and refund payment have separate state models. Receiving goods or approving a return does not establish that a payment succeeded.
- The initial deliverables are analysis documents, models, specifications, and planned validation scenarios. They are not evidence of an implemented service.

### Out of scope

- Product exchanges, warranties, repairs, and a complete e-commerce storefront.
- Cross-border returns, multiple currencies, and tax-engine integration.
- Live payment processing, production ERP integration, and real customer data.
- Automated fraud scoring and production deployment or operational support.

## 5. Stakeholder roles and input needed

These are fictional roles to guide future elicitation; no interview or approval is recorded.

| Role | Input or decision to clarify |
| --- | --- |
| Customer | Eligibility expectations, refund explanation, and status needs. |
| Customer service | Intake information, common questions, and cross-team handoffs. |
| Store staff and inventory staff | Receipt evidence, inspection outcomes, and stock disposition. |
| Store manager | Approval authority, escalation, and exception reasons. |
| Finance | Refund calculation, uncertain outcomes, and reconciliation evidence. |
| Business sponsor or product owner | Objectives, scope priorities, policy decisions, and acceptance authority. |
| Developer and QA roles | Technical feasibility, integration constraints, and testability. |

## 6. Assumptions and evidence limits

| ID | Working assumption | Basis and validation status |
| --- | --- | --- |
| ASM-001 | The analysis uses one online channel, three stores, one market, and VND. | Defined by the repository scenario; a case-study boundary, not a retailer finding. |
| ASM-002 | Email and spreadsheets are the assumed current tracking mechanism. | Narrative assumption in the repository; not supported by observed operations. |
| ASM-003 | An online purchase may be presented for return at a store. | Primary scenario in the repository; detailed eligibility is still open. |
| ASM-004 | The original order and payment details can be represented for analysis. | Proposed integration assumption; available fields and contracts are not validated. |
| ASM-005 | Synthetic orders and mock payment responses will be sufficient for analysis demonstrations. | Portfolio constraint; actual executable artifacts and results must be documented separately when created. |

## 7. Open discovery questions

| ID | Question to resolve | Role to consult in a real project | Why it matters |
| --- | --- | --- | --- |
| OQ-001 | What is the return window, its starting event, timezone, and exact cutoff behavior? | Business sponsor; customer service | Determines eligibility and boundary scenarios. |
| OQ-002 | Which product categories, conditions, and purchase evidence are eligible or excluded? | Store operations; business sponsor | Determines decision inputs, inspection rules, and rejection reasons. |
| OQ-003 | Which cases require approval, who may approve, and may a requester approve their own exception? | Store manager; business sponsor | Determines authority and separation of duties. |
| OQ-004 | How are discounts, rounding, shipping fees, and any other charges handled for partial returns? | Finance; business sponsor | Determines the permitted refund and test examples. |
| OQ-005 | Do open return requests reserve quantities, and when are reservations released? | Store operations; inventory; technical roles | Determines concurrent-request handling and remaining quantities. |
| OQ-006 | What proves payment success, who reconciles unknown outcomes, and when is another submission allowed? | Finance; payment integration roles | Determines duplicate-payment controls and recovery paths. |
| OQ-007 | Who owns each request state, what starts and stops elapsed-time measurement, and which access and audit records are required? | Operations; finance; technical roles | Determines handoffs, reporting definitions, and traceability. |

No policy values or stakeholder answers have been invented to close these questions.

## 8. Next analysis activities

1. Turn the open questions into an elicitation guide and record the evidence status of any answers. Label role-play explicitly if used.
2. Model the assumed current process and the proposed future process, including ownership, exceptions, and separate return/payment states.
3. Specify business rules and requirements linked to OBJ-01 through OBJ-03, then derive acceptance scenarios and data/integration needs.

This document is a draft discovery artifact. It does not complete discovery, approve a policy, or demonstrate an implemented or validated solution.

## Source and related material

- [Repository overview and scenario](../../README.md) — source for this brief's business context, proposed boundaries, and unresolved analysis topics.
- [Return handling overview](../../diagrams/return-handling.svg) — existing proposed flow; not a validated BPMN model.
- [Refund processing overview](../../diagrams/refund-processing.svg) — existing proposed flow; not an executed payment integration.
