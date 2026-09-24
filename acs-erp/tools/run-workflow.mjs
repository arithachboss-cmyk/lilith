#!/usr/bin/env node
// Prints the required synthetic workflow to the terminal, under the runtime
// (owner-pending) approval policy. Read-only, deterministic, no network.

import { createErp } from '../src/domain/erp.mjs';
import { runFixtureWorkflow } from '../src/domain/workflow.mjs';
import { PROTOTYPE_LABELS } from '../src/domain/constants.mjs';

const erp = createErp();
const run = runFixtureWorkflow(erp);

process.stdout.write(`${PROTOTYPE_LABELS.data} · ${PROTOTYPE_LABELS.scope}\n\n`);
for (const step of run.steps) {
  process.stdout.write(
    `${String(step.outcome).padEnd(23)} ${step.label}\n${' '.repeat(24)}${step.detail}\n`,
  );
}
process.stdout.write(
  `\napproval policy : ${run.approval_policy}\n` +
    `halted at       : ${run.halted_at || 'not halted'}\n` +
    `final state     : ${run.final_state}\n` +
    `audit entries   : ${erp.audit.size()} (chain ${erp.audit.verifyChain().ok ? 'verified' : 'BROKEN'})\n`,
);
