import { spawnSync } from "node:child_process";
import {
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
  copyFileSync,
} from "node:fs";
import { resolve, join } from "node:path";
import { createHash } from "node:crypto";
const git = (...args) => {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
};
if (git("status", "--porcelain", "--untracked-files=no"))
  throw new Error("Commit source changes before exact-SHA verification.");
const sha = git("rev-parse", "HEAD"),
  directory = resolve("output/readiness", sha);
mkdirSync(directory, { recursive: true });
const manifest = {
  repository: "https://github.com/arithachboss-cmyk/lilith",
  branch: git("branch", "--show-current"),
  source_sha: sha,
  started_at: new Date().toISOString(),
  mock_data: true,
  production_published: false,
  real_leads_enabled: false,
  paid_traffic: false,
  google_ads: false,
  node: process.version,
  browser_channel: process.env.PLAYWRIGHT_CHANNEL ?? "chromium",
  steps: [],
  artifacts: [],
};
for (const [label, args] of [
  ["typecheck", ["typecheck"]],
  ["lint", ["lint"]],
  ["unit", ["test:unit"]],
  ["build", ["build"]],
  ["integration", ["test:integration"]],
  ["browser", ["test:e2e"]],
]) {
  const started = new Date().toISOString();
  console.log(`RUN ${label} ${sha}`);
  const result = spawnSync("pnpm", args, {
    env: { ...process.env, MIDDLE_BUILD_SHA: sha },
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  const log = `Command: pnpm ${args.join(" ")}\nSource SHA: ${sha}\nStarted: ${started}\n${result.stdout ?? ""}\n${result.stderr ?? ""}\nExit code: ${result.status}\n`;
  writeFileSync(join(directory, `${label}.log`), log);
  manifest.steps.push({
    label,
    command: `pnpm ${args.join(" ")}`,
    exit_code: result.status,
    log: `${label}.log`,
    sha256: createHash("sha256").update(log).digest("hex"),
  });
  console.log(`${result.status === 0 ? "PASS" : "REVISE"} ${label}`);
  if (result.status !== 0) {
    manifest.completed_at = new Date().toISOString();
    writeFileSync(
      join(directory, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    console.error(log);
    process.exit(1);
  }
}
for (const name of readdirSync("output/playwright/readiness")) {
  if (!name.endsWith(".png")) continue;
  const bytes = readFileSync(join("output/playwright/readiness", name));
  copyFileSync(
    join("output/playwright/readiness", name),
    join(directory, name),
  );
  manifest.artifacts.push({
    file: name,
    sha256: createHash("sha256").update(bytes).digest("hex"),
    mock_data: true,
  });
}
manifest.completed_at = new Date().toISOString();
manifest.result = "PASS — Codex local mock verification only";
writeFileSync(
  join(directory, "manifest.json"),
  JSON.stringify(manifest, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    source_sha: sha,
    evidence: directory,
    result: manifest.result,
  }),
);
