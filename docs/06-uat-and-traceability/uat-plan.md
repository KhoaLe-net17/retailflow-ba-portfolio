# Acceptance validation plan

## Purpose and evidence boundary

Validate the selected case-study rules against a deterministic reference implementation. The scenarios are UAT-style business acceptance specifications; executing them as automated checks is not business-user UAT or sponsor sign-off.

**Environment:** Node >=22; PGlite (actual embedded PostgreSQL/WASM); fixed clock 2026-11-23T09:00:00Z; fresh synthetic schema per case. HTTP cases use an ephemeral loopback port. No retailer, bank, customer, or payment network is contacted.

## Entry criteria

- Policy 0.1 and stable requirement/scenario IDs exist.
- Schema, seed and contract are available in Git.
- Fixture amounts, dates, actors and expected outcomes are known.
- Dependencies install from the checked-in lockfile.

## Execution

Run `pnpm test`. The runner executes each scenario with assertions and writes `evidence/validation-results.json`, including actual timestamp, environment, duration and failures. `evidence/sql-results.json` captures query outputs. Run contract validation separately with `python tools/validate_contract.py`. Check the prototype in a browser against the demo script.

## Exit criteria

- Every defined automated scenario passes; failed assertions remain visible until fixed.
- Every functional requirement has at least one scenario in the traceability matrix.
- The six SQL analyses produce expected fixture values and no invariant violations.
- OpenAPI validation passes; BPMN parses without import warnings; all internal documentation links resolve.
- Browser observations and known limitations are documented, without claiming stakeholder acceptance.

## Severity and defect handling

Critical: duplicate/excess payout or unauthorized financial mutation. High: invalid reservation or state transition. Medium: inconsistent status/validation presentation. Low: non-blocking presentation issue. Record reproducible steps, expected/actual behavior, affected requirement, correction and retest evidence. Do not invent defects or interviews to fill a template.

## Business acceptance pending

An actual retailer must still review policies, operational handoffs, availability of integration fields, permissions, provider failure semantics and measurement targets. No acceptance signature is provided.
