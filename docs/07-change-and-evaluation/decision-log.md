# Decision log

**Status:** documented case-study selections by the portfolio owner, not recorded stakeholder agreements. Date: 2026-11-23.

| ID | Selected option | Alternative considered | Reason / trade-off |
| --- | --- | --- | --- |
| DEC-01 | 30-day inclusive instant window | Calendar-day cutoff | Unambiguous testable instant; real policy still unvalidated. |
| DEC-02 | Immutable integer unit allocations | Round each partial return independently | Conserves original paid total; stable cancelled-reservation behavior. |
| DEC-03 | Atomic unit reservation with partial unique index | Check quantity only in UI | Database enforces no active duplicate unit; transaction rechecks input. |
| DEC-04 | Separate return and payment states | One shared completed flag | Avoids equating accepted goods with successful payment. |
| DEC-05 | UNKNOWN requires same-attempt reconciliation | Retry after timeout with new key | Prevents a second payment when the first may have succeeded. |
| DEC-06 | Embedded PostgreSQL plus loopback Node reference | Live payment / production deployment | Reproducible SQL and API proof without real financial integration. |
| DEC-07 | HTML interaction prototype and source-based diagrams | Unverifiable static artwork | Reviewer can inspect fields, interactions, source and actual outputs. |

Dispute resolution, retention rules, actual provider semantics and production performance remain open. No invented workshop or approval is used to justify these decisions.
