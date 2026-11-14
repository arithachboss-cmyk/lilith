# ADR-0019 — Geo tables and the station seed: how DB-003 reads the blueprint

Status: proposed; owner review pending.
Date: 2026-11-14

## Context

On 2026-11-14 the owner asked for a "vertical slice" and chose the feature "ค้นหาทำเลและสถานี (แนะนำ)": search for locations and transit stations. The slice is two tasks and two pull requests.

- **DB-003** (this ADR): the tables of §8.2.2, the seed of stations and areas, and `nearestStations`.
- **SLICE-001** (after DB-003 is merged): the search service in core, the two geo routes of §18.10 and a search section on the foundation page. It is the search part of API-004.

DB-003 asks for stations "seeded with real coordinates" and a distance test with a tolerance of 50 metres. The blueprint does not say where the coordinates come from, which 24 stations are meant, or what the centre of an area is. The owner decided those points; the remaining readings are this ADR's.

### The owner's answers

Each answer was picked in a question form. Questions and answers are copied as they were shown. Every option the owner picked was the one marked as recommended.

1. Q: แหล่งพิกัดสถานีและทำเล: แบบแปลนกำหนดให้ใช้พิกัดจริง ผมจะไม่ใช้ตัวเลขจากความจำ คุณต้องการให้ใช้ข้อมูลจากที่ใด?
   A: ใช้ Wikidata (แนะนำ)
2. Q: ชุดสถานีตั้งต้น: แบบแปลนระบุ 24 สถานี BTS/MRT ช่วงอ่อนนุชถึงอารีย์ แต่ไม่ได้ระบุชื่อ ช่วงนั้นของ BTS สายสุขุมวิทมี 15 สถานี คุณต้องการให้อีก 9 สถานีเป็นสถานีใด?
   A: MRT พระราม 9 ถึงหัวลำโพง (แนะนำ)
3. Q: การเข้าถึง: เส้นทางค้นหาทำเลและสถานีตอบเฉพาะข้อมูลอ้างอิงที่เปิดเผยทั่วไป (ชื่อย่าน ชื่อและตำแหน่งสถานี) และระบบล็อกอินยังไม่มี คุณต้องการให้เส้นทางสองเส้นนี้เปิดให้ใช้โดยไม่ต้องล็อกอินหรือไม่?
   A: ไม่ต้องล็อกอิน (แนะนำ)
4. Q: การแสดงระยะถึงสถานี: ระบบคำนวณได้เฉพาะระยะเส้นตรง ไม่ใช่ระยะเดินจริงตามถนน และแบบแปลนไม่ได้กำหนดวิธีแปลงเป็นเวลาเดิน คำอ้างแบบ "เดิน 4 นาทีถึง BTS" เป็นคำอ้างต่อผู้บริโภค คุณต้องการให้หน้าค้นหาแสดงอย่างไร?
   A: ระยะเส้นตรงเป็นเมตร (แนะนำ)
5. Q: พิกัดจาก Wikidata ละเอียดพอเพียง 15 จาก 24 สถานี อีก 9 สถานี (รวมทองหล่อ) คลาดเคลื่อนได้ 50–100 เมตรหรือมากกว่า ซึ่งไม่ผ่านเกณฑ์ 50 เมตรของแบบแปลน คุณต้องการให้แก้อย่างไร?
   A: ใช้ข้อมูลเปิดกระทรวงคมนาคม (แนะนำ)
6. Q: จุดกึ่งกลางของย่านทั้งสาม (ทองหล่อ อารีย์ อ่อนนุช): ย่านเหล่านี้ไม่มีขอบเขตทางการ และพิกัดย่านใน Wikidata ใช้ไม่ได้ทั้งหมด คุณต้องการให้จุดกึ่งกลางของแต่ละย่านคือจุดใด?
   A: สถานี BTS ชื่อเดียวกัน (แนะนำ)

Answers 3 and 4 concern SLICE-001 and are recorded here so that they stay with the others.

## Decision

### 1. Scope

- DB-003 creates `locations` and `transit_stations`, seeds them, and provides `nearestStations`.
- `property_transit` is in the card's title and is not created here. It refers to `properties`, which arrives with DB-004 (`0005_property`). The card's acceptance criteria and tests do not mention it.
- API-004 stays open for what it adds beyond search: recomputing `property_transit` and the amenities route.

### 2. Where the station positions come from

- Wikidata was tried first (answer 1). It states 15 of the 24 positions to an arc second or better. It gives the other 9 to three or four decimals, among them Thong Lo, the station the card's test names. The owner then chose the Ministry of Transport's open data (answer 5).
- The source is the dataset "ชื่อสถานีและเส้นทางรถไฟฟ้า" of the Department of Rail Transport (กรมการขนส่งทางราง), at `https://datagov.mot.go.th/dataset/rail_station`. The file was last changed on 2026-09-23 and was read on 2026-11-14 through the catalogue's API. `packages/db/seed/stations.ts` records this.
- What was checked before using it:
  - all 24 stations are present and marked as open;
  - every coordinate has six to eight decimals;
  - at the 13 elevated BTS stations that Wikidata places precisely, the two sources are 3 to 16 metres apart;
  - at the 2 MRT stations that Wikidata places precisely, they are 82 metres (Phra Ram 9) and 144 metres (Si Lom) apart. Both stations are underground and about 200 metres long, and each source marks one point. Which point is nearer the middle is not settled.
- **Terms of use.** The catalogue labels the dataset "Open Data Common", classes it as public data ("ข้อมูลสาธารณะ") and gives its access condition as "ไม่มี" (none). It links no licence text, and that label is not among the licences this catalogue lists. The record is copied from the department's own catalogue (`drt.gdcatalog.go.th`), which was not read. This ADR does not judge whether that is enough for a commercial product; it is an open risk for the owner.
- Codes, names and coordinates are the source's own, copied into the seed by a script, not typed.
  - The source calls the lines "Light green" and "Blue". The seed stores `Sukhumvit` and `Blue`, the operators' names.
  - Two names differ from the source. E5 is "พร้อมพงษ์", as the operator writes it; the source has "พร้อมพงศ์". BL23 is "Queen Sirikit National Convention Centre"; the source's English name is cut short.

### 3. Which stations and which places

- The 24 stations of §22.4 are the 15 BTS Sukhumvit line stations from On Nut to Ari and the 9 MRT Blue line stations from Phra Ram 9 to Hua Lamphong (answer 2).
- The 3 areas of §22.4 are Thong Lo, Ari and On Nut. The centre of each is the BTS station that carries its name (answer 6). No area has a boundary.
- The areas sit under Bangkok, and Bangkok under Thailand, so that the hierarchy of §8.2.2 has a root. The points of those two rows are the coordinates Wikidata gives for them. They mark the place and are not meant for measuring.
- No district or subdistrict is seeded.

### 4. The migration

- The folder is `0004_geo`, the number the card gives. `0002` and `0003` do not exist yet.
  - Tried by hand: `prisma migrate deploy` applies an earlier-numbered migration that is added after a later one.
  - So a database migrated today receives `0002` and `0003` later, and a new database receives all of them in number order. `0004_geo` therefore relies on `0001_extensions` only.
  - The trigger function `set_updated_at()` is shared by every table. It is written with `CREATE OR REPLACE`, and DB-001 must write it the same way.
- Both tables carry `created_at` and `updated_at` (§8 conventions), with the trigger. They carry no `deleted_at` or `version`: §8.2.2 lists neither.
- `centroid` is required and `boundary` is optional, as §8.2.2 writes them.
- Constraints the blueprint does not name:
  - a slug is lower-case letters, digits and single hyphens;
  - a name, line or code is not empty and has no space at either end;
  - a location is not its own parent;
  - `(system, line, code)` is unique, so a search never lists a station twice.
- Not enforced by the database: that a parent's level is above its child's, that a longer chain does not loop, and that only a country has no parent.
- Trigram indexes on the two names of a location are created here. They serve the search of API-004, and adding them now avoids a second migration for the same table.
- `schema.prisma` now describes both tables. PostGIS columns are `Unsupported` there, so every query that reads or writes a position is SQL.

### 5. `nearestStations`

- It lives in the database package: `client.geo.nearestStations(origin, radiusMeters, { limit })`.
- It needs no actor. Locations and stations are public reference data, the same for everyone. This is a short list of named reads, not a way to query other tables without an actor (ADR-0017 §5 still holds).
- The distance is the straight line on the WGS 84 ellipsoid, in whole metres.
- A station is in the answer when its exact distance is within the radius. The order is by exact distance, then system, line and code.
- The radius is a whole number from 1 to 50,000, as the contract's `StationsQuery` has it. The answer holds at most 50 stations unless a limit is given, and never more than 200; these two numbers are this ADR's.
- A station is one point, and its platforms are 150 metres long or more. A distance to a station is therefore good to about 100 metres, and less at an underground station. It is not a walking distance.

### 6. The seed

- `pnpm db:seed` exists now. DB-011 owns that command; here it writes the reference data only.
- The reference data is real, so it suits every environment. DB-011 adds the synthetic world and must keep that part out of production.
- A seed row's id is the version-5 UUID of its natural key inside one fixed namespace (DB-011: "fixed UUID namespace").
- The seed runs in one transaction. A row that already holds the same values is not written again, and no row is ever deleted.

## Enforcement

- 119 new tests in `packages/db`, 28 without a database and 91 against PostgreSQL; `pnpm test:db` runs them.
  - Schema: columns, types, enums, indexes and the foreign key are compared with lists written out in the test, and each constraint is shown to refuse a bad row.
  - `prisma migrate diff` between the migrated database and `schema.prisma` must be empty.
  - Seed: 24 stations and 3 areas; a second run changes no row; a renamed or moved row is put back; a blocked run writes nothing.
  - Every seed station is compared with Wikidata's position for it: within 50 metres at the 13 precisely placed elevated stations, within 150 metres at the others.
  - Known distances from Thong Lo station to six fixed points, computed with Karney's algorithm outside PostGIS, hold to half a metre. The card asks for 50.
  - From six origins, the stations within 1,500 metres and their order equal an independent calculation written in the test.
- The foundation workflow gains `pnpm db:seed`.

## Consequences

- Thai search depends on the database's locale. Under the `C` locale `pg_trgm` finds no trigrams in Thai text. A test checks the local database; a hosted database must be checked when it is chosen.
- The station positions are a copy of one file. A new station, a renamed one or a corrected position needs a new seed; nothing refreshes it.
- The health route of SKEL-001 calls the database `ok` when the five extensions are installed. It does not notice a database that lacks `0004_geo`. OPS-003 owns that check.
- An interchange served by two lines of one system could be stored once per line. The seed stores Siam once, on the Sukhumvit line.
- Display wording for distances is decided in SLICE-001, within answer 4: a straight-line distance in metres, with no walking time.
