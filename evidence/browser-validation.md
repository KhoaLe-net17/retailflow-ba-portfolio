# Browser verification record

**Date:** 2026-11-23. **Target:** actual local reference server, http://127.0.0.1:4173. **Method:** browser interaction with rendered controls; no mocked DOM state. This is a solo technical walkthrough, not stakeholder UAT.

| Check | Actual observation | Result |
| --- | --- | --- |
| Original order and preview | O-100/L-01 initially showed 2 available units; quantity 1 previewed 250000 VND. | PASS |
| Return handoff | Agent created APPROVED request; store actor recorded passed inspection. | PASS |
| Uncertain payment | Finance selected mock UNKNOWN; queue displayed UNKNOWN with no retry action. | PASS |
| Reconciliation | Simulated matching provider success updated the existing attempt; return displayed COMPLETED and refund SUCCEEDED for 250000 VND. | PASS |
| High-value approval | O-200/L-02 previewed 900000 VND with manager approval required; manager decision changed AWAITING_APPROVAL to APPROVED. | PASS |
| Audit | Creation, inspection, payment result, provider reconciliation, completion and manager decision showed synthetic actor, transition and fixed business timestamp. | PASS |
| Small viewport | Browser override 390x844; document viewport/scroll widths both 375 CSS px after scrollbar. No page-level horizontal overflow on intake. | PASS |
| BPMN rendering | All three XML sources imported through bpmn-js with zero warnings and exported SVG. Reviewed lanes, labels and connectors; adjusted bypass routes to avoid task text. | PASS |

## Captures

- [Completed refund / operational queue](screenshots/completed-refund.jpg) — actual browser screenshot, not generated artwork.
- [Mobile intake](screenshots/mobile-intake.jpg) — actual browser screenshot.

## Limits

No browser matrix, automated accessibility certification, real-user usability study, provider network or production load test. The fixture clock is intentional, so business-event timestamps are identical; execution logs record actual wall-clock time separately. The collection is supplied for Postman import; no Postman run is claimed.
