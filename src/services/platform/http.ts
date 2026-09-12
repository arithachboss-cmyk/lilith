import { z } from "zod";
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
export const json = (data: unknown, status = 200) =>
  Response.json(
    { data },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        Vary: "Cookie, oai-authenticated-user-id",
      },
    },
  );
export async function endpoint(
  action: () => Promise<Response>,
): Promise<Response> {
  const requestId = crypto.randomUUID();
  try {
    return await action();
  } catch (error) {
    const known = error instanceof ApiError;
    const validation = error instanceof z.ZodError;
    if (!known && !validation)
      console.error("platform_request_failed", {
        requestId,
        type: error instanceof Error ? error.name : "UnknownError",
      });
    return Response.json(
      {
        error: {
          code: known
            ? error.code
            : validation
              ? "VALIDATION_ERROR"
              : "INTERNAL_ERROR",
          message: known
            ? error.message
            : validation
              ? "Please check the submitted fields"
              : "The request could not be completed. Please retry.",
          requestId,
          ...(validation
            ? {
                fields: error.issues.map((issue) => ({
                  path: issue.path.join("."),
                  message: issue.message,
                })),
              }
            : {}),
        },
      },
      {
        status: known ? error.status : validation ? 422 : 500,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
export function assertSameOrigin(request: Request): void {
  // Browser-only session mutations require Origin. Non-browser trusted callers must supply it too.
  if (
    request.headers.get("origin") !== new URL(request.url).origin ||
    request.headers.get("sec-fetch-site") === "cross-site"
  ) {
    throw new ApiError(
      403,
      "INVALID_ORIGIN",
      "This action must be submitted from this site",
    );
  }
}
const MAX_JSON_BYTES = 32768;
export async function input<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  assertSameOrigin(request);
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/json"
  )
    throw new ApiError(415, "CONTENT_TYPE", "Send application/json");
  if (!request.body)
    throw new ApiError(400, "INVALID_JSON", "A JSON body is required");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_JSON_BYTES) {
        await reader.cancel();
        throw new ApiError(413, "BODY_TOO_LARGE", "The request is too large");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const buffer = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.length;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(new TextDecoder().decode(buffer));
  } catch {
    throw new ApiError(400, "INVALID_JSON", "The request is not valid JSON");
  }
  return schema.parse(parsed);
}
