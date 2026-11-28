# UML model set

**Notation:** selected UML 2.5.1 views · **Renderer:** PlantUML 1.2026.10 (MIT distribution), local Java, Smetana layout where applicable · **Revision:** 1.1.

| Model / full-size SVG | Question it answers | Traceability | Editable source |
| --- | --- | --- | --- |
| [Use-case view](../../diagrams/uml/use-case.svg) | Actors, system boundary, mandatory inclusion and conditional extensions | UC-01/02; FR-002/003/004/008/010/011/012 | [PlantUML](../../diagrams/uml/use-case.puml) |
| [Conceptual domain classes](../../diagrams/uml/domain-classes.svg) | 11 domain concepts, associations, multiplicity and invariants | BR-002/004/006/010; SQL dictionary | [PlantUML](../../diagrams/uml/domain-classes.puml) |
| [Reconciliation sequence](../../diagrams/uml/refund-reconciliation-sequence.svg) | Synchronous reference calls, transactions, exact replay and matched provider event | FR-007/008/009/012; UC-02 | [PlantUML](../../diagrams/uml/refund-reconciliation-sequence.puml) |
| [Return state machine](../../diagrams/uml/return-state-machine.svg) | Approval, cancellation, inspection, disputed hold and completion | FR-003/004/005/010; BR-007/012 | [PlantUML](../../diagrams/uml/return-state-machine.puml) |
| [Logical refund state machine](../../diagrams/uml/refund-state-machine.svg) | UNKNOWN/PENDING reconciliation, definitive failure and guarded retry | FR-007/008/009; BR-009/010 | [PlantUML](../../diagrams/uml/refund-state-machine.puml) |

## Interpretation and consistency

The use-case view summarizes the two detailed [use cases](../03-requirements/use-cases.md); it is not a replacement for their exceptions or role permissions. `«include»` denotes required supporting behavior. `«extend»` denotes conditional behavior at the stated extension condition. A staff association does not authorize that actor to execute all stages. Customers are represented through staff intake; no self-service customer UI is implemented.

The class view is a conceptual domain model, not evidence of an object-oriented ORM implementation. The reference code uses functions and SQL tables. `1`, `0..1`, `1..*` and `0..*` express multiplicity; historical unit allocations may have many records but only one active allocation. The physical [ERD](../../diagrams/erd.svg) additionally specifies table columns, keys and constraints. The sequence view explicitly shows the same-process mock selector; no bank call is implied.

The refund model describes the logical instruction. Retrying FAILED creates a new attempt; it never reopens a terminal failed attempt. UNKNOWN and PENDING require reconciliation against the existing attempt. A disputed return is an unresolved hold, not an automatically resolved final business outcome. Return rejection/cancellation and payment failure have different reservation effects.

Use [BPMN](../02-process-analysis/process-analysis.md) for cross-role business workflow, UML for actor/domain/interaction/state views and ERD for physical relational data. They are complementary representations of the same bounded policy.

## Rendering and provenance

Install Java and download the pinned **MIT** JAR from the [official PlantUML 1.2026.10 release](https://github.com/plantuml/plantuml/releases/tag/v1.2026.10). Keep the external renderer outside the repository; no binary JAR is redistributed. Then:

```bash
python tools/render-uml.py --jar /path/to/plantuml-mit-1.2026.10.jar
```

On Windows use a real path appropriate to your installation. The renderer passes repository-relative source paths, validates SVG XML and records source/output/JAR SHA-256 values in the [render manifest](../../diagrams/uml/render-manifest.json). Source is rendered locally, not uploaded to an external rendering service. Open SVG in a browser or use a PlantUML-capable editor to change the source and re-export. Text remains vector text; open full size for detailed models.

The [analysis checker](../../tools/check-analysis.py) verifies the checked-in render hashes, labels and design exports. Rendering correctness is distinct from semantic review or stakeholder approval. Reference: [OMG UML 2.5.1](https://www.omg.org/spec/UML/2.5.1/) and [PlantUML command line](https://plantuml.com/command-line).
