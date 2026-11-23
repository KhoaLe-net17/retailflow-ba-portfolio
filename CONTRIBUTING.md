# Contributing and review

Use an analysis-question or defect issue for a concrete ambiguity or reproducible discrepancy. Reference stable FR/BR/UAT IDs and use synthetic inputs only. Do not report a simulated interview as stakeholder evidence.

For a change, update the relevant rule, requirement, design, contract and acceptance cases together; record rationale and out-of-scope consequences. Work on a branch, review the diff and submit a pull request with actual validation results. Solo self-review is not independent stakeholder approval.

Run `pnpm test`, contract validation after Python setup, and relevant browser checks. `pnpm diagrams` reproduces DOT exports; the process viewer exports BPMN SVG. Keep source files with diagram exports. See the README for setup and the validation plan for evidence limits.

This repository currently grants no project-content license. Third-party packages retain their own licenses; their installation does not grant a license to the portfolio's original content.
