# Stakeholder analysis and elicitation guide

**Status:** prepared analysis, fictional roles. No real interviews, workshops, meeting attendance or sign-offs are claimed.

## Stakeholder map

| Role | Interest / influence | Information needed | Engagement approach |
| --- | --- | --- | --- |
| Sponsor / product owner | High / high | Scope, success measures, priorities, policy acceptance | Decision workshop with options and unresolved assumptions |
| Finance | High / high | Net paid, rounding, unknown outcomes, reconciliation ownership | Walk through partial-refund and timeout examples |
| Store manager | High / high | Approval authority, exceptions, self-approval restrictions | Exception decision table review |
| Store and inventory staff | High / medium | Receiving evidence, discrepancy handling, stock disposition | Observe an actual return and validate handoffs in a real project |
| Customer service | High / medium | Lookup, intake, status visibility and customer explanation | Scenario interview and prototype walkthrough |
| Customer | High / low | Eligibility, amount and communication clarity | Usability feedback using representative tasks |
| Developer / QA | High / medium | Atomicity, API semantics, state transitions, negative cases | Contract review and acceptance-example review |

## Proposed responsibility matrix

R = performs work, A = accountable decision-maker, C = consulted, I = informed. This matrix is proposed, not evidence of assigned real staff.

| Activity | Sponsor | CS | Store | Manager | Finance | Dev / QA |
| --- | --- | --- | --- | --- | --- | --- |
| Baseline business policy | A | C | C | C | R | C |
| Capture return request | I | A/R | C | I | I | C |
| Approve exception | I | C | C | A/R | C | I |
| Inspect goods | I | I | A/R | C | I | I |
| Submit and reconcile refund | I | I | C | C | A/R | C |
| Specify acceptance examples | A | C | C | C | C | R |

## Interview questions and probes

1. CS: Walk through the last typical return. Where do you re-enter information? What proves the current status? Probe: an order partly returned previously.
2. Store: What confirms the product and quantity received? What happens when the received goods disagree with the request? Probe: quarantine versus sellable stock.
3. Manager: Which cases require independent approval? Can the requester be the approver? Probe: exactly at a monetary threshold.
4. Finance: Which paid components are refundable? How are discount remainder dong handled? Probe: two sequential partial returns and cancellation of a reservation.
5. Finance / technical roles: What is definitive payment failure? What happens after a timeout? Probe: duplicate or late callback and a provider reference mismatch.
6. Sponsor: Which outcome matters most, and what data establishes a baseline? Probe: unresolved cases excluded from completed-case averages.

## Proposed session and recording approach

Begin with the business outcome, request a concrete example, map the current steps, replay exceptions, and read back unresolved points. Record question ID, exact answer, evidence location, source role, date, confidence and follow-up owner. Do not treat a role-play answer as observed evidence. Obtain real participants' permission before recording any actual interview.

## Present evidence

The available inputs are the repository scenario and explicitly selected case-study policies. See [assumption and evidence log](evidence-and-assumptions.md). The guide is ready to use; it has not been represented as a completed interview.
