import http from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { createSystem, DomainError, DEMO_NOW, POLICY } from "./domain.mjs";

const root = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".json": "application/json",
  ".bpmn": "application/xml",
};
export function makeServer(system) {
  return http.createServer(async (req, res) => {
    const pathname = new URL(req.url, "http://127.0.0.1").pathname;
    const json = (status, body) => {
      res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(JSON.stringify(body));
    };
    try {
      if (!pathname.startsWith("/api/")) {
        const relative =
          pathname === "/" ? "prototype/index.html" : pathname.slice(1);
        if (
          ![
            "prototype/",
            "diagrams/",
            "node_modules/bpmn-js/dist/",
            "node_modules/bpmn-js/dist/assets/",
          ].some((p) => relative.startsWith(p))
        )
          return json(404, {
            code: "NOT_FOUND",
            message: "Resource not found.",
          });
        const target = path.resolve(root, relative);
        if (!target.startsWith(root + path.sep))
          return json(404, {
            code: "NOT_FOUND",
            message: "Resource not found.",
          });
        if (req.method !== "GET")
          return json(405, { code: "METHOD_NOT_ALLOWED", message: "Use GET." });
        const data = await readFile(target);
        res.writeHead(200, {
          "Content-Type":
            mime[path.extname(target)] || "application/octet-stream",
          "X-Content-Type-Options": "nosniff",
        });
        res.end(data);
        return;
      }
      if (req.method === "GET" && pathname === "/api/health")
        return json(200, {
          status: "ok",
          context: "synthetic-local-demo",
          now: DEMO_NOW,
          policy: POLICY,
        });
      const who = req.headers["x-demo-actor"];
      let body = {};
      if (["POST", "PUT", "PATCH"].includes(req.method)) {
        if (
          !String(req.headers["content-type"] || "").startsWith(
            "application/json",
          )
        )
          return json(415, {
            code: "JSON_REQUIRED",
            message: "Use Content-Type: application/json.",
          });
        let raw = "";
        for await (const chunk of req) {
          raw += chunk;
          if (Buffer.byteLength(raw) > 65536)
            throw new DomainError(413, "BODY_TOO_LARGE", "Body exceeds 64 KB.");
        }
        try {
          body = JSON.parse(raw);
        } catch {
          throw new DomainError(
            400,
            "INVALID_JSON",
            "Request body is not valid JSON.",
          );
        }
      }
      const route = (method, pattern) =>
        req.method === method && pathname.match(pattern);
      let match;
      if (route("GET", /^\/api\/orders$/))
        return json(200, await system.listOrders(who));
      if ((match = route("GET", /^\/api\/orders\/([^/]+)$/)))
        return json(
          200,
          await system.getOrder(decodeURIComponent(match[1]), who),
        );
      if (route("GET", /^\/api\/workbench$/))
        return json(200, await system.snapshot(who));
      if (route("POST", /^\/api\/return-previews$/))
        return json(200, await system.preview(body, who));
      if (route("POST", /^\/api\/return-requests$/))
        return json(201, await system.createReturn(body, who));
      if (
        (match = route("POST", /^\/api\/return-requests\/([^/]+)\/approval$/))
      )
        return json(200, await system.decide(match[1], body, who));
      if (
        (match = route("POST", /^\/api\/return-requests\/([^/]+)\/inspection$/))
      )
        return json(200, await system.inspect(match[1], body, who));
      if (
        (match = route(
          "POST",
          /^\/api\/return-requests\/([^/]+)\/cancellation$/,
        ))
      )
        return json(200, await system.cancel(match[1], body, who));
      if (route("POST", /^\/api\/refunds$/)) {
        const result = await system.refund(
          body,
          req.headers["idempotency-key"],
          who,
        );
        return json(result.replayed ? 200 : 201, result);
      }
      if ((match = route("POST", /^\/api\/refunds\/([^/]+)\/retry$/))) {
        const result = await system.retry(
          match[1],
          body,
          req.headers["idempotency-key"],
          who,
        );
        return json(result.replayed ? 200 : 201, result);
      }
      if (route("POST", /^\/api\/payment-events$/))
        return json(200, await system.paymentEvent(body, who));
      return json(404, { code: "NOT_FOUND", message: "API route not found." });
    } catch (error) {
      if (error instanceof DomainError)
        return json(error.status, { code: error.code, message: error.message });
      if (error.code === "ENOENT")
        return json(404, { code: "NOT_FOUND", message: "Resource not found." });
      console.error("Unexpected demo error:", error.message);
      return json(500, {
        code: "INTERNAL_ERROR",
        message: "Unexpected local demo error.",
      });
    }
  });
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const system = await createSystem();
  const server = makeServer(system);
  const port = Number(process.env.PORT || 4173);
  server.listen(port, "127.0.0.1", () =>
    console.log(
      `RetailFlow synthetic demo: http://127.0.0.1:${port}\nFixed clock: ${DEMO_NOW}. Restart resets all synthetic data.`,
    ),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await system.close();
        process.exit(0);
      }),
    );
}
