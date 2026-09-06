'use client';
import Image from 'next/image';
import { useEffect, useState, type FormEvent } from 'react';
type Agent = {
    id: string;
    email: string;
    team: string;
    tier: number;
    score: number;
    note: string;
};
type DeskData = {
    me: Agent;
    manager: boolean;
    agents: Agent[];
    properties: Property[];
};
type Property = {
    id: string;
    name: string;
    area: string;
    rent: number;
    bedrooms: number;
    size: number;
    tier: number;
    status: string;
    owner: string;
    photos: string[];
};
export default function AgentDesk() {
    const [data, setData] = useState<{
        me: Agent;
        manager: boolean;
        agents: Agent[];
        properties: Property[];
    } | null>(null);
    const [memberEdit, setMemberEdit] = useState<Agent | null>(null);
    const [message, setMessage] = useState('กำลังโหลดข้อมูล…');
    const [busy, setBusy] = useState(false);
    const [edit, setEdit] = useState<Property | null>(null);
    async function load() { const r = await fetch('/api/agents'); const d = await r.json() as DeskData & {
        error?: string;
    }; if (!r.ok)
        throw Error(d.error); setData(d); setMessage(''); }
    useEffect(() => { let active = true; fetch('/api/agents').then(async (r) => { const d = await r.json() as DeskData & {
        error?: string;
    }; if (!r.ok)
        throw Error(d.error); return d; }).then(d => { if (active) {
        setData(d);
        setMessage('');
    } }).catch(e => { if (active)
        setMessage(e.message); }); return () => { active = false; }; }, []);
    async function save(e: FormEvent<HTMLFormElement>, action: string) {
        e.preventDefault();
        setBusy(true);
        setMessage('กำลังบันทึก…');
        const form = e.currentTarget;
        const f = new FormData(form);
        try {
            let photos = edit?.photos ?? [];
            if (action === 'property') {
                const files = f.getAll('photos').filter((x): x is File => x instanceof File && x.size > 0);
                if (files.length) {
                    const upload = new FormData();
                    files.forEach(x => upload.append('photos', x));
                    const r = await fetch('/api/agents/photos', { method: 'POST', body: upload });
                    const d = await r.json() as {
                        photos: string[];
                        error?: string;
                    };
                    if (!r.ok)
                        throw Error(d.error);
                    photos = d.photos;
                }
            }
            const payload = { ...Object.fromEntries(f), action, ...(action === 'property' ? { id: edit?.id, photos } : {}) };
            delete (payload as Record<string, unknown>).unused;
            const r = await fetch('/api/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
            const d = await r.json() as {
                error?: string;
            };
            if (!r.ok)
                throw Error(d.error);
            await load();
            setMessage('บันทึกเรียบร้อย');
            form.reset();
            if (action === 'property')
                setEdit(null);
            else
                setMemberEdit(null);
        }
        catch (e) {
            setMessage(e instanceof Error ? e.message : 'บันทึกไม่สำเร็จ กรุณาลองใหม่');
        }
        finally {
            setBusy(false);
        }
    }
    return <main className="agent-desk"><header className="agent-header"><div><a href="/dashboard">← แดชบอร์ดลูกค้า</a><p className="eyebrow">LILITH HOMES / TEAM OPERATIONS</p><h1>{data ? `Agent ${data.me.id}` : 'Agent M1'}</h1><p>จัดการคอนโดเช่า 12 เดือน และผลงานทีม</p></div><span className="agent-badge">{data?.manager ? 'ผู้จัดการ' : data ? `ทีม ${data.me.team} · ระดับ ${data.me.tier}` : 'เข้าสู่ระบบแล้ว'}</span></header>
 <p role="status" aria-live="polite">{message}</p>
 {data && <><section className="agent-metrics"><article><strong>{data.properties.length}</strong><span>ทรัพย์ที่เข้าถึงได้</span></article><article><strong>{data.agents.length}</strong><span>สมาชิกทีม</span></article><article><strong>{data.me.score}</strong><span>คะแนนประเมินของคุณ</span></article></section>
 <div className="agent-columns"><section className="agent-panel"><h2>{edit ? 'แก้ไขทรัพย์' : 'เพิ่มคอนโดปล่อยเช่า'}</h2><form key={edit?.id ?? 'new'} onSubmit={e => save(e, 'property')} className="agent-form">
 <label>ชื่อโครงการ<input name="name" required maxLength={160} defaultValue={edit?.name}/></label><label>ทำเล / สถานี BTS<input name="area" required maxLength={160} defaultValue={edit?.area}/></label>
 <div className="agent-pair"><label>ค่าเช่าต่อเดือน (บาท)<input name="rent" type="number" min="1" max="10000000" required defaultValue={edit?.rent}/></label><label>ห้องนอน<input name="bedrooms" type="number" min="0" max="20" required defaultValue={edit?.bedrooms ?? 1}/></label></div>
 <div className="agent-pair"><label>พื้นที่ (ตร.ม.)<input name="size" type="number" min="1" max="10000" step="0.01" required defaultValue={edit?.size}/></label><label>สัญญา<input value="12 เดือน" readOnly/></label></div>
 <label>รูปห้อง — สูงสุด 6 รูป รูปละ 5 MB<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple required={!edit}/></label>{edit && <small>ไม่เลือกรูปใหม่จะเก็บรูปเดิม เลือกรูปใหม่เพื่อแทนที่ทั้งชุด</small>}
 <div className="agent-pair"><label>สิทธิ์เข้าถึง<select name="tier" defaultValue={edit?.tier ?? data.me.tier}>{[1, 2, 3, 4, 5].filter(t => data.manager || t >= data.me.tier).map(t => <option key={t} value={t}>ระดับ 1–{t}</option>)}</select></label><label>สถานะ<select name="status" defaultValue={edit?.status ?? 'Available'}><option value="Available">ว่าง</option><option value="Reserved">จองแล้ว</option><option value="Rented">เช่าแล้ว</option><option value="Inactive">พักประกาศ</option></select></label></div>
 <button disabled={busy}>บันทึกทรัพย์</button>{edit && <button type="button" disabled={busy} onClick={() => setEdit(null)}>ยกเลิกแก้ไข</button>}</form></section>
 <section className="agent-panel"><h2>ทรัพย์ที่คุณเข้าถึงได้</h2>{!data.properties.length && <p>ยังไม่มีทรัพย์ เริ่มจากเพิ่มคอนโดและรูปห้องด้านข้าง</p>}<div className="agent-list">{data.properties.map(p => <article className="agent-property" key={p.id}>{p.photos[0] && <Image unoptimized src={`/api/agents/photos?id=${encodeURIComponent(p.photos[0])}`} alt={p.name} width={320} height={180}/>}<div><span className="agent-badge">{({ Available: 'ว่าง', Reserved: 'จองแล้ว', Rented: 'เช่าแล้ว', Inactive: 'พักประกาศ' } as Record<string, string>)[p.status]}</span><h3>{p.name}</h3><p>{p.area} · {p.bedrooms} ห้องนอน · {p.size} ตร.ม.</p><strong>฿{p.rent.toLocaleString()} / เดือน</strong><p>Agent {p.owner} · ระดับ 1–{p.tier} · สัญญา 12 เดือน</p>{p.photos.length > 1 && <div className="agent-thumbnails">{p.photos.slice(1).map(photo => <Image unoptimized key={photo} src={`/api/agents/photos?id=${encodeURIComponent(photo)}`} alt={`รูปเพิ่มเติม ${p.name}`} width={80} height={60}/>)}</div>}{(data.manager || p.owner === data.me.id) && <button disabled={busy} onClick={() => { setEdit(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>แก้ไขทรัพย์</button>}</div></article>)}</div></section></div>
 <section className="agent-panel"><h2>ทีมและลำดับสิทธิ์</h2><p>ระดับ 1 สูงสุด → ระดับ 5 เริ่มต้น · A–L อยู่ฝั่งซ้าย · M คือ The Middle · N–Z อยู่ฝั่งขวา</p><p>คะแนนเฉลี่ยทีมใช้เปรียบเทียบผลงาน การเลื่อนระดับต้องได้รับอนุมัติจากผู้จัดการ</p><div className="agent-teams">{[...new Set(data.agents.map(a => a.team))].sort().map(team => { const members = data.agents.filter(a => a.team === team); return <article key={team}><strong>ทีม {team}</strong><p>{members.length} คน · เฉลี่ย {Math.round(members.reduce((s, a) => s + a.score, 0) / members.length)} คะแนน</p></article>; })}</div><div className="agent-table"><table><thead><tr><th>เอเจนต์</th><th>ทีม</th><th>ระดับ</th><th>คะแนน / 100</th><th>บันทึกประเมิน</th></tr></thead><tbody>{[...data.agents].sort((a, b) => b.score - a.score).map(a => <tr key={a.id}><td>{a.id}</td><td>{a.team}</td><td>{a.tier}</td><td>{a.score}</td><td>{a.note || 'ยังไม่ประเมิน'}{data.manager && a.id !== 'M1' && <button disabled={busy} onClick={() => setMemberEdit(a)}>ประเมิน / แก้ไข</button>}</td></tr>)}</tbody></table></div>
 {data.manager && <form key={memberEdit?.id ?? "new-member"} className="agent-form agent-member-form" onSubmit={e => save(e, 'agent')}><h3>เพิ่มสมาชิก / ประเมินและปรับระดับ</h3><p>ใช้รหัสเดิมเพื่อแก้ไขสมาชิก รหัส M1 สงวนให้ผู้จัดการ</p><label>รหัสเอเจนต์<input name="id" defaultValue={memberEdit?.id} readOnly={!!memberEdit} placeholder="A1" pattern="[A-Z][1-9][0-9]{0,3}" required/></label><label>อีเมลที่ใช้เข้าสู่ระบบ<input name="email" type="email" defaultValue={memberEdit?.email} required/></label><label>ทีม<select name="team" defaultValue={memberEdit?.team ?? "A"}>{'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(t => <option key={t}>{t}</option>)}</select></label><label>ระดับ<select name="tier" defaultValue={memberEdit?.tier ?? 5}>{[1, 2, 3, 4, 5].map(t => <option key={t}>{t}</option>)}</select></label><label>คะแนนประเมิน<input name="score" type="number" min="0" max="100" defaultValue={memberEdit?.score ?? 0} required/></label><label>เหตุผล / ผลงานที่ตรวจแล้ว<textarea name="note" defaultValue={memberEdit?.note} required maxLength={500}/></label><button disabled={busy}>บันทึกสมาชิกและผลประเมิน</button>{memberEdit && <button type="button" onClick={() => setMemberEdit(null)}>เพิ่มสมาชิกใหม่</button>}</form>}</section></>}
 </main>;
}
