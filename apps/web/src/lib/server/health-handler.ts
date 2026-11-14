import { HealthResponse } from "@lilith/contracts/dto";
import type { SystemHealth } from "@lilith/core/system";
import { apiErrorCopy } from "@lilith/i18n";
import { errorResponse, jsonResponse, newRequestId } from "./http";

/**
 * GET /api/health (Blueprint §18.10). The route adapter does three things
 * only: ask core, check the answer against the contract, and put it on the
 * wire. It always answers 200 — a monitor reads `status` — unless the adapter
 * itself fails, which is a 500 in the error envelope.
 */
export function createHealthHandler(
  readHealth: () => Promise<SystemHealth>,
): () => Promise<Response> {
  return async function GET() {
    const requestId = newRequestId();
    try {
      const body = HealthResponse.parse(await readHealth());
      return jsonResponse(body, requestId);
    } catch {
      // Nothing about the cause goes to the caller; the id lets us find it.
      return errorResponse("INTERNAL", apiErrorCopy.INTERNAL, requestId, true);
    }
  };
}
