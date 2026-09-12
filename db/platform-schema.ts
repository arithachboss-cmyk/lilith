import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// Matching platform tables are additive; existing lead and tiered agent data stay independent.
export const organizations = sqliteTable("mp_organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});
export const roles = sqliteTable(
  "mp_roles",
  { name: text("name").primaryKey() },
  (t) => [
    check(
      "mp_role_name",
      sql`${t.name} IN ('OWNER','AGENT','CLIENT','ADMIN','OPERATOR')`,
    ),
  ],
);
export const users = sqliteTable("mp_users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  role: text("role")
    .notNull()
    .references(() => roles.name),
  organizationId: text("organization_id").references(() => organizations.id),
  createdAt: text("created_at").notNull(),
});
export const profiles = sqliteTable("mp_profiles", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id),
  displayName: text("display_name").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const properties = sqliteTable(
  "mp_properties",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    description: text("description").notNull(),
    transactionType: text("transaction_type").notNull(),
    propertyType: text("property_type").notNull(),
    location: text("location").notNull(),
    price: text("price").notNull(),
    currency: text("currency").notNull(),
    bedrooms: integer("bedrooms").notNull(),
    areaSqm: real("area_sqm").notNull(),
    facilities: text("facilities").notNull(),
    status: text("status").notNull().default("PUBLISHED"),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("mp_property_search").on(t.transactionType, t.propertyType, t.status),
    index("mp_property_owner").on(t.ownerId),
    check(
      "mp_property_transaction",
      sql`${t.transactionType} IN ('RENT','SALE')`,
    ),
    check("mp_property_currency", sql`${t.currency} = 'THB'`),
    check(
      "mp_property_status",
      sql`${t.status} IN ('DRAFT','PUBLISHED','ARCHIVED')`,
    ),
    check("mp_property_rooms", sql`${t.bedrooms} >= 0 AND ${t.areaSqm} > 0`),
  ],
);
export const propertyMedia = sqliteTable("mp_property_media", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  objectKey: text("object_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  position: integer("position").notNull(),
  createdAt: text("created_at").notNull(),
});
export const propertyDocuments = sqliteTable("mp_property_documents", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id),
  objectKey: text("object_key").notNull().unique(),
  name: text("name").notNull(),
  createdAt: text("created_at").notNull(),
});
export const requirements = sqliteTable(
  "mp_requirements",
  {
    id: text("id").primaryKey(),
    createdBy: text("created_by")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description").notNull(),
    transactionType: text("transaction_type").notNull(),
    propertyType: text("property_type").notNull(),
    budgetMax: text("budget_max").notNull(),
    currency: text("currency").notNull(),
    locations: text("locations").notNull(),
    minBedrooms: integer("min_bedrooms").notNull(),
    facilities: text("facilities").notNull(),
    hardBudget: integer("hard_budget", { mode: "boolean" }).notNull(),
    hardLocation: integer("hard_location", { mode: "boolean" }).notNull(),
    consentAt: text("consent_at").notNull(),
    status: text("status").notNull().default("ACTIVE"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("mp_requirement_author").on(t.createdBy),
    index("mp_requirement_search").on(
      t.transactionType,
      t.propertyType,
      t.status,
    ),
    check(
      "mp_requirement_transaction",
      sql`${t.transactionType} IN ('RENT','SALE')`,
    ),
    check("mp_requirement_currency", sql`${t.currency} = 'THB'`),
    check("mp_requirement_status", sql`${t.status} IN ('ACTIVE','CLOSED')`),
  ],
);
export const requirementPreferences = sqliteTable(
  "mp_requirement_preferences",
  {
    id: text("id").primaryKey(),
    requirementId: text("requirement_id")
      .notNull()
      .references(() => requirements.id),
    name: text("name").notNull(),
    value: text("value").notNull(),
    hard: integer("hard", { mode: "boolean" }).notNull(),
  },
);
export const matches = sqliteTable(
  "mp_matches",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id),
    requirementId: text("requirement_id")
      .notNull()
      .references(() => requirements.id),
    status: text("status").notNull().default("MATCH_CREATED"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("mp_match_pair").on(t.propertyId, t.requirementId),
    check(
      "mp_match_status",
      sql`${t.status} IN ('MATCH_CREATED','INTEREST_EXPRESSED','MUTUAL_MATCH')`,
    ),
  ],
);
export const matchScores = sqliteTable(
  "mp_match_scores",
  {
    matchId: text("match_id")
      .primaryKey()
      .references(() => matches.id),
    score: integer("score").notNull(),
    confidence: real("confidence").notNull(),
    hardConstraintPassed: integer("hard_constraint_passed", {
      mode: "boolean",
    }).notNull(),
    result: text("result").notNull(),
    weights: text("weights").notNull(),
    engineVersion: text("engine_version").notNull(),
  },
  (t) => [
    check(
      "mp_score_range",
      sql`${t.score} BETWEEN 0 AND 100 AND ${t.confidence} BETWEEN 0 AND 1`,
    ),
  ],
);
export const matchReasons = sqliteTable(
  "mp_match_reasons",
  {
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id),
    code: text("code").notNull(),
    matched: integer("matched", { mode: "boolean" }).notNull(),
    explanation: text("explanation").notNull(),
  },
  (t) => [primaryKey({ columns: [t.matchId, t.code] })],
);
export const interests = sqliteTable(
  "mp_interests",
  {
    matchId: text("match_id")
      .notNull()
      .references(() => matches.id),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    side: text("side").notNull(),
    decision: text("decision").notNull(),
    operationId: text("operation_id").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.matchId, t.side] }),
    uniqueIndex("mp_interest_actor").on(t.matchId, t.actorId),
    check("mp_interest_side", sql`${t.side} IN ('SUPPLY','DEMAND')`),
    check(
      "mp_interest_decision",
      sql`${t.decision} IN ('PASS','INTERESTED','SUPER_MATCH')`,
    ),
  ],
);
export const dealRooms = sqliteTable(
  "mp_deal_rooms",
  {
    id: text("id").primaryKey(),
    matchId: text("match_id")
      .notNull()
      .unique()
      .references(() => matches.id),
    state: text("state").notNull(),
    version: integer("version").notNull().default(0),
    lastOperationId: text("last_operation_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    check(
      "mp_deal_state",
      sql`${t.state} IN ('DEAL_ROOM_OPENED','VIEWING_REQUESTED','VIEWING_CONFIRMED','VIEWING_COMPLETED','OFFER_SUBMITTED','COUNTER_OFFER','NEGOTIATION','AGREEMENT_PENDING','AGREEMENT_SIGNED','DEAL_CLOSED','CANCELLED')`,
    ),
  ],
);
export const dealParticipants = sqliteTable(
  "mp_deal_participants",
  {
    roomId: text("room_id")
      .notNull()
      .references(() => dealRooms.id),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    side: text("side").notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.roomId, t.userId] }),
    uniqueIndex("mp_room_side").on(t.roomId, t.side),
    index("mp_participant_user").on(t.userId),
  ],
);
export const messages = sqliteTable(
  "mp_messages",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => dealRooms.id),
    senderId: text("sender_id")
      .notNull()
      .references(() => users.id),
    body: text("body").notNull(),
    requestId: text("request_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("mp_message_request").on(t.senderId, t.requestId),
    index("mp_message_room").on(t.roomId, t.createdAt),
  ],
);
export const viewings = sqliteTable(
  "mp_viewings",
  {
    id: text("id").primaryKey(),
    roomId: text("room_id")
      .notNull()
      .references(() => dealRooms.id),
    requestedBy: text("requested_by")
      .notNull()
      .references(() => users.id),
    scheduledAt: text("scheduled_at").notNull(),
    notes: text("notes").notNull(),
    status: text("status").notNull(),
    requestId: text("request_id").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("mp_viewing_request").on(t.requestedBy, t.requestId),
    index("mp_viewing_room").on(t.roomId),
    check(
      "mp_viewing_status",
      sql`${t.status} IN ('REQUESTED','CONFIRMED','COMPLETED','CANCELLED')`,
    ),
  ],
);
export const offers = sqliteTable("mp_offers", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => dealRooms.id),
  submittedBy: text("submitted_by")
    .notNull()
    .references(() => users.id),
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});
export const negotiations = sqliteTable("mp_negotiations", {
  id: text("id").primaryKey(),
  offerId: text("offer_id")
    .notNull()
    .references(() => offers.id),
  actorId: text("actor_id")
    .notNull()
    .references(() => users.id),
  terms: text("terms").notNull(),
  createdAt: text("created_at").notNull(),
});
export const agreements = sqliteTable("mp_agreements", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .references(() => dealRooms.id),
  offerId: text("offer_id")
    .notNull()
    .references(() => offers.id),
  status: text("status").notNull(),
  documentId: text("document_id").references(() => propertyDocuments.id),
  signedAt: text("signed_at"),
});
export const deals = sqliteTable("mp_deals", {
  id: text("id").primaryKey(),
  roomId: text("room_id")
    .notNull()
    .unique()
    .references(() => dealRooms.id),
  agreementId: text("agreement_id")
    .notNull()
    .references(() => agreements.id),
  transactionValue: text("transaction_value").notNull(),
  currency: text("currency").notNull(),
  closedAt: text("closed_at").notNull(),
});
export const feePolicies = sqliteTable("mp_fee_policies", {
  id: text("id").primaryKey(),
  rate: text("rate").notNull(),
  basis: text("basis").notNull(),
  currency: text("currency").notNull(),
  active: integer("active", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
});
export const fees = sqliteTable("mp_fees", {
  id: text("id").primaryKey(),
  dealId: text("deal_id")
    .notNull()
    .unique()
    .references(() => deals.id),
  policyId: text("policy_id")
    .notNull()
    .references(() => feePolicies.id),
  transactionValue: text("transaction_value").notNull(),
  feeBasis: text("fee_basis").notNull(),
  feeRate: text("fee_rate").notNull(),
  feeAmount: text("fee_amount").notNull(),
  currency: text("currency").notNull(),
  invoiceStatus: text("invoice_status").notNull(),
  paymentStatus: text("payment_status").notNull(),
});
export const payments = sqliteTable("mp_payments", {
  id: text("id").primaryKey(),
  feeId: text("fee_id")
    .notNull()
    .references(() => fees.id),
  providerReference: text("provider_reference").notNull().unique(),
  amount: text("amount").notNull(),
  currency: text("currency").notNull(),
  status: text("status").notNull(),
  createdAt: text("created_at").notNull(),
});
export const notifications = sqliteTable(
  "mp_notifications",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    eventKey: text("event_key").notNull(),
    title: text("title").notNull(),
    href: text("href").notNull(),
    readAt: text("read_at"),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("mp_notification_event").on(t.userId, t.eventKey),
    index("mp_notification_user").on(t.userId, t.createdAt),
  ],
);
export const verificationRecords = sqliteTable("mp_verification_records", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id").notNull(),
  subjectType: text("subject_type").notNull(),
  reviewedBy: text("reviewed_by")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull(),
  evidence: text("evidence").notNull(),
  createdAt: text("created_at").notNull(),
});
export const auditLogs = sqliteTable(
  "mp_audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    action: text("action").notNull(),
    resourceId: text("resource_id").notNull(),
    details: text("details").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [index("mp_audit_resource").on(t.resourceId, t.createdAt)],
);
export const aiRuns = sqliteTable("mp_ai_runs", {
  id: text("id").primaryKey(),
  actorId: text("actor_id")
    .notNull()
    .references(() => users.id),
  useCase: text("use_case").notNull(),
  model: text("model").notNull(),
  promptVersion: text("prompt_version").notNull(),
  latencyMs: integer("latency_ms").notNull(),
  success: integer("success", { mode: "boolean" }).notNull(),
  usage: text("usage").notNull(),
  errorCode: text("error_code"),
  createdAt: text("created_at").notNull(),
});
export const events = sqliteTable(
  "mp_events",
  {
    id: text("id").primaryKey(),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id),
    resourceId: text("resource_id").notNull(),
    payload: text("payload").notNull(),
    dedupKey: text("dedup_key").notNull().unique(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    index("mp_event_resource").on(t.resourceId, t.createdAt),
    check("mp_event_kind", sql`${t.kind} IN ('DOMAIN','ANALYTICS')`),
  ],
);
