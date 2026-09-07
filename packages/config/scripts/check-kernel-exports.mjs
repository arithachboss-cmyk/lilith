import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// These run outside a bundler, from a real consumer with declared dependencies.
const checks = [
  `import assert from 'node:assert/strict';
   import { Money } from '@lilith/core';
   import { fixedClock } from '@lilith/core/shared';
   import { ok } from '@lilith/core/shared/result';
   import { domainError } from '@lilith/core/shared/errors';
   import { Money as SubpathMoney } from '@lilith/core/shared/money';
   import { parseUUID } from '@lilith/core/shared/ids';
   import { createClock } from '@lilith/core/shared/clock';
   import '@lilith/core/shared/actor';
   assert.equal(Money.fromBaht('12500.50'), 1250050n);
   assert.equal(SubpathMoney, Money);
   assert.deepEqual(ok(fixedClock(123).now()), {ok:true, value:123});
   assert.equal(createClock(() => 456).now(), 456);
   assert.equal(domainError('NOT_FOUND', 'Missing').retryable, false);
   assert.equal(parseUUID('50b0e0f7-bf20-4449-b62c-12edceeaaae5').ok, true);`,
  `import assert from 'node:assert/strict';
   import { Money, fixedClock } from '../../packages/core/dist/index.js';
   assert.equal(Money.fromBaht(Money.format(-1250050n)), -1250050n);
   assert.equal(fixedClock(123).now(), 123);`,
];
for (const [index, code] of checks.entries()) {
  const result = spawnSync(
    process.execPath,
    ["--input-type=module", "--eval", code],
    {
      cwd: fileURLToPath(new URL("../../../apps/worker/", import.meta.url)),
      encoding: "utf8",
      timeout: 10_000,
    },
  );
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  console.log(
    `PASS: ${index === 0 ? "all source package subpaths" : "emitted JavaScript imports"} load in native Node`,
  );
}
