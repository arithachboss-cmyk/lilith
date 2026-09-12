import { z } from "zod";
import {
  profileInput,
  roleSchema,
  type Actor,
  type ProfileInput,
} from "../../domain/platform/contracts";
import { audit, database, event, now, statement } from "./database";
import { ApiError } from "./http";
const identitySchema = z.object({
  id: z.string().min(1).max(200),
  email: z.email().max(254),
});
/** Only trust these headers behind the Sites dispatcher. No direct public Worker ingress. */
export function identity(request: Request) {
  const parsed = identitySchema.safeParse({
    id: request.headers.get("oai-authenticated-user-id"),
    email: request.headers.get("oai-authenticated-user-email"),
  });
  if (!parsed.success)
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue");
  return parsed.data;
}
export async function findActor(id: string): Promise<Actor | null> {
  const row = await statement(
    "SELECT u.id,u.email,u.role,p.display_name AS displayName FROM mp_users u JOIN mp_profiles p ON p.user_id=u.id WHERE u.id=?",
    id,
  ).first<Actor>();
  if (row) roleSchema.parse(row.role);
  return row;
}
export async function actor(request: Request): Promise<Actor> {
  const account = identity(request);
  const found = await findActor(account.id);
  if (!found)
    throw new ApiError(
      403,
      "PROFILE_REQUIRED",
      "Choose your role before continuing",
    );
  return found;
}
export function requireRole(account: Actor, allowed: readonly Actor["role"][]) {
  if (!allowed.includes(account.role))
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Your role cannot perform this action",
    );
}
export async function saveProfile(request: Request, value: ProfileInput) {
  profileInput.parse(value);
  const account = identity(request);
  const old = await findActor(account.id);
  if (old)
    throw new ApiError(
      409,
      "PROFILE_EXISTS",
      "Your role is already registered",
    );
  const at = now();
  try {
    await database().batch([
      statement(
        "INSERT INTO mp_users (id,email,role,created_at) VALUES (?,?,?,?)",
        account.id,
        account.email.toLowerCase(),
        value.role,
        at,
      ),
      statement(
        "INSERT INTO mp_profiles (user_id,display_name,updated_at) VALUES (?,?,?)",
        account.id,
        value.displayName,
        at,
      ),
      audit(account.id, "profile.created", account.id, { role: value.role }),
      event(
        account.id,
        "signup_started",
        account.id,
        `signup-start:${account.id}`,
      ),
      event(
        account.id,
        "signup_completed",
        account.id,
        `signup:${account.id}`,
        { role: value.role },
      ),
    ]);
  } catch (error) {
    if (await findActor(account.id))
      throw new ApiError(
        409,
        "PROFILE_EXISTS",
        "Your role is already registered",
      );
    throw error;
  }
  return findActor(account.id);
}
