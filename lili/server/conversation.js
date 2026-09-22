/**
 * Conversation engine.
 *
 * A bounded slot-filling state machine. The server owns the state; the model only
 * ever proposes slot values. That is why there is no LangChain/LangGraph here — the
 * graph has six nodes and one loop, and every edge is a permission or validation
 * decision that has to run server-side anyway. A framework would add a runtime
 * surface without removing any of the work.
 */
import { randomUUID } from "node:crypto";
import { load, save } from "./store.js";
import { validate, REQUIREMENT_SCHEMA, AGENT_PROFILE_SCHEMA, MODEL_OUTPUT_SCHEMA } from "./schema.js";
import { extract, detectLanguage } from "./nlu/rules.js";
import { extractWithModel } from "./nlu/model.js";
import { answer as kbAnswer } from "./knowledge.js";
import { assess, REQUIRED_TENANT, REQUIRED_AGENT_PROFILE } from "./readiness.js";
import { T, t } from "./copy.js";
import { runtimeMode } from "./config.js";
import { record } from "./events.js";

const TENANT_ORDER = ["city", "propertyType", "bedrooms", "budgetMonthlyTHB", "moveInDate", "occupants", "leaseTermMonths", "pets", "area"];
const AGENT_ORDER = ["agencyName", "agentType", "country", "contactChannel", "contactValue"];

export function conversations() {
  return load("conversations", []);
}

export function getConversation(id) {
  return conversations().find((c) => c.id === id) || null;
}

export function createConversation(user, flow, lang = "th") {
  const list = conversations();
  const convo = {
    id: randomUUID(),
    ownerId: user.id,
    ownerRole: user.role,
    flow, // "tenant" | "coagent"
    lang,
    messages: [],
    requirement: {},
    agentProfile: {},
    consent: { attested: false, attestedAt: null, statement: null },
    inferredFields: [],
    askedOptional: [],
    unansweredQuestions: [],
    reviewed: false,
    submissionId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const greeting = flow === "coagent" ? T.greetCoagent : T.greetTenant;
  convo.messages.push({ role: "lili", text: t(greeting, lang), ts: convo.createdAt });
  if (flow === "coagent" && user.status === "pending") {
    convo.messages.push({ role: "lili", text: t(T.pendingNotice, lang), ts: convo.createdAt });
  }
  list.push(convo);
  save("conversations", list);
  record({ actorId: user.id, actorRole: user.role, type: "conversation_created", subjectId: convo.id, to: flow });
  return convo;
}

function persist(convo) {
  const list = conversations();
  const i = list.findIndex((c) => c.id === convo.id);
  convo.updatedAt = new Date().toISOString();
  if (i >= 0) list[i] = convo; else list.push(convo);
  save("conversations", list);
  return convo;
}

/** Next thing to ask: required fields first, then each optional one at most once. */
function nextQuestion(convo) {
  if (convo.flow === "coagent") {
    for (const f of AGENT_ORDER) if (convo.agentProfile[f] === undefined) return { field: f, scope: "agent" };
    if (!convo.consent.attested) return { field: "__consent", scope: "consent" };
  }
  for (const f of TENANT_ORDER) {
    const required = REQUIRED_TENANT.includes(f);
    if (convo.requirement[f] !== undefined) continue;
    if (required) return { field: f, scope: "requirement" };
    if (!convo.askedOptional.includes(f)) return { field: f, scope: "requirement", optional: true };
  }
  return null;
}

function looksLikeQuestion(text) {
  return /\?|ไหม|หรือเปล่า|ยังไง|อย่างไร|เท่าไห?ร่|กี่|ทำไม|อะไร|^(what|how|why|when|where|who|can|do|does|is|are)\b/i.test(text);
}

/** Merge proposals into stored state. Rules win over the model on any shared field. */
function mergeSlots(convo, ruleSlots, modelSlots, inferred) {
  const merged = { ...modelSlots, ...ruleSlots };
  const { value, errors, dropped } = validate(merged, REQUIREMENT_SCHEMA);
  const changed = [];
  for (const [k, v] of Object.entries(value)) {
    if (convo.requirement[k] !== v) {
      changed.push({ field: k, from: convo.requirement[k] ?? null, to: v });
      convo.requirement[k] = v;
    }
  }
  for (const f of inferred) if (!convo.inferredFields.includes(f)) convo.inferredFields.push(f);
  // A field the user restated explicitly is no longer an inference.
  for (const f of Object.keys(ruleSlots)) {
    const i = convo.inferredFields.indexOf(f);
    if (i >= 0 && !inferred.includes(f)) convo.inferredFields.splice(i, 1);
  }
  return { changed, errors, dropped };
}

/** Free-text answers to agent-profile questions, which the slot extractor does not cover. */
function captureAgentAnswer(convo, text) {
  const pending = nextQuestion(convo);
  if (!pending || pending.scope !== "agent") return null;
  const field = pending.field;
  let value;

  if (field === "agentType") {
    if (/อิสระ|independent|freelance|solo/i.test(text)) value = "independent";
    else if (/บริษัท|company|agency|firm/i.test(text)) value = "company";
  } else if (field === "contactChannel") {
    if (/line/i.test(text)) value = "line";
    else if (/whats\s?app/i.test(text)) value = "whatsapp";
    else if (/โทร|phone|call|เบอร์/i.test(text)) value = "phone";
    else if (/mail|อีเมล|@/i.test(text)) value = "email";
  } else {
    value = text.trim();
  }
  if (value === undefined) return null;

  const { value: clean, errors } = validate({ [field]: value }, AGENT_PROFILE_SCHEMA);
  if (errors.length || clean[field] === undefined) return null;
  convo.agentProfile[field] = clean[field];
  return { field, value: clean[field] };
}

/**
 * Handle one user turn.
 * Never throws for model problems — a model failure degrades to rules and says so.
 */
export async function handleTurn(convo, user, text) {
  const lang = detectLanguage(text) || convo.lang;
  convo.lang = lang;
  const ts = new Date().toISOString();
  convo.messages.push({ role: "user", text: text.slice(0, 2000), ts });

  const replies = [];
  let modelFailed = false;

  // 1. Deterministic extraction always runs.
  const { slots: ruleSlots, inferred } = extract(text);

  // 2. Model layer, only when configured. Advisory, validated, droppable.
  let modelSlots = {};
  if (runtimeMode() === "model") {
    const result = await extractWithModel(text);
    if (result.ok) {
      const { value, dropped } = validate(result.data ?? {}, MODEL_OUTPUT_SCHEMA);
      modelSlots = value.requirement ?? {};
      if (dropped.length) {
        record({ actorId: user.id, actorRole: user.role, type: "model_output_keys_dropped", subjectId: convo.id, meta: { dropped } });
      }
    } else {
      modelFailed = true;
      record({ actorId: user.id, actorRole: user.role, type: "model_call_failed", subjectId: convo.id, note: result.error });
    }
  }

  // 3. Agent-profile capture takes precedence while that section is open.
  const agentCaptured = convo.flow === "coagent" ? captureAgentAnswer(convo, text) : null;

  // 4. Merge requirement slots.
  const { changed } = mergeSlots(convo, ruleSlots, modelSlots, inferred);
  if (changed.length) {
    record({ actorId: user.id, actorRole: user.role, type: "requirement_updated", subjectId: convo.id, meta: { changed } });
    // Any change invalidates a prior confirmation — the user reviews the new version.
    if (convo.reviewed) {
      convo.reviewed = false;
      record({ actorId: user.id, actorRole: user.role, type: "review_reset_by_edit", subjectId: convo.id });
    }
  }

  // 5. Questions: answer from the KB, or say plainly that we don't know.
  if (looksLikeQuestion(text)) {
    const found = kbAnswer(text, lang);
    if (found) {
      replies.push(found.text);
    } else if (!changed.length && !agentCaptured) {
      replies.push(t(T.dontKnow, lang));
      if (!convo.unansweredQuestions.includes(text)) convo.unansweredQuestions.push(text.slice(0, 300));
      record({ actorId: user.id, actorRole: user.role, type: "question_outside_kb", subjectId: convo.id, note: text.slice(0, 200) });
    }
  }

  if (modelFailed) replies.push(t(T.modelFallback, lang));
  if (changed.length && !replies.includes(t(T.updated, lang))) replies.push(t(T.updated, lang));

  // 6. Next step.
  const pending = nextQuestion(convo);
  if (pending?.scope === "consent") {
    replies.push(t(T.consentPrompt, lang));
  } else if (pending) {
    if (pending.optional) convo.askedOptional.push(pending.field);
    replies.push(t(T.ask[pending.field], lang));
  } else {
    const state = assess({ ...convo, unansweredQuestions: convo.unansweredQuestions }, lang);
    const closing = state.canSubmit ? t(T.reviewedNext, lang) : t(T.reviewReady, lang);
    const lastLili = [...convo.messages].reverse().find((m) => m.role === "lili");
    const alreadySaid = Boolean(lastLili?.text.includes(closing));

    // Saying the same "please confirm the summary" line on every turn reads as
    // nagging. Repeat it only when something changed; otherwise keep it short, or
    // say nothing when the turn already carried a real answer.
    if (!alreadySaid || changed.length) replies.push(closing);
    else if (!replies.length) replies.push(t(T.reviewReadyShort, lang));
  }

  const reply = replies.filter(Boolean).join("\n\n");
  convo.messages.push({ role: "lili", text: reply, ts: new Date().toISOString() });
  persist(convo);

  return { convo, reply, modelFailed };
}

export function applyManualEdit(convo, user, patch) {
  const { value, errors, dropped } = validate(patch, REQUIREMENT_SCHEMA);
  if (errors.length) return { ok: false, errors };
  const changed = [];
  for (const [k, v] of Object.entries(value)) {
    if (convo.requirement[k] !== v) {
      changed.push({ field: k, from: convo.requirement[k] ?? null, to: v });
      convo.requirement[k] = v;
    }
    const i = convo.inferredFields.indexOf(k);
    if (i >= 0) convo.inferredFields.splice(i, 1);
  }
  if (changed.length) {
    convo.reviewed = false;
    record({ actorId: user.id, actorRole: user.role, type: "requirement_edited_manually", subjectId: convo.id, meta: { changed, dropped } });
  }
  persist(convo);
  return { ok: true, changed, dropped };
}

export function setReviewed(convo, user, reviewed) {
  convo.reviewed = Boolean(reviewed);
  record({ actorId: user.id, actorRole: user.role, type: reviewed ? "requirement_reviewed" : "review_withdrawn", subjectId: convo.id });
  persist(convo);
  return convo;
}

export function setConsent(convo, user, attested, statement) {
  convo.consent = {
    attested: Boolean(attested),
    attestedAt: attested ? new Date().toISOString() : null,
    statement: attested ? String(statement || "").slice(0, 500) : null,
  };
  record({ actorId: user.id, actorRole: user.role, type: attested ? "client_consent_attested" : "client_consent_withdrawn", subjectId: convo.id });
  if (attested) {
    convo.messages.push({ role: "lili", text: t(T.consentOk, convo.lang), ts: new Date().toISOString() });
  }
  persist(convo);
  return convo;
}

export { persist };
