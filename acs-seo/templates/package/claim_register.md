# Claim Register — {{PACKAGE_ID}}

ทะเบียน claim เฉพาะแพ็กเกจนี้ ต้อง sync กับทะเบียนกลาง `acs-seo/data/claims.json`
ห้ามเพิ่ม claim ใหม่ที่ไม่มีใน register กลางโดยไม่ขึ้นทะเบียนก่อน

| # | ข้อความในบทความ | claim_id | ประเภท | source_id | สถานะหลักฐาน | การตัดสินใจ |
|---|---|---|---|---|---|---|
| 1 | {{ยกข้อความมาตรงตัว}} | {{CLM-XXX-000}} | {{SAFE_WORDING/EVIDENCE_REQUIRED/OWNER_REQUIRED/BLOCKED}} | {{SRC-XXX-000 หรือ —}} | {{SUPPLIED/NOT_SUPPLIED}} | {{KEEP/REVISE/REMOVE}} |

## Claim ที่ถูกลบออกจากดราฟต์
| ข้อความเดิม | เหตุผล | claim_id |
|---|---|---|
| {{...}} | {{...}} | {{...}} |

## สิ่งที่ยังต้องรอ
- [ ] {{source ที่ต้องได้รับก่อนจึงจะกู้ claim กลับมาได้}}
