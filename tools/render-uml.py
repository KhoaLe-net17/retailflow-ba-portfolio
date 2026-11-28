"""Render editable PlantUML sources locally with Java and a user-supplied JAR.

Example: python tools/render-uml.py --jar /path/to/plantuml-1.2026.10.jar
No source data is sent to an external renderer. Smetana avoids a native dot dependency.
"""
import argparse
import hashlib
import json
import os
import subprocess
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument(
    "--jar", type=Path,
    default=Path(os.environ.get(
        "PLANTUML_JAR",
        ROOT.parent / ".portfolio-build/tooling/plantuml-1.2026.10.jar",
    )),
)
parser.add_argument(
    "--source-dir", type=Path, default=ROOT / "diagrams/uml",
    help="Directory containing editable .puml sources",
)
args = parser.parse_args()
if not args.jar.is_file():
    parser.error("Set --jar or PLANTUML_JAR to an official PlantUML JAR. See docs/04-solution-design/uml-models.md.")
sources = sorted(args.source_dir.resolve().glob("*.puml"))
if not sources:
    parser.error("No .puml sources found in --source-dir.")

# Relative arguments also avoid Unicode command-line mangling in some Windows
# Java launchers. subprocess receives an argument list, never a shell command.
jar_arg = os.path.relpath(args.jar, ROOT)
java = ["java", "-Djava.awt.headless=true", "-jar", jar_arg]
version = subprocess.check_output(
    java + ["-version"], cwd=ROOT, text=True, encoding="utf-8", errors="replace",
).splitlines()[0]
jar_hash = hashlib.sha256(args.jar.read_bytes()).hexdigest()
manifest = []
for source in sources:
    subprocess.run(
        java + ["-tsvg", "-charset", "UTF-8", "-nometadata", "-failfast2", os.path.relpath(source, ROOT)],
        cwd=ROOT, check=True,
    )
    target = source.with_suffix(".svg")
    svg = target.read_bytes()
    tree = ET.fromstring(svg)
    if tree.tag != "{http://www.w3.org/2000/svg}svg" or "Syntax Error?" in svg.decode("utf-8"):
        raise RuntimeError("Invalid PlantUML output: " + source.name)
    manifest.append({
        "source": Path(os.path.relpath(source, ROOT)).as_posix(),
        "sourceSha256": hashlib.sha256(source.read_bytes()).hexdigest(),
        "svg": Path(os.path.relpath(target, ROOT)).as_posix(),
        "svgSha256": hashlib.sha256(svg).hexdigest(),
        "renderer": version, "jarSha256": jar_hash,
        "layout": "PlantUML / Smetana where applicable",
    })
    print("Rendered", source.name)
(args.source_dir / "render-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
