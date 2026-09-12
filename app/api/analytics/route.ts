import { actor } from "@/src/services/platform/auth";
import { endpoint, json } from "@/src/services/platform/http";
import { statement } from "@/src/services/platform/database";
import { z } from "zod";
export const GET = (request: Request) =>
  endpoint(async () => {
    z.object({})
      .strict()
      .parse(Object.fromEntries(new URL(request.url).searchParams));
    const account = await actor(request);
    const counts = await statement(
      `SELECT
    (SELECT COUNT(*) FROM mp_properties WHERE owner_id=?) AS properties,
    (SELECT COUNT(*) FROM mp_requirements WHERE created_by=?) AS requirements,
    (SELECT COUNT(*) FROM mp_matches m JOIN mp_properties p ON p.id=m.property_id JOIN mp_requirements r ON r.id=m.requirement_id WHERE p.owner_id=? OR r.created_by=?) AS matches,
    (SELECT COUNT(*) FROM mp_deal_participants WHERE user_id=?) AS deals,
    (SELECT COUNT(*) FROM mp_viewings v JOIN mp_deal_participants p ON p.room_id=v.room_id WHERE p.user_id=?) AS viewings`,
      account.id,
      account.id,
      account.id,
      account.id,
      account.id,
      account.id,
    ).first();
    return json(counts);
  });
