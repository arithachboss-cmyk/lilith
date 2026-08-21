# Lilith Homes Premium Rental Pipeline

ระบบรับและจัดการลูกค้าเช่ากรุงเทพสำหรับงบ 50,000-250,000 บาทต่อเดือน และสัญญา 12 เดือน

## Production

- Public rental brief: `https://lilith-renter-leads.yacht369.chatgpt.site`
- Private operator dashboard: `https://lilith-renter-leads.yacht369.chatgpt.site/dashboard`

หน้า public รับโจทย์จากผู้เช่าโดยไม่ต้องล็อกอิน ส่วนรายชื่อลูกค้า การ export และเครื่องมือหลังบ้านต้องผ่าน ChatGPT sign-in

## Current Scope

- Premium renter brief with contact, budget, area, property type and bedrooms
- Required 12-month lease confirmation and monthly budget gate
- Move-in date, viewing window, language, pets and must-have requirements
- UTM source/campaign/content tracking
- D1-backed lead storage with protected read access
- Priority scoring, protected stage updates, next follow-up scheduling, response scripts and CSV export
- Campaign copy for expat, corporate relocation, premium Facebook groups, portals and referrals
- Thai/English social sharing preview
- Launch plan and outreach pack for qualified premium leads

## Local Development

```sh
pnpm install
pnpm dev
```

Build and tests:

```sh
pnpm test
pnpm lint
```

## Operating Documents

- `LAUNCH_TODAY.md`: tracked links and launch sequence
- `OUTREACH_PACK.md`: Thai/English outreach and follow-up copy
- `ACQUISITION_PLAYBOOK.md`: qualification, funnel and response standard

The system is ready to receive qualified briefs. A customer is counted only after real contact details, target budget and a 12-month lease are confirmed.
