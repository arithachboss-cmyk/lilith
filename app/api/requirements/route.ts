import { actor } from "@/src/services/platform/auth";
import { endpoint, input, json } from "@/src/services/platform/http";
import {
  createRequirement,
  ownInventory,
} from "@/src/services/platform/inventory";
import {
  paginationInput,
  requirementInput,
} from "@/src/domain/platform/contracts";
export const POST = (request: Request) =>
  endpoint(async () =>
    json(
      await createRequirement(
        await actor(request),
        await input(request, requirementInput),
      ),
      201,
    ),
  );
export const GET = (request: Request) =>
  endpoint(async () =>
    json(
      await ownInventory(
        await actor(request),
        paginationInput.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        ).cursor,
        "requirements",
      ),
    ),
  );
