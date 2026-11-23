import { writeFile, mkdir } from "node:fs/promises";
const escape = (s) =>
  String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;");
const models = [
  {
    name: "as-is",
    title: "Assumed current return handling",
    lanes: ["Customer service", "Store operations", "Finance"],
    nodes: [
      ["start", "startEvent", "Return requested", 0, 100, 105, 36, 36],
      ["intake", "userTask", "Record email / spreadsheet", 0, 185, 80, 160, 86],
      ["ask", "userTask", "Ask store for eligibility", 0, 415, 80, 160, 86],
      ["check", "userTask", "Check order and goods", 1, 645, 255, 160, 86],
      ["eligible", "exclusiveGateway", "Eligible?", 1, 865, 270, 55, 55],
      ["reject", "userTask", "Communicate rejection", 0, 1010, 80, 160, 86],
      ["end_reject", "endEvent", "Return rejected", 0, 1240, 105, 36, 36],
      [
        "calculate",
        "userTask",
        "Manually calculate refund",
        2,
        1010,
        430,
        160,
        86,
      ],
      ["pay", "userTask", "Submit payment manually", 2, 1230, 430, 160, 86],
      ["update", "userTask", "Update separate records", 2, 1450, 430, 160, 86],
      ["end", "endEvent", "Recorded as handled", 2, 1670, 455, 36, 36],
    ],
    flows: [
      ["start", "intake"],
      ["intake", "ask"],
      ["ask", "check"],
      ["check", "eligible"],
      ["eligible", "reject", "No"],
      ["reject", "end_reject"],
      ["eligible", "calculate", "Yes"],
      ["calculate", "pay"],
      ["pay", "update"],
      ["update", "end"],
    ],
  },
  {
    name: "to-be-returns",
    title: "Proposed return handling · policy 0.1",
    lanes: ["Customer service / system", "Manager", "Store operations"],
    nodes: [
      ["start", "startEvent", "Request entered", 0, 100, 105, 36, 36],
      [
        "validate",
        "serviceTask",
        "Validate policy and units",
        0,
        185,
        80,
        160,
        86,
      ],
      ["eligible", "exclusiveGateway", "Eligible?", 0, 415, 95, 55, 55],
      [
        "reject",
        "userTask",
        "Explain eligibility rejection",
        0,
        535,
        80,
        160,
        86,
      ],
      ["end_invalid", "endEvent", "Not submitted", 0, 760, 105, 36, 36],
      [
        "reserve",
        "serviceTask",
        "Reserve units atomically",
        0,
        535,
        185,
        160,
        86,
      ],
      [
        "approval",
        "exclusiveGateway",
        "Exception review?",
        0,
        755,
        200,
        55,
        55,
      ],
      [
        "review",
        "userTask",
        "Independent approval decision",
        1,
        880,
        330,
        160,
        86,
      ],
      ["decision", "exclusiveGateway", "Approved?", 1, 1100, 345, 55, 55],
      [
        "release",
        "serviceTask",
        "Release units and record reason",
        1,
        1235,
        330,
        160,
        86,
      ],
      ["end_reject", "endEvent", "Rejected", 1, 1460, 355, 36, 36],
      [
        "inspect",
        "userTask",
        "Receive and inspect goods",
        2,
        1235,
        505,
        160,
        86,
      ],
      ["accepted", "exclusiveGateway", "Accepted?", 2, 1455, 520, 55, 55],
      [
        "dispute",
        "userTask",
        "Quarantine and record discrepancy",
        2,
        1630,
        610,
        160,
        86,
      ],
      [
        "end_dispute",
        "endEvent",
        "Disputed / payment blocked",
        2,
        1860,
        635,
        36,
        36,
      ],
      [
        "amount",
        "serviceTask",
        "Confirm reserved-unit paid value",
        2,
        1630,
        505,
        160,
        86,
      ],
      ["end", "endEvent", "Accepted / ready for finance", 2, 1860, 530, 36, 36],
    ],
    flows: [
      ["start", "validate"],
      ["validate", "eligible"],
      ["eligible", "reject", "No"],
      ["reject", "end_invalid"],
      ["eligible", "reserve", "Yes"],
      ["reserve", "approval"],
      ["approval", "review", "Yes"],
      ["review", "decision"],
      ["decision", "release", "No"],
      ["release", "end_reject"],
      ["approval", "inspect", "No"],
      ["decision", "inspect", "Yes"],
      ["inspect", "accepted"],
      ["accepted", "dispute", "No"],
      ["dispute", "end_dispute"],
      ["accepted", "amount", "Yes"],
      ["amount", "end"],
    ],
  },
  {
    name: "to-be-payments",
    title: "Proposed payment handling · policy 0.1",
    lanes: ["Finance", "Reference payment system"],
    nodes: [
      ["start", "startEvent", "Accepted return", 0, 100, 105, 36, 36],
      [
        "submit",
        "userTask",
        "Submit idempotent refund command",
        0,
        185,
        80,
        160,
        86,
      ],
      [
        "validate",
        "serviceTask",
        "Check actor, state and key",
        1,
        415,
        255,
        160,
        86,
      ],
      [
        "pay",
        "serviceTask",
        "Create mock payment attempt",
        1,
        645,
        255,
        160,
        86,
      ],
      ["outcome", "exclusiveGateway", "Payment result?", 1, 865, 270, 55, 55],
      [
        "success",
        "serviceTask",
        "Record success / complete return",
        1,
        1035,
        180,
        160,
        86,
      ],
      ["end_ok", "endEvent", "Completed", 1, 1270, 205, 36, 36],
      ["failed", "userTask", "Review definitive failure", 0, 1035, 80, 160, 86],
      [
        "end_failed",
        "endEvent",
        "Failed / guarded retry available",
        0,
        1270,
        105,
        36,
        36,
      ],
      [
        "reconcile",
        "userTask",
        "Reconcile existing attempt",
        0,
        1035,
        420,
        160,
        86,
      ],
      [
        "confirmed",
        "exclusiveGateway",
        "Confirmed result?",
        0,
        1260,
        435,
        55,
        55,
      ],
      [
        "wait",
        "userTask",
        "Keep open / do not resubmit",
        0,
        1425,
        530,
        160,
        86,
      ],
      ["end_wait", "endEvent", "Pending reconciliation", 0, 1650, 555, 36, 36],
    ],
    flows: [
      ["start", "submit"],
      ["submit", "validate"],
      ["validate", "pay"],
      ["pay", "outcome"],
      ["outcome", "success", "SUCCEEDED"],
      ["success", "end_ok"],
      ["outcome", "failed", "FAILED"],
      ["failed", "end_failed"],
      ["outcome", "reconcile", "UNKNOWN / PENDING"],
      ["reconcile", "confirmed"],
      ["confirmed", "success", "SUCCEEDED"],
      ["confirmed", "failed", "FAILED"],
      ["confirmed", "wait", "Still uncertain"],
      ["wait", "end_wait"],
    ],
  },
];
await mkdir("diagrams", { recursive: true });
const payments = models.find((m) => m.name === "to-be-payments");
payments.lanes = [
  "Finance / intake and failure review",
  "Reference payment system",
  "Finance / reconciliation",
];
for (const n of payments.nodes) {
  if (["reconcile", "confirmed", "wait", "end_wait"].includes(n[0])) n[3] = 2;
  if (n[0] === "success") n[5] = 255;
  if (n[0] === "end_ok") n[5] = 280;
}
for (const model of models) {
  const processId = "Process_" + model.name.replaceAll("-", "_"),
    positions = new Map(model.nodes.map((n) => [n[0], n]));
  const flows = model.flows.map((f, i) => ({
    id: "Flow_" + i,
    from: f[0],
    to: f[1],
    label: f[2] || "",
  }));
  const width = Math.max(...model.nodes.map((n) => n[4] + n[6])) + 100;
  const height = Math.max(...model.nodes.map((n) => n[5] + n[7])) + 80;
  const laneHeight = height / model.lanes.length;
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_${model.name}" targetNamespace="https://github.com/KhoaLe-net17/retailflow-ba-portfolio" exporter="RetailFlow BPMN source builder" exporterVersion="1.0.0">\n<bpmn:process id="${processId}" name="${escape(model.title)}" isExecutable="false"><bpmn:documentation>Fictional analysis model; not deployed automation. Cancellation before inspection is a separate supported alternate flow documented in state-models.md.</bpmn:documentation><bpmn:laneSet id="LaneSet">`;
  for (let i = 0; i < model.lanes.length; i++)
    xml += `<bpmn:lane id="Lane_${i}" name="${escape(model.lanes[i])}">${model.nodes
      .filter((n) => n[3] === i)
      .map((n) => `<bpmn:flowNodeRef>${n[0]}</bpmn:flowNodeRef>`)
      .join("")}</bpmn:lane>`;
  xml += "</bpmn:laneSet>";
  for (const n of model.nodes) {
    xml += `<bpmn:${n[1]} id="${n[0]}" name="${escape(n[2])}">`;
    for (const f of flows.filter((f) => f.to === n[0]))
      xml += `<bpmn:incoming>${f.id}</bpmn:incoming>`;
    for (const f of flows.filter((f) => f.from === n[0]))
      xml += `<bpmn:outgoing>${f.id}</bpmn:outgoing>`;
    xml += `</bpmn:${n[1]}>`;
  }
  for (const f of flows)
    xml += `<bpmn:sequenceFlow id="${f.id}" sourceRef="${f.from}" targetRef="${f.to}"${f.label ? ` name="${escape(f.label)}"` : ""}/>`;
  xml += `</bpmn:process><bpmndi:BPMNDiagram id="Diagram"><bpmndi:BPMNPlane id="Plane" bpmnElement="${processId}">`;
  // Lane bounds encompass each node assigned to that lane; model coordinates are reviewed visually.
  const extents = model.lanes.map((_, i) => {
    const ns = model.nodes.filter((n) => n[3] === i);
    return {
      min: Math.min(...ns.map((n) => n[5])),
      max: Math.max(...ns.map((n) => n[5] + n[7])),
    };
  });
  for (let i = 0; i < model.lanes.length; i++) {
    const top =
      i === 0 ? extents[i].min - 45 : (extents[i - 1].max + extents[i].min) / 2;
    const bottom =
      i === model.lanes.length - 1
        ? extents[i].max + 45
        : (extents[i].max + extents[i + 1].min) / 2;
    xml += `<bpmndi:BPMNShape id="LaneShape_${i}" bpmnElement="Lane_${i}" isHorizontal="true"><dc:Bounds x="30" y="${top}" width="${width - 40}" height="${bottom - top}"/></bpmndi:BPMNShape>`;
  }
  for (const n of model.nodes)
    xml += `<bpmndi:BPMNShape id="Shape_${n[0]}" bpmnElement="${n[0]}"${n[1] === "exclusiveGateway" ? ' isMarkerVisible="true"' : ""}><dc:Bounds x="${n[4]}" y="${n[5]}" width="${n[6]}" height="${n[7]}"/></bpmndi:BPMNShape>`;
  for (const f of flows) {
    const a = positions.get(f.from),
      b = positions.get(f.to),
      ax = a[4] + a[6],
      ay = a[5] + a[7] / 2,
      bx = b[4],
      by = b[5] + b[7] / 2;
    const mid = (ax + bx) / 2;
    let points = [
      [ax, ay],
      [mid, ay],
      [mid, by],
      [bx, by],
    ];
    if (
      model.name === "to-be-returns" &&
      f.from === "approval" &&
      f.to === "inspect"
    )
      points = [
        [ax, ay],
        [1190, ay],
        [1190, by],
        [bx, by],
      ];
    if (
      model.name === "to-be-payments" &&
      f.from === "confirmed" &&
      f.to === "failed"
    )
      points = [
        [ax, ay],
        [1360, ay],
        [1360, 45],
        [1010, 45],
        [1010, by],
        [bx, by],
      ];
    if (
      model.name === "to-be-payments" &&
      f.from === "confirmed" &&
      f.to === "success"
    )
      points = [
        [ax, ay],
        [1360, ay],
        [1360, 350],
        [1215, 350],
        [1215, by],
        [b[4] + b[6], by],
      ];
    xml +=
      `<bpmndi:BPMNEdge id="Edge_${f.id}" bpmnElement="${f.id}">` +
      points.map(([x, y]) => `<di:waypoint x="${x}" y="${y}"/>`).join("") +
      "</bpmndi:BPMNEdge>";
  }
  xml += "</bpmndi:BPMNPlane></bpmndi:BPMNDiagram></bpmn:definitions>\n";
  await writeFile(`diagrams/${model.name}.bpmn`, xml);
}
console.log(
  `Generated ${models.length} editable, non-executable BPMN 2.0 XML models.`,
);
