# Stakeholder demonstration and review pack

**Revision:** 1.1 · **Prepared by:** Anh Kho · **Status:** prepared for review; no external session has been conducted or approved.

## Purpose and participants

Review whether the selected returns/refunds flow explains policy decisions, role handoffs, data invariants and unresolved payments. Proposed participants are a policy owner, customer-service representative, store representative, finance representative and technical reviewer. These are fictional role personas, not people interviewed or organizations engaged. Invite real reviewers only when a session is actually arranged; record permission before collecting personal data or recordings.

## Setup and review route

Use a fresh local server (`pnpm start`) with synthetic seed and fixed business clock. Open the [demo script](demo-script.md), [SRS](../docs/03-requirements/software-requirements-specification.md), [Figma handoff](../docs/04-solution-design/figma-handoff.md), [UML](../docs/04-solution-design/uml-models.md) and [RTM](../docs/06-uat-and-traceability/traceability-matrix.csv). Reset between scenarios that consume the same units. Explain actor selection, in-memory storage and mock payments at the start. Use the HTML app to execute behavior; use Figma to discuss screen intent.

| Scenario | Proposed role / action | Expected observable behavior | Questions to resolve | Coverage |
| --- | --- | --- | --- | --- |
| DEMO-01 Standard partial return | AGENT previews O-100/L-01/1, S01, NOT_SUITABLE; STORE passes; FINANCE selects success | Preview 250000 VND with no reservation; create APPROVED; inspect ACCEPTED; payment SUCCEEDED / return COMPLETED; audit | Is the original discount allocation explainable? What confirmation would staff need? | FR-001/002/003/005/006/007/012 |
| DEMO-02 Independent exception | AGENT creates O-200/L-02/1 at 900000 VND; MANAGER decides with reason | AWAITING_APPROVAL; requester cannot self-decide; rejection releases or approval permits inspection | Is >500000 the right threshold? Who may delegate and who owns policy? | FR-004; BR-005; UAT-10–14 |
| DEMO-03 Uncertain payment | Prepare an ACCEPTED return; FINANCE chooses UNKNOWN; attempt-matched provider fixture reports SUCCEEDED | Retry blocked; same logical refund/attempt reconciled; duplicate event no regression | Who owns aged unresolved cases? What provider evidence proves definitive failure? | FR-007/008/009; UAT-20–29 |
| DEMO-04 Goods discrepancy | STORE fails inspection of an APPROVED request | DISPUTED/QUARANTINE; payment blocked; paid units stay held | What evidence resolves the dispute? Who controls physical stock/accounting? | FR-005; BR-007/012; UAT-16 |
| DEMO-05 Cancellation and invalid intake | Requester cancels before inspection; retry late/excluded/excess quantity inputs | Authorized cancellation releases; invalid intake changes nothing; post-inspection cancellation blocked | Are cancellation boundaries and messages operationally usable? | FR-002/003/010/013 |
| DEMO-06 Audit and reconciliation data | Inspect workbench/audit; run six SQL analyses and trace one FR to test | Actor/state/detail visible; conservation, duplicate-success and excess-refund checks observable | Which records must be retained, restricted or reconciled daily? | FR-011/012/014 |

DEMO-02 and DEMO-04 are separate scenarios; their screen handoffs do not grant MANAGER the STORE action. For exact click sequence, role changes, retry values and event IDs, follow the runnable demo script and current generated IDs rather than hardcoding stale IDs.

## Facilitation and feedback

State the business question before clicking. Ask the reviewer to predict a result, show the actual behavior, compare, and record the gap in their own words. Separate a usability observation, policy question, defect and new-scope request. Link each finding to FR/BR/screen/test and identify the decision owner. Do not silently change an agreed rule during a demonstration.

| Feedback ID | Session/date/reviewer role | Scenario + observed evidence | Finding / type | Linked requirement | Owner / decision | Retest / status |
| --- | --- | --- | --- | --- | --- | --- |
| Reserved for actual feedback | Not conducted | No external observation recorded | No findings asserted | To be recorded | Pending real owner | Not started |

## Acceptance record

| Review gate | Current evidence | Status |
| --- | --- | --- |
| Technical reference behavior | Automated SQL/HTTP/assertion evidence, browser observations | Executed within documented synthetic scope |
| Document/model consistency | Sources, exports and analysis checks | See actual analysis evidence |
| Stakeholder demonstration | This prepared script only | Not conducted |
| Business acceptance / policy sign-off | No authorized external decision | Pending |
| Production readiness | Mock identity/payment, disposable storage, documented gaps | Not assessed / outside this portfolio |

Only record acceptance after a real authorized reviewer states a decision and outstanding conditions are logged. A test pass, merged PR or attractive interface cannot substitute for that decision. Proposed changes use the [change assessment](../docs/07-change-and-evaluation/change-request.md) and [evaluation plan](../docs/07-change-and-evaluation/evaluation-plan.md).
