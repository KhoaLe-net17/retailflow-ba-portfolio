# Software Requirements Specification · RetailFlow

**Document:** SRS-01 · **Revision:** 1.1 · **Owner:** Anh Kho · **Date:** 2026-11-28
**Business policy:** 0.1 · **Status:** implemented reference slice; business acceptance pending.

## 1. Purpose and document control

Specify the externally observable behavior of a returns/refunds reference system and connect it to rules, interfaces and verification. This consolidated view reuses existing requirement IDs; it does not introduce a competing policy baseline. The [machine catalog](../../analysis/catalog.json) holds functional/rule/test relationships; the [requirements catalog](requirements-catalog.md) and linked domain artifacts carry detailed analysis. A change must update these views together through a reviewed commit.

This is an independently authored fictional case study, not an IEEE/ISO compliance certification or an approved client specification. Document approval and actual business-user UAT have not taken place. Portfolio revision 1.1 adds analysis/design coverage without changing the executable policy.

## 2. Business context and scope

Assumed problem: disconnected records make eligibility, handoffs and uncertain payments difficult to explain. OBJ-01 is shared operational visibility; OBJ-02 is consistent policy decisions; OBJ-03 is traceable payment control. No real retailer baseline or improvement percentage is asserted.

In scope: one online channel, three receiving stores (S01–S03), one market, integer VND, original paid orders, partial returns, exception approval, inspection, one logical refund per return, guarded retries, payment-event reconciliation and audit. All data is synthetic.

Out of scope: exchanges, warranty, fraud scoring, customer self-service, multiple currencies, shipping refunds, new tax calculation, physical inventory posting, dispute resolution, production identity, durable operations and live payments. [Context and process](../02-process-analysis/process-analysis.md) define the system boundary.

## 3. Users, constraints and dependencies

| Role | Responsibility | Constraint |
| --- | --- | --- |
| AGENT | Find paid order; preview/create request; cancel own pre-inspection request | Cannot inspect or issue payment |
| MANAGER | Intake; independent exception decision; pre-inspection cancellation | Cannot decide a request they created |
| STORE | Inspect approved goods; record pass/discrepancy | Cannot pay or resolve disputed goods |
| FINANCE | Initiate refund; reconcile; retry definitive failure | UNKNOWN/PENDING prohibit a new attempt |
| PROVIDER fixture | Submit matched outcome event | Test actor, no actual external provider |

The actor selector/header is a role-testing fixture, not authentication. Read/mutation permissions are defined in the [screen specification](../04-solution-design/screen-specification.md). The server rechecks permissions and policy independently of UI visibility.

Reference runtime: Node >=22 (verified on Node 24), pinned pnpm 11.25.0, embedded PostgreSQL via PGlite, loopback HTTP, disposable in-memory storage. Fixed business clock: `2026-11-23T09:00:00Z`; display UTC+7. A real provider must define definitive failure, delivery guarantees and signed events before integration design can be accepted.

## 4. External interfaces

| Interface | Input / output / behavior | Contract |
| --- | --- | --- |
| Staff UI | SCR-01 intake, SCR-02 preview, SCR-03 approval/inspection, SCR-04 reconciliation, SCR-05 audit | [Fields, states and role actions](../04-solution-design/screen-specification.md); [Figma handoff](../04-solution-design/figma-handoff.md) |
| Read API | GET `/orders`, `/orders/{id}`, `/workbench`; health is separately exposed | [OpenAPI 3.1.1](../../api/openapi.yaml) |
| Return commands | POST `/return-previews`, `/return-requests`, and request-specific approval/inspection/cancellation | Server-calculated values; atomic create and mutations |
| Payment commands | POST `/refunds`, `/refunds/{id}/retry`, `/payment-events` | `Idempotency-Key` on payment commands; attempt/reference/event matching |
| Data | 11 PostgreSQL tables, constraints and integer paid-unit allocations | [Dictionary/ERD](../05-data-and-integration/data-dictionary.md); [schema](../../sql/00-schema.sql) |

JSON requests require the documented content type and demo actor. Unknown fields and malformed payloads are rejected. The contract distinguishes 400 malformed input, 401 missing/unknown actor, 403 role denial, 404 missing entity, 409 conflicting state/key and 422 policy/input validation. Consult the contract for endpoint-specific statuses and exact schemas. The supplied [Postman collection](../../api/retailflow.postman_collection.json) is a reproducible client walkthrough; execution inside Postman is not claimed.

## 5. Functional requirements

| ID | Capability | Acceptance / observable behavior | Rules | Objective |
| --- | --- | --- | --- | --- |
| FR-001 | Find original order and remaining units | Read order O-100; show L-01 with paid total 500000 VND and initially 2 available units. | BR-002 | OBJ-01 |
| FR-002 | Preview eligibility without mutation | Preview one unit of L-01 at 250000 VND; no return, reservation, refund or audit mutation occurs. | BR-001, BR-003, BR-011 | OBJ-02 |
| FR-003 | Create and reserve a return atomically | Create selected units once, revalidate availability, and reject an over-reservation with no partial write. | BR-002, BR-011 | OBJ-02 |
| FR-004 | Control manager decisions | Route high-value or damaged returns for manager review; reject unauthorized or self decisions and require a reason. | BR-005, BR-008 | OBJ-02 |
| FR-005 | Record inspection and discrepancy | Only approved returns can be inspected by STORE; failure blocks refund while preserving reservation. | BR-007, BR-008 | OBJ-02 |
| FR-006 | Calculate conserved refunds | Original unit allocations sum to original net paid including remainders; preview never accepts a client amount. | BR-003, BR-004 | OBJ-03 |
| FR-007 | Initiate an idempotent mock payment | FINANCE can pay an ACCEPTED return; exact replay creates no second instruction or attempt; conflicting key is rejected. | BR-004, BR-006, BR-009 | OBJ-03 |
| FR-008 | Reconcile uncertain payment outcomes | Unknown remains open; an attempt-matched provider success completes the return; repeated or stale events do not regress state. | BR-009, BR-010 | OBJ-03 |
| FR-009 | Retry only confirmed failures | Retry FAILED as attempt 2 with the same logical refund and amount; block UNKNOWN and PENDING retries. | BR-009 | OBJ-03 |
| FR-010 | Cancel and release before inspection | Requester or manager can cancel eligible pre-inspection requests and release their units; reject unrelated agents and post-inspection cancellation. | BR-012 | OBJ-02 |
| FR-011 | Display cross-team operational status | Workbench shows return/payment states, latest attempt and unresolved queue; role-specific actions are also checked by the server. | BR-007, BR-009 | OBJ-01 |
| FR-012 | Provide atomic audit history | Successful creation, approval, inspection, payout and reconciliation record the responsible actor, time and transition. | BR-008 | OBJ-01 |
| FR-013 | Validate HTTP input and demo actor | Reject missing/unknown demo actor, malformed JSON, unsupported content type and unknown fields with documented errors. | BR-011 | OBJ-02 |
| FR-014 | Expose reproducible reconciliation analyses | SQL reports remaining units, pending/unknown age, duplicate success, excess refund and allocation conservation with documented expected results. | BR-002, BR-004, BR-010 | OBJ-03 |

The UI captures one line per request; the API accepts at most 20 distinct lines from the same paid order. Creation revalidates eligibility and availability regardless of a previous preview. A preview is not a reservation or approval record.

## 6. Quality requirements

| ID | Requirement and measure | Verification / current boundary |
| --- | --- | --- |
| NFR-01 | Every protected mutation rejects unsupported roles; zero unauthorized mutations in the defined test set. | Negative role tests. Demo actor header is a fixture, not authentication. |
| NFR-02 | All selected units and audit changes commit together or none do; zero partial writes in rollback/concurrency cases. | UAT-09, UAT-31, UAT-34 on embedded PostgreSQL. Not a multi-node load test. |
| NFR-03 | Allocated unit values sum exactly to original net paid for every fixture, using integer VND. | UAT-18, UAT-37; deterministic remainder distribution. |
| NFR-04 | Exact repeated payment commands and events create zero duplicate successful attempts in the test set. | UAT-21, UAT-25, UAT-26, UAT-37. Durable across commands within one demo session; resets on restart. |
| NFR-05 | Setup is reproducible with Node >=22, pnpm lockfile and documented commands; no paid service or live credential required. | Fresh in-memory database per test; CI installs from lockfile. |
| NFR-06 | UI labels and controls remain usable at 390px and desktop; inputs have labels, feedback is announced, keyboard focus is visible. | Browser walkthrough and manual accessibility checks; not a WCAG certification. |

**Proposed production performance target, not validated:** p95 order lookup and preview under 2 seconds at 20 concurrent staff with 100,000 order lines. A real deployment needs agreed infrastructure, representative data and a dedicated load test; the local demo does not substantiate this target.

The 390px/keyboard observations concern the HTML reference UI. The new Figma frames are desktop handoff designs, not evidence of mobile accessibility or production usability.

## 7. Business rules and state/data invariants

| Rule | Required policy |
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

Return and payment state machines are separate: APPROVED is not ACCEPTED, and ACCEPTED is not COMPLETED. Only confirmed SUCCEEDED completes a return. A failed attempt stays terminal even when the logical refund creates a later attempt. [State semantics](../04-solution-design/state-models.md) and [UML models](../04-solution-design/uml-models.md) describe guards and transitions.

Paid allocations are immutable integer VND; original line paid total must equal the sum of its units. A unit has at most one active return allocation. Rejection/pre-inspection cancellation release units; completed, disputed and payment-uncertain returns do not. One logical refund belongs to one return. Command idempotency and event deduplication solve different replay problems. Rejected commands leave business records unchanged.

## 8. Acceptance and traceability

UC-01 covers intake through completion; UC-02 covers uncertain-payment reconciliation. Read [full use cases](use-cases.md) for preconditions, main flow and alternate flows. Every functional requirement maps to a story and executable scenario:

| Requirement | Story | Acceptance scenarios |
| --- | --- | --- |
| FR-001 | US-01 | UAT-01 |
| FR-002 | US-02 | UAT-02, UAT-03, UAT-04, UAT-05, UAT-06 |
| FR-003 | US-03 | UAT-07, UAT-08, UAT-09, UAT-31 |
| FR-004 | US-04 | UAT-10, UAT-11, UAT-12, UAT-13, UAT-14 |
| FR-005 | US-05 | UAT-15, UAT-16, UAT-17 |
| FR-006 | US-02 | UAT-18, UAT-19 |
| FR-007 | US-06 | UAT-20, UAT-21, UAT-22, UAT-23 |
| FR-008 | US-07 | UAT-24, UAT-25, UAT-26, UAT-27 |
| FR-009 | US-08 | UAT-28, UAT-29 |
| FR-010 | US-09 | UAT-30, UAT-32 |
| FR-011 | US-10 | UAT-33 |
| FR-012 | US-11 | UAT-34 |
| FR-013 | US-12 | UAT-35, UAT-36 |
| FR-014 | US-10 | UAT-37 |

The [RTM](../06-uat-and-traceability/traceability-matrix.csv) adds objectives, rules, implementation and evidence. [Validation report](../06-uat-and-traceability/validation-report.md) reports actual local outcomes. Automated reference checks and response-schema validation demonstrate selected consistency, not external stakeholder acceptance. [Stakeholder review pack](../../portfolio/stakeholder-demo.md) defines a proposed review and records no invented participation.

## 9. Open decisions and acceptance gates

| Item | Current treatment | Evidence needed before a real deployment |
| --- | --- | --- |
| Eligibility/approval thresholds | Fictional policy 0.1 | Policy-owner review and decision record |
| Real payment provider | Same-process mock outcomes/events | Provider failure semantics, authentication, callback signatures, durable outbox/recovery tests |
| Operations | In-memory reference process | Persistence, backup/restore, monitoring and reconciliation ownership |
| Store identity/scope | Named synthetic actors | Verified identity and row/store authorization |
| Disputed goods | Hold; block payment | Agreed resolution, inventory and accounting procedure |
| Performance/accessibility | Stated scope and proposed target | Representative load test and user/accessibility review |
| Business acceptance | Not performed | Observed sessions, linked findings, retests and explicit authorized decision |

Changes follow the [decision log](../07-change-and-evaluation/decision-log.md), [change assessment](../07-change-and-evaluation/change-request.md) and [evaluation plan](../07-change-and-evaluation/evaluation-plan.md). Do not treat a merged PR, green CI or a Figma screen as business sign-off.
