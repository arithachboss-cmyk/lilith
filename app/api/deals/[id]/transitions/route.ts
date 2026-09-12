import { actor } from "@/src/services/platform/auth";
import { endpoint, input, json } from "@/src/services/platform/http";
import { transitionDeal } from "@/src/services/platform/deals";
import { idSchema, transitionInput } from "@/src/domain/platform/contracts";
export const POST = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) =>
  endpoint(async () =>
    json(
      await transitionDeal(
        await actor(request),
        idSchema.parse((await context.params).id),
        await input(request, transitionInput),
      ),
      200,
    ),
  );
