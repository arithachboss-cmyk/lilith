import { legacyLeadWritesClosed } from "@/src/domain/pilot";
import { isAuthenticated } from "./auth";
import {
  deleteTestLeads,
  ensureLeadSchema,
  insertLead,
  listLeads,
  updateLeadProgress,
} from "./storage";
import {
  monthlyBudgetRange,
  normalizeLead,
  normalizeLeadUpdate,
  purchaseBudgetRange,
  type LeadPayload,
  type LeadUpdatePayload,
} from "./validation";

function json(data: unknown, init?: ResponseInit) {
  return Response.json(data, {
    ...init,
    headers: {
      "Cache-Control": "no-store",
      ...(init?.headers ?? {}),
    },
  });
}

export async function GET(request: Request) {
  if (!isAuthenticated(request)) {
    return json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureLeadSchema();
  const result = await listLeads();

  return json({ leads: result.results ?? [] });
}

export async function POST(request: Request) {
  if (legacyLeadWritesClosed()) return Response.json({ error: "NO-GO: real lead intake is closed in this readiness build." }, {status:503,headers:{"Cache-Control":"no-store"}});
  await ensureLeadSchema();
  let payload: LeadPayload;
  try {
    payload = (await request.json()) as LeadPayload;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const lead = normalizeLead(payload, isAuthenticated(request));

  if (lead && "spam" in lead) {
    return json({ accepted: true }, { status: 201 });
  }

  if (!lead) {
    return json(
      {
        error:
          `Lead must be a valid real estate brief. Rental leads need a 12-month lease and monthly budget of ฿${monthlyBudgetRange.min.toLocaleString("en-US")}-฿${monthlyBudgetRange.max.toLocaleString("en-US")}; purchase/listing leads need THB ${purchaseBudgetRange.min.toLocaleString("en-US")}+ and verified contact details.`,
      },
      { status: 422 },
    );
  }

  const result = await insertLead(lead);

  return json({ lead: result }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (legacyLeadWritesClosed()) return Response.json({ error: "NO-GO: real lead intake is closed in this readiness build." }, {status:503,headers:{"Cache-Control":"no-store"}});
  if (!isAuthenticated(request)) {
    return json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureLeadSchema();
  let payload: LeadUpdatePayload;
  try {
    payload = (await request.json()) as LeadUpdatePayload;
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const update = normalizeLeadUpdate(payload);
  if (!update) {
    return json({ error: "Invalid lead update" }, { status: 422 });
  }

  const result = await updateLeadProgress(update);

  if (!result) return json({ error: "Lead not found" }, { status: 404 });
  return json({ lead: result });
}

export async function DELETE(request: Request) {
  if (legacyLeadWritesClosed()) return Response.json({ error: "NO-GO: real lead intake is closed in this readiness build." }, {status:503,headers:{"Cache-Control":"no-store"}});
  if (!isAuthenticated(request)) {
    return json({ error: "Sign in required" }, { status: 401 });
  }

  await ensureLeadSchema();
  const scope = new URL(request.url).searchParams.get("scope");
  if (scope !== "tests") {
    return json({ error: "Only test lead cleanup is supported" }, { status: 400 });
  }

  const result = await deleteTestLeads();
  return json({ deleted: result.meta?.changes ?? 0 });
}
