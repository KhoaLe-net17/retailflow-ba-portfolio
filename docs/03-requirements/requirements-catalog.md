# Requirements catalog

**Baseline:** case-study v1.0; policy 0.1. **Validation boundary:** automated reference-model checks and browser walkthrough; no business sign-off.

## Functional requirements

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

## Measurable quality requirements

| ID | Requirement and measure | Verification / current boundary |
| --- | --- | --- |
| NFR-01 | Every protected mutation rejects unsupported roles; zero unauthorized mutations in the defined test set. | Negative role tests. Demo actor header is a fixture, not authentication. |
| NFR-02 | All selected units and audit changes commit together or none do; zero partial writes in rollback/concurrency cases. | UAT-09, UAT-31, UAT-34 on embedded PostgreSQL. Not a multi-node load test. |
| NFR-03 | Allocated unit values sum exactly to original net paid for every fixture, using integer VND. | UAT-18, UAT-37; deterministic remainder distribution. |
| NFR-04 | Exact repeated payment commands and events create zero duplicate successful attempts in the test set. | UAT-21, UAT-25, UAT-26, UAT-37. Durable across commands within one demo session; resets on restart. |
| NFR-05 | Setup is reproducible with Node >=22, pnpm lockfile and documented commands; no paid service or live credential required. | Fresh in-memory database per test; CI installs from lockfile. |
| NFR-06 | UI labels and controls remain usable at 390px and desktop; inputs have labels, feedback is announced, keyboard focus is visible. | Browser walkthrough and manual accessibility checks; not a WCAG certification. |

**Proposed production performance target, not validated:** p95 order lookup and preview under 2 seconds at 20 concurrent staff with 100,000 order lines. A real deployment needs agreed infrastructure, representative data and a dedicated load test; the local demo does not substantiate this target.

## Prioritization

Must: FR-001 through FR-010, FR-012 and FR-013 (safe end-to-end handling). Should: FR-011 and FR-014 (operational support). Could: richer customer notifications and physical inventory integration. Will not in v1.0: exchanges, live payments, fraud scoring and production authentication.

See [stories and Given/When/Then criteria](user-stories.md) and [traceability](../06-uat-and-traceability/traceability-matrix.csv).
