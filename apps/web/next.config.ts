import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";

const config: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../../", import.meta.url)),
  poweredByHeader: false,
  transpilePackages: [
    "@lilith/contracts",
    "@lilith/core",
    "@lilith/ui",
    "@lilith/i18n",
  ],
};
export default config;
