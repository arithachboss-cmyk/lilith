import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["shared/__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["shared/{money,result,errors,ids,clock}.ts"],
      reporter: ["text", "json-summary", "html"],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
