import { cp, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

// Next standalone tracing omits static assets. Package only generated files.
const source = fileURLToPath(new URL("../.next/static/", import.meta.url));
const target = fileURLToPath(
  new URL("../.next/standalone/apps/web/.next/static/", import.meta.url),
);
await rm(target, { recursive: true, force: true });
await mkdir(target, { recursive: true });
await cp(source, target, { recursive: true });
