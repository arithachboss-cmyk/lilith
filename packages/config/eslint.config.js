import js from "@eslint/js";
import tseslint from "typescript-eslint";
import globals from "globals";
import next from "@next/eslint-plugin-next";
import { fileURLToPath } from "node:url";
import { boundaries } from "./rules/boundaries.js";

const sources = [
  "apps/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}",
  "packages/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}",
];
const prisma = {
  group: ["@prisma/*", "@prisma/**", ".prisma/**"],
  message: "Only packages/db may import Prisma.",
};
const framework = {
  group: ["next", "next/**", "react", "react/**", "react-dom", "react-dom/**"],
  message: "Core must stay framework-free.",
};

export default tseslint.config(
  // Next 15 probes the config file itself, so it needs a concrete global rule map.
  {
    plugins: { "@next/next": next },
    rules: { "@next/next/no-sync-scripts": "error" },
  },
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/next-env.d.ts",
    ],
  },
  {
    files: sources,
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    plugins: { architecture: { rules: { boundaries } } },
    rules: {
      "architecture/boundaries": "error",
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
    },
  },
  {
    files: sources,
    ignores: ["packages/db/**"],
    rules: { "no-restricted-imports": ["error", { patterns: [prisma] }] },
  },
  {
    files: ["packages/core/**/*.{ts,tsx,js,jsx,mjs,cjs,mts,cts}"],
    languageOptions: {
      globals: {
        ...Object.fromEntries(
          Object.keys(globals.browser).map((name) => [name, "off"]),
        ),
        ...globals.node,
      },
    },
    rules: {
      "no-restricted-imports": ["error", { patterns: [prisma, framework] }],
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    settings: {
      next: {
        rootDir: fileURLToPath(new URL("../../apps/web/", import.meta.url)),
      },
    },
    rules: /** @type {import("eslint").Linter.RulesRecord} */ ({
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    }),
  },
);
