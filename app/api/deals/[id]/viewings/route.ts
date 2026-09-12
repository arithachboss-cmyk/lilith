import { actor } from "@/src/services/platform/auth";
import { endpoint, input, json } from "@/src/services/platform/http";
import { requestViewing } from "@/src/services/platform/deals";
import { idSchema, viewingInput } from "@/src/domain/platform/contracts";
export const POST = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) =>
  endpoint(async () =>
    json(
      await requestViewing(
        await actor(request),
        idSchema.parse((await context.params).id),
        await input(request, viewingInput),
      ),
      201,
    ),
  );
