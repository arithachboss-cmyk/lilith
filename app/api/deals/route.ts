import { z } from "zod";
import { actor } from "@/src/services/platform/auth";
import { ApiError, endpoint, input, json } from "@/src/services/platform/http";
import { listRooms, roomAccess } from "@/src/services/platform/deals";
import { matchAccess } from "@/src/services/platform/matching";
import { statement } from "@/src/services/platform/database";
import { idSchema, paginationInput } from "@/src/domain/platform/contracts";
export const GET = (request: Request) =>
  endpoint(async () =>
    json(
      await listRooms(
        await actor(request),
        paginationInput.parse(
          Object.fromEntries(new URL(request.url).searchParams),
        ).cursor,
      ),
    ),
  );
export const POST = (request: Request) =>
  endpoint(async () => {
    const account = await actor(request);
    const { matchId } = await input(
      request,
      z.object({ matchId: idSchema }).strict(),
    );
    await matchAccess(account, matchId);
    const row = await statement(
      "SELECT id FROM mp_deal_rooms WHERE match_id=?",
      matchId,
    ).first<{ id: string }>();
    if (!row)
      throw new ApiError(
        409,
        "MUTUAL_MATCH_REQUIRED",
        "Both parties must express interest before a deal can start",
      );
    return json(await roomAccess(account, row.id));
  });
