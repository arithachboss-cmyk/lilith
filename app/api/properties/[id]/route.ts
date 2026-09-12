import { actor } from "@/src/services/platform/auth";
import { endpoint, json } from "@/src/services/platform/http";
import { getProperty } from "@/src/services/platform/inventory";
import { idSchema } from "@/src/domain/platform/contracts";
export const GET = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) =>
  endpoint(async () =>
    json(
      await getProperty(
        await actor(request),
        idSchema.parse((await context.params).id),
      ),
    ),
  );
