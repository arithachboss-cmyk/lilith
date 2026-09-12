import { AsyncLocalStorage } from "node:async_hooks";
import { verifiedIdentity } from "./identity";
type Identity = Awaited<ReturnType<typeof verifiedIdentity>>;
// Vinext's server-render and Worker entry can be separate module graphs.
// Share the ALS instance, never a mutable current-user value.
const key = Symbol.for("middle.readiness.request-identity");
const registry = globalThis as typeof globalThis & { [key: symbol]: unknown };
const context = (registry[key] ??=
  new AsyncLocalStorage<Identity>()) as AsyncLocalStorage<Identity>;
export const requestIdentity = () => context.getStore() ?? null;
export async function withRequestIdentity(
  request: Request,
  action: () => Promise<Response>,
) {
  const account = await verifiedIdentity(request);
  return context.run(account, action);
}
