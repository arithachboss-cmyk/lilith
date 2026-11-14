// T2: a clean checkout builds and tests with no network access.
//
// Clones the COMMITTED tree (not the working directory) into a scratch folder,
// installs dependencies with the network on, then runs build, unit tests,
// verify, claims and e2e inside a network namespace that has no route out.
// Needs Linux, root and `unshare`; where those are missing it says so and
// records the test as not run rather than passing it.
//
// Usage: node tests/qa/offline.mjs <scratch-directory>
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const site = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const repo = resolve(site, '..');
const scratch = process.argv[2];
if (!scratch) {
  console.error('usage: node tests/qa/offline.mjs <scratch-directory>');
  process.exit(2);
}
const out = join(site, 'test-results');
mkdirSync(out, { recursive: true });

const commit = execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const dirty = execFileSync('git', ['-C', repo, 'status', '--porcelain', '--', 'acs-site', 'acs-seo/tools'], { encoding: 'utf8' })
  .split('\n').filter((line) => line && !line.includes('test-results/')).length;

const steps = [];
const step = (name, command, args, cwd) => {
  const started = Date.now();
  const run = spawnSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const pass = run.status === 0;
  steps.push({ name, pass, seconds: Math.round((Date.now() - started) / 1000), tail: pass ? '' : `${run.stdout}\n${run.stderr}`.trim().split('\n').slice(-12).join('\n') });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}`);
  return pass;
};

const canIsolate = spawnSync('unshare', ['-n', 'true']).status === 0;
const clone = join(resolve(scratch), 'clean-checkout');
rmSync(clone, { recursive: true, force: true });
mkdirSync(resolve(scratch), { recursive: true });

// Brings the loopback interface up inside the new namespace (the preview
// server listens on 127.0.0.1), then proves there is no way out before running.
const inside = (script) => ['-n', 'sh', '-c', [
  `python3 -c "import socket,fcntl,struct;s=socket.socket();f=struct.unpack('16sH',fcntl.ioctl(s,0x8913,struct.pack('16sH',b'lo',0)))[1];fcntl.ioctl(s,0x8914,struct.pack('16sH',b'lo',f|1))"`,
  script,
].join(' && ')];

let networkBlocked = false;
if (canIsolate) {
  step('clone the committed tree', 'git', ['clone', '--quiet', '--no-hardlinks', repo, clone], repo);
  step('npm ci (network on)', 'npm', ['ci', '--no-audit', '--no-fund'], join(clone, 'acs-site'));
  // An outbound connection must FAIL in here, or the run proves nothing.
  const probe = spawnSync('unshare', inside(`node -e "fetch('https://registry.npmjs.org/').then(()=>process.exit(0),()=>process.exit(7))"`), { cwd: clone });
  networkBlocked = probe.status === 7;
  steps.push({ name: 'network is unreachable inside the namespace', pass: networkBlocked, seconds: 0, tail: networkBlocked ? '' : `probe exited ${probe.status}` });
  console.log(`${networkBlocked ? 'PASS' : 'FAIL'}  network is unreachable inside the namespace`);
  for (const name of ['typecheck', 'build', 'test', 'verify', 'claims', 'e2e', 'slice']) {
    step(`npm run ${name} (network off)`, 'unshare', inside(`npm run ${name}`), join(clone, 'acs-site'));
  }
}

const pass = canIsolate && dirty === 0 && steps.every((s) => s.pass);
writeFileSync(join(out, 'offline.json'), JSON.stringify({
  ranAt: new Date().toISOString(),
  commit,
  uncommittedChanges: dirty,
  isolation: canIsolate ? 'Linux network namespace (unshare -n), loopback only' : 'unavailable: unshare -n could not be used here',
  networkBlocked,
  pass,
  note: dirty ? 'The working tree had uncommitted changes, so the clone did not contain what was being tested.' : '',
  steps,
}, null, 2) + '\n');
rmSync(clone, { recursive: true, force: true });

console.log(`\n${pass ? 'PASS' : 'FAIL'}  T2 on commit ${commit.slice(0, 7)}${dirty ? ` (but ${dirty} uncommitted change(s) were not in the clone)` : ''}`);
process.exit(pass ? 0 : 1);
