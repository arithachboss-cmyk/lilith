import { randomUUID } from "node:crypto";
import { domainError } from "./errors.ts";
import type { DomainError } from "./errors.ts";
import { err, ok } from "./result.ts";
import type { Result } from "./result.ts";

declare const uuidBrand: unique symbol;
export type UUID = string & { readonly [uuidBrand]: "UUID" };
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const UUID_LENGTH = 36;

/** Syntax validation is not identity resolution or authorization. */
export function parseUUID(
  input: unknown,
): Result<UUID, DomainError<"VALIDATION_FAILED">> {
  if (
    typeof input !== "string" ||
    input.length !== UUID_LENGTH ||
    !UUID_PATTERN.test(input)
  ) {
    return err(
      domainError("VALIDATION_FAILED", "Expected a canonical UUID.", {
        fieldErrors: { id: "Invalid UUID." },
      }),
    );
  }
  return ok(input.toLowerCase() as UUID);
}

export interface IdGenerator {
  next(): UUID;
}

/** A broken injected generator fails explicitly; there is no random fallback. */
export function createIdGenerator(generate: () => string): IdGenerator {
  return Object.freeze({
    next(): UUID {
      const result = parseUUID(generate());
      if (!result.ok)
        throw new TypeError("ID generator returned an invalid UUID.");
      return result.value;
    },
  });
}

/** Production UUID v4 generator; injected generators may supply other validated versions. */
export const systemIds: IdGenerator = createIdGenerator(randomUUID);
