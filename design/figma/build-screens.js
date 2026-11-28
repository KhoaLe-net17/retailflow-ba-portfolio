// Executed through Figma's use_figma tool ($fig builder + native Plugin API).
// Editable screen designs based on the RetailFlow screen specification.
// Re-running creates a new composition; use the saved node IDs for revisions.
const primitives = $fig.varCollection({
  name: "RetailFlow / Primitives",
  modes: ["Value"],
});
const colorValues = {
  ink: "#172C34",
  muted: "#60767E",
  canvas: "#F3F6F8",
  white: "#FFFFFF",
  brand: "#132E35",
  lime: "#C9E9B4",
  line: "#DCE4E7",
  warning: "#FFF3D6",
  success: "#E6F4EA",
};
const primitiveColors = Object.fromEntries(
  Object.entries(colorValues).map(([name, value]) => [
    name,
    primitives.colorVar({
      name: `color/${name}`,
      values: { Value: value },
      scopes: [],
    }),
  ]),
);
const tokens = $fig.varCollection({
  name: "RetailFlow / Semantic",
  modes: ["Light"],
});
const colors = Object.fromEntries(
  Object.keys(colorValues).map((name) => [
    name,
    tokens.colorVar({
      name: `color/${name}`,
      values: { Light: primitiveColors[name] },
      scopes: ["FRAME_FILL", "SHAPE_FILL", "TEXT_FILL", "STROKE_COLOR"],
    }),
  ]),
);
const space = Object.fromEntries(
  [8, 12, 16, 24, 32, 40].map((v) => [
    v,
    tokens.numVar({
      name: `space/${v}`,
      values: { Light: v },
      scopes: ["GAP"],
    }),
  ]),
);
const radius = tokens.numVar({
  name: "radius/control",
  values: { Light: 8 },
  scopes: ["CORNER_RADIUS"],
});
const paint = (key) => [{ type: "SOLID", color: colors[key] }];
const font = (style) => ({ family: "Inter", style });
const text = (
  name,
  characters,
  size = 16,
  color = "ink",
  style = "Regular",
  width,
) =>
  $fig.text({
    name,
    characters,
    fontName: font(style),
    fontSize: size,
    lineHeight: { unit: "PERCENT", value: 150 },
    fills: paint(color),
    ...(width
      ? { width, textAutoResize: "HEIGHT" }
      : { textAutoResize: "WIDTH_AND_HEIGHT" }),
  });
const column = (name, children, opts = {}) =>
  $fig.autoLayout(
    {
      name,
      layoutMode: "VERTICAL",
      itemSpacing: space[16],
      fills: [],
      ...opts,
    },
    children,
  );
const row = (name, children, opts = {}) =>
  $fig.autoLayout(
    {
      name,
      layoutMode: "HORIZONTAL",
      itemSpacing: space[16],
      counterAxisAlignItems: "CENTER",
      fills: [],
      ...opts,
    },
    children,
  );
const btn = (label, disabled = false) =>
  $fig.instance("cc8b558dc7d9684011b6b99ce8e6509399bc836b", {
    name: `Action / ${label}`,
    props: {
      "Label#2:0": label,
      Variant: "Primary",
      State: disabled ? "Disabled" : "Default",
      Size: "Medium",
      "Has Icon Start#4:128": false,
      "Has Icon End#4:64": false,
    },
  });
const field = (label, value, width = 280) =>
  $fig.instance("c28150b04d333d34ed9d2b77abd9f2f54e1a878a", {
    name: `Field / ${label}`,
    width,
    props: {
      "Label#280:41": label,
      "Value#630:14": value,
      State: "Default",
      "Value Type": "Default",
      "Has Description#611:20": false,
    },
  });

// Repeated screen elements are instances of reusable main components.
const nav = $fig.component(
  {
    name: "RetailFlow / Navigation item",
    x: 0,
    y: 1200,
    layoutMode: "HORIZONTAL",
    layoutSizingVertical: "HUG",
    width: 200,
    paddingTop: space[12],
    paddingBottom: space[12],
    paddingLeft: space[16],
    paddingRight: space[16],
    itemSpacing: space[12],
    cornerRadius: radius,
    fills: paint("brand"),
  },
  [
    text("Number", "01", 12, "lime", "Semi Bold").textProp("Number"),
    text("Label", "Return intake", 14, "white", "Medium").textProp("Label"),
  ],
);
const record = $fig.component(
  {
    name: "RetailFlow / Data record",
    x: 260,
    y: 1200,
    layoutMode: "HORIZONTAL",
    layoutSizingVertical: "HUG",
    width: 950,
    paddingTop: space[16],
    paddingBottom: space[16],
    paddingLeft: space[16],
    paddingRight: space[16],
    itemSpacing: space[24],
    cornerRadius: radius,
    fills: paint("canvas"),
  },
  [
    text("Key", "Order", 14, "muted", "Medium", 180).textProp("Key"),
    text("Value", "O-100", 15, "ink", "Medium", 650).textProp("Value"),
  ],
);
const badge = $fig.component(
  {
    name: "RetailFlow / Status badge",
    x: 0,
    y: 1300,
    layoutMode: "HORIZONTAL",
    layoutSizingVertical: "HUG",
    layoutSizingHorizontal: "HUG",
    paddingTop: space[8],
    paddingBottom: space[8],
    paddingLeft: space[12],
    paddingRight: space[12],
    cornerRadius: radius,
    fills: paint("warning"),
  },
  [text("Status", "UNKNOWN", 12, "ink", "Semi Bold").textProp("Status")],
);
const rec = (key, value) =>
  $fig.instance(record, { props: { Key: key, Value: value } });
const status = (value) => $fig.instance(badge, { props: { Status: value } });
const navLabels = [
  "Return intake",
  "Refund preview",
  "Return queue",
  "Reconciliation",
  "Audit history",
];
const navLinks = [];
function shell(index, title, subtitle, actor, content) {
  const items = navLabels.map((label, i) => {
    const n = $fig.instance(nav, {
      name: `Navigate / SCR-0${i + 1}`,
      props: { Label: label, Number: `0${i + 1}` },
    });
    navLinks.push({ node: n, target: i, origin: index });
    return n;
  });
  const sidebar = column(
    "Navigation",
    [
      text("Brand", "RetailFlow", 28, "lime", "Bold"),
      text("Product", "RETURNS & REFUNDS", 11, "white", "Medium"),
      column("Screen links", items, { itemSpacing: space[8] }),
      text(
        "Scope",
        "REFERENCE DESIGN\nSynthetic data · VND\nOne channel · Three stores",
        12,
        "white",
        "Regular",
        200,
      ),
    ],
    {
      width: 236,
      paddingTop: space[32],
      paddingBottom: space[32],
      paddingLeft: space[16],
      paddingRight: space[16],
      itemSpacing: space[32],
      fills: paint("brand"),
      layoutSizingVertical: "FILL",
    },
  );
  const header = row(
    "Header",
    [
      text("Breadcrumb", "Operations / Returns", 14, "muted"),
      text("Role", `Acting role: ${actor}`, 14, "ink", "Medium"),
    ],
    {
      width: 1124,
      primaryAxisAlignItems: "SPACE_BETWEEN",
      paddingLeft: space[40],
      paddingRight: space[40],
      paddingTop: space[24],
      paddingBottom: space[24],
      fills: paint("white"),
    },
  );
  const body = column(
    "Content",
    [
      text(
        "Screen reference",
        `SCR-0${index + 1} / BUSINESS WORKFLOW`,
        12,
        "muted",
        "Semi Bold",
      ),
      text("Heading", title, 32, "ink", "Bold"),
      text("Purpose", subtitle, 15, "muted", "Regular", 1000),
      ...content,
      text(
        "Boundary",
        "Fictional case study. Static navigation demonstrates the design; the local reference app executes policy, SQL and mock payments.",
        12,
        "muted",
        "Regular",
        1000,
      ),
    ],
    {
      width: 1124,
      paddingTop: space[32],
      paddingBottom: space[32],
      paddingLeft: space[40],
      paddingRight: space[40],
      itemSpacing: space[24],
    },
  );
  return row(
    `SCR-0${index + 1} / ${title}`,
    [
      sidebar,
      column("Main", [header, body], {
        width: 1124,
        itemSpacing: 0,
        layoutSizingVertical: "FILL",
      }),
    ],
    {
      x: index * 1440,
      y: 0,
      width: 1360,
      height: 1000,
      itemSpacing: 0,
      counterAxisAlignItems: "MIN",
      fills: paint("canvas"),
      clipsContent: false,
    },
  );
}
const panels = (title, children) =>
  column(
    title,
    [text("Panel title", title, 20, "ink", "Semi Bold"), ...children],
    {
      width: 1044,
      paddingTop: space[24],
      paddingBottom: space[24],
      paddingLeft: space[24],
      paddingRight: space[24],
      cornerRadius: radius,
      fills: paint("white"),
    },
  );
const actions = [];
const preview = btn("Preview eligibility");
actions.push({ node: preview, target: 1 });
const create = btn("Create return");
actions.push({ node: create, target: 2 });
const toFinance = btn("Open reconciliation");
actions.push({ node: toFinance, target: 3 });
const toAudit = btn("View audit history");
actions.push({ node: toAudit, target: 4 });
const screens = [
  shell(
    0,
    "Start a return",
    "Find the original paid order and select eligible units. Paid values remain read-only.",
    "agent-1 / AGENT",
    [
      panels("Original order", [
        row("Lookup", [field("Order ID", "O-100", 600), btn("Find order")]),
        rec("Delivered", "2026-11-10 · Within the 30-day window"),
        rec("L-01 / Apparel", "2 units available · Net paid 500,000 VND"),
      ]),
      panels("Return details", [
        row("Quantity and store", [
          field("Quantity", "1"),
          field("Store", "S01"),
          field("Reason", "NOT_SUITABLE"),
        ]),
        text(
          "Validation",
          "Quantity must be a positive integer. The server rechecks availability when creating the return.",
          14,
          "muted",
          "Regular",
          950,
        ),
        preview,
      ]),
    ],
  ),
  shell(
    1,
    "Review the refund",
    "Preview has no side effects. Confirm only after reviewing eligibility and the original paid allocation.",
    "agent-1 / AGENT",
    [
      panels("Refund calculation", [
        rec("Selection", "O-100 / L-01 / 1 unit / S01"),
        rec(
          "Original line paid",
          "600,000 gross − 100,000 original discount = 500,000 VND",
        ),
        rec("Allocation", "500,000 ÷ 2 paid units = 250,000 VND"),
        text("Amount", "250,000 VND", 40, "ink", "Bold"),
        status("ELIGIBLE · AUTO-APPROVAL"),
        text(
          "Preview warning",
          "No shipping refund or new tax calculation. Changing the intake invalidates this preview.",
          14,
          "muted",
          "Regular",
          950,
        ),
        create,
      ]),
    ],
  ),
  shell(
    2,
    "Coordinate the handoff",
    "Approval and inspection are separate actions. The server checks the selected role on every command.",
    "manager-1 / MANAGER",
    [
      panels("Exception queue · independent decision", [
        rec("O-200 / L-02", "900,000 VND · AWAITING_APPROVAL"),
        rec("Requester", "agent-1 · A different manager must decide"),
        field(
          "Decision reason",
          "Reviewed exception against case-study policy",
          920,
        ),
        row("Decision actions", [
          btn("Approve"),
          btn("Reject"),
          btn("Cancel before inspection"),
        ]),
      ]),
      panels("Inspection handoff", [
        rec("Role / precondition", "store-1 / STORE · Only APPROVED returns"),
        rec(
          "Pass / discrepancy",
          "ACCEPTED / RESTOCK_CANDIDATE · DISPUTED / QUARANTINE",
        ),
        text(
          "Inventory boundary",
          "Disposition labels are recorded; physical inventory movement is not implemented.",
          14,
          "muted",
          "Regular",
          950,
        ),
        toFinance,
      ]),
    ],
  ),
  shell(
    3,
    "Reconcile before retrying",
    "A timeout does not prove failure. Keep one logical refund and reconcile the existing payment attempt.",
    "finance-1 / FINANCE",
    [
      panels("Unresolved payment", [
        rec("Return / amount", "ACCEPTED · 250,000 VND"),
        rec(
          "Instruction / attempt",
          "One logical refund · Attempt 1 · Matching provider reference",
        ),
        status("UNKNOWN · RECONCILE EXISTING ATTEMPT"),
        text(
          "Retry guard",
          "Retry is blocked for UNKNOWN and PENDING. Only definitive FAILED permits a new attempt of the same refund.",
          16,
          "ink",
          "Medium",
          950,
        ),
        row("Payment actions", [
          btn("Retry payment", true),
          btn("Simulate matched success"),
        ]),
        text(
          "Fixture note",
          "Simulate matched success is a provider-event fixture control; it is not a finance-to-bank integration.",
          14,
          "muted",
          "Regular",
          950,
        ),
        toAudit,
      ]),
    ],
  ),
  shell(
    4,
    "Explain the decision trail",
    "Read actor, transition and event details recorded atomically with successful business changes.",
    "finance-1 / FINANCE",
    [
      panels("Synthetic example · event progression", [
        rec("agent-1 / RETURN_CREATED", "APPROVED · Reserved one paid unit"),
        rec("store-1 / INSPECTED", "APPROVED → ACCEPTED · Goods passed"),
        rec(
          "finance-1 / REFUND_INITIATED",
          "UNKNOWN · Attempt 1 · Original idempotency response",
        ),
        rec(
          "provider-1 / PAYMENT_EVENT",
          "UNKNOWN → SUCCEEDED · Return → COMPLETED",
        ),
        status("COMPLETED · PAYMENT SUCCEEDED"),
        text(
          "Evidence boundary",
          "These are illustrative design records. Run the reference app or acceptance runner for actual event IDs and timestamps.",
          14,
          "muted",
          "Regular",
          950,
        ),
      ]),
    ],
  ),
];
await $fig.done();
// Reactions are navigation only: no simulated transaction is claimed in Figma.
const links = [
  ...navLinks.filter((link) => link.origin !== link.target),
  ...actions,
];
for (const { node, target } of links) {
  await node.node.setReactionsAsync([
    {
      trigger: { type: "ON_CLICK" },
      actions: [
        {
          type: "NODE",
          destinationId: screens[target].node.id,
          navigation: "NAVIGATE",
          transition: null,
          preserveScrollPosition: false,
        },
      ],
    },
  ]);
}
const evidence = screens.map((s) => {
  const root = s.node;
  const all = root.query("*").toArray();
  const counts = {};
  for (const n of all) counts[n.type] = (counts[n.type] || 0) + 1;
  return {
    id: root.id,
    name: root.name,
    width: root.width,
    height: root.height,
    descendants: all.length,
    counts,
    imageFilledNodes: all
      .filter(
        (n) =>
          "fills" in n &&
          Array.isArray(n.fills) &&
          n.fills.some((p) => p.type === "IMAGE"),
      )
      .map((n) => ({
        id: n.id,
        name: n.name,
        type: n.type,
        width: n.width,
        height: n.height,
      })),
    fontFamilies: [
      ...new Set(
        all.filter((n) => n.type === "TEXT").map((n) => n.fontName.family),
      ),
    ],
  };
});
return {
  screens: evidence,
  navigationLinks: links.length,
  localComponents: [nav.node.id, record.node.id, badge.node.id],
  sourceComponents: {
    button: "cc8b558dc7d9684011b6b99ce8e6509399bc836b",
    input: "c28150b04d333d34ed9d2b77abd9f2f54e1a878a",
  },
  semanticVariables: Object.fromEntries(
    Object.entries(colors).map(([k, v]) => [k, v.id]),
  ),
  scope:
    "Editable static UX handoff; transactions are executed in the separate reference app.",
};
