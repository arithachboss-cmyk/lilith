/** Immutable epoch milliseconds. Domain services receive a Clock explicitly. */
export interface Clock {
  now(): number;
}
const MAX_EPOCH_MILLISECONDS = 8_640_000_000_000_000;

function assertInstant(value: number): number {
  if (
    !Number.isSafeInteger(value) ||
    value < -MAX_EPOCH_MILLISECONDS ||
    value > MAX_EPOCH_MILLISECONDS
  ) {
    throw new RangeError("Clock must return valid integer epoch milliseconds.");
  }
  return value;
}

export function createClock(read: () => number): Clock {
  return Object.freeze({ now: () => assertInstant(read()) });
}

export function fixedClock(epochMilliseconds: number): Clock {
  const instant = assertInstant(epochMilliseconds);
  return Object.freeze({ now: () => instant });
}

/** The only ambient time adapter; no read occurs until now() is called. */
export const systemClock: Clock = createClock(() => Date.now());
