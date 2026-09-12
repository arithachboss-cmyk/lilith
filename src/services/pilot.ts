import { validImage } from "./pilot-image";
import { env } from "cloudflare:workers";
import { z } from "zod";
import {
  ApiError,
  input,
  assertSameOrigin,
  json,
  endpoint,
} from "./platform/http";
import {
  attributionSchema,
  eventNames,
  leadSchema,
  sessionSchema,
} from "../domain/pilot";

export { json, endpoint };
type Draft = {
  id: string;
  consent_version: string;
  consent_at: string;
  expires_at: string;
};
type Lead = {
  id: string;
  draft_id: string;
  payload_hash: string;
  payload: string;
  status: string;
  viewing_window: string | null;
};
type Photo = {
  id: string;
  position: number;
  content_hash: string;
  mime: string;
  content: string;
};
const settings = () =>
  env as typeof env & {
    MIDDLE_READINESS_MODE?: string;
    MIDDLE_OPERATIONS_USER_IDS?: string;
  };
export function mockOnly() {
  if (settings().MIDDLE_READINESS_MODE !== "mock")
    throw new ApiError(
      503,
      "NO_GO",
      "Real lead intake is closed. This build is for isolated mock testing only.",
    );
}
export async function hash(value: string | Uint8Array) {
  const bytes =
    typeof value === "string" ? new TextEncoder().encode(value) : value;
  const digest = await crypto.subtle.digest("SHA-256", bytes as BufferSource);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}
async function tokenHash(request: Request) {
  const token = request.headers.get("x-pilot-token") ?? "";
  if (!/^[a-f0-9]{64}$/.test(token))
    throw new ApiError(
      401,
      "SESSION_REQUIRED",
      "Start with consent to continue.",
    );
  return hash(token);
}
export function operator(request: Request) {
  mockOnly();
  const id = request.headers.get("oai-authenticated-user-id");
  const ids = (settings().MIDDLE_OPERATIONS_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!id || !ids.includes(id))
    throw new ApiError(
      403,
      "OPERATIONS_AUTHORIZATION_REQUIRED",
      "Operations access has not been authorized for this account.",
    );
  return id;
}
export async function draft(request: Request): Promise<Draft> {
  mockOnly();
  const row = await env.DB.prepare(
    "SELECT * FROM pilot_drafts WHERE token_hash = ? AND expires_at > ?",
  )
    .bind(await tokenHash(request), new Date().toISOString())
    .first<Draft>();
  if (!row)
    throw new ApiError(
      401,
      "SESSION_EXPIRED",
      "Your session expired. Start again with consent.",
    );
  return row;
}
export async function createSession(request: Request) {
  mockOnly();
  const body = await input(request, sessionSchema);
  const token = await tokenHash(request);
  const now = new Date();
  await env.DB.prepare(
    "INSERT OR IGNORE INTO pilot_drafts (id, token_hash, consent_version, consent_at, expires_at, mock_data) VALUES (?, ?, ?, ?, ?, 1)",
  )
    .bind(
      body.draft_id,
      token,
      body.consent.version,
      now.toISOString(),
      new Date(now.getTime() + 24 * 3600000).toISOString(),
    )
    .run();
  const row = await draft(request);
  if (row.id !== body.draft_id)
    throw new ApiError(409, "SESSION_CONFLICT", "Start a new test session.");
  return json({
    draft_id: row.id,
    consent_version: row.consent_version,
    consent_at: row.consent_at,
    mock_data: true,
  });
}
async function photos(draftId: string) {
  return (
    (
      await env.DB.prepare(
        "SELECT id, position, content_hash FROM pilot_images WHERE draft_id = ? ORDER BY position, id",
      )
        .bind(draftId)
        .all<Pick<Photo, "id" | "position" | "content_hash">>()
    ).results ?? []
  );
}
export async function readDraft(request: Request) {
  const row = await draft(request);
  const lead = await env.DB.prepare(
    "SELECT * FROM pilot_leads WHERE draft_id = ?",
  )
    .bind(row.id)
    .first<Lead>();
  return json({
    draft_id: row.id,
    consent_version: row.consent_version,
    consent_at: row.consent_at,
    images: await photos(row.id),
    lead: lead
      ? {
          id: lead.id,
          ...JSON.parse(lead.payload),
          status: lead.status,
          viewing_window: lead.viewing_window,
        }
      : null,
  });
}
async function mutable(row: Draft) {
  if (
    await env.DB.prepare("SELECT id FROM pilot_leads WHERE draft_id = ?")
      .bind(row.id)
      .first()
  )
    throw new ApiError(
      409,
      "FINALIZED",
      "This request is already saved; its images cannot be changed.",
    );
}
export async function putImage(request: Request, id: string) {
  const row = await draft(request);
  assertSameOrigin(request);
  z.string().uuid().parse(id);
  const mime = request.headers.get("content-type") ?? "";
  if (!["image/png"].includes(mime))
    throw new ApiError(
      415,
      "IMAGE_TYPE",
      "Choose a synthetic non-interlaced 8-bit PNG image.",
    );
  const reader = request.body?.getReader();
  if (!reader) throw new ApiError(422, "EMPTY_IMAGE", "Choose an image.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 131072) {
        await reader.cancel();
        throw new ApiError(
          413,
          "IMAGE_SIZE",
          "Test images must be 128 KB or smaller.",
        );
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  if (!(await validImage(bytes, mime)))
    throw new ApiError(
      422,
      "INVALID_IMAGE",
      "The image file is malformed or does not match its type.",
    );
  const digest = await hash(bytes);
  const existing = await env.DB.prepare(
    "SELECT id, draft_id, content_hash FROM pilot_images WHERE id = ?",
  )
    .bind(id)
    .first<{ id: string; draft_id: string; content_hash: string }>();
  if (existing) {
    if (existing.draft_id !== row.id || existing.content_hash !== digest)
      throw new ApiError(
        409,
        "IMAGE_CONFLICT",
        "That upload ID cannot be reused.",
      );
    return json({ id, mock_data: true });
  }
  await mutable(row);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  try {
    await env.DB.prepare(
      "INSERT INTO pilot_images (id,draft_id,content_hash,mime,content,position,created_at) VALUES (?,?,?,?,?,(SELECT COUNT(*) FROM pilot_images WHERE draft_id = ?),?)",
    )
      .bind(
        id,
        row.id,
        digest,
        mime,
        btoa(binary),
        row.id,
        new Date().toISOString(),
      )
      .run();
  } catch {
    const saved = await env.DB.prepare(
      "SELECT id FROM pilot_images WHERE id = ? AND draft_id = ? AND content_hash = ?",
    )
      .bind(id, row.id, digest)
      .first();
    if (saved) return json({ id, mock_data: true });
    if ((await photos(row.id)).length >= 4)
      throw new ApiError(
        422,
        "IMAGE_LIMIT",
        "A request can contain at most 4 images.",
      );
    await mutable(row);
    throw new ApiError(
      503,
      "UPLOAD_FAILED",
      "The image was not saved. Retry with the same upload ID.",
    );
  }
  return json({ id, mock_data: true }, 201);
}
export async function getImage(request: Request, id: string) {
  mockOnly();
  let scope: string | null = null;
  if (request.headers.has("x-pilot-token")) scope = (await draft(request)).id;
  else operator(request);
  const row = await env.DB.prepare(
    `SELECT * FROM pilot_images WHERE id = ?${scope ? " AND draft_id = ?" : ""}`,
  )
    .bind(...(scope ? [id, scope] : [id]))
    .first<Photo>();
  if (!row) throw new ApiError(404, "NOT_FOUND", "Image not found.");
  const bytes = Uint8Array.from(atob(row.content), (c) => c.charCodeAt(0));
  return new Response(bytes, {
    headers: {
      "Content-Type": row.mime,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'",
    },
  });
}
export async function changeImages(request: Request) {
  const row = await draft(request);
  await mutable(row);
  const body = await input(
    request,
    z.object({ image_ids: z.array(z.string().uuid()).max(4) }).strict(),
  );
  const current = await photos(row.id);
  if (
    new Set(body.image_ids).size !== body.image_ids.length ||
    body.image_ids.some((id) => !current.some((p) => p.id === id))
  )
    throw new ApiError(
      422,
      "INVALID_IMAGES",
      "Select only images belonging to this request.",
    );
  const statements = current
    .filter((p) => !body.image_ids.includes(p.id))
    .map((p) =>
      env.DB.prepare(
        "DELETE FROM pilot_images WHERE id = ? AND draft_id = ?",
      ).bind(p.id, row.id),
    );
  body.image_ids.forEach((id, i) =>
    statements.push(
      env.DB.prepare(
        "UPDATE pilot_images SET position = ? WHERE id = ? AND draft_id = ?",
      ).bind(i, id, row.id),
    ),
  );
  if (statements.length) await env.DB.batch(statements);
  return json({ images: await photos(row.id) });
}
export async function saveLead(request: Request) {
  const row = await draft(request);
  const body = await input(request, leadSchema);
  const payload = JSON.stringify(body);
  const digest = await hash(payload);
  const candidate = `MP-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  // One atomic D1 transaction. UNIQUE(draft_id) is the idempotency boundary.
  await env.DB.batch([
    env.DB.prepare(
      "INSERT OR IGNORE INTO pilot_leads (id,draft_id,payload_hash,payload,created_at,mock_data) VALUES (?,?,?,?,?,1)",
    ).bind(candidate, row.id, digest, payload, now),
    env.DB.prepare(
      "INSERT OR IGNORE INTO pilot_outbox (id,lead_id,destination,status,created_at) SELECT 'notification-' || id,id,'mock://middle-property-operations','generated_mock',? FROM pilot_leads WHERE draft_id = ?",
    ).bind(now, row.id),
    env.DB.prepare(
      "INSERT OR IGNORE INTO pilot_events (id,draft_id,lead_id,name,occurred_at,attribution) SELECT 'submit-' || id,draft_id,id,'form_submit',?,? FROM pilot_leads WHERE draft_id = ?",
    ).bind(now, JSON.stringify(body.attribution), row.id),
  ]);
  const saved = await env.DB.prepare(
    "SELECT * FROM pilot_leads WHERE draft_id = ?",
  )
    .bind(row.id)
    .first<Lead>();
  if (!saved)
    throw new ApiError(503, "SAVE_FAILED", "The request was not saved. Retry.");
  if (saved.payload_hash !== digest)
    throw new ApiError(
      409,
      "ALREADY_SAVED",
      "This request was already saved with different details. Reopen the saved record.",
    );
  return json(
    {
      lead_id: saved.id,
      status: saved.status,
      mock_data: true,
      notification: "generated_mock",
      sent: false,
    },
    saved.id === candidate ? 201 : 200,
  );
}
export async function recordEvent(request: Request) {
  const row = await draft(request);
  const body = await input(
    request,
    z
      .object({
        id: z.string().uuid(),
        name: z
          .enum(eventNames)
          .exclude(["form_submit", "qualified_lead", "viewing_request"]),
        occurred_at: z.string().datetime(),
        attribution: attributionSchema,
      })
      .strict(),
  );
  await env.DB.prepare(
    "INSERT OR IGNORE INTO pilot_events (id,draft_id,lead_id,name,occurred_at,attribution) VALUES (?,?,(SELECT id FROM pilot_leads WHERE draft_id = ?),?,?,?)",
  )
    .bind(
      body.id,
      row.id,
      row.id,
      body.name,
      body.occurred_at,
      JSON.stringify(body.attribution),
    )
    .run();
  return json({ recorded: true, mock_data: true });
}
export async function inbox(request: Request) {
  operator(request);
  const rows =
    (
      await env.DB.prepare(
        "SELECT l.*,d.consent_version,d.consent_at,o.id AS notification_id,o.destination,o.status AS notification_status FROM pilot_leads l JOIN pilot_drafts d ON d.id=l.draft_id JOIN pilot_outbox o ON o.lead_id=l.id ORDER BY l.created_at DESC LIMIT 100",
      ).all<Lead & Record<string, unknown>>()
    ).results ?? [];
  return json({
    leads: await Promise.all(
      rows.map(async (r) => ({
        ...r,
        payload: JSON.parse(r.payload),
        images: await photos(r.draft_id),
      })),
    ),
    delivery: "mock_only",
    owner_authorization_confirmed: false,
  });
}
export async function progress(request: Request) {
  const actor = operator(request);
  const body = await input(
    request,
    z
      .object({
        lead_id: z
          .string()
          .uuid()
          .or(z.string().regex(/^MP-[a-f0-9-]{36}$/)),
        status: z.enum(["qualified", "viewing_ready"]),
        viewing_window: z.string().min(5).max(100).optional(),
      })
      .strict(),
  );
  const lead = await env.DB.prepare("SELECT * FROM pilot_leads WHERE id = ?")
    .bind(body.lead_id)
    .first<Lead>();
  if (!lead) throw new ApiError(404, "NOT_FOUND", "Lead not found.");
  if (
    body.status === "viewing_ready" &&
    (!body.viewing_window ||
      !["qualified", "viewing_ready"].includes(lead.status))
  )
    throw new ApiError(
      422,
      "QUALIFICATION_REQUIRED",
      "Qualify the request and provide a viewing window first.",
    );
  if (lead.status === "viewing_ready" && body.status === "qualified")
    throw new ApiError(
      409,
      "INVALID_TRANSITION",
      "A viewing-ready request cannot return to qualified.",
    );
  const name =
    body.status === "qualified" ? "qualified_lead" : "viewing_request";
  await env.DB.batch([
    env.DB.prepare(
      "UPDATE pilot_leads SET status=?,viewing_window=? WHERE id=? AND status=?",
    ).bind(
      body.status,
      body.viewing_window ?? lead.viewing_window,
      lead.id,
      lead.status,
    ),
    env.DB.prepare(
      "INSERT OR IGNORE INTO pilot_events (id,draft_id,lead_id,name,occurred_at,attribution,actor_id) SELECT ?,?,?,?,?,?,? WHERE EXISTS (SELECT 1 FROM pilot_leads WHERE id=? AND status=?)",
    ).bind(
      `${name}-${lead.id}`,
      lead.draft_id,
      lead.id,
      name,
      new Date().toISOString(),
      JSON.stringify(JSON.parse(lead.payload).attribution),
      actor,
      lead.id,
      body.status,
    ),
  ]);
  const current = await env.DB.prepare(
    "SELECT status FROM pilot_leads WHERE id=?",
  )
    .bind(lead.id)
    .first<{ status: string }>();
  if (current?.status !== body.status)
    throw new ApiError(
      409,
      "STATUS_CHANGED",
      "The request changed. Refresh the inbox before trying again.",
    );
  // Identity is returned only to the authorized operator; no personal fields are logged.
  return json({
    lead_id: lead.id,
    status: body.status,
    actor,
    mock_data: true,
  });
}
