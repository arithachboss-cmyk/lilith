export type Ok<T> = { readonly ok: true; readonly value: T };
export type Err<E> = { readonly ok: false; readonly error: E };

/**
 * Outcome of an operation that can fail for an expected business reason.
 * Domain services return this instead of throwing (Blueprint §7.2).
 */
export type Result<T, E> = Ok<T> | Err<E>;

export function ok<T>(value: T): Ok<T> {
  return { ok: true, value };
}

export function err<E>(error: E): Err<E> {
  return { ok: false, error };
}

function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result.ok;
}

function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return !result.ok;
}

function map<T, U, E>(
  result: Result<T, E>,
  transform: (value: T) => U,
): Result<U, E> {
  return result.ok ? ok(transform(result.value)) : result;
}

function mapErr<T, E, F>(
  result: Result<T, E>,
  transform: (error: E) => F,
): Result<T, F> {
  return result.ok ? result : err(transform(result.error));
}

/** Runs `next` on a success and passes a failure through unchanged. */
function andThen<T, U, E, F>(
  result: Result<T, E>,
  next: (value: T) => Result<U, F>,
): Result<U, E | F> {
  return result.ok ? next(result.value) : result;
}

function unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
  return result.ok ? result.value : fallback;
}

export const Result = {
  ok,
  err,
  isOk,
  isErr,
  map,
  mapErr,
  andThen,
  unwrapOr,
} as const;
