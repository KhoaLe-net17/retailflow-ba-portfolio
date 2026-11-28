# RetailFlow

### Omnichannel Returns & Refunds · IT Business Analyst Portfolio

[![Validate portfolio](https://github.com/KhoaLe-net17/retailflow-ba-portfolio/actions/workflows/validate.yml/badge.svg)](https://github.com/KhoaLe-net17/retailflow-ba-portfolio/actions/workflows/validate.yml)

An independent business analysis case study connecting objectives to process models, requirements, interface behavior, data, API contracts and executable acceptance evidence.

**Owner:** [Anh Kho](https://github.com/KhoaLe-net17) · Third-year IT student at UEH
**Scope:** one online channel · three stores · one market · VND · synthetic data
**Baseline:** portfolio v1.1 / case-study policy 0.1

[Case study](portfolio/case-study.md) · [SRS](docs/03-requirements/software-requirements-specification.md) · [UML](docs/04-solution-design/uml-models.md) · [Figma](docs/04-solution-design/figma-handoff.md) · [Artifact index](docs/README.md) · [Validation](docs/06-uat-and-traceability/validation-report.md) · [Demo script](portfolio/demo-script.md) · [Releases](https://github.com/KhoaLe-net17/retailflow-ba-portfolio/releases)

> **Evidence boundary:** fictional case study with a runnable local reference model. No client engagement, stakeholder interviews, business sign-off, live payments, production deployment or measured business improvement is claimed. Automated acceptance checks are not business-user UAT.

## Business case

The assumed retailer tracks returns in separate email and spreadsheet records. Teams may struggle to explain progress, apply eligibility consistently, and reconcile partial or uncertain refunds. These are scenario assumptions, not findings from an actual retailer.

| Objective | Analysis response | Evidence path |
| --- | --- | --- |
| OBJ-01 · Shared operational visibility | Separate return/payment states, queue and audit history | FR-011/012; UAT-33/34 |
| OBJ-02 · Consistent policy decisions | Eligibility, independent approvals, inspection, atomic reservations | FR-002–005/010/013; boundary/negative cases |
| OBJ-03 · Traceable payment control | Original paid-unit allocations, idempotency, uncertain-outcome reconciliation | FR-006–009/014; UAT-18–29/37 |

Business baselines and improvement targets are not measured here. The [evaluation plan](docs/07-change-and-evaluation/evaluation-plan.md) defines what a real pilot would need.

## Review in five minutes

1. Read the [case study](portfolio/case-study.md) and [business rules](docs/03-requirements/business-rules.md).
2. Inspect the [current/future processes](docs/02-process-analysis/process-analysis.md) and [separate state models](docs/04-solution-design/state-models.md).
3. Follow a requirement through the [traceability matrix](docs/06-uat-and-traceability/traceability-matrix.csv) to its acceptance case and actual result.
4. Run the demo or inspect the [OpenAPI contract](api/openapi.yaml), [SQL](sql/02-analysis.sql) and [machine evidence](evidence/validation-results.json).

## Delivered artifacts

| Area | Deliverables |
| --- | --- |
| Discovery | [Initial brief](docs/01-discovery/project-brief.md), [stakeholder/RACI and elicitation guide](docs/01-discovery/stakeholders-and-elicitation.md), [evidence/assumptions](docs/01-discovery/evidence-and-assumptions.md) |
| Process | Three editable BPMN 2.0 models and SVG exports; context diagram, gap analysis and glossary |
| Requirements | [14 functional requirements and measurable quality requirements](docs/03-requirements/requirements-catalog.md), [12 rules](docs/03-requirements/business-rules.md), [12 stories with acceptance criteria](docs/03-requirements/user-stories.md), [two use cases](docs/03-requirements/use-cases.md), [consolidated SRS](docs/03-requirements/software-requirements-specification.md) |
| Solution | Five-screen HTML prototype, [screen/role specification](docs/04-solution-design/screen-specification.md), return/refund states, [five editable PlantUML models](docs/04-solution-design/uml-models.md), [native Figma handoff](docs/04-solution-design/figma-handoff.md) |
| Data/integration | [ERD/dictionary](docs/05-data-and-integration/data-dictionary.md), 11 PostgreSQL tables, synthetic seed, six analyses, OpenAPI 3.1.1 and seven-step Postman collection |
| Validation | [37 acceptance scenarios](docs/06-uat-and-traceability/uat-scenarios.md), assertions, RTM, actual SQL/HTTP/schema evidence, defect/retest records and CI |
| Change/evaluation | [Decisions](docs/07-change-and-evaluation/decision-log.md), [simulated exchange change request](docs/07-change-and-evaluation/change-request.md), evaluation and limitations |
| Portfolio | Case study, demo script, [CV project entry](portfolio/cv-summary.md), [role-based stakeholder review pack](portfolio/stakeholder-demo.md), [capability coverage](portfolio/artifact-coverage.md), changelog and contribution templates |

## Key workflow

![Proposed return handling rendered from BPMN with bpmn-js](diagrams/to-be-returns.svg)

[Full-size model](diagrams/to-be-returns.svg) · [BPMN source](diagrams/to-be-returns.bpmn) · [Payment model](diagrams/to-be-payments.svg) · [ERD](diagrams/erd.svg)

Look up the paid order and preview selected units; recheck and reserve atomically; obtain independent approval where required; inspect goods; finance creates an idempotent logical refund. Confirmed payment success completes the return. Unknown/pending outcomes require reconciliation on the existing attempt. Discrepancies hold the return and block payment.

The primary example is two items at 300000 VND each with a 100000 VND original discount: one eligible unit refunds **250000 VND**. Immutable integer allocations also conserve non-divisible totals across partial returns.

## Run the local demo

Prerequisites: **Node.js 22+** and **pnpm 11.25.0**. Local validation and CI use Node 24. Install pnpm if needed: `npm install --global pnpm@11.25.0`.

```bash
git clone https://github.com/KhoaLe-net17/retailflow-ba-portfolio.git
cd retailflow-ba-portfolio
pnpm install --frozen-lockfile
pnpm start
```

Open **http://127.0.0.1:4173**. As `agent-1`, find `O-100`, preview one `L-01` and create the return. Switch to `store-1` for inspection and `finance-1` for a mock refund. Use UNKNOWN to inspect reconciliation. Follow the [demo script](portfolio/demo-script.md).

The server binds to loopback. Actor selection is a role-test fixture, **not authentication**. Payments are simulated. Embedded PostgreSQL data is in memory and resets on restart. Business clock: **2026-11-23 16:00 UTC+7**, fixed for reproducible date boundaries.

The UI selects one line per request; API supports up to 20 distinct lines atomically. Import the [Postman collection](api/retailflow.postman_collection.json) for its seven-step walkthrough on a fresh server. Execution in Postman is not claimed by the HTTP evidence.

## Reproduce validation

```bash
pnpm test
python -m venv .venv
```

Activate the environment: Windows PowerShell `.\.venv\Scripts\Activate.ps1`; macOS/Linux `source .venv/bin/activate`. Then:

```bash
python -m pip install -r requirements-validation.txt
python tools/validate_contract.py
pnpm diagrams
python tools/check-analysis.py
```

The test runner executes business assertions, actual HTTP requests, PostgreSQL queries, BPMN import and local documentation-link checks, writing timestamped evidence. Python validates OpenAPI and actual captured response schemas. CI repeats checks and uploads results without committing generated files.

View BPMN at **http://127.0.0.1:4173/prototype/process.html** or import the sources into a compatible modeler. Download SVG uses bpmn-js. `node tools/build-bpmn.mjs` regenerates the supplied source layout; `pnpm diagrams` renders DOT through Graphviz/WASM. These are tool-rendered vector diagrams, not generated artwork.

## Repository map

```text
docs/        Discovery, process, requirements, design, data, validation, change
analysis/    Machine-readable rule, requirement and acceptance catalog
diagrams/    BPMN, DOT, PlantUML and tool-rendered SVG
design/      Native Figma frame IDs, structure evidence and authoring recipe
prototype/   HTML/CSS/JavaScript prototype and process viewer
demo/        Local Node HTTP and PostgreSQL reference model
sql/         Schema, synthetic seed and six analyses
api/         OpenAPI and Postman collection
evidence/    Actual validation outputs and browser observations
portfolio/   Case study, demo script and CV entry
tools/       Validation and diagram tooling
.github/     Issue/PR templates and validation workflow
```

## Scope and limits

The selected case-study slice is specified and implemented. Exchanges, warranties, cross-border/multi-currency returns, real customer data, physical inventory posting, dispute resolution, durable operations, production identity and live payments are outside it. Production load/security tests and stakeholder validation have not been performed. See [evaluation](docs/07-change-and-evaluation/evaluation-plan.md) and [integration gaps](docs/05-data-and-integration/integration-design.md).

## Standards and tools

- [OMG BPMN 2.0.2](https://www.omg.org/spec/BPMN/2.0.2/) and [bpmn-js](https://bpmn.io/toolkit/bpmn-js/) for process modeling/rendering.
- [Graphviz](https://graphviz.org/) via Viz.js for context and ERD exports.
- [PlantUML](https://plantuml.com/) with local Java for editable UML/vector exports; [Figma](https://www.figma.com/design/7l9l0eDyTbYw2Y6kRguuIp) for native editable desktop handoff frames.
- [PostgreSQL via PGlite](https://pglite.dev/docs/) for embedded SQL execution.
- [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) for the HTTP contract.
- Markdown/Git/GitHub, HTML/CSS/JavaScript and Node.js for inspectable documents, interactions, review and checks.

Figma designs are native editable frames with static navigation; final all-frame visual review/export retrieval is pending the connected tool limit. No Jira deployment, production database, bank integration or real-user UAT is implied. Original content currently has no granted license; dependencies retain their own licenses. See [contribution guidance](CONTRIBUTING.md) and [changelog](CHANGELOG.md).
