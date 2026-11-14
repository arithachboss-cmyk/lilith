/**
 * Source of the current time. Domain code takes a `Clock` instead of calling
 * `Date.now()` or `new Date()`, so tests control time (Blueprint §30 ARCH-002).
 */
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

/** A clock that only moves when told to. */
export interface ManualClock extends Clock {
  set(at: Date | string): void;
  advance(milliseconds: number): void;
}

function toTimestamp(at: Date | string): number {
  const timestamp = (typeof at === "string" ? new Date(at) : at).getTime();
  if (Number.isNaN(timestamp))
    throw new RangeError(`Not a valid date: ${String(at)}`);
  return timestamp;
}

export function manualClock(start: Date | string): ManualClock {
  let current = toTimestamp(start);
  return {
    // A fresh Date each time, so a caller cannot move the clock by mutating it.
    now: () => new Date(current),
    set(at) {
      current = toTimestamp(at);
    },
    advance(milliseconds) {
      if (!Number.isFinite(milliseconds) || milliseconds < 0)
        throw new RangeError(
          `Clock can only advance by a non-negative duration: ${milliseconds}`,
        );
      current += milliseconds;
    },
  };
}
