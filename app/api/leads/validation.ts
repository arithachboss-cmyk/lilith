export type LeadPayload = {
  name?: string;
  contact?: string;
  source?: string;
  budget?: number | string;
  budgetPeriod?: string;
  area?: string;
  propertyType?: string;
  bedrooms?: number | string;
  moveDate?: string;
  viewingWindow?: string;
  contractTerm?: string;
  preferredLanguage?: string;
  customerCountry?: string;
  dealIntent?: string;
  wechat?: string;
  partnerAgency?: string;
  partnerAgent?: string;
  partnerContact?: string;
  externalId?: string;
  importBatch?: string;
  pets?: string;
  requirements?: string;
  consent?: boolean;
  website?: string;
  stage?: string;
};

export type NormalizedLead = {
  name: string;
  contact: string;
  source: string;
  budget: number;
  budgetPeriod: string;
  area: string;
  propertyType: string;
  bedrooms: number | null;
  moveDate: string | null;
  viewingWindow: string | null;
  contractTerm: string;
  preferredLanguage: string;
  customerCountry: string | null;
  dealIntent: string;
  wechat: string | null;
  partnerAgency: string | null;
  partnerAgent: string | null;
  partnerContact: string | null;
  externalId: string | null;
  importBatch: string | null;
  pets: string | null;
  requirements: string | null;
  stage: string;
};

export const monthlyBudgetRange = {
  min: 30000,
  max: 250000,
} as const;

export const purchaseBudgetRange = {
  min: 1000000,
  max: 250000000,
} as const;

export const listingValueRange = {
  min: 1000000,
  max: 500000000,
} as const;

export const leadStages = [
  "New inquiry",
  "Qualified",
  "Shortlist sent",
  "Viewing booked",
  "Offer submitted",
  "Deposit pending",
  "Won",
  "Lost",
] as const;

export const leadIntents = [
  "Rent 12-month",
  "Buy condo",
  "Sell/List property",
  "China agent referral",
] as const;

export const budgetPeriods = [
  "Monthly rent",
  "Purchase budget",
  "Listing value",
] as const;

export type LeadUpdatePayload = {
  id?: number | string;
  stage?: string;
  nextFollowUpAt?: string | null;
};

function normalizeStage(value: unknown) {
  const stage = String(value ?? "New inquiry").trim();
  return leadStages.includes(stage as (typeof leadStages)[number]) ? stage : null;
}

function clean(value: unknown, maxLength: number) {
  return String(value ?? "").trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function optional(value: unknown, maxLength: number) {
  return clean(value, maxLength) || null;
}

function normalizedNeedle(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function normalizeDealIntent(value: unknown) {
  const intent = clean(value, 80);
  const key = intent.toLowerCase();

  if (
    key.includes("buy") ||
    key.includes("purchase") ||
    key.includes("invest") ||
    key.includes("ซื้อ") ||
    key.includes("买") ||
    key.includes("购买") ||
    key.includes("куп")
  ) {
    return "Buy condo";
  }

  if (
    key.includes("sell") ||
    key.includes("list") ||
    key.includes("owner") ||
    key.includes("ขาย") ||
    key.includes("业主") ||
    key.includes("прод")
  ) {
    return "Sell/List property";
  }

  if (
    key.includes("china") ||
    key.includes("chinese") ||
    key.includes("broker") ||
    key.includes("agent referral") ||
    key.includes("wechat") ||
    key.includes("จีน") ||
    key.includes("中国") ||
    key.includes("中介")
  ) {
    return "China agent referral";
  }

  if (intent && !key.includes("rent") && !key.includes("lease") && !key.includes("เช่า")) {
    return null;
  }

  return "Rent 12-month";
}

function normalizeBudgetPeriod(value: unknown, dealIntent: string, budget: number) {
  const key = normalizedNeedle(value);

  if (
    key.includes("listing") ||
    key.includes("sale value") ||
    key.includes("asset") ||
    key.includes("ประกาศขาย") ||
    key.includes("ขาย")
  ) {
    return "Listing value";
  }

  if (
    key.includes("purchase") ||
    key.includes("buy") ||
    key.includes("investment") ||
    key.includes("total") ||
    key.includes("ซื้อ")
  ) {
    return "Purchase budget";
  }

  if (
    key.includes("month") ||
    key.includes("rent") ||
    key.includes("lease") ||
    key.includes("เช่า") ||
    key.includes("เดือน") ||
    key.includes("月")
  ) {
    return "Monthly rent";
  }

  if (dealIntent === "Buy condo") return "Purchase budget";
  if (dealIntent === "Sell/List property") return "Listing value";
  if (dealIntent === "China agent referral" && budget >= purchaseBudgetRange.min) {
    return "Purchase budget";
  }
  return "Monthly rent";
}

function normalizeContractTerm(value: unknown, budgetPeriod: string) {
  const term = clean(value, 40);
  if (budgetPeriod !== "Monthly rent") return term || "Not applicable";
  if (!term || term === "1 year" || term === "one year" || term === "12 month") {
    return "12 months";
  }
  return term;
}

function budgetInRange(budget: number, budgetPeriod: string) {
  if (!Number.isFinite(budget)) return false;
  if (budgetPeriod === "Listing value") {
    return budget >= listingValueRange.min && budget <= listingValueRange.max;
  }
  if (budgetPeriod === "Purchase budget") {
    return budget >= purchaseBudgetRange.min && budget <= purchaseBudgetRange.max;
  }
  return budget >= monthlyBudgetRange.min && budget <= monthlyBudgetRange.max;
}

function normalizeBedrooms(value: unknown) {
  if (value === undefined || value === null || value === "") return null;
  const bedrooms = Number(value);
  if (!Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 8) return null;
  return bedrooms;
}

function normalizeLeadCore(payload: LeadPayload, trustedSource: boolean) {
  const spamSignal = clean(payload.website, 120);
  if (spamSignal) return { spam: true } as const;

  const name = clean(payload.name, 120);
  const contact = clean(payload.contact, 160);
  const source = clean(payload.source ?? "Public capture URL", 140);
  const area = clean(payload.area, 140);
  const propertyType = clean(payload.propertyType, 60);
  const preferredLanguage = clean(payload.preferredLanguage, 50);
  const customerCountry = optional(payload.customerCountry, 80);
  const dealIntent = normalizeDealIntent(payload.dealIntent);
  const stage = trustedSource ? normalizeStage(payload.stage) : "New inquiry";
  const budget = Number(payload.budget);
  const budgetPeriod = dealIntent
    ? normalizeBudgetPeriod(payload.budgetPeriod, dealIntent, budget)
    : null;
  const contractTerm = budgetPeriod
    ? normalizeContractTerm(payload.contractTerm, budgetPeriod)
    : "";
  const bedrooms = normalizeBedrooms(payload.bedrooms);
  const wechat = optional(payload.wechat, 80);
  const partnerContact = optional(payload.partnerContact, 160);
  const primaryContact = contact || wechat || partnerContact || "";

  if (
    name.length < 2 ||
    primaryContact.length < 3 ||
    source.length < 2 ||
    area.length < 2 ||
    !propertyType ||
    !preferredLanguage ||
    !dealIntent ||
    !budgetPeriod ||
    !budgetInRange(budget, budgetPeriod) ||
    (budgetPeriod === "Monthly rent" && contractTerm !== "12 months") ||
    (!trustedSource && payload.consent !== true) ||
    !stage
  ) {
    return null;
  }

  return {
    name,
    contact: primaryContact,
    source,
    budget: Math.round(budget),
    budgetPeriod,
    area,
    propertyType,
    bedrooms,
    moveDate: optional(payload.moveDate, 20),
    viewingWindow: optional(payload.viewingWindow, 80),
    contractTerm,
    preferredLanguage,
    customerCountry,
    dealIntent,
    wechat,
    partnerAgency: optional(payload.partnerAgency, 120),
    partnerAgent: optional(payload.partnerAgent, 120),
    partnerContact,
    externalId: optional(payload.externalId, 120),
    importBatch: optional(payload.importBatch, 120),
    pets: optional(payload.pets, 80),
    requirements: optional(payload.requirements, 800),
    stage,
  } satisfies NormalizedLead;
}

export function normalizeLead(payload: LeadPayload, authenticated: boolean) {
  return normalizeLeadCore(payload, authenticated);
}

export function normalizeImportedLead(payload: LeadPayload) {
  return normalizeLeadCore(payload, true);
}

export function normalizeLeadUpdate(payload: LeadUpdatePayload) {
  const id = Number(payload.id);
  const stage = normalizeStage(payload.stage);
  const nextFollowUpAt = String(payload.nextFollowUpAt ?? "").trim().slice(0, 32) || null;

  if (
    !Number.isInteger(id) ||
    id < 1 ||
    !stage ||
    (nextFollowUpAt && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(nextFollowUpAt))
  ) {
    return null;
  }

  return { id, stage, nextFollowUpAt };
}
