import { actor } from "@/src/services/platform/auth";
import { endpoint, json } from "@/src/services/platform/http";
import { listMatches } from "@/src/services/platform/matching";
import { idSchema, paginationInput } from "@/src/domain/platform/contracts";
const query = paginationInput
  .extend({ requirementId: idSchema.optional() })
  .strict();
export const GET = (request: Request) =>
  endpoint(async () => {
    const filter = query.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    return json(
      await listMatches(
        await actor(request),
        filter.cursor,
        true,
        filter.requirementId,
      ),
    );
  });
