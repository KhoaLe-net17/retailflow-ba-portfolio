"""Validate the consolidated specification and source-based analysis artifacts.

This checks consistency/provenance, not UML conformance or stakeholder acceptance.
No Java or Figma account is required to check the committed review package.
"""
import hashlib
import json
import re
import struct
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
checks = []


def load(path):
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def check(name, condition, detail):
    checks.append({"check": name, "result": "PASS" if condition else "FAIL", "detail": detail})


def digest(path):
    return hashlib.sha256((ROOT / path).read_bytes()).hexdigest()


catalog = load("analysis/catalog.json")
srs = (ROOT / "docs/03-requirements/software-requirements-specification.md").read_text(encoding="utf-8")
for family, expected in [
    ("FR", {r["id"] for r in catalog["requirements"]}),
    ("BR", {r["id"] for r in catalog["rules"]}),
    ("NFR", {f"NFR-{i:02}" for i in range(1, 7)}),
]:
    found = set(re.findall(rf"\b{family}-\d{{2,3}}\b", srs))
    # FR regex must not mistake the suffix of NFR for an independent requirement.
    if family == "FR":
        found = set(re.findall(r"(?<![A-Z])FR-\d{3}\b", srs))
    check(f"SRS {family} coverage", found == expected, {"expected": sorted(expected), "found": sorted(found)})
for req in catalog["requirements"]:
    rows = [r for r in srs.splitlines() if r.startswith(f'| {req["id"]} |')]
    linked = any(req["story"] in row and all(uat in row for uat in req["uat"]) for row in rows)
    check(f'SRS trace {req["id"]}', linked, {"story": req["story"], "uat": req["uat"]})

models = load("diagrams/uml/render-manifest.json")
expected_models = {
    "use-case", "domain-classes", "refund-reconciliation-sequence",
    "return-state-machine", "refund-state-machine",
}
check("UML model set", {Path(m["source"]).stem for m in models} == expected_models, {"count": len(models)})
for m in models:
    src = (ROOT / m["source"]).read_text(encoding="utf-8")
    svg_path = ROOT / m["svg"]
    tree = ET.parse(svg_path)
    svg_text = svg_path.read_text(encoding="utf-8")
    valid = (
        digest(m["source"]) == m["sourceSha256"]
        and digest(m["svg"]) == m["svgSha256"]
        and tree.getroot().tag == "{http://www.w3.org/2000/svg}svg"
        and "Syntax Error?" not in svg_text
        and src.startswith("@startuml\n") and src.rstrip().endswith("@enduml")
        and "1.2026.10" in m["renderer"]
    )
    check("UML source/export: " + Path(m["source"]).stem, valid, {"renderer": m["renderer"], "sourceSha256": m["sourceSha256"], "svgSha256": m["svgSha256"]})
    if Path(m["source"]).stem == "domain-classes":
        labels = ["".join(node.itertext()) for node in tree.iter() if node.tag.endswith("}text")]
        classes = re.findall(r"^class (\w+) \{\s*$", src, re.MULTILINE)
        # PlantUML can accept an unclosed class as text and implicitly create a
        # later class from its association. Rendering success alone misses this.
        check("UML class boundaries and labels", len(classes) == 11 and all(name in labels for name in classes) and not any(label.lstrip().startswith("class ") for label in labels), {"declaredClasses": classes, "rawDeclarationInSvg": any(label.lstrip().startswith("class ") for label in labels)})

figma = load("design/figma/manifest.json")
check("Figma native screen coverage", len(figma["screens"]) == 5, {"fileUrl": figma["fileUrl"], "frames": [s["id"] for s in figma["screens"]]})
for i, screen in enumerate(figma["screens"], 1):
    counts = screen["counts"]
    check(f"Figma editable structure SCR-0{i}", counts.get("TEXT", 0) > 0 and counts.get("INSTANCE", 0) > 0 and not screen["imageFilledNodes"] and screen["fontFamilies"] == ["Inter"], {"counts": counts, "imageFilledNodes": screen["imageFilledNodes"], "fontFamilies": screen["fontFamilies"]})
check("Figma navigation evidence", figma["navigationLinks"] == 24, {"navigationLinks": figma["navigationLinks"], "boundary": "Saved tool response, not a fresh remote canvas query or full visual review"})
png = (ROOT / "evidence/design/figma-scr-01.png").read_bytes()
png_ok = png[:8] == b"\x89PNG\r\n\x1a\n" and len(png) > 1000
size = struct.unpack(">II", png[16:24]) if png_ok else (0, 0)
check("Native Figma intake snapshot", png_ok and size == (1360, 1000), {"size": list(size), "sha256": hashlib.sha256(png).hexdigest(), "boundary": "Initial composition before compact component refinements"})
check("No empty design files", all(p.stat().st_size > 0 for p in (ROOT / "design/figma").rglob("*") if p.is_file()), "Requested Figma SVG downloads returned empty HTTP 202; absent from this package")
pack = (ROOT / "portfolio/stakeholder-demo.md").read_text(encoding="utf-8")
check("Stakeholder review coverage", all(f"DEMO-0{i}" in pack for i in range(1, 7)) and "Not conducted" in pack and "Pending" in pack, "Six prepared scenarios; no external participation or sign-off asserted")

report = {
    "executedAt": datetime.now(timezone.utc).isoformat(),
    "scope": "Local source/catalog/export integrity and saved native Figma structure; not live Figma review, formal UML conformance, or business acceptance",
    "summary": {"total": len(checks), "passed": sum(c["result"] == "PASS" for c in checks), "failed": sum(c["result"] == "FAIL" for c in checks)},
    "checks": checks,
}
(ROOT / "evidence/analysis-design-validation.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
print(f'{report["summary"]["passed"]}/{len(checks)} analysis/design checks passed.')
for item in checks:
    if item["result"] == "FAIL":
        print("FAIL:", item["check"], item["detail"])
raise SystemExit(1 if report["summary"]["failed"] else 0)
