/*
 * AMI Office · สำนักงาน 100 เอเจนต์ · prototype logic
 *
 * อ่านอย่างเดียวจาก office-data.js ไม่มีการเรียก network ไม่มีการเปิดใช้เอเจนต์
 * และไม่มีปุ่มใดที่ส่งงาน อนุมัติ หรือเชื่อมต่ออะไรจริง
 */

import { ROLES } from './data.js';
import { AGENTS, BLOCKERS, TEAMS } from './office-data.js';
import { OFFICE_FACTS } from './office-facts.js';
import { HUMAN_ROLE, buildAgentPrompt, routeToHuman } from './office-prompt.js';

const els = {
  stats: document.getElementById('officeStats'),
  rule: document.getElementById('configRule'),
  team: document.getElementById('teamFilter'),
  owner: document.getElementById('ownerFilter'),
  search: document.getElementById('searchFilter'),
  blocked: document.getElementById('blockedFilter'),
  count: document.getElementById('resultCount'),
  list: document.getElementById('teamList'),
  detail: document.getElementById('agentDetail'),
};

const ui = { team: 'all', owner: 'all', query: '', blockedOnly: false, selected: null };

/* ---------- ดัชนี ---------- */
const byId = new Map(AGENTS.map((agent) => [agent.id, agent]));
const PROMPT_CONTEXT = { agents: AGENTS, teams: TEAMS, roles: ROLES, blockers: BLOCKERS, facts: OFFICE_FACTS };
const byCallSign = new Map(AGENTS.map((agent) => [agent.callSign, agent]));
const teamById = new Map(TEAMS.map((team) => [team.id, team]));
const roleById = new Map(ROLES.map((role) => [role.roleId, role]));

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );

const ownerOf = (agent) => teamById.get(agent.team)?.owner ?? null;
const isLead = (agent) => teamById.get(agent.team)?.lead === agent.id;
const roleLabel = (roleId) => `${roleId} · ${roleById.get(roleId)?.title ?? 'ไม่รู้จัก'}`;

/** ปลายทางถัดไป · คืน { kind:'human', id } หรือ { kind:'agent', agent } หรือ null เมื่ออ้างไม่เจอ */
function nextOf(agent) {
  if (HUMAN_ROLE.test(agent.to)) return { kind: 'human', id: agent.to };
  const target = byCallSign.get(agent.to);
  return target ? { kind: 'agent', agent: target } : null;
}

/** เส้นทางจนถึงคน · ใช้ตัวคำนวณเดียวกับ build-contract.mjs */
function routeOf(agent) {
  return routeToHuman(agent, AGENTS).map((id) =>
    HUMAN_ROLE.test(id) ? { kind: 'human', id } : { kind: 'agent', agent: byId.get(id) });
}

const stepLabel = (step) =>
  step.kind === 'human'
    ? `<span class="route-human">${esc(roleLabel(step.id))}</span>`
    : `<span class="mono">${esc(step.agent.callSign)}</span>`;

/* ---------- สรุปบนหัว ---------- */
function renderStats() {
  const owners = new Set(TEAMS.map((team) => team.owner));
  const members = AGENTS.filter((agent) => !isLead(agent)).length;
  const blocked = AGENTS.filter((agent) => agent.blockedBy).length;
  const cells = [
    ['เอเจนต์ทั้งหมด', AGENTS.length],
    ['ทีม', TEAMS.length],
    ['หัวหน้าทีม (Grok)', AGENTS.length - members],
    ['สมาชิก', members],
    ['คนที่รับผิดชอบ', `${owners.size} ตำแหน่ง`],
    ['รอคำตัดสิน', blocked],
    ['เชื่อมต่อจริง', 0],
    ['ค่าใช้จ่ายที่เพิ่ม', 'ไม่มี'],
  ];
  els.stats.innerHTML = cells
    .map(([label, value]) => `<div class="idcell"><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`)
    .join('');
  els.rule.textContent =
    `ทะเบียนนี้ตั้งค่าเอเจนต์ไว้ ${AGENTS.length} ตัว แต่ไม่ได้เปิดใช้ตัวใดเลย · ` +
    `${AGENTS.length} เอเจนต์ไม่ได้แปลว่า ${AGENTS.length} process หรือ ${AGENTS.length} การเชื่อมต่อ ` +
    'จึงไม่มีค่าใช้จ่ายเพิ่มขึ้นเพียงเพราะจำนวนครบ';
}

/* ---------- ตัวกรอง ---------- */
function renderFilters() {
  els.team.innerHTML = [`<option value="all">ทุกทีม (${TEAMS.length})</option>`]
    .concat(TEAMS.map((team) => `<option value="${esc(team.id)}">${esc(team.id)} · ${esc(team.nameTh)}</option>`))
    .join('');
  const owners = [...new Set(TEAMS.map((team) => team.owner))].sort();
  els.owner.innerHTML = ['<option value="all">ทุกตำแหน่ง</option>']
    .concat(owners.map((id) => `<option value="${esc(id)}">${esc(roleLabel(id))}</option>`))
    .join('');
}

function matches(agent) {
  if (ui.team !== 'all' && agent.team !== ui.team) return false;
  if (ui.owner !== 'all' && ownerOf(agent) !== ui.owner) return false;
  if (ui.blockedOnly && !agent.blockedBy) return false;
  if (!ui.query) return true;
  const haystack = [agent.id, agent.callSign, agent.titleTh, agent.titleEn, agent.dutyTh, agent.dutyEn]
    .join(' ')
    .toLowerCase();
  return haystack.includes(ui.query);
}

/* ---------- รายการทีม ---------- */
function agentCard(agent) {
  const next = nextOf(agent);
  const selected = ui.selected === agent.id;
  return `<button type="button" class="office-agent${isLead(agent) ? ' is-lead' : ''}"
      data-agent="${esc(agent.id)}" aria-pressed="${selected}">
    <span class="oa-head">
      <span class="mono oa-id">${esc(agent.id)}</span>
      ${isLead(agent) ? '<span class="chip accent">หัวหน้าทีม</span>' : ''}
    </span>
    <span class="oa-cs">${esc(agent.callSign)}</span>
    <span class="oa-title">${esc(agent.titleTh)}</span>
    <span class="oa-duty">${esc(agent.dutyTh)}</span>
    <span class="oa-to">ส่งต่อ → ${next ? stepLabel(next) : '<span class="chip stop">ไม่พบปลายทาง</span>'}</span>
    <span class="oa-chips">
      <span class="chip ok">ตั้งค่าแล้ว</span>
      <span class="chip warn">ยังไม่เชื่อมต่อ</span>
      ${agent.blockedBy ? '<span class="chip stop">รอคำตัดสิน</span>' : ''}
    </span>
  </button>`;
}

function renderList() {
  const visible = AGENTS.filter(matches);
  els.count.textContent = `แสดง ${visible.length} จาก ${AGENTS.length} เอเจนต์`;

  if (visible.length === 0) {
    els.list.innerHTML = `<div class="state-box" data-state="empty">
      <div class="st-title">ไม่พบเอเจนต์ที่ตรงกับตัวกรอง</div>
      <p class="st-body">ลองล้างคำค้นหรือเลือกทุกทีม ทะเบียนยังมีครบ ${AGENTS.length} ตัว</p>
    </div>`;
    return;
  }

  els.list.innerHTML = TEAMS.map((team) => {
    const inTeam = visible.filter((agent) => agent.team === team.id);
    if (inTeam.length === 0) return '';
    const lead = byId.get(team.lead);
    const total = AGENTS.filter((agent) => agent.team === team.id).length;
    return `<section class="panel team" aria-labelledby="team-${esc(team.id)}">
      <div class="team-head">
        <div>
          <span class="mono team-id">${esc(team.id)}</span>
          <h2 id="team-${esc(team.id)}">${esc(team.nameTh)} <span class="team-en">${esc(team.nameEn)}</span></h2>
          <p class="team-mission">${esc(team.missionTh)}</p>
        </div>
        <dl class="team-meta">
          <div><dt>หัวหน้าทีม</dt><dd class="mono">${esc(team.lead)} · ${esc(lead?.callSign)}</dd></div>
          <div><dt>คนที่รับผิดชอบ</dt><dd>${esc(roleLabel(team.owner))}</dd></div>
          <div><dt>ประเภท</dt><dd>${team.pool === 'shared' ? 'Shared pool · ทุกตำแหน่งขอใช้ได้ผ่าน AMI' : 'ประจำตำแหน่ง'}</dd></div>
          <div><dt>ขนาด</dt><dd>${inTeam.length === total ? `${total} เอเจนต์` : `${inTeam.length} จาก ${total} เอเจนต์`}</dd></div>
        </dl>
      </div>
      <div class="office-grid">${inTeam.map(agentCard).join('')}</div>
    </section>`;
  }).join('');
}

/* ---------- รายละเอียด ---------- */
function renderDetail() {
  const agent = ui.selected ? byId.get(ui.selected) : null;
  if (!agent) {
    els.detail.innerHTML = `<h2 id="detailTitle" tabindex="-1">รายละเอียดเอเจนต์</h2>
      <p class="readonly-note">เลือกเอเจนต์หนึ่งตัวเพื่อดูหน้าที่ ผู้รับผิดชอบ และเส้นทางส่งต่องานจนถึงคน</p>`;
    return;
  }
  const team = teamById.get(agent.team);
  const route = routeOf(agent);
  const endsAtHuman = route.length > 0 && route[route.length - 1].kind === 'human';
  const escalate = isLead(agent) ? roleLabel(team.owner) : `${team.lead} · ${byId.get(team.lead)?.callSign}`;
  const blocker = agent.blockedBy ? BLOCKERS[agent.blockedBy] : null;

  els.detail.innerHTML = `
    <span class="mono oa-id">${esc(agent.id)}</span>
    <h2 id="detailTitle" tabindex="-1">${esc(agent.callSign)}</h2>
    <p class="detail-title">${esc(agent.titleTh)} <span class="team-en">${esc(agent.titleEn)}</span></p>
    <dl class="detail-grid">
      <div><dt>หน้าที่</dt><dd>${esc(agent.dutyTh)}<span class="detail-en">${esc(agent.dutyEn)}</span></dd></div>
      <div><dt>ทีม</dt><dd>${esc(team.id)} · ${esc(team.nameTh)}</dd></div>
      <div><dt>คนที่รับผิดชอบ</dt><dd>${esc(roleLabel(team.owner))}</dd></div>
      <div><dt>ยกระดับไปที่</dt><dd>${esc(escalate)}</dd></div>
      <div><dt>สถานะ</dt><dd><span class="chip ok">ตั้งค่าแล้ว</span> <span class="chip warn">ยังไม่เชื่อมต่อ</span></dd></div>
    </dl>
    <h3 class="route-title">เส้นทางส่งต่องาน</h3>
    <ol class="route">
      <li><span class="mono">${esc(agent.callSign)}</span></li>
      ${route.map((step) => `<li>${stepLabel(step)}</li>`).join('')}
    </ol>
    ${endsAtHuman
      ? '<p class="readonly-note">งานทุกชิ้นจบที่คนที่รับผิดชอบ และผ่านหัวหน้าทีมก่อนถึงคนเสมอ</p>'
      : '<div class="send-note" role="alert">เส้นทางนี้ไม่จบที่คน · ต้องแก้ใน office-data.js</div>'}
    ${blocker ? `<div class="send-note">${esc(blocker.th)}</div>` : ''}
    <div class="send-note">
      ยังเปิดใช้เอเจนต์นี้ไม่ได้ · การเปิดใช้ต้องผ่าน ACTIVATION-REQUEST พร้อมผลทดสอบ
      ค่าใช้จ่ายที่ประเมินแล้ว และการอนุมัติของเจ้าของ ทีละตัว
    </div>
    <h3 class="route-title">Prompt สำหรับแชตของเอเจนต์นี้</h3>
    <p class="readonly-note">
      วางเป็นคำสั่งของแชตหนึ่งแชต แล้วคัดลอกบล็อก HANDOFF ระหว่างแชตด้วยมือ
      · ไม่ใช่การเชื่อมต่อระบบ · ห้ามวางเบอร์โทร อีเมล หรือเลขบัตรของลูกค้าลงในแชต
    </p>
    <button class="btn btn-primary" type="button" data-act="copy-prompt">คัดลอก prompt</button>
    <span class="copy-result" id="copyResult" role="status" aria-live="polite"></span>
    <details class="prompt-view" id="promptView">
      <summary>ดู prompt</summary>
      <pre id="promptText">${esc(buildAgentPrompt(agent, PROMPT_CONTEXT))}</pre>
    </details>`;
}

/* คัดลอกในเครื่องเท่านั้น · ถ้าเบราว์เซอร์ไม่อนุญาต ให้เปิดข้อความแล้วเลือกไว้ให้คัดลอกเอง */
async function copyPrompt() {
  const agent = byId.get(ui.selected);
  const result = els.detail.querySelector('#copyResult');
  if (!agent || !result) return;
  try {
    await navigator.clipboard.writeText(buildAgentPrompt(agent, PROMPT_CONTEXT));
    result.textContent = 'คัดลอกแล้ว · วางเป็นคำสั่งของแชตใหม่ได้เลย';
  } catch {
    const view = els.detail.querySelector('#promptView');
    const text = els.detail.querySelector('#promptText');
    view.open = true;
    window.getSelection().selectAllChildren(text);
    result.textContent = 'คัดลอกอัตโนมัติไม่ได้ · เลือกข้อความไว้ให้แล้ว คัดลอกเองได้เลย';
  }
}

/* ---------- การโต้ตอบ ---------- */
function select(agentId, { focus = true } = {}) {
  ui.selected = byId.has(agentId) ? agentId : null;
  const hash = ui.selected ? `#agent=${ui.selected}` : '';
  if (window.location.hash !== hash) {
    window.history.replaceState(null, '', hash || window.location.pathname);
  }
  renderList();
  renderDetail();
  if (focus && ui.selected) {
    const heading = els.detail.querySelector('#detailTitle');
    if (heading) heading.focus();
  }
}

els.list.addEventListener('click', (event) => {
  const card = event.target.closest('[data-agent]');
  if (card) select(card.dataset.agent);
});

els.detail.addEventListener('click', (event) => {
  if (event.target.closest('[data-act="copy-prompt"]')) copyPrompt();
});

els.team.addEventListener('change', () => { ui.team = els.team.value; renderList(); });
els.owner.addEventListener('change', () => { ui.owner = els.owner.value; renderList(); });
els.blocked.addEventListener('change', () => { ui.blockedOnly = els.blocked.checked; renderList(); });
els.search.addEventListener('input', () => { ui.query = els.search.value.trim().toLowerCase(); renderList(); });

function agentFromHash() {
  const match = /^#agent=([A-Z0-9-]+)$/.exec(window.location.hash);
  return match && byId.has(match[1]) ? match[1] : null;
}

window.addEventListener('hashchange', () => select(agentFromHash(), { focus: false }));

/* ---------- เริ่มทำงาน ---------- */
renderStats();
renderFilters();
ui.selected = agentFromHash();
renderList();
renderDetail();
