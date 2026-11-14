import { afterEach, describe, expect, it } from "vitest";
import { getDatabaseClient } from "../index";

const KEY = Symbol.for("lilith.db.client");
const holder = globalThis as { [KEY]?: unknown };

afterEach(async () => {
  const client = holder[KEY] as { close(): Promise<void> } | undefined;
  delete holder[KEY];
  await client?.close();
});

describe("getDatabaseClient", () => {
  it("creates the client on first use and returns the same one afterwards", () => {
    expect(holder[KEY]).toBeUndefined();
    const first = getDatabaseClient();
    expect(getDatabaseClient()).toBe(first);
    expect(holder[KEY]).toBe(first);
  });

  it("does not connect until something is asked of it", () => {
    // Creating the client must work with no database running: a build or a
    // test that only imports the module never opens a connection.
    expect(() => getDatabaseClient()).not.toThrow();
  });
});
