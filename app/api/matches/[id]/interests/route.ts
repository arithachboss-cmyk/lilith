import { actor } from "@/src/services/platform/auth";
import { endpoint, input, json } from "@/src/services/platform/http";
import { expressInterest } from "@/src/services/platform/matching";
import { idSchema, interestInput } from "@/src/domain/platform/contracts";
export const POST = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) =>
  endpoint(async () =>
    json(
      await expressInterest(
        await actor(request),
        idSchema.parse((await context.params).id),
        await input(request, interestInput),
      ),
    ),
  );
