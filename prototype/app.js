"use strict";
const $ = (s) => document.querySelector(s),
  esc = (v) =>
    String(v ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const money = (n) => new Intl.NumberFormat("en-US").format(n) + " VND";
let currentOrder = null,
  pending = null,
  selectedAction = null,
  selectedRow = null;
function message(text, error = false) {
  $("#message").textContent = text;
  $("#message").className = error ? "error" : "";
}
async function api(path, body, options = {}) {
  const headers = { "X-Demo-Actor": options.actor || $("#actor").value };
  if (body) headers["Content-Type"] = "application/json";
  if (options.key) headers["Idempotency-Key"] = options.key;
  const response = await fetch("/api" + path, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();
  $("#api-response").textContent = JSON.stringify(
    { httpStatus: response.status, body: data },
    null,
    2,
  );
  if (!response.ok) throw new Error(`${data.code}: ${data.message}`);
  return data;
}
function requestBody() {
  return {
    orderId: $("#order-id").value.trim(),
    items: [
      {
        orderLineId: $("#line-id").value,
        quantity: Number($("#quantity").value),
      },
    ],
    storeId: $("#store").value,
    reasonCode: $("#reason").value,
  };
}
async function lookup() {
  currentOrder = await api(
    "/orders/" + encodeURIComponent($("#order-id").value.trim()),
  );
  $("#preview-card").hidden = true;
  pending = null;
  $("#order-detail").innerHTML =
    `<strong>${esc(currentOrder.id)} · Paid online order</strong><dl><dt>Delivered</dt><dd>${esc(new Date(currentOrder.delivered_at).toISOString().slice(0, 10))}</dd><dt>Currency</dt><dd>VND</dd></dl>${currentOrder.lines.map((l) => `<div class="line-item"><strong>${esc(l.product_name)}</strong><span>${esc(l.id)} · ${l.purchased_qty} purchased · ${l.remaining_qty} available</span><span>Original paid total: ${money(l.net_paid_vnd)}</span></div>`).join("")}`;
  $("#line-id").innerHTML = currentOrder.lines
    .map(
      (l) =>
        `<option value="${esc(l.id)}">${esc(l.id)} · ${esc(l.product_name)}</option>`,
    )
    .join("");
}
function showView(name) {
  document.querySelectorAll(".view").forEach((v) => (v.hidden = v.id !== name));
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => b.classList.toggle("active", b.dataset.view === name));
  $("#breadcrumb").textContent = {
    intake: "New return",
    queue: "Operations queue",
    audit: "Audit trail",
  }[name];
}
const badge = (s) => `<span class="status ${esc(s)}">${esc(s)}</span>`;
function actionButton(action, id, label) {
  return `<button class="secondary" data-action="${action}" data-id="${esc(id)}">${label}</button>`;
}
async function refresh() {
  const data = await api("/workbench");
  const actor = $("#actor").value;
  const isManager = actor === "manager-1",
    isStore = actor === "store-1",
    isFinance = actor === "finance-1";
  $("#metrics").innerHTML = [
    [data.returns.length, "Return requests"],
    [
      data.returns.filter(
        (r) => !["COMPLETED", "CANCELLED", "REJECTED"].includes(r.status),
      ).length,
      "Open returns",
    ],
    [
      data.refunds.filter((r) => ["UNKNOWN", "PENDING"].includes(r.status))
        .length,
      "Reconciliation required",
    ],
  ]
    .map(
      ([n, t]) =>
        `<div class="metric"><strong>${n}</strong><span>${t}</span></div>`,
    )
    .join("");
  $("#returns-body").innerHTML = data.returns.length
    ? data.returns
        .map(
          (r) =>
            `<tr><td><strong>${esc(r.id.slice(0, 12))}</strong><small>${esc(r.order_id)} · ${esc(r.store_id)}<br>Requested by ${esc(r.requester_id)}</small></td><td>${badge(r.status)}</td><td>${money(r.amount_vnd)}</td><td>${r.status === "AWAITING_APPROVAL" && isManager ? actionButton("approve", r.id, "Approve") + actionButton("reject", r.id, "Reject") : ""}${r.status === "APPROVED" && isStore ? actionButton("accept", r.id, "Accept inspection") + actionButton("dispute", r.id, "Record discrepancy") : ""}${r.status === "ACCEPTED" && isFinance && !data.refunds.some((f) => f.return_id === r.id) ? actionButton("refund", r.id, "Initiate mock refund") : ""}${["APPROVED", "AWAITING_APPROVAL"].includes(r.status) && (r.requester_id === actor || isManager) ? actionButton("cancel", r.id, "Cancel return") : ""}</td></tr>`,
        )
        .join("")
    : '<tr><td colspan="4" class="empty">No requests. Create a return from the intake screen.</td></tr>';
  $("#refunds-body").innerHTML = data.refunds.length
    ? data.refunds
        .map(
          (r) =>
            `<tr><td><strong>${esc(r.id.slice(0, 14))}</strong><small>Attempt ${r.attempt_no}<br>${esc(r.provider_ref.slice(0, 18))}</small></td><td>${badge(r.status)}</td><td>${money(r.amount_vnd)}</td><td>${r.status === "FAILED" && isFinance ? actionButton("retry", r.id, "Retry confirmed failure") : ""}${["UNKNOWN", "PENDING"].includes(r.status) && isFinance ? actionButton("reconcile", r.id, "Simulate provider confirmation") : ""}</td></tr>`,
        )
        .join("")
    : '<tr><td colspan="4" class="empty">No payment instructions.</td></tr>';
  $("#audit-body").innerHTML =
    data.audit
      .map(
        (a) =>
          `<tr><td><strong>${esc(a.action)}</strong><small>${esc(a.entity_id.slice(0, 16))}<br>${esc(new Date(a.created_at).toISOString())}</small></td><td>${esc(a.actor_id)}</td><td>${esc(a.before_status || "—")} / ${esc(a.after_status || "—")}</td><td>${esc(JSON.stringify(a.detail))}</td></tr>`,
      )
      .join("") || '<tr><td colspan="4" class="empty">No events yet.</td></tr>';
  return data;
}
function guard(fn) {
  return async (event) => {
    if (event?.type === "submit") event.preventDefault();
    try {
      message("");
      await fn(event);
    } catch (error) {
      message(error.message, true);
    }
  };
}
$("#lookup-form").addEventListener("submit", guard(lookup));
$("#return-form").addEventListener(
  "submit",
  guard(async () => {
    pending = requestBody();
    const result = await api("/return-previews", pending);
    $("#preview-amount").textContent = money(result.amountVnd);
    $("#preview-detail").textContent = result.approvalRequired
      ? "Manager approval required. The requester cannot approve this exception."
      : "Eligible under case-study policy. No additional manager approval required.";
    $("#preview-card").hidden = false;
  }),
);
$("#return-form").addEventListener("change", () => {
  $("#preview-card").hidden = true;
  pending = null;
});
$("#order-id").addEventListener("input", () => {
  $("#preview-card").hidden = true;
  pending = null;
});
$("#submit-return").addEventListener(
  "click",
  guard(async () => {
    if (!pending) return;
    const result = await api("/return-requests", pending);
    pending = null;
    $("#preview-card").hidden = true;
    message(
      `Return created: ${result.status}. Switch to the appropriate role for the next action.`,
    );
    showView("queue");
    await refresh();
  }),
);
document.querySelectorAll("[data-view]").forEach((b) =>
  b.addEventListener(
    "click",
    guard(async () => {
      showView(b.dataset.view);
      if (b.dataset.view !== "intake") await refresh();
    }),
  ),
);
$("#actor").addEventListener(
  "change",
  guard(async () => {
    pending = null;
    $("#preview-card").hidden = true;
    await refresh();
  }),
);
$("#refresh").addEventListener("click", guard(refresh));
document.addEventListener(
  "click",
  guard(async (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const data = await refresh();
    selectedAction = button.dataset.action;
    selectedRow = [...data.returns, ...data.refunds].find(
      (r) => r.id === button.dataset.id,
    );
    $("#action-title").textContent = button.textContent;
    $("#action-help").textContent =
      selectedAction === "reconcile"
        ? "This triggers a synthetic provider event on the existing attempt. It does not submit another payout."
        : "The server rechecks role, state, and business rules when confirmed.";
    $("#outcome-control").hidden = !["refund", "retry", "reconcile"].includes(
      selectedAction,
    );
    $("#outcome").innerHTML = (
      selectedAction === "reconcile"
        ? ["SUCCEEDED", "FAILED"]
        : ["SUCCEEDED", "UNKNOWN", "FAILED", "PENDING"]
    )
      .map((s) => `<option>${s}</option>`)
      .join("");
    $("#action-dialog").showModal();
  }),
);
$("#dismiss").addEventListener("click", () => $("#action-dialog").close());
$("#action-form").addEventListener(
  "submit",
  guard(async () => {
    const action = selectedAction,
      r = selectedRow,
      reason = $("#action-reason").value,
      outcome = $("#outcome").value;
    const base = "/return-requests/" + r.id;
    if (["approve", "reject"].includes(action))
      await api(base + "/approval", { approved: action === "approve", reason });
    if (["accept", "dispute"].includes(action))
      await api(base + "/inspection", { passed: action === "accept", reason });
    if (action === "cancel") await api(base + "/cancellation", { reason });
    if (action === "refund")
      await api(
        "/refunds",
        { returnId: r.id, simulationOutcome: outcome },
        { key: crypto.randomUUID() },
      );
    if (action === "retry")
      await api(
        "/refunds/" + r.id + "/retry",
        { simulationOutcome: outcome },
        { key: crypto.randomUUID() },
      );
    if (action === "reconcile")
      await api(
        "/payment-events",
        {
          eventId: crypto.randomUUID(),
          attemptId: r.attempt_id,
          providerRef: r.provider_ref,
          status: outcome,
        },
        { actor: "provider-1" },
      );
    $("#action-dialog").close();
    message(
      "Action recorded. Inspect the queue and audit trail for the resulting state.",
    );
    await refresh();
  }),
);
