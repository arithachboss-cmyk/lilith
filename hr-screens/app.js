/*
 * AMI — HUMAN + AI COMMAND · prototype logic
 *
 * ทั้งไฟล์เป็นการจำลองเพื่อการออกแบบ ไม่มีการเรียก network ไม่มีการส่งคำขอจริง
 * ไม่มีการอ่านหรือเขียนบัญชีผู้ใช้ และไม่แตะระบบ matching หรือ permission ใด ๆ
 *
 * ตัวสลับบทบาทในหน้านี้เทียบเท่ากับ active_role ของระบบจริง คือเป็น UI context
 * เท่านั้น ไม่ใช่การตัดสินใจด้านความปลอดภัย สิทธิ์จริงต้องถูกตรวจใหม่ฝั่ง server ทุกคำขอ
 */

import { BRAND, FUNNEL, PRINCIPLES, ROLES, SPECIALISTS } from './data.js';

const screenEl = document.getElementById('screen');
const roleBar = document.getElementById('roleBar');

/* สถานะตัวอย่างของแผงหลัก — ใช้สาธิต empty / loading / error / ไม่มีสิทธิ์ */
const PANEL_STATES = [
  ['ready', 'พร้อมใช้งาน'],
  ['loading', 'กำลังโหลด'],
  ['empty', 'ยังไม่มีข้อมูล'],
  ['error', 'เกิดข้อผิดพลาด'],
  ['unavailable', 'ไม่มีสิทธิ์เข้าถึง'],
];

const ui = {
  roleIndex: 0,
  panelState: 'ready',
  specialist: null,
  draft: null,
};

/* ---------- ตัวช่วย ---------- */
const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  );

const stageTh = (id) => (FUNNEL.find((stage) => stage.id === id) || {}).th || id;
const stageEn = (id) => (FUNNEL.find((stage) => stage.id === id) || {}).label || id;

const healthChip = (health) =>
  ({
    'on-track': '<span class="chip ok">เดินตามแผน</span>',
    attention: '<span class="chip warn">ต้องติดตาม</span>',
    blocked: '<span class="chip stop">ติดขัด</span>',
  })[health] || '<span class="chip">ไม่ระบุ</span>';

function emblemSvg(role) {
  return `<svg viewBox="0 0 64 64" role="img" aria-label="ตราภารกิจ ${esc(role.space)}">
    <g fill="none" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <ellipse class="ring" cx="32" cy="32" rx="29" ry="11.5" transform="rotate(-24 32 32)"/>
      <ellipse class="ring" cx="32" cy="32" rx="29" ry="11.5" transform="rotate(24 32 32)"/>
      <g class="glyph">${role.emblem}</g>
    </g>
  </svg>`;
}

function orbitDot(health) {
  const color = health === 'blocked' ? 'var(--stop)' : health === 'attention' ? 'var(--warn)' : 'var(--ok)';
  return `<svg class="orbit" viewBox="0 0 34 34" aria-hidden="true">
    <circle cx="17" cy="17" r="12" fill="none" stroke="var(--line)" stroke-width="1.2"/>
    <circle cx="17" cy="5" r="3.2" fill="${color}"/>
  </svg>`;
}

/* ---------- สถานะตัวอย่าง ---------- */
function stateBox(state) {
  if (state === 'loading') {
    return `<div class="state-box" data-state="loading" role="status">
      <div class="st-title">กำลังโหลดข้อมูล</div>
      <p class="st-body">กำลังดึงข้อมูลที่คุณมีสิทธิ์เห็น</p>
      <div class="sk" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>`;
  }
  if (state === 'empty') {
    return `<div class="state-box" data-state="empty">
      <div class="st-title">ยังไม่มีข้อมูลในช่วงนี้</div>
      <p class="st-body">เมื่อมีงานเข้ามา รายการจะขึ้นที่นี่ ยังไม่ต้องทำอะไรตอนนี้</p>
    </div>`;
  }
  if (state === 'error') {
    return `<div class="state-box" data-state="error" role="alert">
      <div class="st-title">โหลดข้อมูลไม่สำเร็จ</div>
      <p class="st-body">ยังไม่ได้รับข้อมูลจากระบบ ข้อมูลที่เห็นก่อนหน้านี้อาจไม่ใช่สถานะล่าสุด</p>
      <button class="btn" type="button" data-act="retry">ลองอีกครั้ง</button>
    </div>`;
  }
  if (state === 'unavailable') {
    return `<div class="state-box" data-state="unavailable" role="status">
      <div class="st-title">ยังไม่ทราบสิทธิ์ของคุณสำหรับข้อมูลชุดนี้</div>
      <p class="st-body">
        ข้อมูลส่วนนี้ต้องผ่านทั้งสิทธิ์จาก AMI และการเปิดเผยโดย The Keeper
        ระบบจะไม่เดาว่าคุณเข้าถึงได้ จึงแสดงว่ารอตรวจสิทธิ์แทน
      </p>
      <span class="chip warn">รอตรวจสิทธิ์</span>
    </div>`;
  }
  return '';
}

/* ---------- แผงเฉพาะบทบาท ---------- */
function panelDirector(role) {
  const p = role.panels;
  return `
  <section class="panel">
    <div class="panel-head"><h2>Mission map · ภารกิจของทีม</h2>${stateSwitch()}</div>
    <div id="mainPanelBody">
      ${ui.panelState !== 'ready' ? stateBox(ui.panelState) : `<div class="missionmap">
        ${p.missionMap.map((m) => `<div class="mrow">
          ${orbitDot(m.health)}
          <div>
            <div class="name">${esc(m.name)}</div>
            <div class="sub">${esc(stageEn(m.stage))} · ${esc(stageTh(m.stage))} · ผู้ดูแล ${esc(m.owner)}</div>
          </div>
          ${healthChip(m.health)}
        </div>`).join('')}
      </div>`}
    </div>
  </section>

  <section class="panel">
    <h2>Briefing · เรื่องรอการตัดสินใจ</h2>
    <table>
      <thead><tr><th>เรื่อง</th><th>มาจาก</th><th>ค้างมา</th></tr></thead>
      <tbody>${p.decisions.map((d) => `<tr>
        <td>${esc(d.title)}<div class="sub" style="font-size:11.5px;color:var(--ivory-faint)">${esc(d.waiting)}</div></td>
        <td>${esc(d.from)}</td><td>${esc(d.age)}</td></tr>`).join('')}</tbody>
    </table>
  </section>

  <section class="panel">
    <h2>Escalation · เรื่องที่ถูกยกระดับ</h2>
    <table>
      <thead><tr><th>เรื่อง</th><th>ระดับ</th><th>เส้นทาง</th></tr></thead>
      <tbody>${p.escalations.map((e) => `<tr>
        <td>${esc(e.title)}</td>
        <td><span class="chip ${e.level === 'สูง' ? 'stop' : 'warn'}">${esc(e.level)}</span></td>
        <td class="mono">${esc(e.route)}</td></tr>`).join('')}</tbody>
    </table>
  </section>`;
}

function panelHr(role) {
  const p = role.panels;
  return `
  <section class="panel">
    <div class="panel-head"><h2>Onboarding journey · เส้นทางการเริ่มงาน</h2>${stateSwitch()}</div>
    <div id="mainPanelBody">
      ${ui.panelState !== 'ready' ? stateBox(ui.panelState) : `<div class="journey">
        ${p.journey.map((s) => `<div class="jstep" data-state="${esc(s.state)}">
          <div><span class="jdot"></span></div>
          <div><div class="jtitle">${esc(s.step)}</div><div class="jnote">${esc(s.note)}</div></div>
        </div>`).join('')}
      </div>`}
    </div>
  </section>

  <section class="panel">
    <h2>สมาชิกที่กำลังดูแล</h2>
    <table>
      <thead><tr><th>สมาชิก</th><th>บทบาท</th><th>ขั้นตอน</th><th>สถานะ</th></tr></thead>
      <tbody>${p.people.map((person) => `<tr>
        <td>${esc(person.alias)}</td>
        <td><span class="mono">${esc(person.roleId)}</span> ${esc(person.role)}</td>
        <td>${esc(person.stage)}</td>
        <td><span class="chip">${esc(person.status)}</span></td></tr>`).join('')}</tbody>
    </table>
    <p class="readonly-note" style="margin-top:10px">
      แสดงเฉพาะความคืบหน้าของการต้อนรับ ไม่แสดงข้อมูล HR ที่เป็นความลับใน prototype นี้
    </p>
  </section>

  <section class="panel">
    <h2>Role registry · ทะเบียนบทบาท</h2>
    <table>
      <thead><tr><th>role_id</th><th>บทบาท</th><th>ความชัดเจนของคำอธิบาย</th></tr></thead>
      <tbody>${p.registry.map((r) => `<tr>
        <td class="mono">${esc(r.roleId)}</td><td>${esc(r.role)}</td>
        <td><span class="chip ${r.clarity === 'ยืนยันแล้ว' ? 'ok' : 'warn'}">${esc(r.clarity)}</span></td></tr>`).join('')}</tbody>
    </table>
    <p class="readonly-note" style="margin-top:10px">
      การแก้ทะเบียนบทบาทเป็นการทำให้คำอธิบายงานชัดขึ้น ไม่ใช่การให้สิทธิ์เข้าถึงข้อมูลโดยอัตโนมัติ
    </p>
  </section>`;
}

function panelOps(role) {
  const p = role.panels;
  return `
  <section class="panel">
    <div class="panel-head"><h2>Workflow board · ลำดับงาน</h2>${stateSwitch()}</div>
    <div id="mainPanelBody">
      ${ui.panelState !== 'ready' ? stateBox(ui.panelState) : `<div class="lanes">
        ${p.lanes.map((lane) => `<div class="lane">
          <h3>${esc(stageEn(lane.stage))}</h3>
          <div class="lane-th">${esc(stageTh(lane.stage))}</div>
          ${lane.items.length === 0
            ? '<div class="lane-empty">ยังไม่มีงานในขั้นนี้</div>'
            : lane.items.map((item) => `<div class="wcard ${esc(item.flag || '')}">
                <div class="wid">${esc(item.id)}</div>
                <div>${esc(item.title)}</div>
                <div class="wid">${esc(item.owner)} · ${esc(item.age)}</div>
                ${item.flag === 'bottleneck' ? '<span class="chip stop">จุดติดขัด</span>' : ''}
                ${item.flag === 'handoff' ? '<span class="chip accent">รอส่งต่อ</span>' : ''}
              </div>`).join('')}
        </div>`).join('')}
      </div>`}
    </div>
  </section>

  <section class="panel">
    <h2>Handoff queue · คิวส่งต่อ</h2>
    <table>
      <thead><tr><th>งาน</th><th>จาก</th><th>ถึง</th><th>รอมา</th><th>สถานะ</th></tr></thead>
      <tbody>${p.handoffs.map((h) => `<tr>
        <td class="mono">${esc(h.item)}</td><td>${esc(h.from)}</td><td>${esc(h.to)}</td>
        <td>${esc(h.waiting)}</td><td><span class="chip warn">${esc(h.state)}</span></td></tr>`).join('')}</tbody>
    </table>
    <p class="readonly-note" style="margin-top:10px">
      หน้าจอนี้แสดงสถานะงานและเจ้าของงาน การเห็นสถานะไม่ให้สิทธิ์เปิดรายละเอียดลูกค้า
    </p>
  </section>`;
}

function panelIntel(role) {
  const p = role.panels;
  const kindLabel = { fact: 'ข้อเท็จจริง', hypothesis: 'สมมติฐาน', check: 'ต้องตรวจเพิ่ม' };
  return `
  <section class="panel">
    <div class="panel-head"><h2>Research desk · โต๊ะวิจัย</h2>${stateSwitch()}</div>
    <div id="mainPanelBody">
      ${ui.panelState !== 'ready' ? stateBox(ui.panelState) : `<div class="desk">
        <div>
          <h2 style="margin-bottom:10px">Evidence library · คลังหลักฐาน</h2>
          <table>
            <thead><tr><th>อ้างอิง</th><th>รายการ</th><th>แหล่ง / วันที่</th></tr></thead>
            <tbody>${p.evidence.map((ev) => `<tr>
              <td class="mono">${esc(ev.ref)}</td>
              <td>${esc(ev.title)}</td>
              <td>${esc(ev.source)}<div style="font-size:11.5px;color:var(--ivory-faint)">${esc(ev.date)}</div>
                  <span class="chip ${ev.state === 'มีหลักฐาน' ? 'ok' : 'stop'}">${esc(ev.state)}</span></td>
            </tr>`).join('')}</tbody>
          </table>
        </div>
        <div>
          <h2 style="margin-bottom:10px">Brief · ร่างบรีฟ</h2>
          ${p.statements.map((s) => `<div class="stmt" data-kind="${esc(s.kind)}">
            <span class="klabel">${esc(kindLabel[s.kind])}</span>
            ${esc(s.text)}
            <div style="font-size:11.5px;color:var(--ivory-faint);margin-top:4px">
              ${s.ref ? 'อ้างอิง ' + esc(s.ref) : 'ยังไม่มีแหล่งอ้างอิง'}
            </div>
          </div>`).join('')}
          <p class="readonly-note">
            ช่องที่ยังไม่มีหลักฐานจะแสดงว่ายังไม่มี ระบบไม่เติมตัวเลข แหล่งอ้างอิง
            หรือระดับความมั่นใจให้เอง
          </p>
        </div>
      </div>`}
    </div>
  </section>`;
}

function panelMatch(role) {
  const p = role.panels;
  return `
  <section class="panel">
    <div class="send-note" style="margin:0 0 14px">
      <b>Matchmaker / GROK-04 ไม่ใช่ MATCHMAKER-1 / THE KEEPER</b><br>
      ตำแหน่งนี้จับคู่และส่งต่อโอกาส ส่วน MATCHMAKER-1 / THE KEEPER เป็น Confidentiality Gate
      อิสระที่คุมการเปิดเผยข้อมูล คนละหน้าที่และคนละสายอำนาจ
    </div>
    <div class="panel-head"><h2>Connection nexus · จับคู่และส่งต่อ</h2>${stateSwitch()}</div>
    <div id="mainPanelBody">
      ${ui.panelState !== 'ready' ? stateBox(ui.panelState) : `<div class="desk">
        <div>
          <h2 style="margin-bottom:10px">Brief · ความต้องการที่ผ่านการคัดกรอง</h2>
          <div class="scope-box">
            <b>${esc(p.brief.ref)}</b> · <span class="chip ok">${esc(p.brief.qualified)}</span>
            <p style="margin:9px 0 0">${esc(p.brief.need)}</p>
          </div>
          <h2 style="margin:14px 0 8px">ข้อจำกัดที่ระบุไว้</h2>
          <ul style="margin:0;padding-left:18px;font-size:13px;color:var(--ivory-dim)">
            ${p.brief.constraints.map((c) => `<li>${esc(c)}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h2 style="margin-bottom:10px">Candidates · ตัวเลือกที่เหมาะสม</h2>
          ${p.candidates.map((c) => `<div class="cand">
            <div class="cand-head">
              <span class="mono">${esc(c.ref)}</span>
              <span class="score" style="margin-left:auto">${esc(c.score)}</span>
            </div>
            <div class="meter" role="img" aria-label="คะแนนการจับคู่ ${esc(c.score)} จาก 100">
              <span style="width:${Number(c.score)}%"></span>
            </div>
            <div style="font-size:12.5px;color:var(--ivory-dim)">เหตุผล: ${esc(c.fit.join(' · '))}</div>
            ${c.conflict ? `<div style="font-size:12.5px;margin-top:5px"><span class="chip stop">ข้อขัดแย้ง</span> ${esc(c.conflict)}</div>` : ''}
          </div>`).join('')}
          <p class="readonly-note">
            คะแนนมาจากการจับคู่แบบ deterministic อ่านได้อย่างเดียว · AI อธิบายเหตุผลได้
            แต่เปลี่ยนคะแนนไม่ได้ และเปิดข้อมูลผู้เกี่ยวข้องเองไม่ได้
          </p>
        </div>
      </div>`}
    </div>
  </section>

  <section class="panel">
    <h2>ผู้รับช่วงต่อ</h2>
    <p style="font-size:13.5px;margin:0">
      ส่งต่อให้ <b>${esc(p.receiver.role)}</b> — ${esc(p.receiver.note)}
    </p>
    <div class="send-note">
      prototype นี้เตรียมได้เฉพาะร่างการส่งต่อ ยังไม่มีการส่งจริงและยังไม่มีการเปิดข้อมูลผู้เกี่ยวข้อง
    </div>
  </section>`;
}

function panelAi(role) {
  const p = role.panels;
  return `
  <section class="panel">
    <div class="panel-head"><h2>Agent registry · ทะเบียนบทบาท AI</h2>${stateSwitch()}</div>
    <div id="mainPanelBody">
      ${ui.panelState !== 'ready' ? stateBox(ui.panelState) : `<div class="agents">
        ${p.agents.map((a) => `<div class="agent">
          <div class="aid">${esc(a.id)}</div>
          <div class="acs">${esc(a.callSign)}</div>
          <div class="aown">ผู้รับผิดชอบ ${esc(a.owner === 'shared' ? 'Shared pool' : a.owner)}</div>
          <div style="margin-top:6px">
            <span class="chip ok">ออกแบบแล้ว</span>
            <span class="chip warn">ยังไม่เชื่อมต่อ</span>
          </div>
        </div>`).join('')}
      </div>`}
    </div>
  </section>

  <section class="panel">
    <h2>Integration readiness · ความพร้อมในการเชื่อมต่อ</h2>
    <table>
      <thead><tr><th>รายการ</th><th>สถานะ</th></tr></thead>
      <tbody>${p.readiness.map((r) => `<tr>
        <td>${esc(r.item)}</td>
        <td><span class="chip ${r.state === 'ออกแบบแล้ว' ? 'ok' : 'warn'}">${esc(r.state)}</span></td>
      </tr>`).join('')}</tbody>
    </table>
    <div class="send-note">
      หน้าจอนี้ไม่แสดง key, token หรือ secret ใด ๆ และการเป็น AI Coordinator
      ไม่ให้อำนาจสร้าง credentials หรืออนุมัติ integration
    </div>
  </section>`;
}

const PANELS = { director: panelDirector, hr: panelHr, ops: panelOps, intel: panelIntel, match: panelMatch, ai: panelAi };

function stateSwitch() {
  return `<span class="state-switch">
    <label for="stateSel">สถานะตัวอย่าง</label>
    <select id="stateSel">
      ${PANEL_STATES.map(([value, label]) =>
        `<option value="${value}"${value === ui.panelState ? ' selected' : ''}>${label}</option>`).join('')}
    </select>
  </span>`;
}

/* ---------- หน้าจอ ---------- */
function renderScreen() {
  const role = ROLES[ui.roleIndex];
  document.documentElement.setAttribute('data-accent', role.accent);

  screenEl.setAttribute('aria-labelledby', `roletab-${role.roleId}`);
  screenEl.id = `panel-${role.roleId}`;
  screenEl.innerHTML = `
  <section class="passport">
    <div class="card accented">
      <div class="hello">
        <div class="emblem">${emblemSvg(role)}</div>
        <div style="min-width:0">
          <span class="spacename">${esc(role.space)}</span>
          <h1>ยินดีต้อนรับ คุณ ${esc(role.displayName)}</h1>
          <p class="welcome-line">${esc(role.welcome)}</p>
        </div>
      </div>
      <dl class="idgrid">
        <div class="idcell"><dt>ตำแหน่ง</dt><dd class="plain">${esc(role.title)}</dd></div>
        <div class="idcell"><dt>role_id</dt><dd>${esc(role.roleId)}</dd></div>
        <div class="idcell"><dt>call sign</dt><dd>${esc(role.callSign)}</dd></div>
        <div class="idcell"><dt>Grok ประจำตำแหน่ง</dt><dd>${esc(role.grokId)}</dd></div>
      </dl>
      <p class="readonly-note" style="margin:12px 0 0">
        ${esc(role.titleNote)} · ตัวตนและ role_id ต้องมาจาก session ฝั่ง server เสมอ
      </p>
    </div>

    <div class="card mission">
      <h2>ภารกิจสำคัญวันนี้</h2>
      <p class="headline">${esc(role.missionToday.headline)}</p>
      <p class="detail">${esc(role.missionToday.detail)}</p>
      <h2>Next action</h2>
      <ul class="actions">
        ${role.nextActions.map((a) => `<li><span>${esc(a.text)}</span><span class="meta">${esc(a.meta)}</span></li>`).join('')}
      </ul>
      <button class="btn btn-primary" type="button" data-act="primary">${esc(role.primaryAction)}</button>
      <div id="primaryResult" aria-live="polite"></div>
    </div>
  </section>

  <div class="columns">
    <div class="stack">${PANELS[role.panels.kind](role)}</div>

    <div class="stack">
      <section class="panel copilot">
        <h2>AI คู่คิดประจำตำแหน่ง</h2>
        <p style="margin:6px 0 10px;font-size:15px">
          <b class="mono" style="color:var(--accent)">${esc(role.grokId)}</b>
          <span style="letter-spacing:.08em"> · ${esc(role.callSign)}</span>
        </p>
        <span class="status"><span class="dot"></span>กำหนดบทบาทแล้ว · รอเชื่อมต่อ</span>
        <p style="margin-top:12px">${esc(role.aiScope)}</p>
        <p class="readonly-note">ยังไม่มีการเชื่อมต่อ xAI, AMI Core หรือ THE KEEPER · ยังเรียกใช้งานจริงไม่ได้</p>
      </section>

      <section class="panel">
        <h2>ขอผู้เชี่ยวชาญร่วม (Shared Specialist)</h2>
        <p class="readonly-note" style="margin:6px 0 10px">
          เลือกผู้เชี่ยวชาญเพื่อเตรียมร่างคำขอ · pool นี้ไม่ผูกกับพนักงานคนใดคนหนึ่ง
          และการขอไม่ได้ทำให้เห็นข้อมูลเพิ่มโดยอัตโนมัติ
        </p>
        <div class="spec-list" role="radiogroup" aria-label="เลือกผู้เชี่ยวชาญ">
          ${SPECIALISTS.map((s) => `<label class="spec">
            <input type="radio" name="specialist" value="${esc(s.id)}"${ui.specialist === s.id ? ' checked' : ''}>
            <span><span class="scs">${esc(s.callSign)}</span><br><span class="sth">${esc(s.th)}</span></span>
            <span class="sid">${esc(s.id)}</span>
          </label>`).join('')}
        </div>
        <div class="scope-box">
          <b>ขอบเขตข้อมูลที่จะใช้</b><br>
          ${esc(role.aiScope)} — เฉพาะข้อมูลที่บทบาท ${esc(role.roleId)} มีสิทธิ์เห็นอยู่แล้ว
          และต้องผ่านทั้งสิทธิ์จาก AMI และการเปิดเผยโดย The Keeper ก่อนถึง Grok
        </div>
        <button class="btn btn-primary" type="button" data-act="draft">เตรียมร่างคำขอ</button>
        <div id="draftResult" aria-live="polite"></div>
        <div class="send-note">ยังส่งคำขอจริงไม่ได้ · prototype เตรียมได้เฉพาะร่าง</div>
      </section>

      <section class="panel">
        <h2>ขอบเขตอำนาจของหน้าจอนี้</h2>
        <p class="boundary">${esc(role.boundary)}</p>
        <ul class="principles">
          ${PRINCIPLES.map((p) => `<li><b>${esc(p.en)}</b>${esc(p.th)}</li>`).join('')}
        </ul>
        <p class="readonly-note" style="margin-top:10px">
          MATCHMAKER-1 / THE KEEPER เป็น Confidentiality Gate อิสระ
          ไม่มีหน้าจอใดมีปุ่ม override หรือเลือกเปิดข้อมูลลับทั้งหมดได้
        </p>
      </section>
    </div>
  </div>`;

  bindScreen(role);
}

/* ---------- การโต้ตอบ ---------- */
function bindScreen(role) {
  const stateSel = screenEl.querySelector('#stateSel');
  if (stateSel) {
    stateSel.addEventListener('change', (event) => {
      ui.panelState = event.target.value;
      renderScreen();
      requestAnimationFrame(() => {
        const next = screenEl.querySelector('#stateSel');
        if (next) next.focus();
      });
    });
  }

  screenEl.querySelectorAll('input[name="specialist"]').forEach((input) => {
    input.addEventListener('change', () => {
      ui.specialist = input.value;
      const box = screenEl.querySelector('#draftResult');
      if (box) box.innerHTML = '';
    });
  });

  screenEl.querySelectorAll('[data-act]').forEach((button) => {
    button.addEventListener('click', () => onAction(button.dataset.act, role));
  });
}

function onAction(action, role) {
  if (action === 'retry') {
    ui.panelState = 'loading';
    renderScreen();
    // จำลองการโหลดซ้ำเท่านั้น ไม่มีการเรียก network ใด ๆ
    window.setTimeout(() => {
      ui.panelState = 'ready';
      renderScreen();
    }, 700);
    return;
  }

  if (action === 'primary') {
    const box = screenEl.querySelector('#primaryResult');
    box.innerHTML = `<div class="send-note" role="status">
      เตรียมร่าง “${esc(role.primaryAction)}” ไว้แล้วในตัวอย่างนี้ ·
      ยังไม่มีการส่ง ไม่มีการแจ้งใคร และไม่มีการเปลี่ยนสถานะงานจริง
    </div>`;
    return;
  }

  if (action === 'draft') {
    const box = screenEl.querySelector('#draftResult');
    if (!ui.specialist) {
      box.innerHTML = `<div class="state-box" data-state="error" role="alert" style="padding:14px;margin-top:10px">
        <div class="st-title">ยังไม่ได้เลือกผู้เชี่ยวชาญ</div>
        <p class="st-body" style="margin-bottom:0">เลือกหนึ่งรายการก่อน จึงจะเตรียมร่างคำขอได้</p>
      </div>`;
      return;
    }
    const spec = SPECIALISTS.find((s) => s.id === ui.specialist);
    box.innerHTML = `<div class="scope-box" role="status" style="margin-top:10px">
      <b>ร่างคำขอ (ยังไม่ส่ง)</b><br>
      ผู้ขอ ${esc(role.roleId)} · ${esc(role.title)}<br>
      ผู้เชี่ยวชาญ ${esc(spec.id)} · ${esc(spec.callSign)}<br>
      ขอบเขต ${esc(spec.th)} ภายในข้อมูลที่ ${esc(role.roleId)} มีสิทธิ์เห็น<br>
      <span class="chip warn" style="margin-top:7px">รอสิทธิ์จาก AMI และการเปิดเผยจาก Keeper</span>
    </div>`;
  }
}

/* ---------- แถบบทบาท: tablist + ปุ่มลูกศร ---------- */
function renderRoleBar() {
  roleBar.innerHTML = ROLES.map((role, index) => `
    <button type="button" role="tab" id="roletab-${role.roleId}"
      aria-controls="panel-${role.roleId}"
      aria-selected="${index === ui.roleIndex}"
      tabindex="${index === ui.roleIndex ? '0' : '-1'}">
      <span class="num">${esc(role.screen)}</span>
      <span>${esc(role.title)}</span>
    </button>`).join('');

  const tabs = Array.from(roleBar.querySelectorAll('button'));
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => select(index));
    tab.addEventListener('keydown', (event) => {
      const map = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (map[event.key]) {
        event.preventDefault();
        const next = (index + map[event.key] + tabs.length) % tabs.length;
        select(next);
        roleBar.querySelectorAll('button')[next].focus();
      } else if (event.key === 'Home') {
        event.preventDefault(); select(0); roleBar.querySelectorAll('button')[0].focus();
      } else if (event.key === 'End') {
        event.preventDefault(); select(tabs.length - 1); roleBar.querySelectorAll('button')[tabs.length - 1].focus();
      }
    });
  });
}

function select(index, { pushHash = true } = {}) {
  ui.roleIndex = index;
  ui.panelState = 'ready';
  ui.specialist = null;
  // เก็บบทบาทที่กำลังดูไว้ใน hash เพื่อแชร์ลิงก์ของหน้าจอเดียวได้
  // เป็นสถานะของ prototype เท่านั้น ไม่ใช่การเปลี่ยนสิทธิ์ใด ๆ
  if (pushHash) {
    const roleId = ROLES[index].roleId;
    if (window.location.hash !== `#role=${roleId}`) {
      window.history.replaceState(null, '', `#role=${roleId}`);
    }
  }
  renderRoleBar();
  renderScreen();
}

function indexFromHash() {
  const match = /^#role=([A-Z0-9-]+)$/.exec(window.location.hash);
  if (!match) return 0;
  const found = ROLES.findIndex((role) => role.roleId === match[1]);
  return found === -1 ? 0 : found;
}

/* ---------- เมนูบัญชี ---------- */
document.getElementById('accountBtn').addEventListener('click', () => {
  window.alert(
    'ตัวอย่างเท่านั้น\n\n' +
    'เมนูบัญชีของระบบจริงยังคงลำดับเดิม: เข้าสู่ระบบด้วยอีเมลองค์กร ' +
    'เปลี่ยนรหัสเริ่มต้น แล้วจึงเข้าพื้นที่สมาชิก\n\n' +
    'prototype นี้ไม่สร้าง ไม่รีเซ็ต และไม่แก้ไขบัญชีใด ๆ',
  );
});

document.getElementById('signoutBtn').addEventListener('click', () => {
  window.alert(
    'ตัวอย่างเท่านั้น\n\n' +
    'การออกจากระบบจริงต้องยกเลิก session ฝั่ง server\n' +
    'prototype นี้ไม่มี session จริงจึงไม่มีอะไรให้ยกเลิก',
  );
});

/* ---------- เริ่มทำงาน ---------- */
document.title = `${BRAND.systemFull} · prototype`;
ui.roleIndex = indexFromHash();
renderRoleBar();
renderScreen();

window.addEventListener('hashchange', () => {
  select(indexFromHash(), { pushHash: false });
});
