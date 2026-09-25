/**
 * File-backed JSON store with atomic writes.
 *
 * No database is available in this environment, so persistence is a JSON file per
 * collection written via write-temp-then-rename. A failed write leaves the previous
 * file intact — losing existing data on a partial write is the failure mode this
 * guards against.
 */
import { readFileSync, writeFileSync, renameSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { config } from "./config.js";

const cache = new Map();

function fileFor(name) {
  if (!existsSync(config.dataDir)) mkdirSync(config.dataDir, { recursive: true });
  return join(config.dataDir, `${name}.json`);
}

export function load(name, fallback) {
  if (cache.has(name)) return cache.get(name);
  const file = fileFor(name);
  let value = fallback;
  if (existsSync(file)) {
    try {
      value = JSON.parse(readFileSync(file, "utf8"));
    } catch {
      // Corrupt file: keep the bad copy for inspection, start from fallback.
      renameSync(file, `${file}.corrupt-${Date.now()}`);
      value = fallback;
    }
  }
  cache.set(name, value);
  return value;
}

export function save(name, value) {
  cache.set(name, value);
  const file = fileFor(name);
  const tmp = `${file}.tmp-${process.pid}`;
  writeFileSync(tmp, JSON.stringify(value, null, 2), "utf8");
  renameSync(tmp, file);
  return value;
}

export function resetAll() {
  cache.clear();
}
