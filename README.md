# Lilith Homes International Real Estate Pipeline

ระบบรับและจัดการ lead อสังหาไทยสำหรับลูกค้าไทย จีน อังกฤษ และรัสเซีย รองรับเช่า ซื้อ ขาย/listing และ China agent referral พร้อม public form, dashboard, SEO on-page และ CSV/JSON import API

## Production

- Public rental brief: `https://lilith-renter-leads.yacht369.chatgpt.site`
- Private operator dashboard: `https://lilith-renter-leads.yacht369.chatgpt.site/dashboard`

หน้า public รับโจทย์ลูกค้าโดยไม่ต้องล็อกอิน ส่วนรายชื่อลูกค้า การ export การ import และเครื่องมือหลังบ้านต้องผ่าน ChatGPT sign-in หรือ import token

## Current Scope

- Multilingual public intake: Thai, Chinese, English and Russian
- Real estate brief types: rent 12-month, buy condo, sell/list property and China agent referral
- Contact, WeChat, customer country, language, budget period, area, property type and bedrooms
- Required 12-month lease confirmation for monthly rental leads
- UTM source/campaign/content tracking
- D1-backed lead storage with protected read access
- Protected `/api/import` for JSON, CSV and Excel-exported lead files
- Priority scoring, protected stage updates, next follow-up scheduling, multilingual response scripts and CSV export
- Campaign copy for China brokers, Xiaohongshu, Russian relocation, expat, corporate relocation, portals and referrals
- Thai/English social sharing preview
- DBD planning, acquisition plan, bug analysis, project report and slide deck deliverables

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

- `docs/IMPORT_API.md`: JSON/CSV import contract and Excel header template
- `docs/DBD_BUSINESS_STRUCTURE.md`: business structure draft for DBD planning
- `docs/ONLINE_ACQUISITION_PLAN.md`: online acquisition strategy and weekly plan
- `docs/BUG_ANALYSIS.md`: expected bugs and verification notes
- `docs/PROJECT_REPORT.md`: project implementation report
- `deliverables/LILITH_HOMES_DELIVERABLES.md`: final deliverables index
- `LAUNCH_TODAY.md`: tracked links and launch sequence
- `OUTREACH_PACK.md`: Thai/English outreach and follow-up copy
- `PARTNER_PIPELINE.csv`: prioritized company-level partner contacts and tracked links
- `PARTNER_OUTREACH.md`: permission-aware partner launch sequence and message templates
- `OUTBOUND_DRAFTS.md`: personalized Priority A drafts ready for sender details and approval
- `ACQUISITION_PLAYBOOK.md`: qualification, funnel and response standard

The system is ready to receive qualified briefs. A lead is counted only after contact/WeChat, target budget, area, property type, language and intent are confirmed.
