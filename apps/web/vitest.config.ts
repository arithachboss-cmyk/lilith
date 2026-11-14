import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The health path runs through the real database of docker-compose.yml.
export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
