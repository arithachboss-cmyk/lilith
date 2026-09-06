export type Member = {
    id: string;
    email: string;
    team: string;
    tier: number;
    score: number;
    note: string;
};
export type Listing = {
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
export function canView(me: Member, p: Pick<Listing, 'tier'>, manager = false) { return manager || me.tier <= p.tier; }
export function canEdit(me: Member, p: Pick<Listing, 'owner' | 'tier'>, manager = false) { return manager || (p.owner === me.id && canView(me, p)); }
export function normalizeProperty(p: Record<string, unknown>) {
    const name = String(p.name ?? '').trim(), area = String(p.area ?? '').trim();
    const rent = Number(p.rent), size = Number(p.size), bedrooms = Number(p.bedrooms), tier = Number(p.tier);
    if (!name || name.length > 160 || !area || area.length > 160 || !Number.isInteger(rent) || rent < 1 || rent > 10000000 || !Number.isFinite(size) || size < 1 || size > 10000 || !Number.isInteger(bedrooms) || bedrooms < 0 || bedrooms > 20 || !Number.isInteger(tier) || tier < 1 || tier > 5 || !['Available', 'Reserved', 'Rented', 'Inactive'].includes(String(p.status)))
        return null;
    if (!Array.isArray(p.photos) || p.photos.length < 1 || p.photos.length > 6 || p.photos.some(x => typeof x !== 'string' || !/^[a-f0-9-]{36}$/.test(x)))
        return null;
    return { name, area, rent, size, bedrooms, tier, status: String(p.status), photos: p.photos as string[] };
}
export function normalizeMember(p: Record<string, unknown>) {
    const id = String(p.id ?? '').trim(), email = String(p.email ?? '').trim().toLowerCase(), team = String(p.team ?? ''), tier = Number(p.tier), score = Number(p.score), note = String(p.note ?? '').trim();
    if (!/^[A-Z][1-9][0-9]{0,3}$/.test(id) || id === 'M1' || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254 || !/^[A-Z]$/.test(team) || !Number.isInteger(tier) || tier < 1 || tier > 5 || !Number.isInteger(score) || score < 0 || score > 100 || !note || note.length > 500)
        return null;
    return { id, email, team, tier, score, note };
}
