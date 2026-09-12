// Read-only, reproducible heuristic scan. Never print credential values.
// Run from the repository root after building the source SHA below:
// node evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/security-scan.mjs
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const sourceSha = 'bee6a6e93a88820bba0d709c8356092c65cfae75';
const output = `evidence/real-lead-readiness/${sourceSha}/security-pattern-scan.json`;
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const rules = [
  ['private-key', '-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----'],
  ['github-token', '(?:gh[pousr]_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{40,})'],
  ['aws-access-id', '(?:AKIA|ASIA)[A-Z0-9]{16}'],
  ['openai-style-secret', 'sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{32,}'],
  ['slack-token', 'xox[baprs]-[A-Za-z0-9-]{20,}'],
  ['stripe-live-secret', '(?:sk|rk)_live_[A-Za-z0-9]{20,}'],
];
const inputs = [];
const findings = [];
function inspect(path, bytes, origin) {
  const text = bytes.toString('utf8');
  if (text.includes('\uFFFD') || text.includes('\0')) return;
  inputs.push({ path, origin, bytes: bytes.length, sha256: digest(bytes) });
  for (const [rule, pattern] of rules) {
    const matches = text.match(new RegExp(pattern, 'g'));
    if (matches) findings.push({ path, rule, count: matches.length });
  }
}
const tracked = execFileSync('git', ['ls-tree', '-rz', '--name-only', sourceSha, '--', 'app', 'src', 'public', 'worker'])
  .toString().split('\0').filter(Boolean).sort();
for (const path of tracked)
  inspect(path, execFileSync('git', ['show', `${sourceSha}:${path}`], { maxBuffer: 20 * 1024 * 1024 }), 'git-show-exact-source');
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile()) inspect(path, readFileSync(path), 'local-client-build');
  }
}
walk('dist/client');
const result = {
  source_sha: sourceSha,
  captured_at: new Date().toISOString(),
  command: 'node evidence/real-lead-readiness/bee6a6e93a88820bba0d709c8356092c65cfae75/security-scan.mjs',
  scanner_version: 1,
  scanner_sha256: digest(readFileSync(fileURLToPath(import.meta.url))),
  runtime: process.version,
  scope: ['app', 'src', 'public', 'worker', 'dist/client'],
  selection: 'UTF-8 text without NUL; source via git show exact SHA; client build files hashed below',
  rules: rules.map(([id, pattern]) => ({ id, pattern })),
  files: inputs.length,
  bytes: inputs.reduce((sum, input) => sum + input.bytes, 0),
  credential_pattern_findings: findings,
  inputs,
  limitation: 'Heuristic token-pattern scan only. Does not identify all secret formats, inspect hosted configuration, or certify PII/authorization. Local client build provenance also relies on the build log and SHA endpoint.',
};
writeFileSync(output, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({ output, source_sha: sourceSha, files: result.files, findings: findings.length }));
if (findings.length) process.exitCode = 1;
