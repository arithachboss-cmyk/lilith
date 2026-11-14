/**
 * An expected business failure, carried in the error side of a `Result`.
 *
 * `code` is the stable identifier the API maps to its error envelope
 * (Blueprint §18.0). `message` is English text for logs and developers; the
 * localized `message_en` / `message_th` are resolved from `code` at the API
 * edge, not here.
 */
export interface DomainError<Code extends string = string> {
  readonly code: Code;
  readonly message: string;
  readonly retryable: boolean;
  readonly fieldErrors?: Readonly<Record<string, string>>;
  readonly details?: Readonly<Record<string, unknown>>;
}

export interface DomainErrorOptions {
  readonly retryable?: boolean;
  readonly fieldErrors?: Readonly<Record<string, string>>;
  readonly details?: Readonly<Record<string, unknown>>;
}

export function domainError<Code extends string>(
  code: Code,
  message: string,
  options: DomainErrorOptions = {},
): DomainError<Code> {
  if (code.length === 0) throw new TypeError("DomainError code is required");
  return Object.freeze({
    code,
    message,
    retryable: options.retryable ?? false,
    ...(options.fieldErrors === undefined
      ? {}
      : { fieldErrors: Object.freeze({ ...options.fieldErrors }) }),
    ...(options.details === undefined
      ? {}
      : { details: Object.freeze({ ...options.details }) }),
  });
}

export function isDomainError(value: unknown): value is DomainError {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.code === "string" &&
    candidate.code.length > 0 &&
    typeof candidate.message === "string" &&
    typeof candidate.retryable === "boolean"
  );
}
