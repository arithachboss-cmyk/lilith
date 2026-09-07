import { fileURLToPath } from "node:url";
import path from "node:path";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const eslint = new ESLint({
  cwd: root,
  overrideConfigFile: path.join(root, "eslint.config.mjs"),
});

async function lint(file: string, source: string) {
  const [result] = await eslint.lintText(source, {
    filePath: path.join(root, file),
  });
  expect(result).toBeDefined();
  expect(result?.fatalErrorCount).toBe(0);
  return result?.messages ?? [];
}

const forbidden = [
  ["apps/web/src/app/page.tsx", 'import "@lilith/ai";'],
  ["apps/web/src/app/api/test/route.ts", '"use client"; import "@lilith/ai";'],
  ["apps/web/src/components/card.tsx", '"use client"; import "@lilith/core";'],
  [
    "apps/web/src/components/card.tsx",
    '"use client"; import "@/lib/server/lilith";',
  ],
  ["packages/core/deal/service.ts", 'const loader = require; loader("next");'],
  ["packages/core/deal/service.ts", 'import "next?x";'],
  ["packages/core/deal/service.ts", 'import "next#x";'],
  ["packages/core/deal/service.ts", 'import "node:module";'],
  [
    "packages/core/matching/score.ts",
    'Math.constructor.constructor("return Date.now()")();',
  ],
  ["packages/core/matching/pure/helper.mts", 'import "node:fs";'],
  ["packages/core/matching/pure/helper.cjs", 'require("node:fs");'],
  ["packages/ai/src/task.ts", 'import "@lilith/core/shared/../deal/service";'],
  [
    "packages/core/matching/score.ts",
    'import "@lilith/core/matching/pure/../repository";',
  ],
  ["packages/core/shared/actor.ts", 'import "../deal/service";'],
  ["packages/config/probe.ts", 'await import("@prisma/client");'],
  ["packages/core/probe.mts", 'import "next";'],
  ["apps/web/src/app/api/test/route.ts", 'import "@prisma/client";'],
  [
    "apps/web/app/api/test/route.ts",
    'import "@prisma/client/runtime/library";',
  ],
  ["apps/web/src/app/api/test/route.ts", 'import "@lilith/db";'],
  [
    "apps/web/src/app/api/test/route.ts",
    'import "../../../../../../packages/db/src/index";',
  ],
  ["packages/core/deal/service.ts", 'import "next";'],
  [
    "packages/core/deal/service.ts",
    'import type { NextRequest } from "next/server"; export type Request = NextRequest;',
  ],
  ["packages/core/deal/service.ts", 'import "react";'],
  ["packages/core/deal/service.ts", 'import "react/jsx-runtime";'],
  ["packages/core/deal/service.ts", 'import "react-dom/server";'],
  ["packages/core/deal/service.ts", 'import "@prisma/client";'],
  ["packages/core/deal/service.ts", 'export { value } from "next";'],
  ["packages/core/deal/service.ts", 'export * from "next";'],
  ["packages/core/deal/service.ts", 'await import("next");'],
  ["packages/core/deal/service.ts", "await import(`next`);"],
  ["packages/core/deal/service.ts", 'require("next");'],
  ["packages/core/deal/service.ts", 'require.resolve("next");'],
  [
    "packages/core/deal/service.ts",
    'export type Request = import("next").NextRequest;',
  ],
  [
    "packages/core/deal/service.ts",
    'import framework = require("next"); export { framework };',
  ],
  [
    "packages/core/deal/service.ts",
    'const target = "next"; await import(target);',
  ],
  ["packages/core/deal/service.ts", 'import "@lilith/db";'],
  ["packages/ui/src/test.tsx", 'import "@prisma/client";'],
  ["packages/ai/src/task.ts", 'import "@lilith/core";'],
  ["packages/ai/src/task.ts", 'import "@lilith/core/deal/service";'],
  ["packages/ai/src/task.ts", 'import "@lilith/core/sharedness";'],
  ["packages/ai/src/task.ts", 'import "../../core/deal/service";'],
  ["packages/core/property/repository.ts", 'import "@prisma/client";'],
  [
    "packages/core/property/repository.ts",
    'import "../../db/generated/prisma/client";',
  ],
  ["packages/core/matching/score.ts", 'import "node:fs";'],
  ["packages/core/matching/score.ts", 'import "fs/promises";'],
  ["packages/core/matching/score.ts", 'import "node:http";'],
  ["packages/core/matching/score.ts", 'import "@lilith/db";'],
  ["packages/core/matching/score.ts", 'import "@lilith/ai";'],
  ["packages/core/matching/score.ts", 'import "./repository";'],
  ["packages/core/matching/score.ts", 'import "./arbitrary-helper";'],
  ["packages/core/matching/score.ts", 'import "../property/repository";'],
  ["packages/core/matching/score.ts", 'import "@lilith/contracts";'],
  ["packages/core/matching/dimensions.ts", 'import "node:fs";'],
  ["packages/core/matching/pure/helper.ts", 'import "node:fs";'],
  ["packages/core/shared/money.ts", 'import "../property/repository";'],
  ["packages/core/matching/score.ts", 'fetch("https://example.invalid");'],
  ["packages/core/matching/score.ts", "Date.now();"],
  ["packages/core/matching/score.ts", "new Date();"],
  ["packages/core/matching/score.ts", "Math.random();"],
  ["packages/core/matching/score.ts", "export const random = Math.random;"],
  ["packages/core/matching/score.ts", "export const env = process.env;"],
  [
    "packages/core/matching/score.ts",
    'export const time = globalThis["Date"];',
  ],
  ["apps/web/src/app/api/test/route.ts", 'import "@/../../../../script.js";'],
  ["packages/contracts/src/index.ts", 'import "@lilith/core";'],
] as const;

const allowed = [
  ["apps/web/src/app/api/ai/route.ts", 'import "@lilith/ai";'],
  ["apps/web/src/lib/server/lilith.ts", 'import "@lilith/ai";'],
  ["packages/ai/src/runs.ts", 'import "@lilith/db";'],
  ["apps/web/src/app/api/test/route.ts", 'import "@lilith/core";'],
  ["packages/db/client.ts", 'import "@prisma/client";'],
  ["packages/core/property/repository.ts", 'import "@lilith/db";'],
  ["packages/core/deal/service.ts", 'import "@lilith/contracts";'],
  ["packages/ui/src/test.tsx", 'import "react";'],
  ["packages/ai/src/task.ts", 'import "@lilith/core/shared";'],
  ["packages/ai/src/task.ts", 'import "@lilith/core/shared/money";'],
  ["packages/ai/src/task.ts", 'import "../../core/shared/money";'],
  ["packages/core/matching/score.ts", 'import "./dimensions";'],
  ["packages/core/matching/score.ts", 'import "./pure/helper";'],
  ["packages/core/matching/score.ts", 'import "../shared/money";'],
  [
    "packages/core/matching/score.ts",
    'import type { Property } from "@lilith/contracts"; export type Input = Property;',
  ],
  [
    "packages/core/matching/score.ts",
    "export const rounded = Math.round(1.5);",
  ],
  [
    "packages/core/matching/pure/helper.ts",
    "export const double = (value: number) => value * 2;",
  ],
  ["apps/worker/src/index.ts", 'import "@lilith/db";'],
] as const;

describe("Blueprint §19 import boundaries using the root ESLint configuration", () => {
  it("exposes a rule map when Next 15 probes the root configuration", async () => {
    const config = await eslint.calculateConfigForFile(
      path.join(root, "eslint.config.mjs"),
    );
    expect(config.plugins).toHaveProperty("@next/next");
    expect(Object.entries(config.rules).length).toBeGreaterThan(0);
  });
  it.each(forbidden)("rejects %s: %s", async (file, source) => {
    const messages = await lint(file, source);
    expect(
      messages.some(
        (message) =>
          message.ruleId === "architecture/boundaries" &&
          message.severity === 2,
      ),
    ).toBe(true);
  });
  it.each(allowed)("permits %s: %s", async (file, source) => {
    expect(await lint(file, source)).toEqual([]);
  });
  it("keeps no-restricted-imports active for the two ARCH-001 acceptance examples", async () => {
    for (const [file, source] of [
      ["apps/web/src/app/api/test/route.ts", 'import "@prisma/client";'],
      ["packages/core/probe.ts", 'import "next";'],
    ] as const) {
      expect(
        (await lint(file, source)).some(
          (message) =>
            message.ruleId === "no-restricted-imports" &&
            message.severity === 2,
        ),
      ).toBe(true);
    }
  });
});
