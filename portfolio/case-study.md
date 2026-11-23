# RetailFlow · A verifiable returns and refunds case study

**Author:** Anh Kho · **Role:** IT Business Analyst · **Context:** independent fictional case study. One online channel, three stores, one market, VND; synthetic data only.

## Problem and analysis approach

The assumed retailer tracks returns across separate records, making progress and refund decisions hard to explain. I framed three objectives: shared operational visibility, consistent policy decisions and traceable payment controls. I separated observed evidence from assumptions and chose explicit case-study rules to make the analysis executable.

## Key decisions

- Model return acceptance separately from refund success: inspecting goods does not prove payment.
- Allocate original paid value to units with deterministic integer remainders: partial returns conserve paid totals.
- Reserve units atomically: concurrent submissions cannot claim the same unit.
- Reconcile UNKNOWN on its existing attempt: timeouts do not justify a new payout.

## What is delivered

Discovery and stakeholder/elicitation analysis; current/future BPMN; 12 business rules; 14 functional requirements; 12 stories and acceptance criteria; use cases; five-screen interaction prototype; role/state specifications; PostgreSQL schema, seed and six analyses; OpenAPI contract and Postman collection; 37 executable acceptance scenarios; traceability; a simulated exchange change assessment; evaluation and demo material.

## Evidence and interpretation

Read the [actual validation report](../docs/06-uat-and-traceability/validation-report.md) and [machine results](../evidence/validation-results.json). The reference server, HTTP calls and SQL are exercised locally. This demonstrates internal consistency for selected scenarios; it does not establish real-user acceptance or financial/operational impact.

## Suggested review path

1. [Rules](../docs/03-requirements/business-rules.md) and [requirements](../docs/03-requirements/requirements-catalog.md).
2. [Process analysis](../docs/02-process-analysis/process-analysis.md) and [state model](../docs/04-solution-design/state-models.md).
3. [Demo walkthrough](demo-script.md), then [traceability](../docs/06-uat-and-traceability/traceability-matrix.csv).

## Limits

No client engagement, stakeholder interview, live payment, production deployment or measured business improvement is claimed. The reference slice uses fixture roles, a fixed clock and disposable storage. Real policy validation, durable integration, identity, dispute resolution and operational acceptance remain future work.
