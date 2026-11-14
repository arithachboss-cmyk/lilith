import { z } from "zod";

export interface DtoMeta {
  id: string;
  description?: string;
}

/**
 * Every named schema of the API contract. The OpenAPI generator turns each
 * entry into `#/components/schemas/<id>` (Blueprint §18).
 */
export const dtoRegistry = z.registry<DtoMeta>();

const schemasById = new Map<string, z.ZodType>();

/** Names a schema. An id and a schema instance can each be used only once. */
export function dto<T extends z.ZodType>(
  id: string,
  schema: T,
  description?: string,
): T {
  if (schemasById.has(id)) throw new Error(`Duplicate DTO id: ${id}`);
  if (dtoRegistry.has(schema))
    throw new Error(`Schema is already named; cannot also name it ${id}`);
  schemasById.set(id, schema);
  dtoRegistry.add(
    schema,
    description === undefined ? { id } : { id, description },
  );
  return schema;
}

export function namedSchemas(): ReadonlyMap<string, z.ZodType> {
  return schemasById;
}

export function schemaId(schema: z.ZodType): string | undefined {
  return dtoRegistry.get(schema)?.id;
}
