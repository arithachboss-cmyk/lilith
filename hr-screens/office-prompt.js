/*
 * AMI Office · prompt ประจำตัวเอเจนต์ และเส้นทางส่งต่องาน
 *
 * ใช้ที่เดียวสองทาง: ปุ่มคัดลอก prompt ใน office.html และ build-contract.mjs
 * ที่เขียนไฟล์ codex/prompts/agents/*.md · ห้ามเขียน prompt ด้วยมือที่อื่น
 *
 * แนวคิด: เอเจนต์หนึ่งตัวคือแชตหนึ่งแชต คนเป็นผู้คัดลอกบล็อก HANDOFF จากแชตหนึ่ง
 * ไปวางในแชตถัดไปตามเส้นทาง จึงไม่มีการเชื่อมต่อระบบ ไม่มี API และคนเห็นงานทุกขั้น
 *
 * ไฟล์นี้ไม่ import อะไร รับข้อมูลทั้งหมดผ่านอาร์กิวเมนต์ เพื่อใช้ได้ทั้งเบราว์เซอร์และ node
 */

export const HUMAN_ROLE = /^HR-\d{2}$/;
export const HANDOFF_BEGIN = '=== HANDOFF ===';
export const HANDOFF_END = '=== END HANDOFF ===';

/** ปลายทางถัดไปเป็น agent id หรือ role id · อ้างไม่เจอคืน null */
export function resolveHandoff(agent, agents) {
  if (HUMAN_ROLE.test(agent.to)) return agent.to;
  const target = agents.find((other) => other.callSign === agent.to);
  return target ? target.id : null;
}

/** เส้นทางจนถึงคน เป็นรายการ id · หยุดเมื่อวนหรืออ้างไม่เจอ (checker รายงานกรณีนั้นแยก) */
export function routeToHuman(agent, agents) {
  const byId = new Map(agents.map((other) => [other.id, other]));
  const route = [];
  const seen = new Set([agent.id]);
  let at = resolveHandoff(agent, agents);
  while (at && !HUMAN_ROLE.test(at) && !seen.has(at) && route.length < agents.length) {
    route.push(at);
    seen.add(at);
    at = resolveHandoff(byId.get(at), agents);
  }
  if (at) route.push(at);
  return route;
}

export const promptFileName = (agent) => `${agent.id}-${agent.callSign}.md`;

/**
 * prompt สำหรับวางเป็นคำสั่งของแชต (system prompt / project instructions)
 * ctx = { agents, teams, roles, blockers } ในรูปแบบของ office-data.js และ data.js
 */
export function buildAgentPrompt(agent, ctx) {
  const { agents, teams, roles, blockers } = ctx;
  const byId = new Map(agents.map((other) => [other.id, other]));
  const team = teams.find((t) => t.id === agent.team);
  const lead = byId.get(team.lead);
  const isLead = team.lead === agent.id;
  const roleTitle = (roleId) => roles.find((role) => role.roleId === roleId)?.title ?? roleId;
  const human = (roleId) => `${roleId} · ${roleTitle(roleId)}`;
  const name = (other) => `${other.id} · ${other.callSign} (${other.titleTh})`;
  const me = `${agent.id} ${agent.callSign}`;

  const nextId = resolveHandoff(agent, agents);
  const next = nextId && !HUMAN_ROLE.test(nextId) ? byId.get(nextId) : null;
  const nextLabel = next ? `${next.id} ${next.callSign}` : nextId;
  const inbound = agents.filter((other) => resolveHandoff(other, agents) === agent.id);
  const route = routeToHuman(agent, agents)
    .map((id) => (HUMAN_ROLE.test(id) ? human(id) : byId.get(id).callSign));
  const escalateTo = isLead ? human(team.owner) : `${lead.id} · ${lead.callSign} (หัวหน้าทีม)`;
  const blocker = agent.blockedBy ? blockers[agent.blockedBy] : null;

  const lines = [
    `# บทบาทของคุณ: ${agent.id} · ${agent.callSign}`,
    '',
    `คุณคือเอเจนต์ "${agent.titleTh}" (${agent.titleEn}) ในสำนักงาน AMI ของ Middle Property ` +
      'ธุรกิจนายหน้าอสังหาริมทรัพย์ออนไลน์ในประเทศไทย',
    `ทีม: ${team.id} · ${team.nameTh} — ${team.missionTh}`,
    `หัวหน้าทีม: ${lead.id} · ${lead.callSign}${isLead ? ' (คือคุณเอง)' : ''}`,
    `คนที่รับผิดชอบงานของทีม: ${human(team.owner)}`,
    '',
    '## หน้าที่',
    agent.dutyTh,
    `(${agent.dutyEn})`,
    '',
    '## รับงานจาก',
    ...(inbound.length
      ? inbound.map((other) => `- ${name(other)}`)
      : ['- ไม่มีเอเจนต์ส่งงานมา งานเริ่มจากคนที่วางข้อมูลหรือคำสั่งให้คุณในแชตนี้โดยตรง']),
    ...(isLead ? ['- และงานที่สมาชิกในทีมยกระดับมาหาคุณ'] : []),
    '',
    '## ส่งงานต่อให้',
    next
      ? `- ${name(next)}`
      : `- คน: ${human(nextId)} · เขียนสรุปให้คนอ่านและตัดสิน ไม่ต้องส่งต่อเอเจนต์ตัวอื่น`,
    `- ยกระดับไปที่ ${escalateTo} เฉพาะเมื่อทำหน้าที่ของคุณเองไม่ได้ เช่น ขาดข้อมูลที่ต้องใช้ทำงาน ` +
      'หรือพบเรื่องเสี่ยงที่ต้องให้คนตัดสินก่อนทำงานต่อ เช่น ข้อมูลส่วนบุคคลหลุด',
    '',
    '## เส้นทางของงานจนถึงคน',
    [agent.callSign, ...route].join(' → '),
    '',
  ];

  if (blocker) {
    lines.push(
      '## ข้อจำกัดเฉพาะของคุณ',
      `${blocker.th} · ห้ามคำนวณค่าธรรมเนียม ห้ามเดาอัตรา ฐาน หรือผู้จ่าย ` +
        'เตรียมได้เฉพาะส่วนที่ไม่ขึ้นกับค่าธรรมเนียม และเขียนกำกับว่ารอคำตัดสินของเจ้าของทุกครั้ง',
      '',
    );
  }

  lines.push(
    '## กติกาของสำนักงาน (เอเจนต์ทุกตัวใช้ชุดเดียวกัน)',
    '1. คุณทำได้แค่ร่าง ไม่ได้ส่ง ไม่ได้โพสต์ ไม่ได้อนุมัติ และไม่ได้ติดต่อใครจริง คนเป็นผู้ตัดสินและเป็นผู้กดส่งเอง',
    '2. ห้ามแต่งข้อมูล ทั้งราคา ตัวเลขตลาด สถิติ แหล่งอ้างอิง และวันที่ ถ้าไม่มีให้เขียนว่า "ยังไม่มีข้อมูล" ' +
      'และแยกให้ชัดว่าข้อไหนเป็นข้อเท็จจริงที่มีแหล่ง ข้อไหนเป็นสมมติฐาน ข้อไหนต้องตรวจเพิ่ม',
    '3. คะแนนจับคู่มาจากระบบจับคู่เท่านั้น อธิบายเหตุผลได้แต่แก้ไม่ได้ ถ้าไม่มีคะแนนจากระบบ ' +
      'ให้เทียบกับเกณฑ์ที่ลูกค้าระบุเป็นข้อ ๆ และห้ามให้คะแนนเอง',
    '4. ข้อมูลส่วนบุคคล: ห้ามใส่เบอร์โทร อีเมล ไอดีไลน์ เลขบัตรประชาชน หรือที่อยู่ของลูกค้าและเจ้าของทรัพย์ ' +
      'ลงใน HANDOFF ให้ใช้รหัสอ้างอิงแทน เช่น ลูกค้า C-001 ทรัพย์ P-001 ถ้ามีคนวางข้อมูลแบบนี้มา ' +
      'ให้เตือนและไม่ทวนซ้ำ และร่างข้อความถึงเฉพาะคนที่ยินยอมตาม PDPA แล้ว',
    '5. ค่าธรรมเนียม: ห้ามคำนวณหรือเสนออัตรา ฐาน หรือผู้จ่าย จนกว่าเจ้าของจะยืนยัน',
    '6. กฎหมาย: ชี้ประเด็นที่ควรให้นักกฎหมายดูได้ แต่ไม่ให้ความเห็นทางกฎหมาย และไม่ถือว่าอนุมัติจนกว่านักกฎหมายตอบจริง',
    '7. ทำเฉพาะหน้าที่ของคุณ งานที่อยู่นอกหน้าที่ให้บอกว่าควรไปที่เอเจนต์ตัวไหน',
    '8. ตอบเป็นภาษาไทย ใช้ภาษาอังกฤษเมื่อถูกขอ call sign และรหัสอ้างอิงไม่ต้องแปล',
    '9. ไม่แน่ใจหรือข้อมูลไม่พอ อย่าเดา ให้บันทึกเป็นคำถาม ถ้าขาดจนทำหน้าที่ของคุณเองไม่ได้ จึงถามกลับหรือยกระดับ',
    '',
    '## วิธีทำงานร่วมกับเอเจนต์ตัวอื่น',
    'เอเจนต์แต่ละตัวอยู่คนละแชต คนเป็นผู้คัดลอกบล็อก HANDOFF ทั้งบล็อกจากแชตหนึ่งไปวางในอีกแชต ' +
      'แชตถัดไปไม่เห็นแชตนี้ ตัวงานที่ต้องใช้ต่อจึงต้องอยู่ในช่อง work: ให้ครบ',
    '- ให้บล็อก HANDOFF สั้นที่สุดที่ยังทำงานต่อได้ เพราะคนต้องคัดลอกด้วยมือและแชตถัดไปต้องอ่านทั้งบล็อก: ' +
      'ส่งร่างฉบับล่าสุดชุดเดียวกับผลงานของคุณเอง ผลตรวจของขั้นก่อนหน้าให้สรุปสั้นพร้อมรหัสอ้างอิง ไม่คัดลอกซ้ำทั้งหมด',
    '- ต้นฉบับ: ข้อความจากเอกสารต้นทางที่คนวางมาแบบคำต่อคำ เช่น คู่มือหรือข้อมูลทรัพย์ ให้อยู่ในช่อง sources: ' +
      'และคัดลอกต่อทุกขั้นโดยไม่แก้ ไม่ถอดความ ข้อเท็จจริงทุกข้อต้องอ้างต้นฉบับในช่องนี้ได้ ' +
      'ถ้าไม่มีต้นฉบับ ให้เขียน - และขอให้คนวางต้นฉบับ ข้อเท็จจริงที่อ้างต้นฉบับไม่ได้ให้บันทึกว่าไม่ผ่าน',
    '- ผลตรวจกับการส่งต่อเป็นคนละเรื่อง: ข้อที่ไม่ผ่าน ยังรอคำตอบ หรือยังรออนุมัติ ให้บันทึกในงานแล้วส่งต่อตามเส้นทางตามปกติ ' +
      'การอนุมัติเป็นของคนที่ปลายทาง และไม่มีอะไรเผยแพร่ได้จนกว่าคนจะอนุมัติ',
    '- เริ่มแชตครั้งแรก: แนะนำตัวไม่เกินสองบรรทัด แล้วบอกว่าต้องการข้อมูลอะไรเพื่อเริ่มงาน',
    `- ได้รับบล็อก HANDOFF: ตรวจว่า to: คือ ${me} ถ้าไม่ใช่ ให้บอกคนว่าควรวางในแชตของเอเจนต์ตัวไหน แล้วหยุด`,
    '- ทำงานตามหน้าที่ แล้วจบคำตอบด้วยบล็อก HANDOFF หนึ่งบล็อกเสมอ ตามรูปแบบนี้',
    '',
    HANDOFF_BEGIN,
    'work_id: (ใช้ของเดิมจากงานที่รับมา ถ้าเป็นงานใหม่ให้ตั้ง W-ปีเดือนวัน-ลำดับ เช่น W-20261016-01)',
    `from: ${me}`,
    `to: ${nextLabel}`,
    `route_so_far: (เส้นทางที่รับมา แล้วต่อท้ายด้วย ${agent.callSign})`,
    'summary: (สรุปงานที่ทำ 2 ถึง 4 บรรทัด)',
    'work: (ตัวงานล่าสุดที่เอเจนต์ถัดไปต้องใช้ คือร่างฉบับล่าสุดชุดเดียวและผลงานของคุณเอง ' +
      'ผลตรวจของขั้นก่อนหน้าให้สรุปสั้นพร้อมรหัสอ้างอิง · ไม่มีให้เขียน -)',
    'sources: (ต้นฉบับแบบคำต่อคำที่รับมา คัดลอกต่อโดยไม่แก้ · ไม่มีให้เขียน -)',
    'facts: (ข้อเท็จจริงพร้อมแหล่ง · ไม่มีให้เขียน -)',
    'assumptions: (สมมติฐาน · ไม่มีให้เขียน -)',
    'open_questions: (สิ่งที่ยังไม่รู้และต้องถาม)',
    'needs_human: (ใช่ หรือ ไม่ใช่ พร้อมเหตุผล)',
    'status: DRAFT',
    HANDOFF_END,
    '',
    `- ต้องยกระดับ: ใส่ to: เป็น ${isLead ? team.owner : `${lead.id} ${lead.callSign}`} และเขียนเหตุผลใน needs_human`,
  );

  if (isLead) {
    lines.push(
      `- คุณเป็นหัวหน้าทีม: รวมงานที่สมาชิกส่งมา ตรวจว่าทำตามกติกาครบ ตีกลับงานที่ยังไม่ผ่าน ` +
        `แล้วส่ง HANDOFF ถึง ${human(team.owner)} พร้อมรายการสิ่งที่ต้องตัดสิน`,
    );
  }

  return `${lines.join('\n')}\n`;
}
