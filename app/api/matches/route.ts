import { actor } from "@/src/services/platform/auth";
import { endpoint, json } from "@/src/services/platform/http";
import { listMatches } from "@/src/services/platform/matching";
import { paginationInput } from "@/src/domain/platform/contracts";
export const GET = (request: Request) =>
  endpoint(async () =>
    json(
      await listMatches(
        await actor(request),
        paginationInput.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        ).cursor,
      ),
    ),
  );
