import { actor } from "@/src/services/platform/auth";
import { endpoint, json } from "@/src/services/platform/http";
import { roomAccess } from "@/src/services/platform/deals";
import { statement } from "@/src/services/platform/database";
import { idSchema, paginationInput } from "@/src/domain/platform/contracts";
export const GET = (
  request: Request,
  context: { params: Promise<{ id: string }> },
) =>
  endpoint(async () => {
    const account = await actor(request),
      id = idSchema.parse((await context.params).id);
    const { cursor } = paginationInput.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    await roomAccess(account, id);
    const rows = await statement(
      "SELECT name,payload,created_at AS createdAt FROM mp_events WHERE kind='DOMAIN' AND resource_id=? ORDER BY created_at DESC,id DESC LIMIT 51 OFFSET ?",
      id,
      cursor,
    ).all();
    return json({
      items: rows.results.slice(0, 50),
      nextCursor: rows.results.length > 50 ? cursor + 50 : null,
    });
  });
