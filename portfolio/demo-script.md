# Reviewer demo · approximately 7 minutes

## Prepare

Run `pnpm install --frozen-lockfile`, then `pnpm start`; open http://127.0.0.1:4173. Restart resets fixture data. Explain this is an independent synthetic case study and that the role selector is a testing fixture.

## Walkthrough

1. **Business framing (45s):** show the three objectives, scope and assumption log. Distinguish selected policy from external evidence.
2. **Return preview (60s):** as agent-1, find O-100, select L-01 quantity 1 and preview 250000 VND. Explain original 600000 less 100000 discount, split across two units. No payout occurs on preview.
3. **Handoff (60s):** create the request; switch to store-1 in the operations queue and accept inspection with a reason. Explain APPROVED versus ACCEPTED versus COMPLETED.
4. **Uncertain payment (90s):** switch to finance-1, initiate mock refund with UNKNOWN. Show that retry is absent and the return is not completed. Simulate provider confirmation on the existing attempt; select SUCCEEDED. Observe completed return and one logical refund.
5. **Evidence (60s):** show the audit trail, actual API response, source BPMN and SQL outputs. Link the relevant FR/BR/UAT entries in RTM.
6. **Exception (60s):** create O-200/L-02. Show AWAITING_APPROVAL for 900000 VND; manager-1 approves, store-1 inspects. Mention self-approval and over-reservation negative tests.
7. **Close (45s):** show actual validation results and CR-001 exchange impact. State limitations: real identity, provider, durable operations and stakeholder acceptance are outside the reference implementation.

## Reproduction checks

Run `pnpm test` for assertions, `python tools/validate_contract.py` after Python dependency installation for schema checks, and `pnpm diagrams` to reproduce Graphviz exports. The process viewer exports actual bpmn-js SVG. Reviewers can inspect each source without trusting a static image.
