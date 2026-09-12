import { endpoint, input, json } from "@/src/services/platform/http";
import { findActor, identity, saveProfile } from "@/src/services/platform/auth";
import { profileInput } from "@/src/domain/platform/contracts";
export const GET = (request: Request) =>
  endpoint(async () =>
    json({ profile: await findActor((await identity(request)).id) }),
  );
export const POST = (request: Request) =>
  endpoint(async () =>
    json(await saveProfile(request, await input(request, profileInput)), 201),
  );
