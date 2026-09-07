import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdirSync, rmdirSync, unlinkSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const probes = [
  {
    workspace: "packages/core",
    directory: "packages/core",
    source: 'import "next";',
  },
  {
    workspace: "apps/web",
    directory: "apps/web/src/app/api",
    source: 'import "@prisma/client";',
  },
  {
    workspace: "apps/web",
    directory: "apps/web/app/api",
    source: 'import "@prisma/client";',
  },
];

for (const probe of probes) {
  const createdDirectories = [];
  const filename = path.join(
    root,
    probe.directory,
    `boundary-probe-${randomUUID()}.ts`,
  );
  let written = false;
  try {
    // Remember only directories this probe creates; preserve all existing paths.
    let parent = root;
    for (const segment of probe.directory.split("/")) {
      parent = path.join(parent, segment);
      try {
        mkdirSync(parent);
        createdDirectories.push(parent);
      } catch (error) {
        if (
          !(error instanceof Error) ||
          !("code" in error) ||
          error.code !== "EEXIST"
        )
          throw error;
      }
    }
    writeFileSync(filename, probe.source, { flag: "wx" });
    written = true;
    const result = spawnSync("pnpm", ["lint"], {
      cwd: path.join(root, probe.workspace),
      encoding: "utf8",
      timeout: 60_000,
    });
    assert.ifError(result.error);
    const output = result.stdout + result.stderr;
    assert.equal(result.status, 1, output);
    assert.match(output, /architecture\/boundaries/u);
    assert.match(output, /no-restricted-imports/u);
    assert.ok(output.includes(path.basename(filename)), output);
    console.log(
      `PASS: ${probe.directory} rejected forbidden import with workspace cwd/config discovery`,
    );
  } finally {
    if (written) unlinkSync(filename);
    for (const directory of createdDirectories.reverse()) rmdirSync(directory);
  }
}
