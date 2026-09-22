<!-- GENERATED โดย tools/render-docs.mjs จาก data/page_inventory.json + data/cannibalization_clusters.json — ห้ามแก้ไฟล์นี้ด้วยมือ -->

# Site Inventory — หน้าเว็บเดิมของ www.asiancoding.com

ณ วันที่ **2026-09-22** — 82 URL จาก sitemap จริง

| ชั้นข้อมูล | สถานะ |
|---|---|
| รายชื่อ URL | FACT — ดึงจาก sitemap.xml จริงเมื่อ 2026-09-22 ตรงกับชุดที่ PR #1 เก็บไว้เมื่อ 2026-09-20 ทั้ง 82 URL ไม่มีขาดไม่มีเกิน |
| ประเภทหน้า + risk flag | RECOMMENDATION — อนุมานจากโครงสร้าง URL โดย PR #1 ยังไม่ได้รับการยืนยันจาก Owner |
| primary intent | NOT_SUPPLIED — ต้องให้ SEO Lead/Owner กำหนดต่อหน้า จึงยังเป็น null ทุกหน้า |

**แยกตามประเภท:** KNOWLEDGE 27 · PRODUCT 23 · LANDING 19 · SERVICE 13

**61 จาก 82 หน้า (74%) ถือ risk flag อย่างน้อยหนึ่งอย่าง**

`CANNIBAL` 34 · `PARTNER` 11 · `SPEC` 8 · `CUSTOMER` 6 · `NUMBERS` 5 · `OWNER` 3 · `EVIDENCE` 2 · `RANKING` 2 · `PRICE` 1

## Cannibalization clusters

> ห้ามเขียนแพ็กเกจใหม่ที่ยิง intent ของ cluster ใด จนกว่า cluster นั้นจะมี canonical_owner ที่ Owner ระบุชื่อแล้ว

**8 cluster · 45 URL · มี canonical owner แล้ว 0**

| Cluster | หน้าที่ชนกัน | จำนวน | canonical owner | คำตัดสิน |
|---|---|---|---|---|
| `C-1` Barcode scanner (generic commercial) | `/barcode-scanners` `/barcode-scanner-thailand` `/เครื่องสแกนบาร์โค้ด` `/industrial-barcode-scanner` `/wireless-barcode-scanner` `/2d-barcode-scanner` `/long-range-barcode-scanner` `/warehouse-barcode-scanner` `/retail-barcode-scanner` `/honeywell-barcode-scanner` | **10** | — | — |
| `C-2` Barcode printer | `/barcode-printers` `/barcode-printer-thailand` `/barcode-label-printer` `/tsc-barcode-printer` `/barcode-printer-buying-guide` `/knowledge/barcode-printer-types` | **6** | — | — |
| `C-3` RFID | `/rfid-systems` `/rfid-reader` `/rfid-warehouse-system` `/rfid-workflow-context` `/brady/scanners-rfid` `/knowledge/rfid-warehouse-implementation` `/knowledge/rfid-technology` | **7** | — | — |
| `C-4` Manufacturing | `/manufacturing` `/industry/manufacturing` `/brady/solutions/manufacturing` `/case-study/manufacturing` `/roi-calculator/manufacturing` | **5** | — | — |
| `C-5` Warehouse / logistics | `/logistics` `/warehouse-data-capture` `/brady/solutions/warehouse-logistics` `/case-study/logistics` `/case-study/warehouse` `/roi-calculator/warehouse` | **6** | — | — |
| `C-6` Retail | `/retail` `/retail-barcode-scanner` `/case-study/retail` `/roi-calculator/retail` | **4** | — | — |
| `C-7` Scanner selection / comparison | `/barcode-scanner-comparison` `/knowledge/product-comparisons` `/knowledge/how-to-choose-barcode-scanner` `/knowledge/wired-vs-wireless-barcode-scanner` `/select-solution` | **5** | — | — |
| `C-8` Partner ecosystem | `/partner-ecosystem-hub` `/why-acs/partner-ecosystem` | **2** | — | — |

- C-1 หนักที่สุด: 10 URL ยิง head term เชิงพาณิชย์เดียวกัน — Queue #3 ที่ Owner สั่ง HOLD อยู่ใน cluster นี้
- C-8 มี 2 URL ที่ดูจะพูดเรื่องเดียวกัน เป็นจุดที่แก้ถูกที่สุดบนบอร์ด — redirect เส้นเดียว

## หน้าทั้งหมด

| # | Path | ประเภท | รูปแบบ | risk flags | changefreq | priority |
|---|---|---|---|---|---|---|
| 1 | `/` | LANDING | Home | — | daily | 1 |
| 2 | `/solutions` | SERVICE | Hub | — | weekly | 0.9 |
| 3 | `/contact` | LANDING | Conversion | — | monthly | 0.9 |
| 4 | `/select-solution` | LANDING | Tool | — | weekly | 0.8 |
| 5 | `/brady` | PRODUCT | Brand hub | `PARTNER` | weekly | 0.8 |
| 6 | `/brady/printers/m510` | PRODUCT | Model page | `PARTNER` `SPEC` | weekly | 0.8 |
| 7 | `/brady/labels` | PRODUCT | Category | `PARTNER` `SPEC` | weekly | 0.8 |
| 8 | `/brady/scanners-rfid` | PRODUCT | Category | `PARTNER` `SPEC` | weekly | 0.8 |
| 9 | `/brady/software` | PRODUCT | Category | `PARTNER` | weekly | 0.8 |
| 10 | `/brady/solutions/manufacturing` | SERVICE | Solution | `PARTNER` `CANNIBAL` | weekly | 0.8 |
| 11 | `/brady/solutions/warehouse-logistics` | SERVICE | Solution | `PARTNER` `CANNIBAL` | weekly | 0.8 |
| 12 | `/pos-barcode-system` | SERVICE | Solution | — | weekly | 0.8 |
| 13 | `/warehouse-data-capture` | SERVICE | Solution | `CANNIBAL` | weekly | 0.8 |
| 14 | `/rfid-workflow-context` | KNOWLEDGE | Explainer | `CANNIBAL` | weekly | 0.8 |
| 15 | `/why-acs` | LANDING | Company | — | monthly | 0.8 |
| 16 | `/why-acs/30-years` | LANDING | Company | `OWNER` | monthly | 0.6 |
| 17 | `/why-acs/service-capability` | SERVICE | Company | `OWNER` | monthly | 0.7 |
| 18 | `/why-acs/partner-ecosystem` | LANDING | Company | `PARTNER` `CANNIBAL` | monthly | 0.7 |
| 19 | `/esg-solutions` | SERVICE | Solution | `EVIDENCE` | weekly | 0.8 |
| 20 | `/retail` | SERVICE | Industry | `CANNIBAL` | weekly | 0.8 |
| 21 | `/logistics` | SERVICE | Industry | `CANNIBAL` | weekly | 0.8 |
| 22 | `/manufacturing` | SERVICE | Industry | `CANNIBAL` | weekly | 0.8 |
| 23 | `/industry/manufacturing` | SERVICE | Industry | `CANNIBAL` | weekly | 0.7 |
| 24 | `/industry/healthcare` | SERVICE | Industry | — | weekly | 0.7 |
| 25 | `/ai-consultant` | SERVICE | Tool | `EVIDENCE` | weekly | 0.8 |
| 26 | `/roi-calculator` | LANDING | Tool | `NUMBERS` | weekly | 0.8 |
| 27 | `/roi-calculator/retail` | LANDING | Tool | `NUMBERS` | monthly | 0.7 |
| 28 | `/roi-calculator/warehouse` | LANDING | Tool | `NUMBERS` | monthly | 0.7 |
| 29 | `/roi-calculator/manufacturing` | LANDING | Tool | `NUMBERS` | monthly | 0.7 |
| 30 | `/roi-calculator/mobility` | LANDING | Tool | `NUMBERS` | monthly | 0.7 |
| 31 | `/case-studies` | LANDING | Hub | `CUSTOMER` | weekly | 0.7 |
| 32 | `/case-study/retail` | LANDING | Case | `CUSTOMER` | monthly | 0.6 |
| 33 | `/case-study/warehouse` | LANDING | Case | `CUSTOMER` | monthly | 0.6 |
| 34 | `/case-study/manufacturing` | LANDING | Case | `CUSTOMER` | monthly | 0.6 |
| 35 | `/case-study/logistics` | LANDING | Case | `CUSTOMER` | monthly | 0.6 |
| 36 | `/case-study/healthcare` | LANDING | Case | `CUSTOMER` | monthly | 0.6 |
| 37 | `/insights` | KNOWLEDGE | Hub | — | weekly | 0.7 |
| 38 | `/revenue-articles` | KNOWLEDGE | Hub | — | weekly | 0.6 |
| 39 | `/leadership` | LANDING | Company | `OWNER` | monthly | 0.5 |
| 40 | `/partner-ecosystem-hub` | LANDING | Company | `PARTNER` `CANNIBAL` | monthly | 0.5 |
| 41 | `/barcode-scanner-thailand` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.9 |
| 42 | `/barcode-printer-thailand` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.9 |
| 43 | `/honeywell-barcode-scanner` | PRODUCT | Brand | `PARTNER` `SPEC` | weekly | 0.9 |
| 44 | `/tsc-barcode-printer` | PRODUCT | Brand | `PARTNER` `SPEC` | weekly | 0.9 |
| 45 | `/rfid-warehouse-system` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.9 |
| 46 | `/เครื่องสแกนบาร์โค้ด` | PRODUCT | Commercial TH | `CANNIBAL` | weekly | 0.9 |
| 47 | `/barcode-label-printer` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.9 |
| 48 | `/wireless-barcode-scanner` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.9 |
| 49 | `/industrial-barcode-scanner` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.9 |
| 50 | `/rfid-reader` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.9 |
| 51 | `/barcode-printers` | PRODUCT | Category | `CANNIBAL` | weekly | 0.8 |
| 52 | `/rfid-systems` | PRODUCT | Category | `CANNIBAL` | weekly | 0.8 |
| 53 | `/barcode-scanner-price-guide` | KNOWLEDGE | Commercial | `PRICE` | weekly | 0.8 |
| 54 | `/barcode-scanners` | PRODUCT | Category | `CANNIBAL` | weekly | 0.9 |
| 55 | `/barcode-ribbons` | PRODUCT | Category | `SPEC` | weekly | 0.8 |
| 56 | `/warehouse-barcode-scanner` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.8 |
| 57 | `/retail-barcode-scanner` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.8 |
| 58 | `/2d-barcode-scanner` | PRODUCT | Commercial | `CANNIBAL` | weekly | 0.8 |
| 59 | `/long-range-barcode-scanner` | PRODUCT | Commercial | `CANNIBAL` `SPEC` | weekly | 0.8 |
| 60 | `/barcode-scanner-comparison` | KNOWLEDGE | Comparison | `RANKING` | weekly | 0.8 |
| 61 | `/barcode-printer-buying-guide` | KNOWLEDGE | Guide | `CANNIBAL` | weekly | 0.8 |
| 62 | `/knowledge` | KNOWLEDGE | Hub | — | weekly | 0.8 |
| 63 | `/knowledge/barcode-technology` | KNOWLEDGE | Cluster hub | — | weekly | 0.7 |
| 64 | `/knowledge/barcode-equipment` | KNOWLEDGE | Cluster hub | `CANNIBAL` | weekly | 0.7 |
| 65 | `/knowledge/rfid-technology` | KNOWLEDGE | Cluster hub | — | weekly | 0.7 |
| 66 | `/knowledge/industry-applications` | KNOWLEDGE | Cluster hub | `CANNIBAL` | weekly | 0.7 |
| 67 | `/knowledge/implementation-best-practices` | KNOWLEDGE | Cluster hub | — | weekly | 0.7 |
| 68 | `/knowledge/regional-solutions` | KNOWLEDGE | Cluster hub | `CANNIBAL` | weekly | 0.7 |
| 69 | `/knowledge/product-comparisons` | KNOWLEDGE | Cluster hub | `RANKING` `CANNIBAL` | weekly | 0.7 |
| 70 | `/knowledge/emerging-trends` | KNOWLEDGE | Cluster hub | — | weekly | 0.7 |
| 71 | `/knowledge/1d-vs-2d-barcode` | KNOWLEDGE | Article | — | monthly | 0.7 |
| 72 | `/knowledge/how-to-choose-barcode-scanner` | KNOWLEDGE | Article | `CANNIBAL` | monthly | 0.7 |
| 73 | `/knowledge/wired-vs-wireless-barcode-scanner` | KNOWLEDGE | Article | `CANNIBAL` | monthly | 0.7 |
| 74 | `/knowledge/barcode-printer-types` | KNOWLEDGE | Article | `CANNIBAL` | monthly | 0.7 |
| 75 | `/knowledge/rfid-vs-barcode` | KNOWLEDGE | Article | — | monthly | 0.7 |
| 76 | `/knowledge/rfid-warehouse-implementation` | KNOWLEDGE | Article | `CANNIBAL` | monthly | 0.7 |
| 77 | `/knowledge/barcode-inventory-management` | KNOWLEDGE | Article | — | monthly | 0.7 |
| 78 | `/knowledge/barcode-system-implementation` | KNOWLEDGE | Article | — | monthly | 0.7 |
| 79 | `/knowledge/barcode-scanner-troubleshooting` | KNOWLEDGE | Article | — | monthly | 0.7 |
| 80 | `/knowledge/barcode-printer-calibration` | KNOWLEDGE | Article | — | monthly | 0.7 |
| 81 | `/knowledge/barcode-label-materials` | KNOWLEDGE | Article | `SPEC` | monthly | 0.7 |
| 82 | `/knowledge/barcode-wms-integration` | KNOWLEDGE | Article | — | monthly | 0.7 |
