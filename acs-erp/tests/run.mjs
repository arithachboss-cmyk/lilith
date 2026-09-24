// ACS Online Business ERP — mock prototype test suite.
// Zero dependencies. Run with: node tests/run.mjs

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

import {
  ACTIONS,
  ERROR_CODE,
  EVIDENCE_STATUS,
  EVIDENCE_TRACKS,
  MODULES,
  ROLES,
  TECHNICAL_REVIEW_ACTION,
  VERDICT,
} from '../src/domain/constants.mjs';
import { authorize, permissionMatrix, requirePermission } from '../src/domain/rbac.mjs';
import { attachEvidence, assertStandalone, emptyEvidence } from '../src/domain/evidence.mjs';
import { OWNER_DECISION_PENDING_POLICY } from '../src/domain/policy.mjs';
import { createErp } from '../src/domain/erp.mjs';
import { runFixtureWorkflow } from '../src/domain/workflow.mjs';
import { createErpServer } from '../src/server/server.mjs';
import { FIXTURE_ONLY_APPROVAL_POLICY } from './fixture-policy.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
let passed = 0;
const failures = [];

function ok(label, condition, detail = '') {
  if (condition) {
    passed += 1;
    return;
  }
  failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
}

function eq(label, actual, expected) {
  ok(label, Object.is(actual, expected), `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

function throwsCode(label, fn, code) {
  try {
    fn();
    ok(label, false, `expected ${code}, nothing was thrown`);
  } catch (error) {
    ok(label, error.code === code, `expected ${code}, got ${error.code || error.message}`);
  }
}

function section(name) {
  process.stdout.write(`\n— ${name}\n`);
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

// ---------------------------------------------------------------- 1. RBAC
section('1. roles and permission matrix');
{
  const rows = permissionMatrix();
  const modules = Object.values(MODULES);
  const roles = Object.values(ROLES);
  eq('matrix covers every role x module', rows.length, roles.length * modules.length);

  let undefinedVerdicts = 0;
  for (const row of rows) {
    for (const action of Object.values(ACTIONS)) {
      if (!Object.values(VERDICT).includes(row.actions[action])) undefinedVerdicts += 1;
    }
  }
  eq('every role x module x action has an explicit verdict', undefinedVerdicts, 0);

  const find = (role, module) => rows.find((row) => row.role === role && row.module === module);

  // Chairman: view only. No create, no edit.
  for (const module of modules) {
    const row = find(ROLES.CHAIRMAN, module);
    ok(`chairman may view ${module}`, row.actions.view === VERDICT.ALLOW);
    ok(`chairman may not create in ${module}`, row.actions.create === VERDICT.DENY);
    ok(`chairman may not edit in ${module}`, row.actions.edit === VERDICT.DENY);
  }

  // Manager / Account / Stock / Sales / Technic: view, create, edit.
  for (const role of [ROLES.MANAGER, ROLES.ACCOUNT, ROLES.STOCK, ROLES.SALES, ROLES.TECHNIC]) {
    const row = find(role, MODULES.PRODUCT_EVIDENCE_REGISTRY);
    ok(`${role} may view`, row.actions.view === VERDICT.ALLOW);
    ok(`${role} may create`, row.actions.create === VERDICT.ALLOW);
    ok(`${role} may edit`, row.actions.edit === VERDICT.ALLOW);
  }

  // approve / export: pending for Chairman and Manager, denied for everyone else.
  for (const module of modules) {
    for (const role of [ROLES.CHAIRMAN, ROLES.MANAGER]) {
      const row = find(role, module);
      ok(
        `${role} approve in ${module} is OWNER_DECISION_PENDING`,
        row.actions.approve === VERDICT.OWNER_DECISION_PENDING,
      );
      ok(
        `${role} export in ${module} is OWNER_DECISION_PENDING`,
        row.actions.export === VERDICT.OWNER_DECISION_PENDING,
      );
    }
    for (const role of [ROLES.ACCOUNT, ROLES.STOCK, ROLES.SALES, ROLES.TECHNIC]) {
      const row = find(role, module);
      ok(`${role} has no implicit approval in ${module}`, row.actions.approve === VERDICT.DENY);
      ok(`${role} has no implicit export in ${module}`, row.actions.export === VERDICT.DENY);
    }
  }

  // technical_review belongs to Technic, on its own module only.
  const technicRow = find(ROLES.TECHNIC, MODULES.FULFILLMENT_TECHNICAL_REVIEW);
  eq('technic holds technical_review', technicRow.actions[TECHNICAL_REVIEW_ACTION], VERDICT.ALLOW);
  for (const role of [ROLES.CHAIRMAN, ROLES.MANAGER, ROLES.ACCOUNT, ROLES.STOCK, ROLES.SALES]) {
    eq(
      `${role} does not hold technical_review`,
      find(role, MODULES.FULFILLMENT_TECHNICAL_REVIEW).actions[TECHNICAL_REVIEW_ACTION],
      VERDICT.DENY,
    );
  }
  eq(
    'technical_review does not exist on other modules',
    authorize(
      { actor_id: 'ACTOR-0006', role: ROLES.TECHNIC, console_access: true },
      MODULES.PRICING,
      TECHNICAL_REVIEW_ACTION,
    ).verdict,
    VERDICT.DENY,
  );

  // An actor without console access is refused regardless of role.
  eq(
    'no console access means denied even for a known role',
    authorize({ actor_id: 'ACTOR-0007', role: ROLES.SALES, console_access: false }, MODULES.INVENTORY, ACTIONS.VIEW)
      .verdict,
    VERDICT.DENY,
  );
  throwsCode(
    'requirePermission throws OWNER_DECISION_PENDING for a gated action',
    () =>
      requirePermission(
        { actor_id: 'ACTOR-0002', role: ROLES.MANAGER, console_access: true },
        MODULES.PRICING,
        ACTIONS.APPROVE,
        OWNER_DECISION_PENDING_POLICY,
      ),
    ERROR_CODE.OWNER_DECISION_PENDING,
  );
  throwsCode(
    'requirePermission throws PERMISSION_DENIED for a denied action',
    () =>
      requirePermission(
        { actor_id: 'ACTOR-0005', role: ROLES.SALES, console_access: true },
        MODULES.PRICING,
        ACTIONS.APPROVE,
      ),
    ERROR_CODE.PERMISSION_DENIED,
  );
}

// -------------------------------------------- 2. enforcement at the procedure layer
section('2. enforcement sits at the procedure layer, not in the UI');
{
  const erp = createErp();
  const chairman = erp.store.findActor('ACTOR-0001');
  const sales = erp.store.findActor('ACTOR-0005');
  const technic = erp.store.findActor('ACTOR-0006');
  const noConsole = erp.store.findActor('ACTOR-0007');

  throwsCode(
    'chairman calling createSku directly is refused',
    () => erp.modules.productRegistry.createSku(chairman, { sku_id: 'MOCK-SKU-X', name: 'x' }),
    ERROR_CODE.PERMISSION_DENIED,
  );
  throwsCode(
    'sales calling approveQuotation directly is refused',
    () => erp.modules.salesCrm.approveQuotation(sales, { quotation_id: 'MOCK-QT-X' }),
    ERROR_CODE.PERMISSION_DENIED,
  );
  throwsCode(
    'sales calling recordTechnicalReview directly is refused',
    () => erp.modules.fulfillment.recordTechnicalReview(sales, { sku_id: 'MOCK-SKU-1001' }),
    ERROR_CODE.PERMISSION_DENIED,
  );
  throwsCode(
    'an actor without console access cannot read a module',
    () => erp.modules.inventory.listStock(noConsole),
    ERROR_CODE.PERMISSION_DENIED,
  );
  throwsCode(
    'export is stopped while the owner policy is pending',
    () => erp.modules.productRegistry.exportRegistry(erp.store.findActor('ACTOR-0002')),
    ERROR_CODE.OWNER_DECISION_PENDING,
  );
  ok(
    'technic may record a technical review',
    erp.modules.fulfillment.recordTechnicalReview(technic, {
      sku_id: 'MOCK-SKU-1001',
      specification_matches: true,
    }).review_id === 'MOCK-TR-1',
  );
  // Refusals are recorded, not swallowed.
  const refusals = erp.audit
    .list()
    .filter((entry) => entry.outcome === ERROR_CODE.PERMISSION_DENIED);
  ok('refusals are written to the audit log', refusals.length >= 4, `saw ${refusals.length}`);
}

// ------------------------------------------------------- 3. evidence gates
section('3. evidence-first commercial safety gates');
{
  const erp = createErp();
  const manager = erp.store.findActor('ACTOR-0002');

  // A datasheet closes the specification track and nothing else.
  let evidence = emptyEvidence();
  eq('a new SKU starts with every track missing',
    EVIDENCE_TRACKS.filter((track) => evidence[track].status === EVIDENCE_STATUS.MISSING).length,
    EVIDENCE_TRACKS.length);

  evidence = attachEvidence(evidence, { kind: 'TECHNICAL_DATASHEET', evidence_ref: 'MOCK-EV-DS-T' });
  eq('the datasheet closes claim_source_status', evidence.claim_source_status.status, EVIDENCE_STATUS.PRESENT);
  for (const track of EVIDENCE_TRACKS.filter((name) => name !== 'claim_source_status')) {
    eq(`the datasheet leaves ${track} missing`, evidence[track].status, EVIDENCE_STATUS.MISSING);
  }

  // Each kind closes exactly one track and never more.
  for (const [kind, track] of Object.entries({
    SALE_AUTHORIZATION: 'sale_authorization_status',
    PRICE_RECORD: 'price_status',
    STOCK_COUNT: 'stock_status',
    WARRANTY_TERMS: 'warranty_status',
  })) {
    const single = attachEvidence(emptyEvidence(), { kind, evidence_ref: `MOCK-EV-${kind}` });
    const closed = EVIDENCE_TRACKS.filter((name) => single[name].status === EVIDENCE_STATUS.PRESENT);
    eq(`${kind} closes exactly one track`, closed.length, 1);
    eq(`${kind} closes ${track}`, closed[0], track);
  }

  throwsCode(
    'an evidence record without a reference is refused',
    () => attachEvidence(emptyEvidence(), { kind: 'PRICE_RECORD', evidence_ref: '' }),
    ERROR_CODE.BLOCKED_EVIDENCE_MISSING,
  );

  // The datasheet-only SKU cannot be quoted, priced, stocked or warranted.
  const datasheetOnly = erp.modules.productRegistry.getSku(manager, { sku_id: 'MOCK-SKU-1002' });
  ok('a datasheet-only SKU may state its specification', datasheetOnly.gates.may_state_specification);
  ok('a datasheet-only SKU may not be offered for sale', !datasheetOnly.gates.may_offer_for_sale);
  ok('a datasheet-only SKU may not state a price', !datasheetOnly.gates.may_state_price);
  ok('a datasheet-only SKU may not state stock', !datasheetOnly.gates.may_state_stock);
  ok('a datasheet-only SKU may not state a warranty', !datasheetOnly.gates.may_state_warranty);
  ok('a datasheet-only SKU may not state delivery', !datasheetOnly.gates.may_state_delivery);
  ok('a datasheet-only SKU may not state partner status', !datasheetOnly.gates.may_state_partner_status);

  throwsCode(
    'a quotation for a datasheet-only SKU is blocked',
    () =>
      erp.modules.salesCrm.draftQuotation(erp.store.findActor('ACTOR-0005'), {
        quotation_id: 'MOCK-QT-BLOCKED',
        customer_id: 'MOCK-CUST-01',
        sku_id: 'MOCK-SKU-1002',
        qty_mock: 1,
      }),
    ERROR_CODE.BLOCKED_EVIDENCE_MISSING,
  );
  throwsCode(
    'a cost check without a price record is blocked',
    () =>
      erp.modules.pricing.recordCostCheck(erp.store.findActor('ACTOR-0003'), {
        sku_id: 'MOCK-SKU-1002',
        cost_mock: 1,
      }),
    ERROR_CODE.BLOCKED_EVIDENCE_MISSING,
  );
  throwsCode(
    'a stock check without a stock count is blocked',
    () =>
      erp.modules.inventory.recordStockCheck(erp.store.findActor('ACTOR-0004'), {
        sku_id: 'MOCK-SKU-1002',
        counted_mock: 5,
      }),
    ERROR_CODE.BLOCKED_EVIDENCE_MISSING,
  );

  // Delivery and partner status are never derivable, even from a fully evidenced SKU.
  const fullySku = erp.store.findSku('MOCK-SKU-1001');
  eq(
    'delivery availability is unprovable even when every track is closed',
    assertStandalone(fullySku, 'DELIVERY_AVAILABILITY').code,
    ERROR_CODE.BLOCKED_EVIDENCE_MISSING,
  );
  eq(
    'partner authorisation is unprovable even when every track is closed',
    assertStandalone(fullySku, 'PARTNER_AUTHORIZATION').code,
    ERROR_CODE.BLOCKED_EVIDENCE_MISSING,
  );

  // Inventory and pricing withhold the number rather than printing a zero.
  const stockRows = erp.modules.inventory.listStock(manager);
  const blockedRow = stockRows.find((row) => row.sku_id === 'MOCK-SKU-1002');
  eq('a SKU without a stock record shows no quantity', blockedRow.on_hand_mock, null);
  eq('a SKU without a stock record shows the blocked status', blockedRow.stock_status, EVIDENCE_STATUS.MISSING);
  const priceRow = erp.modules.pricing.listPricing(manager).find((row) => row.sku_id === 'MOCK-SKU-1003');
  eq('a SKU without a price record shows no cost', priceRow.mock_cost_units, null);
}

// -------------------------------------------------------- 4. providers
section('4. provider configuration is LOCAL_MOCK only');
{
  const erp = createErp();
  eq('gateway mode', erp.providers.mode, 'LOCAL_MOCK');

  const fetchCalls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = (...args) => {
    fetchCalls.push(args);
    throw new Error('no external call is permitted in this prototype');
  };
  try {
    const local = erp.providers.request('LOCAL_MOCK', { resource: 'skus' });
    ok('the local mock adapter answers', local.ok === true);
    eq('the local mock adapter makes no external call', local.external_calls, 0);

    for (const providerId of [
      'MOCK_MARKETPLACE_ADAPTER',
      'MOCK_ACCOUNTING_ADAPTER',
      'MOCK_LOGISTICS_ADAPTER',
      'SOME_UNDECLARED_PROVIDER',
    ]) {
      const result = erp.providers.request(providerId, { resource: 'skus' });
      eq(`${providerId} is blocked`, result.code, ERROR_CODE.BLOCKED_SOURCE_UNAVAILABLE);
      eq(`${providerId} makes no external call`, result.external_calls, 0);
      eq(`${providerId} does not fall back to another provider`, result.fallback_attempted, false);
    }
  } finally {
    globalThis.fetch = realFetch;
  }
  eq('no fetch was attempted anywhere in the provider path', fetchCalls.length, 0);

  const disabled = erp.providers.list().filter((provider) => provider.provider_id !== 'LOCAL_MOCK');
  ok('every non-local adapter is an interface declaration only',
    disabled.every((provider) => provider.enabled === false && provider.adapter_approved === false));
}

// -------------------------------------------------------- 5. workflow
section('5. the required synthetic workflow');
{
  // Under the owner-pending policy the run must stop at the approval path.
  const pending = createErp();
  const pendingRun = runFixtureWorkflow(pending);
  eq('the run halts at the approval path', pendingRun.halted_at, ERROR_CODE.OWNER_DECISION_PENDING);
  eq('the SKU rests at AWAITING_APPROVAL', pendingRun.final_state, 'AWAITING_APPROVAL');
  eq('no mock order is created', pending.store.orders.length, 0);
  eq('no fulfillment is recorded', pending.store.fulfillments.length, 0);
  ok(
    'both approving roles were attempted and both were pending',
    pendingRun.steps.filter(
      (step) => step.label.startsWith('7.') && step.outcome === ERROR_CODE.OWNER_DECISION_PENDING,
    ).length === 2,
  );
  ok(
    'the steps after approval are recorded as not attempted',
    pendingRun.steps
      .filter((step) => step.label.startsWith('8.') || step.label.startsWith('9.'))
      .every((step) => step.outcome === 'NOT_ATTEMPTED'),
  );
  ok(
    'the datasheet step is shown leaving four tracks missing',
    pendingRun.steps
      .find((step) => step.label.startsWith('2a.'))
      .detail.split(',').length === 4,
  );
  ok('the dashboard is still read after the halt',
    pendingRun.steps.some((step) => step.label.startsWith('10.') && step.outcome === 'OK'));

  // With a fixture policy in force the remaining steps run to fulfillment.
  const full = createErp({ policy: FIXTURE_ONLY_APPROVAL_POLICY });
  const fullRun = runFixtureWorkflow(full);
  eq('with a policy in force the run does not halt', fullRun.halted_at, null);
  eq('the SKU reaches FULFILLED', fullRun.final_state, 'FULFILLED');
  eq('one mock order exists', full.store.orders.length, 1);
  eq('one fulfillment exists', full.store.fulfillments.length, 1);
  eq('the dashboard counts the order', fullRun.summary.orders, 1);
  eq('the fulfillment still cannot state delivery',
    full.store.fulfillments[0].delivery_statement, EVIDENCE_STATUS.MISSING);

  // An order cannot be created from a quotation that was never approved.
  const unapproved = createErp();
  const manager = unapproved.store.findActor('ACTOR-0002');
  const sales = unapproved.store.findActor('ACTOR-0005');
  unapproved.modules.salesCrm.draftQuotation(sales, {
    quotation_id: 'MOCK-QT-2',
    customer_id: 'MOCK-CUST-01',
    sku_id: 'MOCK-SKU-1001',
    qty_mock: 1,
  });
  throwsCode(
    'an unapproved quotation cannot become an order',
    () => unapproved.modules.fulfillment.createOrder(manager, { order_id: 'MOCK-ORD-2', quotation_id: 'MOCK-QT-2' }),
    'INVALID_TRANSITION',
  );

  // Determinism: two runs produce the same audit head.
  const a = runFixtureWorkflow(createErp());
  const b = runFixtureWorkflow(createErp());
  eq('two identical runs produce the same audit head', a.audit_head, b.audit_head);
}

// -------------------------------------------------------- 6. audit log
section('6. append-only audit record');
{
  const erp = createErp({ policy: FIXTURE_ONLY_APPROVAL_POLICY });
  runFixtureWorkflow(erp);
  const entries = erp.audit.list();
  ok('the workflow wrote audit entries', entries.length >= 14, `saw ${entries.length}`);
  ok('the chain verifies', erp.audit.verifyChain().ok);
  ok('sequence numbers are contiguous', entries.every((entry, index) => entry.seq === index + 1));
  ok('every entry is frozen', entries.every((entry) => Object.isFrozen(entry)));

  const before = erp.audit.size();
  const handedOut = erp.audit.list();
  handedOut.push({ seq: 999 });
  handedOut.splice(0, 1);
  eq('mutating the returned array does not change the log', erp.audit.size(), before);
  ok('the log still verifies after the caller mutated its copy', erp.audit.verifyChain().ok);

  // A tampered copy is detected.
  const tampered = erp.audit.list().map((entry, index) =>
    index === 3 ? { ...entry, outcome: 'OK', detail: 'rewritten' } : entry,
  );
  const verdict = erp.audit.verifyChain(tampered);
  ok('an edited entry breaks the chain', verdict.ok === false);
  eq('the break is reported at the edited entry', verdict.broken_at, 4);
}

// -------------------------------------------------------- 7. HTTP boundary
section('7. route, access control and SEO boundary');
{
  const erp = createErp();
  const server = createErpServer({ erp });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;

  async function get(path, { token, method = 'GET' } = {}) {
    const headers = token ? { authorization: `Bearer ${token}` } : {};
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { method, headers });
    return { status: response.status, headers: response.headers, body: await response.text() };
  }

  const anonymous = await get('/admin/erp-mock');
  eq('an unauthenticated request does not get the console', anonymous.status, 404);
  ok('the 404 body carries no ERP content', !/MOCK-SKU|Executive Dashboard|ACTOR-/.test(anonymous.body));
  ok('the 404 body names no module', !/Product & Evidence Registry/.test(anonymous.body));

  const badToken = await get('/admin/erp-mock', { token: 'not-a-real-token' });
  eq('an unknown token does not get the console', badToken.status, 404);

  const noConsole = await get('/admin/erp-mock', { token: 'mock-token-no-console' });
  eq('a known actor without console access is refused', noConsole.status, 403);
  ok('the 403 body carries no ERP data', !/MOCK-SKU|ACTOR-/.test(noConsole.body));

  const admin = await get('/admin/erp-mock', { token: 'mock-token-manager' });
  eq('an admin session reaches the console', admin.status, 200);
  ok('the page carries the MOCK DATA label', admin.body.includes('MOCK DATA'));
  ok('the page carries the prototype label', admin.body.includes('INTERNAL PROTOTYPE — NOT FOR PRODUCTION USE'));
  eq('the response is noindex,nofollow for robots',
    admin.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive, nosnippet');
  ok('the document declares robots noindex', /<meta name="robots" content="noindex,nofollow/.test(admin.body));
  ok('the document declares googlebot noindex', /<meta name="googlebot" content="noindex,nofollow/.test(admin.body));
  ok('the console is never cached', admin.headers.get('cache-control').includes('no-store'));

  // Every module page answers for an admin session.
  for (const module of Object.values(MODULES)) {
    const view = await get(`/admin/erp-mock/${module.toLowerCase()}`, { token: 'mock-token-manager' });
    eq(`module page ${module} answers`, view.status, 200);
    ok(`module page ${module} is labelled`, view.body.includes('MOCK DATA'));
  }
  for (const page of ['permissions', 'workflow', 'audit']) {
    const view = await get(`/admin/erp-mock/${page}`, { token: 'mock-token-chairman' });
    eq(`${page} page answers`, view.status, 200);
  }

  // Nothing else is served.
  for (const path of ['/', '/admin', '/admin/erp', '/api/erp', '/erp-mock', '/admin/erp-mock/unknown']) {
    const response = await get(path, { token: 'mock-token-manager' });
    eq(`${path} is not served`, response.status, 404);
  }

  // No mutating verb is accepted.
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const response = await get('/admin/erp-mock', { token: 'mock-token-manager', method });
    eq(`${method} is refused`, response.status, 405);
  }

  const robots = await get('/robots.txt');
  eq('robots.txt is served locally', robots.status, 200);
  ok('robots.txt disallows the admin tree', robots.body.includes('Disallow: /admin/'));

  // The console renders a refusal rather than data when the role may not read.
  const chairmanPage = await get('/admin/erp-mock/pricing', { token: 'mock-token-chairman' });
  eq('chairman may view pricing', chairmanPage.status, 200);

  await new Promise((resolve) => server.close(resolve));
}

// -------------------------------------------------------- 8. data and repo hygiene
section('8. mock-data boundary and repository hygiene');
{
  // Only the runtime and its fixtures are scanned. This file names the banned
  // terms in order to ban them, so including it would flag itself.
  const files = walk(join(ROOT, 'src'));
  const corpus = files.map((file) => readFileSync(file, 'utf8')).join('\n');

  // Nothing in this prototype may carry real ACS or third-party trade data.
  const forbidden = [
    'asiancoding',
    'Honeywell',
    'Brady',
    'Zebra',
    '7-Eleven',
    'Seven Eleven',
    'GS1',
    '@asiancoding.com',
  ];
  for (const term of forbidden) {
    ok(`no reference to ${term}`, !new RegExp(term, 'i').test(corpus));
  }
  ok('no email address appears in the fixtures or code', !/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(corpus));

  const seed = JSON.parse(readFileSync(join(ROOT, 'src/fixtures/seed.json'), 'utf8'));
  eq('the fixture set declares itself synthetic', seed.data_class, 'DETERMINISTIC_SYNTHETIC_FIXTURE');
  ok('every actor id is synthetic', seed.actors.every((actor) => /^ACTOR-\d{4}$/.test(actor.actor_id)));
  ok('every actor display name is synthetic', seed.actors.every((actor) => /^Synthetic Actor \d{4}$/.test(actor.display_name)));
  ok('every sku id is marked mock', seed.skus.every((sku) => sku.sku_id.startsWith('MOCK-')));
  ok('every supplier is marked mock', seed.suppliers.every((supplier) => supplier.supplier_id.startsWith('MOCK-')));
  ok('every customer is marked mock', seed.customers.every((customer) => customer.customer_id.startsWith('MOCK-')));
  ok('no supplier carries an authorisation on file', seed.suppliers.every((supplier) => supplier.authorization_on_file === false));
  ok('only the local adapter is approved',
    seed.providers.filter((provider) => provider.adapter_approved).every((provider) => provider.provider_id === 'LOCAL_MOCK'));

  // The runtime cannot reach the fixture approval policy.
  const srcFiles = walk(join(ROOT, 'src'));
  ok('nothing under src imports the fixture approval policy',
    srcFiles.every((file) => !readFileSync(file, 'utf8').includes('fixture-policy')));
  // node:http is present because the console is served locally. What must be
  // absent is any outbound client: no fetch, no request(), no socket, no shell.
  ok('nothing under src makes an outbound call',
    srcFiles.every((file) => {
      const text = readFileSync(file, 'utf8');
      return !/\bfetch\s*\(|node:https\b|node:net\b|node:dgram\b|node:child_process\b|\.request\s*\(|XMLHttpRequest/.test(
        text,
      );
    }));
  ok('the only node:http use under src is the local server',
    srcFiles.filter((file) => /node:http\b/.test(readFileSync(file, 'utf8'))).length === 1);
  ok('the local server binds to the loopback interface',
    readFileSync(join(ROOT, 'src/server/server.mjs'), 'utf8').includes("host = '127.0.0.1'"));
  eq('the default runtime policy is the pending one',
    createErp().policy.policy_id, OWNER_DECISION_PENDING_POLICY.policy_id);
  ok('the pending policy blocks transitions', OWNER_DECISION_PENDING_POLICY.blocks_transitions === true);
  ok('the pending policy names no approver',
    OWNER_DECISION_PENDING_POLICY.approval_actor === 'OWNER_DECISION_PENDING');

  // The route must not appear in any sitemap anywhere in the repository.
  const repoFiles = walk(join(ROOT, '..')).filter(
    (file) => /sitemap/i.test(file) && /\.(xml|json|txt|mjs|js|ts)$/.test(file),
  );
  let listed = 0;
  for (const file of repoFiles) {
    if (readFileSync(file, 'utf8').includes('erp-mock')) listed += 1;
  }
  eq('the route appears in no sitemap in the repository', listed, 0);

  // No dependency is introduced.
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  ok('the prototype declares no runtime dependency', !pkg.dependencies || Object.keys(pkg.dependencies).length === 0);
  ok('the prototype declares no dev dependency', !pkg.devDependencies || Object.keys(pkg.devDependencies).length === 0);
  ok('the prototype is marked private', pkg.private === true);
}

// -------------------------------------------------------- report
process.stdout.write(`\n${'-'.repeat(58)}\n`);
if (failures.length === 0) {
  process.stdout.write(`all ${passed} assertions passed\n`);
  process.exit(0);
}
process.stdout.write(`${passed} passed, ${failures.length} FAILED\n\n`);
for (const failure of failures) process.stdout.write(`  FAIL  ${failure}\n`);
process.exit(1);
