import { z } from "zod";

export const CONTACT = {
  brand: "Middle Property",
  line: "@middleproperty",
  lineUrl: "https://line.me/R/ti/p/@middleproperty",
  phone: "0933888594",
  phoneUrl: "tel:+66933888594",
} as const;
export const CONSENT_VERSION = "middle-property-2026-09-13-v1";
export const locales = ["th", "en", "zh", "ru", "ja", "ko", "vi"] as const;
export const eventNames = [
  "page_view",
  "form_start",
  "form_submit",
  "line_click",
  "call_click",
  "qualified_lead",
  "viewing_request",
] as const;
// Explicit allowlist prevents query strings, contacts or arbitrary event data entering analytics.
const campaignValue = z
  .string()
  .max(100)
  .regex(/^[\p{L}\p{N}_. -]*$/u);
export const touchSchema = z
  .object({
    source: campaignValue,
    medium: campaignValue,
    campaign: campaignValue,
    at: z.string().datetime(),
  })
  .strict();
export const attributionSchema = z
  .object({
    landing_locale: z.enum(locales),
    first_touch: touchSchema,
    last_touch: touchSchema,
  })
  .strict();
export const sessionSchema = z
  .object({
    draft_id: z.string().uuid(),
    mock_data: z.literal(true),
    consent: z
      .object({
        accepted: z.literal(true),
        version: z.literal(CONSENT_VERSION),
      })
      .strict(),
  })
  .strict();
export const leadSchema = z
  .object({
    mock_data: z.literal(true),
    name: z.string().min(5).max(100).startsWith("TEST "),
    contact: z
      .email()
      .max(150)
      .regex(/@example\.test$/),
    category: z.enum(["rent", "buy", "list"]),
    language: z.enum(locales),
    budget: z.number().int().min(1).max(500000000),
    area: z.string().trim().min(2).max(150),
    requirements: z.string().max(1000),
    attribution: attributionSchema,
  })
  .strict();
export type PilotLeadInput = z.infer<typeof leadSchema>;

// Director order: no real lead write path is authorized in this review build.
export function legacyLeadWritesClosed(): boolean {
  return true;
}
