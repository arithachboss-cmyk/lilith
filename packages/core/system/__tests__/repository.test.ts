import { describe, expect, it } from "vitest";
import { createSystemRepository } from "../repository";

/**
 * A stand-in for the database client. Only `repository.ts` may import the
 * database package (the boundary rule), so tests build the client's shape by
 * hand.
 */
function fakeClient(probe: () => Promise<unknown>) {
  const calls = { probe: 0, withActor: 0, close: 0 };
  const client = {
    probe: () => {
      calls.probe += 1;
      return probe();
    },
    withActor: () => {
      calls.withActor += 1;
      return Promise.reject(new Error("not used"));
    },
    close: () => {
      calls.close += 1;
      return Promise.resolve();
    },
  };
  return { client: client as never, calls };
}

describe("system repository", () => {
  it("asks the client it was given, and passes the answer on", async () => {
    const { client, calls } = fakeClient(() =>
      Promise.resolve({ serverVersion: "16.15", extensions: ["postgis"] }),
    );
    const repository = createSystemRepository(client);
    expect(await repository.probe()).toEqual({
      serverVersion: "16.15",
      extensions: ["postgis"],
    });
    expect(calls).toEqual({ probe: 1, withActor: 0, close: 0 });
  });

  it("lets a rejection through for the service to judge", async () => {
    const { client } = fakeClient(() => Promise.reject(new Error("down")));
    await expect(createSystemRepository(client).probe()).rejects.toThrow(
      "down",
    );
  });

  it("opens no transaction and never closes the shared client", async () => {
    const { client, calls } = fakeClient(() =>
      Promise.resolve({ serverVersion: "16.15", extensions: [] }),
    );
    const repository = createSystemRepository(client);
    await repository.probe();
    await repository.probe();
    expect(calls.withActor).toBe(0);
    expect(calls.close).toBe(0);
    expect(calls.probe).toBe(2);
  });
});
