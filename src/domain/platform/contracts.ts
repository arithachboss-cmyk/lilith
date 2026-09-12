import { z } from "zod";
import { MONEY_PATTERN, canonicalMoney, toMinorUnits } from "../shared/money";
export const roleSchema = z.enum([
  "OWNER",
  "AGENT",
  "CLIENT",
  "ADMIN",
  "OPERATOR",
]);
export type Role = z.infer<typeof roleSchema>;
export const idSchema = z.string().uuid();
export const moneySchema = z
  .string()
  .regex(
    MONEY_PATTERN,
    "Enter a decimal amount with at most two decimal places",
  )
  .refine(
    (value) => !MONEY_PATTERN.test(value) || toMinorUnits(value) > BigInt(0),
    "Amount must be positive",
  )
  .transform(canonicalMoney);
const location = z.string().trim().min(2).max(120);
const facilities = z
  .array(z.string().trim().min(1).max(60))
  .max(30)
  .transform((values) => [...new Set(values)]);
const common = {
  transactionType: z.enum(["RENT", "SALE"]),
  propertyType: z.enum(["CONDO", "HOUSE", "HOTEL", "LAND", "COMMERCIAL"]),
  currency: z.literal("THB"),
  facilities,
};
export const profileInput = z
  .object({
    displayName: z.string().trim().min(2).max(100),
    role: z.enum(["OWNER", "AGENT", "CLIENT"]),
  })
  .strict();
export const propertyInput = z
  .object({
    ...common,
    name: z.string().trim().min(3).max(160),
    description: z.string().trim().max(4000),
    location,
    price: moneySchema,
    bedrooms: z.number().int().min(0).max(1000),
    areaSqm: z.number().finite().positive().max(10000000),
  })
  .strict();
export const requirementInput = z
  .object({
    ...common,
    title: z.string().trim().min(3).max(160),
    description: z.string().trim().max(4000),
    budgetMax: moneySchema,
    locations: z.array(location).min(1).max(10),
    minBedrooms: z.number().int().min(0).max(1000),
    hardBudget: z.boolean(),
    hardLocation: z.boolean(),
    clientConsent: z.literal(true, {
      error: "Confirm you have permission to represent this requirement",
    }),
  })
  .strict();
export const interestInput = z
  .object({ decision: z.enum(["PASS", "INTERESTED", "SUPER_MATCH"]) })
  .strict();
export const viewingInput = z
  .object({
    scheduledAt: z.iso.datetime({ offset: true }),
    notes: z.string().trim().max(2000),
    requestId: idSchema,
  })
  .strict();
export const messageInput = z
  .object({ body: z.string().trim().min(1).max(4000), requestId: idSchema })
  .strict();
export const transitionInput = z
  .object({
    to: z.enum(["VIEWING_CONFIRMED", "VIEWING_COMPLETED", "CANCELLED"]),
    reason: z.string().trim().min(3).max(1000),
  })
  .strict();
export const paginationInput = z
  .object({ cursor: z.coerce.number().int().min(0).max(1000000).default(0) })
  .strict();
export type PropertyInput = z.infer<typeof propertyInput>;
export type RequirementInput = z.infer<typeof requirementInput>;
export type ProfileInput = z.infer<typeof profileInput>;
export type InterestInput = z.infer<typeof interestInput>;
export type ViewingInput = z.infer<typeof viewingInput>;
export interface Actor {
  id: string;
  email: string;
  role: Role;
  displayName: string;
}
