import { instance } from "@viz-js/viz";
import { readdir, readFile, writeFile } from "node:fs/promises";
const viz = await instance();
for (const name of (await readdir("diagrams")).filter((f) =>
  f.endsWith(".dot"),
)) {
  const result = viz.renderString(await readFile("diagrams/" + name, "utf8"), {
    format: "svg",
  });
  await writeFile("diagrams/" + name.replace(/\.dot$/, ".svg"), result);
  console.log("Rendered", name, "with Graphviz", viz.graphvizVersion);
}
