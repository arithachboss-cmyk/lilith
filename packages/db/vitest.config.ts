import { defineConfig } from "vitest/config";

// `*.integration.test.ts` needs the database of docker-compose.yml; the
// `test` script leaves those out and `test:integration` runs only those.
export default defineConfig({
  test: {
    include: ["__tests__/**/*.test.ts"],
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
