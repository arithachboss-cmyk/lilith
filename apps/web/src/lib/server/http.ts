import {
  errorEnvelope,
  httpStatusOf,
  type ErrorCode,
} from "@lilith/contracts/errors";

/**
 * The edge of the API (Blueprint §18.0): every response carries
 * `X-Request-Id`, and every non-2xx response is the error envelope.
 */

export const REQUEST_ID_HEADER = "X-Request-Id";

/** A fresh id for one request. It is never taken from the caller. */
export function newRequestId(): string {
  return `req_${crypto.randomUUID()}`;
}

export function jsonResponse(
  body: unknown,
  requestId: string,
  status = 200,
): Response {
  return Response.json(body, {
    status,
    headers: {
      [REQUEST_ID_HEADER]: requestId,
      // API answers describe the present moment; nothing may cache them.
      "Cache-Control": "no-store",
    },
  });
}

export interface ErrorTexts {
  readonly en: string;
  readonly th: string;
}

/** The error envelope for a code, with the status the contract gives it. */
export function errorResponse(
  code: Exclude<
    ErrorCode,
    | "DEAL_TRANSITION_NOT_ALLOWED"
    | "SUPER_MATCH_QUOTA_EXCEEDED"
    | "CLOSE_VALUE_MISMATCH"
  >,
  texts: ErrorTexts,
  requestId: string,
  retryable: boolean,
): Response {
  const envelope = errorEnvelope({
    code,
    message_en: texts.en,
    message_th: texts.th,
    request_id: requestId,
    retryable,
  });
  return jsonResponse(envelope, requestId, httpStatusOf(code));
}
