import { actor } from "@/src/services/platform/auth";
import { endpoint, input, json } from "@/src/services/platform/http";
import { sendMessage } from "@/src/services/platform/deals";
import { idSchema, messageInput } from "@/src/domain/platform/contracts";
export const POST = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) =>
  endpoint(async () =>
    json(
      await sendMessage(
        await actor(request),
        idSchema.parse((await context.params).id),
        await input(request, messageInput),
      ),
      201,
    ),
  );
