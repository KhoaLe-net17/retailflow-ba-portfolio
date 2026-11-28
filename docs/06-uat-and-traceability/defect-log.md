# Defect and correction record

Only issues actually observed during local implementation/verification are listed. These are development defects, not invented retailer incidents. DEF-001–003 were corrected in v1.0; DEF-004 was observed and corrected during the 1.1 analysis extension.

| ID | Severity / affected area | Reproduction and observed behavior | Correction | Retest evidence |
| --- | --- | --- | --- | --- |
| DEF-001 | High · prototype / FR-001/002 | Clicking Find order did not submit; a document-level click wrapper cancelled the native form action. | Restrict preventDefault to submit events; keep delegated action handling from cancelling unrelated clicks. | Actual browser lookup and 250000 VND preview passed; browser-validation.md. |
| DEF-002 | High · local server | On Windows, a trailing separator in the static root made the path-containment check compare against a doubled separator; homepage returned 404. | Normalize root with path.resolve before containment checks. | Static HTML/JS/CSS/process-page checks in UAT-35; browser prototype loaded successfully. |
| DEF-003 | Medium · evidence runner / FR-014 | SQL runner split on a semicolon inside a comment; resulting fragment caused a syntax error. | Remove line comments before splitting SQL statements. SQL business queries were unchanged. | UAT-37 and recorded six-query outputs passed. |

These fixes do not constitute independent QA or stakeholder acceptance. Open limitations such as real authentication and durable payment integration are documented scope gaps, not represented as fixed defects.

## DEF-004 · UML class source boundary

Medium · analysis artifact. Initial local SVG showed `class ReturnRequest {` as an OrderUnit attribute, while the association implicitly created an empty ReturnRequest. PlantUML returned success, so syntax/hash checks alone did not catch the semantic rendering defect. Moved the closing brace onto its own line, re-rendered English and private companion sources, and added a class-boundary/visible-label assertion. Retest: corrected browser capture [class model](../../evidence/design/uml-domain-classes.jpg); analysis integrity check passes. No executable business rule changed.
