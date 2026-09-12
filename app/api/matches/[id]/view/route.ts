import { z } from "zod";
import { actor } from "@/src/services/platform/auth";
import { endpoint, input, json } from "@/src/services/platform/http";
import { matchAccess } from "@/src/services/platform/matching";
import { event } from "@/src/services/platform/database";
import { idSchema } from "@/src/domain/platform/contracts";
export const POST = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) =>
  endpoint(async () => {
    const account = await actor(request),
      id = idSchema.parse((await context.params).id);
    const { requestId } = await input(
      request,
      z.object({ requestId: idSchema }).strict(),
    );
    await matchAccess(account, id);
    await event(
      account.id,
      "match_viewed",
      id,
      `view:${account.id}:${id}:${requestId}`,
      {},
      undefined,
      "ANALYTICS",
    ).run();
    return json({ recorded: true });
  });
