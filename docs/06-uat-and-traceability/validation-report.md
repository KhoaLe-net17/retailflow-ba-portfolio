# Validation report · v1.1

**Execution started:** 2026-11-28T09:14:29.654Z

**Environment:** v24.22.3 / win32 / x64; PGlite (actual embedded PostgreSQL).

**Business clock:** 2026-11-23T09:00:00Z (fixed fixture).

## Actual results

| Check | Result | Evidence |
| --- | --- | --- |
| Business acceptance assertions | 37 passed / 0 failed | [Per-case actual results](../../evidence/validation-results.json) |
| Functional traceability | 14/14 functional requirements linked to defined scenarios | [RTM](traceability-matrix.csv) and machine catalog validation |
| BPMN source import | 3 models; zero import warnings | Machine structural checks and browser bpmn-js import/export |
| SQL | All six analyses ran on clean seed and successful partial-return fixture | [Actual outputs](../../evidence/sql-results.json) |
| OpenAPI description | 3.1.1 description validated | [Contract evidence](../../evidence/contract-validation.json) |
| HTTP response schemas | 17 actual responses matched specified schemas | [Captured samples](../../evidence/http-samples.json) |
| Local documentation links | All checked links resolve | Machine structural checks |
| Browser | Preview, handoffs, UNKNOWN reconciliation, high-value approval, audit, 390px viewport and BPMN exports checked | [Observed results and captures](../../evidence/browser-validation.md) |

## What these results establish

The selected policy, reference implementation, contract and assertions agree on the defined synthetic scenarios. PostgreSQL executes the actual checked-in SQL, not a SQLite translation. HTTP samples are collected from a live loopback server during execution. Individual assertions fail the command rather than merely printing an expected result.

## What remains unvalidated

No external stakeholder UAT/sign-off, real provider request or signature verification, production authentication, durable deployment, physical inventory movement, dispute-resolution workflow, representative load/security test, or business-impact measurement. The supplied Postman collection has not been represented as an executed Postman run. CI results are separately visible on GitHub for their own commit/environment; checked-in files record this local run.

## Reproduction

Follow the root README: `pnpm test`, then `python tools/validate_contract.py` in the configured Python environment. Both commands replace their evidence files with fresh execution timestamps and actual outcomes. See [defect/retest record](defect-log.md) for issues observed and corrected during this build.

## Analysis/design extension verification · 2026-11-28

34/34 local artifact checks passed: SRS ID/trace coverage, source-to-SVG hashes, valid SVG XML, class boundaries, native Figma structure, navigation evidence, non-empty intake capture and prepared review coverage. See [machine results](../../evidence/analysis-design-validation.json). All five PlantUML SVGs were opened in the browser at full page size; the class model was corrected and re-inspected. Captures are under evidence/design/. Figma has five created editable frames and 24 native navigation reactions; final all-frame visual review and usable SVG retrieval remain pending the Starter tool limit. The intake PNG predates compact-height refinements. No additional stakeholder acceptance is claimed.
