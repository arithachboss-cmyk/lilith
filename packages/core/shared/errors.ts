// Transport error codes/envelopes are owned by ARCH-003, not this kernel.
export interface DomainError<Code extends string = string> {
  readonly code: Code;
  readonly message: string;
  readonly retryable: boolean;
  readonly fieldErrors: Readonly<Record<string, string>>;
}

export function domainError<Code extends string>(
  code: Code,
  message: string,
  options: Readonly<{
    retryable?: boolean;
    fieldErrors?: Readonly<Record<string, string>>;
  }> = {},
): DomainError<Code> {
  return Object.freeze({
    code,
    message,
    retryable: options.retryable ?? false,
    fieldErrors: Object.freeze({ ...options.fieldErrors }),
  });
}
