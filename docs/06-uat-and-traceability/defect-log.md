# Defect and correction record

Only issues actually observed during local implementation/verification are listed. These are development defects, not invented retailer incidents. Corrections are included in v1.0.

| ID | Severity / affected area | Reproduction and observed behavior | Correction | Retest evidence |
| --- | --- | --- | --- | --- |
| DEF-001 | High · prototype / FR-001/002 | Clicking Find order did not submit; a document-level click wrapper cancelled the native form action. | Restrict preventDefault to submit events; keep delegated action handling from cancelling unrelated clicks. | Actual browser lookup and 250000 VND preview passed; browser-validation.md. |
| DEF-002 | High · local server | On Windows, a trailing separator in the static root made the path-containment check compare against a doubled separator; homepage returned 404. | Normalize root with path.resolve before containment checks. | Static HTML/JS/CSS/process-page checks in UAT-35; browser prototype loaded successfully. |
| DEF-003 | Medium · evidence runner / FR-014 | SQL runner split on a semicolon inside a comment; resulting fragment caused a syntax error. | Remove line comments before splitting SQL statements. SQL business queries were unchanged. | UAT-37 and recorded six-query outputs passed. |

These fixes do not constitute independent QA or stakeholder acceptance. Open limitations such as real authentication and durable payment integration are documented scope gaps, not represented as fixed defects.
