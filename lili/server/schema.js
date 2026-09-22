/**
 * Hand-rolled schema validation.
 *
 * Every write path runs through `validate()`. Anything a model returns is validated
 * here before it can touch stored state, and unknown keys are dropped rather than
 * merged — a model must never be able to introduce a field such as `role`,
 * `accountStatus` or `successFeePercent` by emitting it.
 */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const REQUIREMENT_SCHEMA = {
  city: { type: "string", max: 80 },
  area: { type: "string", max: 160 },
  budgetMonthlyTHB: { type: "integer", min: 1, max: 100_000_000 },
  propertyType: { type: "enum", values: ["condo", "apartment", "house", "townhouse", "other"] },
  bedrooms: { type: "integer", min: 0, max: 20 },
  moveInDate: { type: "date" },
  leaseTermMonths: { type: "integer", min: 1, max: 120 },
  occupants: { type: "integer", min: 1, max: 30 },
  pets: { type: "enum", values: ["none", "cat", "dog", "other"] },
  notes: { type: "string", max: 2000 },
};

export const AGENT_PROFILE_SCHEMA = {
  agencyName: { type: "string", max: 160 },
  country: { type: "string", max: 80 },
  contactChannel: { type: "enum", values: ["email", "phone", "line", "whatsapp"] },
  contactValue: { type: "string", max: 160 },
  agentType: { type: "enum", values: ["independent", "company"] },
};

/** Fields a model is allowed to influence. Everything else is server-owned. */
export const MODEL_OUTPUT_SCHEMA = {
  language: { type: "enum", values: ["th", "en"] },
  intent: {
    type: "enum",
    values: ["provide_requirement", "ask_question", "edit_requirement", "ready_to_submit", "smalltalk", "other"],
  },
  requirement: { type: "object", schema: REQUIREMENT_SCHEMA },
  question: { type: "string", max: 500 },
};

function checkField(key, spec, value, errors) {
  if (value === null || value === undefined || value === "") return undefined;

  switch (spec.type) {
    case "string": {
      if (typeof value !== "string") { errors.push(`${key}: expected string`); return undefined; }
      const v = value.trim();
      if (!v) return undefined;
      if (v.length > spec.max) { errors.push(`${key}: longer than ${spec.max}`); return undefined; }
      return v;
    }
    case "integer": {
      const n = typeof value === "number" ? value : Number(String(value).replace(/[,\s]/g, ""));
      if (!Number.isInteger(n)) { errors.push(`${key}: expected integer`); return undefined; }
      if (n < spec.min || n > spec.max) { errors.push(`${key}: out of range ${spec.min}–${spec.max}`); return undefined; }
      return n;
    }
    case "enum": {
      if (!spec.values.includes(value)) { errors.push(`${key}: not one of ${spec.values.join(", ")}`); return undefined; }
      return value;
    }
    case "date": {
      if (typeof value !== "string" || !ISO_DATE.test(value)) { errors.push(`${key}: expected YYYY-MM-DD`); return undefined; }
      const d = new Date(`${value}T00:00:00Z`);
      if (Number.isNaN(d.getTime())) { errors.push(`${key}: not a real date`); return undefined; }
      return value;
    }
    case "object": {
      if (typeof value !== "object" || Array.isArray(value)) { errors.push(`${key}: expected object`); return undefined; }
      const { value: nested } = validate(value, spec.schema);
      return nested;
    }
    default:
      errors.push(`${key}: unknown spec`);
      return undefined;
  }
}

/**
 * Returns `{ value, errors, dropped }`.
 * `value` contains only keys present in the schema and passing their spec.
 * `dropped` names keys that were present in the input but are not in the schema —
 * surfaced so an unexpected model field is visible in the event log, not silent.
 */
export function validate(input, schema) {
  const errors = [];
  const dropped = [];
  const value = {};

  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    return { value: {}, errors: ["expected an object"], dropped: [] };
  }

  for (const key of Object.keys(input)) {
    if (!Object.hasOwn(schema, key)) { dropped.push(key); continue; }
    const out = checkField(key, schema[key], input[key], errors);
    if (out !== undefined) value[key] = out;
  }

  return { value, errors, dropped };
}
