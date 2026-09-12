import { z } from "zod";
import { actor } from "@/src/services/platform/auth";
import { endpoint, input, json } from "@/src/services/platform/http";
import { now, statement } from "@/src/services/platform/database";
import { paginationInput } from "@/src/domain/platform/contracts";
export const GET = (request: Request) =>
  endpoint(async () => {
    const account = await actor(request);
    const { cursor } = paginationInput.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const rows = await statement(
      "SELECT id,title,href,read_at AS readAt,created_at AS createdAt FROM mp_notifications WHERE user_id=? ORDER BY created_at DESC,id LIMIT 21 OFFSET ?",
      account.id,
      cursor,
    ).all();
    return json({
      items: rows.results.slice(0, 20),
      nextCursor: rows.results.length > 20 ? cursor + 20 : null,
    });
  });
export const PATCH = (request: Request) =>
  endpoint(async () => {
    const account = await actor(request);
    const { id } = await input(
      request,
      z.object({ id: z.string().min(1).max(300) }).strict(),
    );
    await statement(
      "UPDATE mp_notifications SET read_at=? WHERE id=? AND user_id=?",
      now(),
      id,
      account.id,
    ).run();
    return json({ saved: true });
  });
