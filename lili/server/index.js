/**
 * HTTP server — zero runtime dependencies.
 *
 * Every route resolves the caller from the bearer token and re-checks permission at
 * the point of the write. The client is never trusted for role, status or ownership.
 */
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { config, runtimeMode, modeLabel } from "./config.js";
import { userByToken, canSubmit, assertCanRead } from "./auth.js";
import * as convoApi from "./conversation.js";
import { assess } from "./readiness.js";
import * as handoff from "./handoff.js";
import { draft } from "./followup.js";
import { listAll, listFor } from "./events.js";

const PUBLIC_DIR = fileURLToPath(new URL("../public/", import.meta.url));
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml", ".ico": "image/x-icon" };

function send(res, status, body, headers = {}) {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": typeof body === "object" && !Buffer.isBuffer(body) ? "application/json; charset=utf-8" : "text/plain; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...headers,
  });
  res.end(payload);
}

async function readJson(req, limitBytes = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0;
    let aborted = false;
    const chunks = [];
    req.on("data", (c) => {
      if (aborted) return;
      size += c.length;
      if (size > limitBytes) {
        // Stop buffering but keep the socket alive long enough to answer: destroying
        // it here is what turns a 413 into an ECONNRESET on the client.
        aborted = true;
        chunks.length = 0;
        req.pause();
        reject(new Error("payload_too_large"));
        return;
      }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); }
      catch { reject(new Error("invalid_json")); }
    });
    req.on("error", reject);
  });
}

function caller(req) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : null;
  return userByToken(token);
}

/** Conversation as the client sees it: state plus an explicit readiness explanation. */
function view(convo, lang = convo.lang) {
  return {
    ...convo,
    readiness: assess({ ...convo, unansweredQuestions: convo.unansweredQuestions }, lang),
  };
}

function loadConversation(user, id) {
  const convo = convoApi.getConversation(id);
  if (!convo) return { error: [404, { error: "not_found" }] };
  if (!assertCanRead(user, convo)) return { error: [403, { error: "forbidden" }] };
  return { convo };
}

async function serveStatic(req, res, pathname) {
  const rel = pathname === "/" ? "index.html" : normalize(pathname).replace(/^(\.\.[/\\])+/, "").replace(/^\//, "");
  const file = join(PUBLIC_DIR, rel);
  if (!file.startsWith(PUBLIC_DIR)) return send(res, 403, "forbidden");
  try {
    const body = await readFile(file);
    return send(res, 200, body, { "content-type": MIME[extname(file)] || "application/octet-stream" });
  } catch {
    return send(res, 404, "not found");
  }
}

const routes = [
  ["GET", /^\/api\/status$/, async (req, res) => {
    send(res, 200, {
      mode: runtimeMode(),
      modeLabel: { th: modeLabel("th"), en: modeLabel("en") },
      brand: "The Middle Property",
      assistant: "Lili",
      disclosure: {
        th: "Lili เป็นผู้ช่วย AI ไม่ใช่มนุษย์",
        en: "Lili is an AI assistant, not a human.",
      },
      notLive: {
        th: ["ระบบส่งทรัพย์ส่วนตัว", "ระบบจับคู่ครบวงจร", "การส่งข้อความหาลูกค้าจริง"],
        en: ["Private property submission", "End-to-end matching", "Outbound messaging to real customers"],
      },
    });
  }],

  ["POST", /^\/api\/session$/, async (req, res) => {
    const { token } = await readJson(req);
    const user = userByToken(token);
    if (!user) return send(res, 401, { error: "unknown_token" });
    send(res, 200, {
      user: { id: user.id, role: user.role, name: user.name, status: user.status },
      permissions: canSubmit(user),
    });
  }],

  ["POST", /^\/api\/conversations$/, async (req, res, _m, user) => {
    const { flow, lang } = await readJson(req);
    const chosen = flow === "coagent" ? "coagent" : "tenant";
    if (chosen === "coagent" && user.role === "tenant") return send(res, 403, { error: "role_mismatch" });
    if (chosen === "tenant" && user.role === "coagent") return send(res, 403, { error: "role_mismatch" });
    const convo = convoApi.createConversation(user, chosen, lang === "en" ? "en" : "th");
    send(res, 201, view(convo));
  }],

  ["GET", /^\/api\/conversations\/([\w-]+)$/, async (req, res, m, user) => {
    const { convo, error } = loadConversation(user, m[1]);
    if (error) return send(res, ...error);
    send(res, 200, view(convo));
  }],

  ["POST", /^\/api\/conversations\/([\w-]+)\/messages$/, async (req, res, m, user) => {
    const { convo, error } = loadConversation(user, m[1]);
    if (error) return send(res, ...error);
    const { text } = await readJson(req);
    if (typeof text !== "string" || !text.trim()) return send(res, 400, { error: "text_required" });
    const result = await convoApi.handleTurn(convo, user, text.trim());
    send(res, 200, { reply: result.reply, modelFailed: result.modelFailed, conversation: view(result.convo) });
  }],

  ["PATCH", /^\/api\/conversations\/([\w-]+)\/requirement$/, async (req, res, m, user) => {
    const { convo, error } = loadConversation(user, m[1]);
    if (error) return send(res, ...error);
    const patch = await readJson(req);
    const result = convoApi.applyManualEdit(convo, user, patch);
    if (!result.ok) return send(res, 400, { error: "validation_failed", details: result.errors });
    send(res, 200, { changed: result.changed, dropped: result.dropped, conversation: view(convo) });
  }],

  ["POST", /^\/api\/conversations\/([\w-]+)\/review$/, async (req, res, m, user) => {
    const { convo, error } = loadConversation(user, m[1]);
    if (error) return send(res, ...error);
    const { reviewed } = await readJson(req);
    send(res, 200, view(convoApi.setReviewed(convo, user, reviewed)));
  }],

  ["POST", /^\/api\/conversations\/([\w-]+)\/consent$/, async (req, res, m, user) => {
    const { convo, error } = loadConversation(user, m[1]);
    if (error) return send(res, ...error);
    if (convo.flow !== "coagent") return send(res, 400, { error: "consent_only_for_coagent" });
    const { attested, statement } = await readJson(req);
    send(res, 200, view(convoApi.setConsent(convo, user, attested, statement)));
  }],

  ["POST", /^\/api\/conversations\/([\w-]+)\/submit$/, async (req, res, m, user) => {
    const { convo, error } = loadConversation(user, m[1]);
    if (error) return send(res, ...error);
    if (convo.ownerId !== user.id) return send(res, 403, { error: "only_owner_may_submit" });
    const idempotencyKey = req.headers["idempotency-key"] || null;
    const result = handoff.submit(convo, user, { idempotencyKey });
    if (!result.ok) {
      const status = result.code === "forbidden" ? 403 : 409;
      return send(res, status, { error: result.code, reason: result.reason ?? null, readiness: result.readiness ?? null });
    }
    convoApi.persist(convo);
    send(res, result.duplicate ? 200 : 201, { duplicate: result.duplicate, submission: result.submission, conversation: view(convo) });
  }],

  ["GET", /^\/api\/submissions$/, async (req, res, _m, user) => {
    send(res, 200, { submissions: handoff.listForUser(user) });
  }],

  ["GET", /^\/api\/submissions\/([\w-]+)$/, async (req, res, m, user) => {
    const s = handoff.getForUser(user, m[1]);
    if (!s) return send(res, 404, { error: "not_found" });
    send(res, 200, { submission: s, events: user.role === "team" ? listFor(s.id) : [] });
  }],

  ["POST", /^\/api\/submissions\/([\w-]+)\/status$/, async (req, res, m, user) => {
    const { status, note } = await readJson(req);
    const result = handoff.setStatus(user, m[1], status, note);
    if (!result.ok) return send(res, result.code === "forbidden" ? 403 : 400, { error: result.code });
    send(res, 200, { submission: result.submission });
  }],

  ["POST", /^\/api\/submissions\/([\w-]+)\/note$/, async (req, res, m, user) => {
    const { text } = await readJson(req);
    const result = handoff.shareNote(user, m[1], text);
    if (!result.ok) return send(res, result.code === "forbidden" ? 403 : 400, { error: result.code });
    send(res, 200, { submission: result.submission });
  }],

  ["GET", /^\/api\/submissions\/([\w-]+)\/followup$/, async (req, res, m, user) => {
    const s = handoff.getForUser(user, m[1]);
    if (!s) return send(res, 404, { error: "not_found" });
    const url = new URL(req.url, "http://localhost");
    send(res, 200, draft(s, url.searchParams.get("lang") === "en" ? "en" : "th"));
  }],

  ["GET", /^\/api\/events$/, async (req, res, _m, user) => {
    if (user.role !== "team") return send(res, 403, { error: "forbidden" });
    send(res, 200, { events: listAll() });
  }],
];

const PUBLIC_ROUTES = new Set(["/api/status", "/api/session"]);

export const server = createServer(async (req, res) => {
  try {
    const { pathname } = new URL(req.url, "http://localhost");

    if (!pathname.startsWith("/api/")) return serveStatic(req, res, pathname);

    const user = caller(req);
    if (!PUBLIC_ROUTES.has(pathname) && !user) return send(res, 401, { error: "unauthenticated" });

    for (const [method, pattern, handler] of routes) {
      const m = pathname.match(pattern);
      if (m && req.method === method) return await handler(req, res, m, user);
      if (m) return send(res, 405, { error: "method_not_allowed" });
    }
    send(res, 404, { error: "no_route" });
  } catch (err) {
    const reason = err?.message;
    if (reason === "payload_too_large") {
      res.once("finish", () => { req.destroy(); });
      return send(res, 413, { error: "payload_too_large" }, { connection: "close" });
    }
    if (reason === "invalid_json") return send(res, 400, { error: "invalid_json" });
    send(res, 500, { error: "internal_error" });
  }
});

const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isDirectRun) {
  server.listen(config.port, config.host, () => {
    console.log(`Lili prototype on http://${config.host}:${config.port}  [mode: ${runtimeMode()}]`);
  });
}
