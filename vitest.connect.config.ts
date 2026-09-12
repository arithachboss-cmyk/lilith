import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
      "next/image": fileURLToPath(
        new URL("./node_modules/vinext/dist/shims/image.js", import.meta.url),
      ),
      "next/link": fileURLToPath(
        new URL("./node_modules/vinext/dist/shims/link.js", import.meta.url),
      ),
    },
  },
  test: {
    include: ["tests/unit/connect.test.ts", "tests/connect/**/*.test.tsx"],
    environment: "jsdom",
  },
});
