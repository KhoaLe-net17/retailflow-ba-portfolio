# Screen specifications and permissions

**Artifact:** working HTML/CSS/JavaScript interaction prototype, backed by a synthetic reference API. No Figma work is claimed. Run `pnpm start` and open localhost:4173. Source: [prototype](../../prototype/index.html).

| Screen | Purpose | Fields / actions | State and validation | Requirements |
| --- | --- | --- | --- | --- |
| SCR-01 Intake | Retrieve original order and capture request | Order ID; line; integer quantity; S01/S02/S03; NOT_SUITABLE/DAMAGED/WRONG_ITEM | Empty, order found, eligibility error; keep original paid values read-only | FR-001/002/003/013 |
| SCR-02 Preview | Explain amount before commitment | VND amount, approval requirement, confirm creation | No side effects; changing input invalidates preview; server recalculates on create | FR-002/006 |
| SCR-03 Return queue | Coordinate approval and inspection | Status, requester, amount; approve/reject, inspect, cancel | Show relevant role actions; server independently authorizes; require reason | FR-004/005/010/011 |
| SCR-04 Reconciliation | Separate return acceptance from payment | Logical refund, latest attempt, status; mock initiate, retry confirmed failure, simulate provider confirmation | UNKNOWN/PENDING cannot retry; no client amount; duplicate instructions prevented | FR-007/008/009/011 |
| SCR-05 Audit | Explain decisions and transitions | Event, actor, time, state before/after, structured details | Read-only; synthetic role fixture; no production audit-search/retention service | FR-012 |

## Interaction details

Every input has a visible label. Feedback uses a live status region. Invalid preview leaves the form available for correction. Confirmation dialogs describe the action and require a reason where applicable. Payment outcome selection is explicitly mock behavior. UI can capture one line per request; API supports up to 20 distinct lines atomically. To test multi-line behavior use acceptance checks or API client.

The actor switcher is a demonstration fixture. It deliberately lets a reviewer exercise authorization rules; it is not a login or a secure production identity mechanism. In a real system the server must derive identity from verified authentication, restrict row/store scope, and verify provider signatures.

## Role-action matrix

| Action | AGENT | MANAGER | STORE | FINANCE | PROVIDER |
| --- | --- | --- | --- | --- | --- |
| Read orders / workbench / audit | Yes | Yes | Yes | Yes | No |
| Preview / create return | Yes | Yes | No | No | No |
| Approve / reject exception | No | Yes, not own request | No | No | No |
| Cancel before inspection | Own request | Any request | No | No | No |
| Record inspection | No | No | Approved only | No | No |
| Initiate / guarded retry | No | No | No | Yes | No |
| Apply provider event | No | No | No | No | Yes, fixture only |

## Wireframes and reproduction

The HTML is the editable interaction wireframe. BPMN is rendered by bpmn-js and Graphviz diagrams from checked-in DOT. All diagram exports and screenshots, where present, are captures/exports of these sources. No generated raster artwork is used. See [browser observations](../../evidence/browser-validation.md) for actual walkthrough scope.
