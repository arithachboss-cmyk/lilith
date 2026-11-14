/** Source of entity ids. Inject it wherever a test needs predictable ids. */
export interface IdGenerator {
  next(): string;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Largest value that fits the last twelve hex digits of a UUID.
const MAX_SEQUENCE = 0xffff_ffff_ffff;

/** Random UUID v4, the same kind PostgreSQL's `gen_random_uuid()` produces. */
export const randomIds: IdGenerator = {
  next: () => crypto.randomUUID(),
};

/**
 * Deterministic, well-formed UUIDs that count upwards, for tests:
 * `00000000-0000-4000-8000-000000000001`, `…0002`, and so on.
 */
export function sequentialIds(start = 1): IdGenerator {
  if (!Number.isSafeInteger(start) || start < 0 || start > MAX_SEQUENCE)
    throw new RangeError(`Sequence start is out of range: ${start}`);
  let counter = start;
  return {
    next() {
      if (counter > MAX_SEQUENCE)
        throw new RangeError("Sequential id generator is exhausted");
      const suffix = counter.toString(16).padStart(12, "0");
      counter += 1;
      return `00000000-0000-4000-8000-${suffix}`;
    },
  };
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}
