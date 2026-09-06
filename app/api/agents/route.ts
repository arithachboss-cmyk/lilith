import { actor, db, json, property, sameOrigin } from './storage';
import { canView, canEdit, normalizeMember, normalizeProperty } from './model';
export async function GET(request: Request) {
    const a = await actor(request);
    if (!a)
        return json({ error: 'บัญชีนี้ยังไม่มีสิทธิ์เอเจนต์ กรุณาให้ผู้จัดการเพิ่มอีเมลของคุณ' }, 403);
    const agents = await db().prepare(a.manager ? 'SELECT * FROM agent_members ORDER BY score DESC' : 'SELECT id,team,tier,score,note FROM agent_members ORDER BY score DESC').all();
    const rows = await db().prepare(a.manager ? 'SELECT * FROM agent_properties ORDER BY updated_at DESC' : 'SELECT * FROM agent_properties WHERE tier >= ? ORDER BY updated_at DESC');
    const result = await (a.manager ? rows : rows.bind(a.me.tier)).all();
    return json({ ...a, agents: [...(a.manager ? [a.me] : [{ id: 'M1', team: 'M', tier: 1, score: 0, note: 'ผู้จัดการระบบ' }]), ...(agents.results ?? [])], properties: (result.results ?? []).map(p => ({ ...p, photos: JSON.parse(String(p.photos)) })) });
}
export async function POST(request: Request) {
    if (!sameOrigin(request))
        return json({ error: 'Invalid origin' }, 403);
    const a = await actor(request);
    if (!a)
        return json({ error: 'ไม่มีสิทธิ์จัดการทรัพย์' }, 403);
    let p: Record<string, unknown>;
    try {
        p = await request.json();
        if (!p || typeof p !== 'object' || Array.isArray(p))
            throw Error();
    }
    catch {
        return json({ error: 'ข้อมูลไม่ถูกต้อง' }, 400);
    }
    if (p.action === 'agent') {
        if (!a.manager)
            return json({ error: 'เฉพาะผู้จัดการที่ประเมินหรือปรับระดับได้' }, 403);
        const m = normalizeMember(p);
        if (!m || m.email === a.me.email)
            return json({ error: 'ตรวจรหัส อีเมล ระดับ คะแนน และเหตุผลอีกครั้ง (M1 สงวนให้ผู้จัดการ)' }, 422);
        try {
            await db().batch([db().prepare('INSERT INTO agent_members (id,email,team,tier,score,note) VALUES (?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET email=excluded.email,team=excluded.team,tier=excluded.tier,score=excluded.score,note=excluded.note').bind(m.id, m.email, m.team, m.tier, m.score, m.note), db().prepare('INSERT INTO agent_reviews (agent_id,reviewer,score,tier,note) VALUES (?,?,?,?,?)').bind(m.id, a.me.id, m.score, m.tier, m.note)]);
        }
        catch {
            return json({ error: 'บันทึกไม่ได้ อีเมลอาจถูกใช้กับเอเจนต์อื่นแล้ว' }, 409);
        }
        return json({ saved: true });
    }
    if (p.action !== 'property')
        return json({ error: 'ไม่รู้จักคำสั่ง' }, 400);
    const v = normalizeProperty(p);
    if (!v)
        return json({ error: 'กรอกข้อมูลทรัพย์ให้ครบ พร้อมรูปห้อง 1–6 รูป' }, 422);
    if (!canView(a.me, v, a.manager))
        return json({ error: 'ระดับของคุณยังไม่สามารถจัดการทรัพย์ระดับนี้' }, 403);
    const old = p.id ? await property(String(p.id)) : null;
    if (p.id && !old)
        return json({ error: 'ไม่พบทรัพย์' }, 404);
    if (old && !canEdit(a.me, old, a.manager))
        return json({ error: 'แก้ไขได้เฉพาะทรัพย์ของตนเองที่ยังมีสิทธิ์เข้าถึง' }, 403);
    for (const id of v.photos) {
        const photo = await db().prepare('SELECT * FROM agent_photos WHERE id=?').bind(id).first();
        if (!photo || (!a.manager && photo.owner !== a.me.id && !old?.photos.includes(id)))
            return json({ error: 'ไม่มีสิทธิ์ใช้รูปนี้' }, 403);
    }
    const id = old?.id ?? crypto.randomUUID();
    await db().prepare('INSERT INTO agent_properties (id,name,area,rent,bedrooms,size,tier,status,owner,photos,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,area=excluded.area,rent=excluded.rent,bedrooms=excluded.bedrooms,size=excluded.size,tier=excluded.tier,status=excluded.status,photos=excluded.photos,updated_at=excluded.updated_at').bind(id, v.name, v.area, v.rent, v.bedrooms, v.size, v.tier, v.status, old?.owner ?? a.me.id, JSON.stringify(v.photos), new Date().toISOString()).run();
    return json({ saved: true, id }, old ? 200 : 201);
}
