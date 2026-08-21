export type LeadPayload = {
  name?: string;
  contact?: string;
  source?: string;
  budget?: number | string;
  area?: string;
  propertyType?: string;
  bedrooms?: number | string;
  moveDate?: string;
  viewingWindow?: string;
  contractTerm?: string;
  preferredLanguage?: string;
  pets?: string;
  requirements?: string;
  consent?: boolean;
  website?: string;
  stage?: string;
};

export function normalizeLead(payload: LeadPayload, authenticated: boolean) {
  const spamSignal = String(payload.website ?? "").trim().slice(0, 120);
  if (spamSignal) return { spam: true } as const;

  const name = String(payload.name ?? "").trim().slice(0, 120);
  const contact = String(payload.contact ?? "").trim().slice(0, 160);
  const source = String(payload.source ?? "Public capture URL").trim().slice(0, 120);
  const area = String(payload.area ?? "").trim().slice(0, 120);
  const propertyType = String(payload.propertyType ?? "").trim().slice(0, 40);
  const stage = authenticated
    ? String(payload.stage ?? "New inquiry").trim().slice(0, 80)
    : "New inquiry";
  const moveDate = String(payload.moveDate ?? "").trim().slice(0, 20) || null;
  const viewingWindow = String(payload.viewingWindow ?? "").trim().slice(0, 80) || null;
  const contractTerm = String(payload.contractTerm ?? "").trim().slice(0, 40);
  const preferredLanguage = String(payload.preferredLanguage ?? "").trim().slice(0, 40);
  const pets = String(payload.pets ?? "").trim().slice(0, 80) || null;
  const requirements = String(payload.requirements ?? "").trim().slice(0, 600) || null;
  const budget = Number(payload.budget);
  const bedrooms = Number(payload.bedrooms);

  if (
    name.length < 2 ||
    contact.length < 3 ||
    area.length < 2 ||
    !propertyType ||
    !preferredLanguage ||
    !Number.isFinite(budget) ||
    budget < 50000 ||
    budget > 250000 ||
    !Number.isInteger(bedrooms) ||
    bedrooms < 1 ||
    bedrooms > 5 ||
    contractTerm !== "12 months" ||
    payload.consent !== true
  ) {
    return null;
  }

  return {
    name,
    contact,
    source,
    budget: Math.round(budget),
    area,
    propertyType,
    bedrooms,
    moveDate,
    viewingWindow,
    contractTerm,
    preferredLanguage,
    pets,
    requirements,
    stage,
  };
}
