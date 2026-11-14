/**
 * `pnpm contracts:openapi` writes the generated OpenAPI document;
 * `pnpm contracts:check` fails when the committed file is out of date.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { renderOpenApiDocument } from "../src/openapi";

const target = fileURLToPath(new URL("../openapi.json", import.meta.url));
const rendered = renderOpenApiDocument();

if (process.argv.includes("--check")) {
  let committed = "";
  try {
    committed = readFileSync(target, "utf8");
  } catch {
    // A missing file is reported as out of date below.
  }
  if (committed !== rendered) {
    console.error(
      "packages/contracts/openapi.json is out of date. Run `pnpm contracts:openapi` and commit the result.",
    );
    process.exit(1);
  }
  console.log("openapi.json is up to date.");
} else {
  writeFileSync(target, rendered);
  console.log(`Wrote ${target}`);
}
