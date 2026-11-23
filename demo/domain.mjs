import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID, createHash } from "node:crypto";

export const DEMO_NOW = "2026-11-23T09:00:00Z";
export const POLICY = {
  version: "0.1",
  windowDays: 30,
  approvalThresholdVnd: 500000,
  currency: "VND",
};
export class DomainError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
const fail = (status, code, message) => {
  throw new DomainError(status, code, message);
};
const one = async (db, sql, args = []) => (await db.query(sql, args)).rows[0];
const id = (prefix) => `${prefix}-${randomUUID()}`;
const hash = (object) =>
  createHash("sha256").update(JSON.stringify(object)).digest("hex");
const outcomes = ["PENDING", "UNKNOWN", "FAILED", "SUCCEEDED"];
const checkFields = (body, allowed) => {
  if (!body || typeof body !== "object" || Array.isArray(body))
    fail(400, "INVALID_BODY", "A JSON object is required.");
  if (Object.keys(body).some((k) => !allowed.includes(k)))
    fail(400, "UNKNOWN_FIELD", "Remove fields not defined in the contract.");
};
const text = (value, name) => {
  if (typeof value !== "string" || !value.trim() || value.length > 200)
    fail(
      400,
      "INVALID_FIELD",
      `${name} must be a non-empty string of at most 200 characters.`,
    );
  return value;
};
export function allocateUnits(netPaidVnd, quantity) {
  if (
    !Number.isSafeInteger(netPaidVnd) ||
    netPaidVnd < 0 ||
    !Number.isInteger(quantity) ||
    quantity <= 0
  )
    throw new TypeError("Invalid allocation inputs");
  const floor = Math.floor(netPaidVnd / quantity),
    remainder = netPaidVnd % quantity;
  return Array.from(
    { length: quantity },
    (_, i) => floor + (i < remainder ? 1 : 0),
  );
}

export async function createSystem({ now = DEMO_NOW } = {}) {
  const db = new PGlite();
  await db.exec(
    await readFile(new URL("../sql/00-schema.sql", import.meta.url), "utf8"),
  );
  await db.exec(
    await readFile(new URL("../sql/01-seed.sql", import.meta.url), "utf8"),
  );
  const clock = () => new Date(now).toISOString();
  const actor = async (tx, actorId, roles) => {
    const a = await one(tx, "SELECT * FROM actors WHERE id=$1", [actorId]);
    if (!a) fail(401, "DEMO_ACTOR_REQUIRED", "Select a known synthetic actor.");
    if (!roles.includes(a.role))
      fail(403, "FORBIDDEN", "This role cannot perform this action.");
    return a;
  };
  const audit = async (tx, entity, who, action, before, after, detail = {}) =>
    tx.query(
      "INSERT INTO audit_events(entity_id,actor_id,action,before_status,after_status,detail,created_at) VALUES($1,$2,$3,$4,$5,$6,$7)",
      [entity, who, action, before, after, JSON.stringify(detail), clock()],
    );
  const getReturn = async (tx, returnId) => {
    const r = await one(tx, "SELECT * FROM return_requests WHERE id=$1", [
      returnId,
    ]);
    if (!r) fail(404, "RETURN_NOT_FOUND", "Return request not found.");
    return r;
  };
  const selectUnits = async (tx, body) => {
    checkFields(body, ["orderId", "items", "storeId", "reasonCode"]);
    text(body.orderId, "orderId");
    const o = await one(tx, "SELECT * FROM orders WHERE id=$1", [body.orderId]);
    if (!o) fail(404, "ORDER_NOT_FOUND", "Order not found.");
    const age = Date.parse(now) - Date.parse(o.delivered_at);
    if (age < 0 || age > POLICY.windowDays * 86400000)
      fail(
        422,
        "RETURN_WINDOW",
        "Return must be requested between delivery and the inclusive 30-day cutoff.",
      );
    if (!["S01", "S02", "S03"].includes(body.storeId))
      fail(400, "INVALID_STORE", "Select S01, S02, or S03.");
    if (!["NOT_SUITABLE", "DAMAGED", "WRONG_ITEM"].includes(body.reasonCode))
      fail(400, "INVALID_REASON", "Select a supported reason code.");
    if (
      !Array.isArray(body.items) ||
      body.items.length < 1 ||
      body.items.length > 20
    )
      fail(400, "INVALID_ITEMS", "Supply 1 to 20 distinct order lines.");
    const seen = new Set(),
      units = [];
    for (const item of body.items) {
      checkFields(item, ["orderLineId", "quantity"]);
      text(item.orderLineId, "orderLineId");
      if (seen.has(item.orderLineId))
        fail(400, "DUPLICATE_LINE", "Combine quantities for each order line.");
      seen.add(item.orderLineId);
      if (!Number.isInteger(item.quantity) || item.quantity <= 0)
        fail(400, "INVALID_QUANTITY", "Quantity must be a positive integer.");
      const line = await one(
        tx,
        "SELECT * FROM order_lines WHERE id=$1 AND order_id=$2",
        [item.orderLineId, body.orderId],
      );
      if (!line)
        fail(
          422,
          "LINE_ORDER_MISMATCH",
          "Order line does not belong to this order.",
        );
      if (line.category === "CONSUMABLE")
        fail(
          422,
          "CATEGORY_EXCLUDED",
          "Consumables are excluded by the case-study policy.",
        );
      const available = (
        await tx.query(
          "SELECT ou.* FROM order_units ou WHERE ou.line_id=$1 AND NOT EXISTS (SELECT 1 FROM return_units ru WHERE ru.unit_id=ou.id AND ru.active) ORDER BY ou.ordinal LIMIT $2",
          [line.id, item.quantity],
        )
      ).rows;
      if (available.length !== item.quantity)
        fail(
          409,
          "RETURN_QUANTITY_EXCEEDED",
          "Quantity exceeds unreserved, unreturned units.",
        );
      units.push(...available);
    }
    const amountVnd = units.reduce((n, u) => n + u.net_paid_vnd, 0);
    return {
      units,
      amountVnd,
      currency: "VND",
      approvalRequired:
        amountVnd > POLICY.approvalThresholdVnd ||
        body.reasonCode === "DAMAGED",
      policyVersion: POLICY.version,
    };
  };
  const checkKey = (key) => {
    if (typeof key !== "string" || !/^[A-Za-z0-9._:-]{8,100}$/.test(key))
      fail(
        400,
        "IDEMPOTENCY_KEY_REQUIRED",
        "Use an 8–100 character Idempotency-Key (letters, digits, . _ : -).",
      );
  };
  const replay = async (tx, key, fingerprint, who) => {
    checkKey(key);
    const saved = await one(
      tx,
      "SELECT * FROM idempotency_records WHERE key=$1",
      [key],
    );
    if (saved) {
      if (saved.fingerprint !== fingerprint || saved.actor_id !== who)
        fail(
          409,
          "IDEMPOTENCY_CONFLICT",
          "Key was used for a different operation, payload, or actor.",
        );
      return { ...saved.response_json, replayed: true };
    }
    return null;
  };
  const saveReplay = async (tx, key, fingerprint, who, response) =>
    tx.query("INSERT INTO idempotency_records VALUES($1,$2,$3,$4)", [
      key,
      fingerprint,
      who,
      JSON.stringify(response),
    ]);
  const updatePayment = async (tx, refund, attempt, status, who, action) => {
    await tx.query(
      "UPDATE payment_attempts SET status=$1,updated_at=$2 WHERE id=$3",
      [status, clock(), attempt.id],
    );
    await tx.query(
      "UPDATE refund_instructions SET status=$1,updated_at=$2 WHERE id=$3",
      [status, clock(), refund.id],
    );
    await audit(tx, refund.id, who, action, refund.status, status, {
      attemptId: attempt.id,
      amountVnd: refund.amount_vnd,
    });
    if (status === "SUCCEEDED") {
      const r = await getReturn(tx, refund.return_id);
      await tx.query(
        "UPDATE return_requests SET status='COMPLETED',updated_at=$1 WHERE id=$2",
        [clock(), r.id],
      );
      await audit(tx, r.id, who, "RETURN_COMPLETED", r.status, "COMPLETED", {
        refundId: refund.id,
      });
    }
  };
  const submitAttempt = async (tx, refund, outcome, who) => {
    const last = await one(
      tx,
      "SELECT COALESCE(MAX(attempt_no),0)::integer AS n FROM payment_attempts WHERE refund_id=$1",
      [refund.id],
    );
    const attempt = {
      id: id("PA"),
      provider_ref: id("MOCK"),
      attempt_no: last.n + 1,
    };
    await tx.query(
      "INSERT INTO payment_attempts VALUES($1,$2,$3,$4,$5,$6,$6)",
      [
        attempt.id,
        refund.id,
        attempt.attempt_no,
        attempt.provider_ref,
        "PENDING",
        clock(),
      ],
    );
    await updatePayment(
      tx,
      refund,
      attempt,
      outcome,
      who,
      "MOCK_PAYMENT_RESULT",
    );
    return {
      id: refund.id,
      returnId: refund.return_id,
      amountVnd: refund.amount_vnd,
      currency: "VND",
      status: outcome,
      attemptId: attempt.id,
      providerRef: attempt.provider_ref,
      replayed: false,
    };
  };
  return {
    db,
    now,
    async listOrders(who) {
      await actor(db, who, ["AGENT", "MANAGER", "STORE", "FINANCE"]);
      return (await db.query("SELECT * FROM orders ORDER BY id")).rows;
    },
    async getOrder(orderId, who) {
      await actor(db, who, ["AGENT", "MANAGER", "STORE", "FINANCE"]);
      const o = await one(db, "SELECT * FROM orders WHERE id=$1", [orderId]);
      if (!o) fail(404, "ORDER_NOT_FOUND", "Order not found.");
      const lines = (
        await db.query(
          "SELECT ol.*, (SELECT COUNT(*)::integer FROM order_units ou WHERE ou.line_id=ol.id AND NOT EXISTS (SELECT 1 FROM return_units ru WHERE ru.unit_id=ou.id AND ru.active)) AS remaining_qty FROM order_lines ol WHERE order_id=$1 ORDER BY ol.id",
          [orderId],
        )
      ).rows;
      return { ...o, lines };
    },
    async preview(body, who) {
      return db.transaction(async (tx) => {
        await actor(tx, who, ["AGENT", "MANAGER"]);
        const p = await selectUnits(tx, body);
        return {
          amountVnd: p.amountVnd,
          currency: p.currency,
          approvalRequired: p.approvalRequired,
          policyVersion: p.policyVersion,
          unitIds: p.units.map((u) => u.id),
        };
      });
    },
    async createReturn(body, who) {
      return db.transaction(async (tx) => {
        await actor(tx, who, ["AGENT", "MANAGER"]);
        const p = await selectUnits(tx, body);
        const rid = id("R"),
          status = p.approvalRequired ? "AWAITING_APPROVAL" : "APPROVED";
        await tx.query(
          "INSERT INTO return_requests VALUES($1,$2,$3,$4,$5,$6,$7,$8,$8)",
          [
            rid,
            body.orderId,
            body.storeId,
            body.reasonCode,
            who,
            status,
            p.amountVnd,
            clock(),
          ],
        );
        for (const unit of p.units)
          await tx.query("INSERT INTO return_units VALUES($1,$2,true)", [
            rid,
            unit.id,
          ]);
        await audit(tx, rid, who, "RETURN_CREATED", null, status, {
          policyVersion: POLICY.version,
          unitIds: p.units.map((u) => u.id),
        });
        return { id: rid, status, amountVnd: p.amountVnd, currency: "VND" };
      });
    },
    async decide(returnId, body, who) {
      return db.transaction(async (tx) => {
        await actor(tx, who, ["MANAGER"]);
        checkFields(body, ["approved", "reason"]);
        if (typeof body.approved !== "boolean")
          fail(400, "INVALID_DECISION", "approved must be a boolean.");
        text(body.reason, "reason");
        const r = await getReturn(tx, returnId);
        if (r.status !== "AWAITING_APPROVAL")
          fail(
            409,
            "INVALID_STATE",
            "Only awaiting-approval requests can be decided.",
          );
        if (r.requester_id === who)
          fail(
            403,
            "SELF_APPROVAL",
            "Requester cannot approve or reject their own exception.",
          );
        const status = body.approved ? "APPROVED" : "REJECTED";
        await tx.query(
          "UPDATE return_requests SET status=$1,updated_at=$2 WHERE id=$3",
          [status, clock(), r.id],
        );
        if (!body.approved)
          await tx.query(
            "UPDATE return_units SET active=false WHERE return_id=$1",
            [r.id],
          );
        await audit(tx, r.id, who, "APPROVAL_DECISION", r.status, status, {
          reason: body.reason,
        });
        return { id: r.id, status };
      });
    },
    async cancel(returnId, body, who) {
      return db.transaction(async (tx) => {
        const a = await actor(tx, who, ["AGENT", "MANAGER"]);
        checkFields(body, ["reason"]);
        text(body.reason, "reason");
        const r = await getReturn(tx, returnId);
        if (a.role === "AGENT" && r.requester_id !== who)
          fail(
            403,
            "NOT_REQUESTER",
            "Only the requester or a manager may cancel.",
          );
        if (!["AWAITING_APPROVAL", "APPROVED"].includes(r.status))
          fail(
            409,
            "INVALID_STATE",
            "Cancellation is allowed only before inspection.",
          );
        await tx.query(
          "UPDATE return_requests SET status='CANCELLED',updated_at=$1 WHERE id=$2",
          [clock(), r.id],
        );
        await tx.query(
          "UPDATE return_units SET active=false WHERE return_id=$1",
          [r.id],
        );
        await audit(tx, r.id, who, "RETURN_CANCELLED", r.status, "CANCELLED", {
          reason: body.reason,
        });
        return { id: r.id, status: "CANCELLED" };
      });
    },
    async inspect(returnId, body, who) {
      return db.transaction(async (tx) => {
        await actor(tx, who, ["STORE"]);
        checkFields(body, ["passed", "reason"]);
        if (typeof body.passed !== "boolean")
          fail(400, "INVALID_INSPECTION", "passed must be boolean.");
        text(body.reason, "reason");
        const r = await getReturn(tx, returnId);
        if (r.status !== "APPROVED")
          fail(409, "INVALID_STATE", "Inspect only an approved request.");
        const status = body.passed ? "ACCEPTED" : "DISPUTED";
        await tx.query(
          "UPDATE return_requests SET status=$1,updated_at=$2 WHERE id=$3",
          [status, clock(), r.id],
        );
        await audit(tx, r.id, who, "GOODS_INSPECTED", r.status, status, {
          reason: body.reason,
          inventoryDisposition: body.passed
            ? "RESTOCK_CANDIDATE"
            : "QUARANTINE",
        });
        return { id: r.id, status };
      });
    },
    async refund(body, key, who) {
      return db.transaction(async (tx) => {
        await actor(tx, who, ["FINANCE"]);
        checkFields(body, ["returnId", "simulationOutcome"]);
        text(body.returnId, "returnId");
        if (!outcomes.includes(body.simulationOutcome))
          fail(400, "INVALID_OUTCOME", "Select a mock outcome.");
        const fingerprint = hash([
            "refund",
            body.returnId,
            body.simulationOutcome,
          ]),
          saved = await replay(tx, key, fingerprint, who);
        if (saved) return saved;
        const r = await getReturn(tx, body.returnId);
        if (r.status !== "ACCEPTED")
          fail(
            409,
            "INVALID_STATE",
            "Refund only an inspected, accepted return.",
          );
        if (
          await one(
            tx,
            "SELECT id FROM refund_instructions WHERE return_id=$1",
            [r.id],
          )
        )
          fail(
            409,
            "REFUND_EXISTS",
            "A logical refund already exists. Use its status or the guarded retry operation.",
          );
        const refund = {
          id: id("RF"),
          return_id: r.id,
          amount_vnd: r.amount_vnd,
          status: "PENDING",
        };
        await tx.query(
          "INSERT INTO refund_instructions VALUES($1,$2,$3,$4,$5,$5)",
          [refund.id, r.id, r.amount_vnd, "PENDING", clock()],
        );
        const response = await submitAttempt(
          tx,
          refund,
          body.simulationOutcome,
          who,
        );
        await saveReplay(tx, key, fingerprint, who, response);
        return response;
      });
    },
    async retry(refundId, body, key, who) {
      return db.transaction(async (tx) => {
        await actor(tx, who, ["FINANCE"]);
        checkFields(body, ["simulationOutcome"]);
        if (!outcomes.includes(body.simulationOutcome))
          fail(400, "INVALID_OUTCOME", "Select a mock outcome.");
        const fingerprint = hash(["retry", refundId, body.simulationOutcome]),
          saved = await replay(tx, key, fingerprint, who);
        if (saved) return saved;
        const refund = await one(
          tx,
          "SELECT * FROM refund_instructions WHERE id=$1",
          [refundId],
        );
        if (!refund) fail(404, "REFUND_NOT_FOUND", "Refund not found.");
        if (refund.status !== "FAILED")
          fail(
            409,
            "RETRY_BLOCKED",
            "Retry only after a definitive failed outcome; pending or unknown outcomes require reconciliation.",
          );
        const response = await submitAttempt(
          tx,
          refund,
          body.simulationOutcome,
          who,
        );
        await saveReplay(tx, key, fingerprint, who, response);
        return response;
      });
    },
    async paymentEvent(body, who) {
      return db.transaction(async (tx) => {
        await actor(tx, who, ["PROVIDER"]);
        checkFields(body, ["eventId", "attemptId", "providerRef", "status"]);
        for (const k of ["eventId", "attemptId", "providerRef"])
          text(body[k], k);
        if (!["SUCCEEDED", "FAILED"].includes(body.status))
          fail(
            400,
            "INVALID_EVENT_STATUS",
            "Reconciliation event must confirm SUCCEEDED or FAILED.",
          );
        const fingerprint = hash([
            body.attemptId,
            body.providerRef,
            body.status,
          ]),
          old = await one(tx, "SELECT * FROM payment_events WHERE id=$1", [
            body.eventId,
          ]);
        if (old) {
          if (old.fingerprint !== fingerprint)
            fail(
              409,
              "EVENT_CONFLICT",
              "Event ID was reused with different content.",
            );
          return {
            eventId: body.eventId,
            disposition: old.disposition,
            replayed: true,
          };
        }
        const attempt = await one(
          tx,
          "SELECT * FROM payment_attempts WHERE id=$1",
          [body.attemptId],
        );
        if (!attempt) fail(404, "ATTEMPT_NOT_FOUND", "Attempt not found.");
        if (attempt.provider_ref !== body.providerRef)
          fail(
            409,
            "PROVIDER_REFERENCE_MISMATCH",
            "Provider reference does not match this attempt.",
          );
        const refund = await one(
          tx,
          "SELECT * FROM refund_instructions WHERE id=$1",
          [attempt.refund_id],
        );
        const disposition = ["FAILED", "SUCCEEDED"].includes(attempt.status)
          ? "IGNORED_TERMINAL"
          : "APPLIED";
        await tx.query("INSERT INTO payment_events VALUES($1,$2,$3,$4,$5)", [
          body.eventId,
          attempt.id,
          fingerprint,
          disposition,
          clock(),
        ]);
        if (disposition === "APPLIED")
          await updatePayment(
            tx,
            refund,
            attempt,
            body.status,
            who,
            "PAYMENT_RECONCILED",
          );
        else
          await audit(
            tx,
            refund.id,
            who,
            "PAYMENT_EVENT_IGNORED",
            refund.status,
            refund.status,
            { eventId: body.eventId },
          );
        return { eventId: body.eventId, disposition, replayed: false };
      });
    },
    async snapshot(who) {
      await actor(db, who, ["AGENT", "MANAGER", "STORE", "FINANCE"]);
      return {
        returns: (
          await db.query("SELECT * FROM return_requests ORDER BY created_at,id")
        ).rows,
        refunds: (
          await db.query(
            "SELECT ri.*,pa.id AS attempt_id,pa.provider_ref,pa.attempt_no FROM refund_instructions ri JOIN payment_attempts pa ON pa.refund_id=ri.id WHERE pa.attempt_no=(SELECT MAX(p.attempt_no) FROM payment_attempts p WHERE p.refund_id=ri.id) ORDER BY ri.id",
          )
        ).rows,
        audit: (
          await db.query(
            "SELECT * FROM audit_events ORDER BY id DESC LIMIT 100",
          )
        ).rows,
      };
    },
    async close() {
      await db.close();
    },
  };
}
