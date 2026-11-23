import assert from "node:assert/strict";
import { readFile, writeFile, mkdir, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { BpmnModdle } from "bpmn-moddle";
import { createSystem, allocateUnits, DEMO_NOW } from "../demo/domain.mjs";
import { makeServer } from "../demo/server.mjs";

const root = new URL("../", import.meta.url),
  catalog = JSON.parse(
    await readFile(new URL("analysis/catalog.json", root), "utf8"),
  );
const input = (
  orderId = "O-100",
  orderLineId = "L-01",
  quantity = 1,
  reasonCode = "NOT_SUITABLE",
) => ({
  orderId,
  storeId: "S01",
  reasonCode,
  items: [{ orderLineId, quantity }],
});
const q = async (s, sql, args = []) => (await s.db.query(sql, args)).rows;
const count = async (s, table) =>
  Number((await q(s, `SELECT COUNT(*) AS n FROM ${table}`))[0].n);
async function denied(command, code, status) {
  await assert.rejects(
    command,
    (e) => e.code === code && (!status || e.status === status),
    `${code} expected`,
  );
}
const create = (s, body = input(), who = "agent-1") =>
  s.createReturn(body, who);
async function accepted(s, body = input()) {
  const r = await create(s, body);
  if (r.status === "AWAITING_APPROVAL")
    await s.decide(
      r.id,
      { approved: true, reason: "Fixture policy review" },
      "manager-1",
    );
  await s.inspect(r.id, { passed: true, reason: "Fixture intact" }, "store-1");
  return r;
}
async function paid(s, outcome = "SUCCEEDED", key = "validation-key-001") {
  const r = await accepted(s);
  return s.refund(
    { returnId: r.id, simulationOutcome: outcome },
    key,
    "finance-1",
  );
}
const event = (f, status = "SUCCEEDED", eventId = "event-001") => ({
  eventId,
  attemptId: f.attemptId,
  providerRef: f.providerRef,
  status,
});
const tests = {
  "UAT-01": async (s) => {
    const o = await s.getOrder("O-100", "agent-1");
    assert.equal(o.lines[0].remaining_qty, 2);
    assert.equal(o.lines[0].net_paid_vnd, 500000);
  },
  "UAT-02": async (s) => {
    const p = await s.preview(input(), "agent-1");
    assert.equal(p.amountVnd, 250000);
    for (const t of [
      "return_requests",
      "return_units",
      "refund_instructions",
      "audit_events",
    ])
      assert.equal(await count(s, t), 0);
  },
  "UAT-03": async (s) =>
    denied(
      () => s.preview(input("O-OLD", "L-03"), "agent-1"),
      "RETURN_WINDOW",
      422,
    ),
  "UAT-04": async (s) => {
    assert.equal(
      (await s.preview(input("O-EDGE", "L-04"), "agent-1")).amountVnd,
      33334,
    );
    const late = await createSystem({ now: "2026-11-23T09:00:00.001Z" });
    try {
      await denied(
        () => late.preview(input("O-EDGE", "L-04"), "agent-1"),
        "RETURN_WINDOW",
        422,
      );
    } finally {
      await late.close();
    }
  },
  "UAT-05": async (s) =>
    denied(
      () => s.preview(input("O-200", "L-05"), "agent-1"),
      "CATEGORY_EXCLUDED",
      422,
    ),
  "UAT-06": async (s) =>
    denied(
      () => s.preview(input("O-FUTURE", "L-06"), "agent-1"),
      "RETURN_WINDOW",
      422,
    ),
  "UAT-07": async (s) => {
    const r = await create(s);
    assert.equal(r.status, "APPROVED");
    assert.equal(r.amountVnd, 250000);
    assert.equal(
      (await s.getOrder("O-100", "agent-1")).lines[0].remaining_qty,
      1,
    );
  },
  "UAT-08": async (s) => {
    await create(s, input("O-100", "L-01", 2));
    await denied(() => create(s), "RETURN_QUANTITY_EXCEEDED", 409);
    assert.equal(await count(s, "return_requests"), 1);
  },
  "UAT-09": async (s) => {
    const b = input("O-200", "L-02");
    b.items.push({ orderLineId: "L-05", quantity: 1 });
    await denied(() => create(s, b), "CATEGORY_EXCLUDED", 422);
    assert.equal(await count(s, "return_requests"), 0);
    assert.equal(
      (await s.getOrder("O-200", "agent-1")).lines[0].remaining_qty,
      1,
    );
  },
  "UAT-10": async (s) => {
    const r = await create(s, input("O-200", "L-02"));
    assert.equal(r.status, "AWAITING_APPROVAL");
    assert.equal(r.amountVnd, 900000);
  },
  "UAT-11": async (s) => {
    assert.equal(
      (await create(s, input("O-100", "L-01", 2))).status,
      "APPROVED",
    );
  },
  "UAT-12": async (s) => {
    const r = await create(s, input("O-100", "L-01", 1, "DAMAGED"));
    assert.equal(r.status, "AWAITING_APPROVAL");
    assert.equal(
      (
        await s.decide(
          r.id,
          { approved: true, reason: "Damage exception accepted" },
          "manager-1",
        )
      ).status,
      "APPROVED",
    );
  },
  "UAT-13": async (s) => {
    const r = await create(
      s,
      input("O-100", "L-01", 1, "DAMAGED"),
      "manager-1",
    );
    await denied(
      () => s.decide(r.id, { approved: true, reason: "Own case" }, "manager-1"),
      "SELF_APPROVAL",
      403,
    );
    assert.equal(
      (await s.snapshot("manager-1")).returns[0].status,
      "AWAITING_APPROVAL",
    );
  },
  "UAT-14": async (s) => {
    const r = await create(s, input("O-100", "L-01", 1, "DAMAGED"));
    await denied(
      () => s.decide(r.id, { approved: true, reason: "Wrong role" }, "agent-1"),
      "FORBIDDEN",
      403,
    );
    await denied(
      () => s.decide(r.id, { approved: true, reason: "" }, "manager-1"),
      "INVALID_FIELD",
      400,
    );
    await s.decide(
      r.id,
      { approved: false, reason: "Exception not supported" },
      "manager-1",
    );
    assert.equal(
      (await s.getOrder("O-100", "agent-1")).lines[0].remaining_qty,
      2,
    );
  },
  "UAT-15": async (s) => {
    const r = await accepted(s);
    const snap = await s.snapshot("store-1");
    assert.equal(snap.returns[0].status, "ACCEPTED");
    assert.equal(
      snap.audit.find((a) => a.action === "GOODS_INSPECTED").detail
        .inventoryDisposition,
      "RESTOCK_CANDIDATE",
    );
  },
  "UAT-16": async (s) => {
    const r = await create(s);
    await s.inspect(
      r.id,
      { passed: false, reason: "Quantity discrepancy" },
      "store-1",
    );
    await denied(
      () =>
        s.refund(
          { returnId: r.id, simulationOutcome: "SUCCEEDED" },
          "dispute-key-001",
          "finance-1",
        ),
      "INVALID_STATE",
      409,
    );
    const snap = await s.snapshot("store-1");
    assert.equal(snap.returns[0].status, "DISPUTED");
    assert.equal(snap.audit[0].detail.inventoryDisposition, "QUARANTINE");
    assert.equal(
      (await s.getOrder("O-100", "agent-1")).lines[0].remaining_qty,
      1,
    );
  },
  "UAT-17": async (s) => {
    const pending = await create(s, input("O-100", "L-01", 1, "DAMAGED"));
    await denied(
      () =>
        s.inspect(
          pending.id,
          { passed: true, reason: "Not approved" },
          "store-1",
        ),
      "INVALID_STATE",
      409,
    );
    const r = await create(s);
    await denied(
      () => s.inspect(r.id, { passed: true, reason: "Not store" }, "agent-1"),
      "FORBIDDEN",
      403,
    );
  },
  "UAT-18": async (s) => {
    assert.deepEqual(allocateUnits(100001, 3), [33334, 33334, 33333]);
    const amounts = [];
    for (let i = 0; i < 3; i++) {
      amounts.push(
        (await s.preview(input("O-EDGE", "L-04"), "agent-1")).amountVnd,
      );
      await create(s, input("O-EDGE", "L-04"));
    }
    assert.deepEqual(amounts, [33334, 33334, 33333]);
    assert.equal(
      amounts.reduce((a, b) => a + b),
      100001,
    );
  },
  "UAT-19": async (s) =>
    denied(
      () => s.preview({ ...input(), amountVnd: 1 }, "agent-1"),
      "UNKNOWN_FIELD",
      400,
    ),
  "UAT-20": async (s) => {
    const f = await paid(s);
    assert.equal(f.status, "SUCCEEDED");
    const snap = await s.snapshot("finance-1");
    assert.equal(snap.returns[0].status, "COMPLETED");
    assert.equal(await count(s, "refund_instructions"), 1);
    assert.equal(await count(s, "payment_attempts"), 1);
  },
  "UAT-21": async (s) => {
    const r = await accepted(s),
      b = { returnId: r.id, simulationOutcome: "SUCCEEDED" };
    const a = await s.refund(b, "exact-replay-001", "finance-1"),
      b2 = await s.refund(b, "exact-replay-001", "finance-1");
    assert.equal(b2.id, a.id);
    assert.equal(b2.attemptId, a.attemptId);
    assert.equal(b2.replayed, true);
    assert.equal(await count(s, "payment_attempts"), 1);
  },
  "UAT-22": async (s) => {
    const f = await paid(s, "UNKNOWN", "conflict-key-001");
    await denied(
      () =>
        s.refund(
          { returnId: f.returnId, simulationOutcome: "FAILED" },
          "conflict-key-001",
          "finance-1",
        ),
      "IDEMPOTENCY_CONFLICT",
      409,
    );
    await s.db.query("INSERT INTO actors VALUES('finance-2','FINANCE')");
    await denied(
      () =>
        s.refund(
          { returnId: f.returnId, simulationOutcome: "UNKNOWN" },
          "conflict-key-001",
          "finance-2",
        ),
      "IDEMPOTENCY_CONFLICT",
      409,
    );
  },
  "UAT-23": async (s) => {
    const r = await create(s),
      b = { returnId: r.id, simulationOutcome: "UNKNOWN" };
    await denied(
      () => s.refund(b, "guard-key-001", "agent-1"),
      "FORBIDDEN",
      403,
    );
    await denied(
      () => s.refund(b, "guard-key-001", "finance-1"),
      "INVALID_STATE",
      409,
    );
    await s.inspect(r.id, { passed: true, reason: "Intact" }, "store-1");
    await denied(
      () => s.refund(b, undefined, "finance-1"),
      "IDEMPOTENCY_KEY_REQUIRED",
      400,
    );
    await s.refund(b, "guard-key-001", "finance-1");
    await denied(
      () => s.refund(b, "guard-key-002", "finance-1"),
      "REFUND_EXISTS",
      409,
    );
    assert.equal(await count(s, "payment_attempts"), 1);
  },
  "UAT-24": async (s) => {
    const f = await paid(s, "UNKNOWN");
    assert.equal((await s.snapshot("finance-1")).returns[0].status, "ACCEPTED");
    await s.paymentEvent(event(f), "provider-1");
    const snap = await s.snapshot("finance-1");
    assert.equal(snap.refunds[0].status, "SUCCEEDED");
    assert.equal(snap.returns[0].status, "COMPLETED");
  },
  "UAT-25": async (s) => {
    const f = await paid(s, "UNKNOWN");
    await s.paymentEvent(event(f), "provider-1");
    assert.equal((await s.paymentEvent(event(f), "provider-1")).replayed, true);
    await denied(
      () => s.paymentEvent(event(f, "FAILED"), "provider-1"),
      "EVENT_CONFLICT",
      409,
    );
    assert.equal(await count(s, "payment_events"), 1);
  },
  "UAT-26": async (s) => {
    const f = await paid(s);
    const e = await s.paymentEvent(
      event(f, "FAILED", "stale-001"),
      "provider-1",
    );
    assert.equal(e.disposition, "IGNORED_TERMINAL");
    const snap = await s.snapshot("finance-1");
    assert.equal(snap.refunds[0].status, "SUCCEEDED");
    assert.equal(snap.returns[0].status, "COMPLETED");
  },
  "UAT-27": async (s) => {
    const f = await paid(s, "UNKNOWN");
    await denied(
      () => s.paymentEvent({ ...event(f), providerRef: "wrong" }, "provider-1"),
      "PROVIDER_REFERENCE_MISMATCH",
      409,
    );
    assert.equal((await s.snapshot("finance-1")).refunds[0].status, "UNKNOWN");
  },
  "UAT-28": async (s) => {
    const f = await paid(s, "FAILED");
    const retry = await s.retry(
      f.id,
      { simulationOutcome: "SUCCEEDED" },
      "retry-key-002",
      "finance-1",
    );
    assert.equal(retry.id, f.id);
    assert.equal(retry.amountVnd, f.amountVnd);
    assert.equal((await s.snapshot("finance-1")).refunds[0].attempt_no, 2);
    assert.equal(
      (await q(s, "SELECT * FROM payment_attempts WHERE status='SUCCEEDED'"))
        .length,
      1,
    );
    const replay = await s.retry(
      f.id,
      { simulationOutcome: "SUCCEEDED" },
      "retry-key-002",
      "finance-1",
    );
    assert.equal(replay.replayed, true);
  },
  "UAT-29": async (s) => {
    const f = await paid(s, "UNKNOWN");
    await denied(
      () =>
        s.retry(
          f.id,
          { simulationOutcome: "SUCCEEDED" },
          "unknown-key-002",
          "finance-1",
        ),
      "RETRY_BLOCKED",
      409,
    );
    await s.db.query(
      "UPDATE refund_instructions SET status='PENDING' WHERE id=$1",
      [f.id],
    );
    await denied(
      () =>
        s.retry(
          f.id,
          { simulationOutcome: "SUCCEEDED" },
          "pending-key-002",
          "finance-1",
        ),
      "RETRY_BLOCKED",
      409,
    );
    assert.equal(await count(s, "payment_attempts"), 1);
  },
  "UAT-30": async (s) => {
    const r = await create(s);
    await s.cancel(r.id, { reason: "Customer changed request" }, "agent-1");
    assert.equal(
      (await s.getOrder("O-100", "agent-1")).lines[0].remaining_qty,
      2,
    );
    assert.equal((await s.snapshot("agent-1")).returns[0].status, "CANCELLED");
  },
  "UAT-31": async (s) => {
    const results = await Promise.allSettled([
      create(s, input("O-100", "L-01", 2)),
      create(s, input("O-100", "L-01", 2), "agent-2"),
    ]);
    assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
    assert.equal(
      results.find((r) => r.status === "rejected").reason.code,
      "RETURN_QUANTITY_EXCEEDED",
    );
    assert.equal(await count(s, "return_requests"), 1);
  },
  "UAT-32": async (s) => {
    const r = await create(s);
    await denied(
      () => s.cancel(r.id, { reason: "Not owner" }, "agent-2"),
      "NOT_REQUESTER",
      403,
    );
    await s.inspect(r.id, { passed: true, reason: "Intact" }, "store-1");
    await denied(
      () => s.cancel(r.id, { reason: "Too late" }, "agent-1"),
      "INVALID_STATE",
      409,
    );
    assert.equal(
      (await s.getOrder("O-100", "agent-1")).lines[0].remaining_qty,
      1,
    );
  },
  "UAT-33": async (s) => {
    await paid(s, "UNKNOWN");
    const snap = await s.snapshot("finance-1");
    assert.equal(snap.returns.length, 1);
    assert.equal(snap.refunds[0].attempt_no, 1);
    assert.equal(snap.refunds[0].status, "UNKNOWN");
    assert.ok(snap.audit.length >= 3);
    await denied(() => s.snapshot("provider-1"), "FORBIDDEN", 403);
  },
  "UAT-34": async (s) => {
    await paid(s);
    const before = await count(s, "audit_events");
    await denied(
      () => s.preview(input("O-OLD", "L-03"), "agent-1"),
      "RETURN_WINDOW",
    );
    assert.equal(await count(s, "audit_events"), before);
    for (const a of (await s.snapshot("manager-1")).audit) {
      for (const f of ["actor_id", "created_at", "entity_id", "action"])
        assert.ok(a[f]);
      assert.ok(a.after_status);
    }
  },
  "UAT-35": async (s) => httpChecks(s),
  "UAT-36": async (s) => {
    for (const body of [input("O-100", "L-01", 0), input("O-100", "L-01", 1.5)])
      await denied(() => create(s, body), "INVALID_QUANTITY", 400);
    const duplicate = input();
    duplicate.items.push({ ...duplicate.items[0] });
    await denied(() => create(s, duplicate), "DUPLICATE_LINE", 400);
    await denied(
      () => create(s, input("O-100", "L-02")),
      "LINE_ORDER_MISMATCH",
      422,
    );
    await denied(
      () => create(s, { ...input(), storeId: "S99" }),
      "INVALID_STORE",
      400,
    );
    await denied(
      () => create(s, { ...input(), reasonCode: "OTHER" }),
      "INVALID_REASON",
      400,
    );
    await denied(
      () => create(s, { ...input(), unexpected: true }),
      "UNKNOWN_FIELD",
      400,
    );
    assert.equal(await count(s, "return_requests"), 0);
  },
  "UAT-37": async (s) => sqlChecks(s),
};
const httpSamples = [];
let sqlResults;
async function httpChecks(s) {
  const server = makeServer(s);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/api`;
  const hit = async (
    method,
    route,
    {
      body,
      actor = "agent-1",
      headers = {},
      raw,
      expected = 200,
      template = route,
    } = {},
  ) => {
    const h = { "X-Demo-Actor": actor, ...headers };
    if (body !== undefined) h["Content-Type"] = "application/json";
    if (actor === null) delete h["X-Demo-Actor"];
    const response = await fetch(url + route, {
      method,
      headers: h,
      body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
    });
    const result = await response.json();
    assert.equal(response.status, expected, JSON.stringify(result));
    httpSamples.push({
      path: template,
      method: method.toLowerCase(),
      status: response.status,
      body: result,
    });
    return result;
  };
  try {
    for (const [asset, expectedType] of [
      ["/", "text/html"],
      ["/prototype/app.js", "text/javascript"],
      ["/prototype/styles.css", "text/css"],
      ["/prototype/process.html", "text/html"],
    ]) {
      const assetResponse = await fetch(url.replace(/\/api$/, "") + asset);
      assert.equal(assetResponse.status, 200, `Static asset ${asset}`);
      assert.ok(
        assetResponse.headers.get("content-type").startsWith(expectedType),
      );
      assert.ok((await assetResponse.text()).length > 20);
    }
    await hit("GET", "/health");
    await hit("GET", "/orders");
    await hit("GET", "/orders/O-100", { template: "/orders/{id}" });
    await hit("GET", "/workbench", { actor: null, expected: 401 });
    await hit("GET", "/workbench", { actor: "unknown-user", expected: 401 });
    await hit("POST", "/return-previews", {
      raw: "{",
      headers: { "Content-Type": "application/json" },
      expected: 400,
    });
    await hit("POST", "/return-previews", {
      raw: "hello",
      headers: { "Content-Type": "text/plain" },
      expected: 415,
    });
    await hit("POST", "/return-previews", { body: input() });
    const r = await hit("POST", "/return-requests", {
      body: input("O-100", "L-01", 1, "DAMAGED"),
      expected: 201,
    });
    await hit("POST", `/return-requests/${r.id}/approval`, {
      actor: "manager-1",
      body: { approved: true, reason: "Case reviewed" },
      template: "/return-requests/{id}/approval",
    });
    await hit("POST", `/return-requests/${r.id}/inspection`, {
      actor: "store-1",
      body: { passed: true, reason: "Intact" },
      template: "/return-requests/{id}/inspection",
    });
    const f = await hit("POST", "/refunds", {
      actor: "finance-1",
      headers: { "Idempotency-Key": "http-key-001" },
      body: { returnId: r.id, simulationOutcome: "FAILED" },
      expected: 201,
    });
    const retry = await hit("POST", `/refunds/${f.id}/retry`, {
      actor: "finance-1",
      headers: { "Idempotency-Key": "http-key-002" },
      body: { simulationOutcome: "UNKNOWN" },
      expected: 201,
      template: "/refunds/{id}/retry",
    });
    await hit("POST", "/payment-events", {
      actor: "provider-1",
      body: event(retry),
    });
    await hit("GET", "/workbench", { actor: "finance-1" });
    const r2 = await hit("POST", "/return-requests", {
      body: input(),
      expected: 201,
    });
    await hit("POST", `/return-requests/${r2.id}/cancellation`, {
      body: { reason: "No longer needed" },
      template: "/return-requests/{id}/cancellation",
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}
async function sqlChecks(s) {
  const statements = (
    await readFile(new URL("sql/02-analysis.sql", root), "utf8")
  )
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((x) => x.trim())
    .filter(Boolean);
  const before = [];
  for (const statement of statements) before.push(await q(s, statement));
  assert.equal(before[0].find((r) => r.id === "L-01").remaining_qty, 2);
  assert.equal(before[1].length, 0);
  for (const rows of before.slice(2)) assert.equal(rows.length, 0);
  await paid(s);
  const after = [];
  for (const statement of statements) after.push(await q(s, statement));
  assert.equal(after[0].find((r) => r.id === "L-01").remaining_qty, 1);
  for (const rows of after.slice(2)) assert.equal(rows.length, 0);
  sqlResults = {
    clock: DEMO_NOW,
    engine: "PostgreSQL via PGlite",
    cleanSeed: before,
    afterSuccessfulPartialReturn: after,
  };
}
await mkdir(new URL("evidence/", root), { recursive: true });
const started = new Date().toISOString(),
  results = [];
for (const scenario of catalog.uat) {
  const begin = performance.now();
  let system;
  try {
    system = await createSystem();
    assert.ok(tests[scenario.id], "Scenario has no executable check");
    await tests[scenario.id](system);
    results.push({
      id: scenario.id,
      title: scenario.title,
      result: "PASS",
      durationMs: Math.round(performance.now() - begin),
    });
    console.log(`PASS ${scenario.id} ${scenario.title}`);
  } catch (error) {
    results.push({
      id: scenario.id,
      title: scenario.title,
      result: "FAIL",
      error: error.stack,
      durationMs: Math.round(performance.now() - begin),
    });
    console.error(`FAIL ${scenario.id}`, error.message);
  } finally {
    if (system) await system.close();
  }
}
const structural = [];
try {
  const ids = new Set(catalog.uat.map((c) => c.id)),
    rules = new Set(catalog.rules.map((r) => r.id));
  for (const r of catalog.requirements) {
    assert.ok(r.uat.length);
    for (const c of r.uat) assert.ok(ids.has(c));
    for (const b of r.rules) assert.ok(rules.has(b));
  }
  structural.push({
    check: "Functional requirement traceability",
    result: "PASS",
    requirements: catalog.requirements.length,
    scenarios: ids.size,
  });
  for (const file of (await readdir(new URL("diagrams/", root))).filter((f) =>
    f.endsWith(".bpmn"),
  )) {
    const result = await new BpmnModdle().fromXML(
      await readFile(new URL("diagrams/" + file, root), "utf8"),
    );
    assert.equal(result.warnings.length, 0);
    structural.push({ check: "BPMN import " + file, result: "PASS" });
  }
  async function walk(dir) {
    const entries = await readdir(new URL(dir, root), { withFileTypes: true });
    for (const e of entries) {
      if (["node_modules", ".git", ".venv", ".local"].includes(e.name))
        continue;
      const name = path.posix.join(dir, e.name);
      if (e.isDirectory()) await walk(name + "/");
      else if (e.name.endsWith(".md")) {
        const data = await readFile(new URL(name, root), "utf8");
        for (const match of data.matchAll(/\]\(([^)]+)\)/g)) {
          const link = match[1];
          if (/^(https?:|#|mailto:)/.test(link)) continue;
          assert.ok(
            existsSync(new URL(link.split("#")[0], new URL(name, root))),
            `Broken link: ${name}: ${link}`,
          );
        }
      }
    }
  }
  await walk("");
  structural.push({ check: "Local Markdown links", result: "PASS" });
} catch (error) {
  structural.push({
    check: "Repository integrity",
    result: "FAIL",
    error: error.message,
  });
}
const passed = results.filter((r) => r.result === "PASS").length;
const report = {
  executedAt: started,
  node: process.version,
  platform: os.platform(),
  architecture: os.arch(),
  database: "PGlite / embedded PostgreSQL",
  fixedBusinessClock: DEMO_NOW,
  context:
    "Synthetic automated reference-model acceptance checks. No stakeholder UAT or production payment.",
  summary: { total: results.length, passed, failed: results.length - passed },
  cases: results,
  structural,
};
await writeFile(
  new URL("evidence/validation-results.json", root),
  JSON.stringify(report, null, 2) + "\n",
);
await writeFile(
  new URL("evidence/http-samples.json", root),
  JSON.stringify(httpSamples, null, 2) + "\n",
);
if (sqlResults)
  await writeFile(
    new URL("evidence/sql-results.json", root),
    JSON.stringify(sqlResults, null, 2) + "\n",
  );
console.log(`${passed}/${results.length} acceptance scenarios passed.`);
if (passed !== results.length || structural.some((r) => r.result === "FAIL"))
  process.exitCode = 1;
