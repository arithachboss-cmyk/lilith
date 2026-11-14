export const foundationCopy = {
  th: {
    title: "กำลังวางรากฐานแพลตฟอร์ม",
    description:
      "หน้านี้ใช้ตรวจสอบการ build เท่านั้น ระบบประกาศอสังหาริมทรัพย์ การจับคู่ และการทำธุรกรรมยังไม่เปิดใช้งาน",
  },
  en: {
    title: "Platform foundation",
    description:
      "Build verification only. Property listings, matching and transactions are not available yet.",
  },
} as const;

/** The status line of the foundation page (SKEL-001). */
export const systemStatusCopy = {
  th: {
    heading: "สถานะระบบ",
    database: "ฐานข้อมูล",
    queue: "คิวงาน",
    ai: "บริการ AI",
    version: "รุ่นที่กำลังรัน",
    // Says what was checked and no more: the product itself is not open yet.
    overall: {
      ok: "ส่วนที่สร้างแล้วทำงานปกติ",
      degraded: "มีส่วนที่ยังไม่พร้อม",
    },
    state: {
      ok: "เชื่อมต่อแล้ว",
      not_migrated: "เชื่อมต่อได้ แต่ยังไม่ได้ติดตั้งโครงสร้างข้อมูล",
      unreachable: "เชื่อมต่อไม่ได้",
      not_configured: "ยังไม่ได้สร้างส่วนนี้",
    },
  },
  en: {
    heading: "System status",
    database: "Database",
    queue: "Job queue",
    ai: "AI service",
    version: "Running version",
    overall: {
      ok: "Everything built so far is working",
      degraded: "Some parts are not ready",
    },
    state: {
      ok: "Connected",
      not_migrated: "Reachable, but its migrations are not applied",
      unreachable: "Not reachable",
      not_configured: "Not built yet",
    },
  },
} as const;

/** Texts of the API error envelope, by error code. Only codes in use are here. */
export const apiErrorCopy = {
  INTERNAL: {
    th: "ระบบขัดข้อง กรุณาลองใหม่อีกครั้ง",
    en: "Something went wrong on our side. Please try again.",
  },
} as const;
