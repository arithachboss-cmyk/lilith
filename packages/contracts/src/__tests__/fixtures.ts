/**
 * The example payloads of Blueprint v1.0 §18 (and §9.7, §10.2, §16.2), copied
 * from the document. Where the blueprint writes "…", a concrete value of the
 * same kind stands in. A schema must parse each one and give back every
 * member, so a member the schema forgot shows up as a failed comparison.
 */

const AT = "2026-09-07T10:22:31Z";

// ---- §18.0 -----------------------------------------------------------------

export const errorEnvelope = {
  error: {
    code: "DEAL_TRANSITION_NOT_ALLOWED",
    message_en: "This deal cannot move from VIEWING_REQUESTED to DEAL_CLOSED.",
    message_th:
      "ดีลนี้ไม่สามารถเปลี่ยนสถานะจาก VIEWING_REQUESTED เป็น DEAL_CLOSED ได้",
    field_errors: { amount: "must be greater than 0" },
    request_id: "req_01JABCDEFGHJKMNPQRSTVWXYZ0",
    retryable: false,
  },
};

// ---- §18.1 -----------------------------------------------------------------

export const otpRequestBody = {
  channel: "SMS",
  destination: "+66812345678",
  purpose: "LOGIN",
  captcha_token: "turnstile-token",
};

export const otpRequestResponse = {
  challenge_id: "ch_01JABC",
  expires_at: AT,
  resend_after_seconds: 60,
};

export const otpVerifyBody = { challenge_id: "ch_01JABC", code: "482913" };

export const user = {
  id: "usr_01JUSER",
  display_name: "Ari",
  avatar_url: null,
  locale: "th-TH",
  verification_tier: "T2",
  roles: ["OWNER", "CLIENT"],
  created_at: AT,
};

export const otpVerifyResponse = { user, next_step: "SELECT_ROLE" };

// ---- §18.2, §18.3 ----------------------------------------------------------

export const verificationCreateBody = {
  subject_type: "USER",
  subject_id: "usr_01JUSER",
  kind: "NATIONAL_ID",
  document_id: "doc_01JDOC",
};

export const uploadSignBody = {
  purpose: "PROPERTY_PHOTO",
  filename: "unit.jpg",
  mime: "image/jpeg",
  bytes: 2394112,
  sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
};

export const uploadSignResponse = {
  document_id: "doc_01JDOC",
  upload_url: "https://uploads.example.test/put/abc",
  method: "PUT",
  headers: { "content-type": "image/jpeg" },
  expires_at: AT,
  max_bytes: 10485760,
};

// ---- §18.4 -----------------------------------------------------------------

export const propertyPublic = {
  id: "prp_01JPROP",
  reference_code: "MP-2026-000123",
  property_type: "CONDO",
  transaction_types: ["RENT"],
  project_name: "The Line Sukhumvit 71",
  area: { id: "loc_01JLOC", name_th: "พระโขนง", name_en: "Phra Khanong" },
  geo_approx: { lat: 13.7145, lng: 100.596, jitter_m: 150 },
  price: { rent_monthly_amount: 4500000, currency: "THB", negotiable: true },
  size_sqm: 45.5,
  bedrooms: 1,
  bathrooms: 1,
  floor: 18,
  furnishing: "FULLY",
  pet_policy: "NEGOTIABLE",
  available_from: "2026-10-01",
  amenities: ["AMENITY_GYM", "AMENITY_POOL", "AMENITY_COWORK"],
  transit: [{ system: "BTS", station: "Phra Khanong", walk_minutes: 4 }],
  media: [
    {
      url: "https://media.example.test/signed/cover.jpg",
      blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
      kind: "PHOTO",
      is_cover: true,
    },
  ],
  badges: ["OWNERSHIP_VERIFIED", "FAST_RESPONDER", "FRESH_7D"],
  listed_by: {
    type: "AGENT",
    display_name: "K. Ploy",
    org: "Middle Property",
    verified: true,
  },
  published_at: AT,
  last_verified_at: AT,
};

/** §18.4: private = public + the members listed there. */
export const propertyPrivate = {
  ...propertyPublic,
  address_line: "88/123 ซอยสุขุมวิท 71",
  unit_number: "18A",
  geo_point: { lat: 13.71452, lng: 100.59611 },
  documents: [
    {
      document_id: "doc_01JDEED",
      kind: "TITLE_DEED",
      visibility: "ADMIN_ONLY",
    },
  ],
  owner: { user_id: "usr_01JOWNER", display_name: "Khun Somchai" },
  mandate: null,
  quality_flags: ["NO_FLOORPLAN"],
  completion_score: 86,
  version: 3,
};

export const propertySummary = {
  id: "prp_01JPROP",
  reference_code: "MP-2026-000123",
  status: "PUBLISHED",
  property_type: "CONDO",
  transaction_types: ["RENT"],
  project_name: "The Line Sukhumvit 71",
  area: { id: "loc_01JLOC", name_th: "พระโขนง", name_en: "Phra Khanong" },
  price: { rent_monthly_amount: 4500000, currency: "THB", negotiable: true },
  size_sqm: 45.5,
  bedrooms: 1,
  bathrooms: 1,
  media: propertyPublic.media,
  published_at: AT,
};

export const propertyCreateBody = {
  transaction_types: ["RENT"],
  property_type: "CONDO",
};

export const propertyPatchResponse = {
  property: propertyPrivate,
  completion_score: 86,
  missing_for_publish: ["media", "available_from"],
};

export const propertyMediaAddBody = {
  items: [
    { document_id: "doc_01JDOC", kind: "PHOTO", sort_order: 0, is_cover: true },
  ],
};

export const propertyPublishBody = {
  acknowledge_ai_review: true,
  ai_run_id: "air_01JRUN",
};

// ---- §18.5 -----------------------------------------------------------------

export const requirement = {
  id: "req_01JREQ",
  status: "ACTIVE",
  transaction_type: "RENT",
  property_types: ["CONDO", "APARTMENT"],
  budget: {
    min_amount: 3500000,
    max_amount: 4500000,
    flex_pct: 10,
    currency: "THB",
  },
  locations: [{ id: "loc_01JTHONGLO", name_en: "Thong Lo" }],
  bedrooms: { min: 1, max: 2 },
  size_sqm: { min: 35, max: 60 },
  move_in: { from: "2026-10-01", to: "2026-11-15" },
  lease_months: 12,
  furnishing_pref: "FULLY",
  pet_requirement: "SMALL_PET",
  max_walk_minutes_to_transit: 7,
  preferences: [
    { key: "AMENITY_POOL", importance: "NICE" },
    { key: "HIGH_FLOOR", importance: "BONUS" },
  ],
  special_requirements_text: "ต้องการห้องมุม เงียบ ไม่ติดถนนใหญ่",
  extracted_attributes: {
    corner_unit: true,
    low_noise: true,
    _meta: {
      ai_run_id: "air_01JRUN",
      confidence: 0.78,
      prompt_version: "extract_requirement@4",
    },
  },
  urgency: "WITHIN_1M",
  version: 2,
};

export const requirementSummary = {
  id: requirement.id,
  status: requirement.status,
  transaction_type: requirement.transaction_type,
  property_types: requirement.property_types,
  budget: requirement.budget,
  locations: requirement.locations,
  bedrooms: requirement.bedrooms,
  move_in: requirement.move_in,
  urgency: requirement.urgency,
};

// ---- §18.6, §9.7 -----------------------------------------------------------

export const matchFeedResponse = {
  data: [
    {
      match_id: "mch_01JMATCH",
      score: 87,
      confidence: 0.82,
      band: "EXCEPTIONAL",
      property: propertyPublic,
      top_reasons: [
        {
          code: "WALK_UNDER_TARGET",
          text_th: "เดิน 4 นาทีถึง BTS ทองหล่อ",
          text_en: "4 min walk to BTS Thong Lo",
        },
        {
          code: "IN_TARGET_AREA",
          text_th: "อยู่ในย่านทองหล่อที่ระบุไว้",
          text_en: "Inside your Thong Lo target area",
        },
        {
          code: "OVER_BUDGET_WITHIN_FLEX",
          kind: "TRADEOFF",
          text_th: "สูงกว่างบ 5,000 บาท/เดือน (อยู่ในช่วงยืดหยุ่นที่ตั้งไว้)",
          text_en: "฿5,000/mo over budget — within your 10% flexibility",
        },
      ],
      expires_at: AT,
    },
  ],
  next_cursor: "eyJvIjoyMH0",
  meta: {
    weight_profile: "default_rent_v1@1",
    generated_at: AT,
    total_candidates: 142,
  },
};

export const matchExplanation = {
  score: 87,
  confidence: 0.82,
  weight_profile: "default_rent_v1@1",
  dimension_scores: {
    location: 1.0,
    budget: 0.72,
    bedrooms: 1.0,
    transport: 1.0,
    furnishing: 0.2,
    pets: null,
  },
  matched_constraints: [
    {
      dimension: "location",
      code: "IN_TARGET_AREA",
      score: 1.0,
      text_th: "อยู่ในย่านทองหล่อที่ระบุไว้",
      text_en: "Inside your Thong Lo target area",
    },
    {
      dimension: "transport",
      code: "WALK_UNDER_TARGET",
      score: 1.0,
      params: { station: "BTS Thong Lo", walk_minutes: 4 },
      text_th: "เดิน 4 นาทีถึง BTS ทองหล่อ",
      text_en: "4 min walk to BTS Thong Lo",
    },
  ],
  tradeoffs: [
    {
      dimension: "budget",
      code: "OVER_BUDGET_WITHIN_FLEX",
      score: 0.72,
      params: { over_amount: 500000, over_pct: 5.2 },
      text_th: "สูงกว่างบ 5,000 บาท/เดือน (อยู่ในช่วงยืดหยุ่นที่ตั้งไว้)",
      text_en: "฿5,000/mo over budget — within your 10% flexibility",
    },
  ],
  unmatched_constraints: [
    {
      dimension: "furnishing",
      code: "PARTIAL_NOT_FULL",
      score: 0.2,
      text_th: "ตกแต่งบางส่วน ไม่ใช่ Fully Furnished ตามที่ต้องการ",
      text_en: "Partially furnished, you asked for fully furnished",
    },
  ],
  match_explanation: {
    text_th: "ยูนิตนี้ตรงกับสิ่งที่คุณให้ความสำคัญที่สุด",
    text_en: "This unit matches what matters most to you.",
    source: "AI",
    model: "gpt-4.1-mini",
    prompt_version: "explain_match@3",
    confidence: 0.9,
    generated_at: AT,
    ai_run_id: "air_01JRUN",
  },
};

export const matchInterestBody = {
  super: false,
  note: "สนใจครับ ขอเข้าชมสัปดาห์หน้า",
};

export const matchInterestResponse = {
  match: { status: "MUTUAL" },
  mutual: true,
  deal_room_id: "drm_01JROOM",
};

// ---- §18.7 -----------------------------------------------------------------

export const viewing = {
  id: "vw_01JVIEW",
  status: "CONFIRMED",
  slots: [
    {
      id: "slt_01JSLOT",
      starts_at: "2026-09-10T03:00:00Z",
      ends_at: "2026-09-10T04:00:00Z",
      selected: true,
    },
  ],
  scheduled_at: "2026-09-10T03:00:00Z",
  duration_minutes: 60,
  location_note: "Lobby ชั้น G",
  attendees: [{ name: "Khun Nok", role: "CLIENT" }],
  requested_by_user_id: "usr_01JCLIENT",
  confirmed_by_user_id: "usr_01JAGENT",
  completed_at: null,
  version: 2,
};

export const offerCreateBody = {
  amount: 4200000,
  currency: "THB",
  terms: {
    lease_months: 12,
    deposit_months: 2,
    advance_months: 1,
    furniture_included: true,
    move_in_date: "2026-10-15",
  },
  expires_at: "2026-09-12T17:00:00Z",
};

export const offer = {
  id: "ofr_01JOFFER",
  sequence: 1,
  side: "DEMAND",
  type: "INITIAL",
  ...offerCreateBody,
  status: "SUBMITTED",
  parent_offer_id: null,
  offered_by_user_id: "usr_01JCLIENT",
  created_at: AT,
};

export const deal = {
  id: "del_01JDEAL",
  reference_code: "MP-DEAL-2026-000042",
  status: "VIEWING_CONFIRMED",
  version: 7,
  property: propertySummary,
  requirement: requirementSummary,
  participants: [
    {
      user_id: "usr_01JAGENT",
      display_name: "K. Ploy",
      role: "LISTING_AGENT",
      can_negotiate: true,
      can_close: true,
      contact: { phone: "+66812345678", line_id: "kploy" },
    },
  ],
  current_viewing: viewing,
  current_offer: null,
  allowed_transitions: ["VIEWING_COMPLETED", "VIEWING_REQUESTED", "CANCELLED"],
  unread_messages: 3,
  opened_at: AT,
  updated_at: AT,
};

export const dealTransitionBody = {
  to: "VIEWING_CONFIRMED",
  payload: { selected_slot_id: "slt_01JSLOT", location_note: "Lobby ชั้น G" },
  reason: null,
};

export const dealTransitionResponse = {
  deal,
  transition: {
    from: "VIEWING_REQUESTED",
    to: "VIEWING_CONFIRMED",
    occurred_at: AT,
  },
  events_emitted: ["viewing.confirmed"],
};

export const messageCreateBody = {
  body: "สะดวกวันเสาร์ไหมครับ",
  attachments: ["doc_01JDOC"],
};

export const viewingCreateBody = {
  slots: [
    { starts_at: "2026-09-10T03:00:00Z", ends_at: "2026-09-10T04:00:00Z" },
  ],
  attendees: [{ name: "Khun Nok", role: "CLIENT" }],
  note: "",
};

export const agreementCreateBody = {
  document_id: "doc_01JLEASE",
  type: "LEASE",
  signers: [{ user_id: "usr_01JCLIENT", method: "UPLOAD_SIGNED" }],
};

export const dealCloseBody = {
  transaction_value_amount: 125000000000,
  currency: "THB",
  closed_at: "2026-09-30",
  evidence_document_id: "doc_01JEVIDENCE",
};

export const dealCloseResponse = {
  deal: {
    status: "AGREEMENT_SIGNED",
    close_confirmations: [{ user_id: "usr_01JAGENT", at: AT }],
  },
  awaiting_confirmation_from: ["usr_01JCLIENT"],
};

export const dealCancelBody = {
  reason_code: "PRICE",
  reason_text: "",
};

// ---- §18.8 -----------------------------------------------------------------

export const dealFeeResponse = {
  fee: {
    id: "fee_01JFEE",
    status: "ISSUED",
    transaction_value_amount: 125000000000,
    fee_basis: "TRANSACTION_VALUE",
    fee_basis_amount: 125000000000,
    fee_rate_bp: 10,
    fee_amount: 125000000,
    vat_amount: 8750000,
    total_amount: 133750000,
    currency: "THB",
    payer: { user_id: "usr_01JOWNER", display_name: "Khun Somchai" },
    rule: { code: "middle_success_fee", version: 1 },
    computed_at: AT,
  },
  invoice: {
    id: "inv_01JINV",
    invoice_number: "MP-INV-2026-000042",
    status: "ISSUED",
    due_at: AT,
    pdf_url: "https://files.example.test/signed/invoice.pdf",
  },
  payments: [],
  receipt: null,
};

export const paymentCreateBody = {
  method: "BANK_TRANSFER",
  amount: 133750000,
  paid_at: AT,
  reference: "KBANK-20260930-0001",
  evidence_document_id: "doc_01JSLIP",
};

// ---- §10.2, §18.9 ----------------------------------------------------------

export const aiMeta = {
  ai_run_id: "air_01JRUN",
  task: "extract_property",
  model: "gpt-4.1-mini",
  prompt_version: "extract_property@4",
  confidence: 0.86,
  input_ref: { property_id: "prp_01JPROP", input_hash: "sha256:abc123" },
  generated_at: AT,
  status: "OK",
  latency_ms: 1840,
  cost_micro_usd: 2100,
  human_override: null,
};

export const aiExtractPropertyBody = {
  property_id: "prp_01JPROP",
  text: "คอนโด 1 ห้องนอน 45 ตร.ม. ชั้น 18",
  language: "th",
};

export const aiExtractPropertyResponse = {
  data: {
    fields: {
      bedrooms: { value: 1, confidence: 0.95 },
      size_sqm: { value: 45.5, confidence: 0.9 },
    },
    amenity_codes: ["AMENITY_GYM"],
    red_flags: [],
  },
  meta: aiMeta,
};

export const aiExtractRequirementResponse = {
  data: {
    fields: { bedrooms: { value: 2, confidence: 0.9 } },
    preferences: [{ key: "AMENITY_POOL", value: true, importance: "NICE" }],
    ambiguities: ["ต้องการกี่ห้องน้ำ?"],
  },
  meta: aiMeta,
};

export const aiNormalizeBody = {
  kind: "AMENITY",
  values: ["ฟิตเนส", "the line 71"],
};

export const aiNormalizeResponse = {
  data: {
    normalized: [
      {
        input: "ฟิตเนส",
        code: "AMENITY_GYM",
        confidence: 1.0,
        source: "DICTIONARY",
      },
    ],
  },
  meta: aiMeta,
};

export const aiDealSummaryResponse = {
  data: {
    summary_th: "รอผู้ให้เช่าตอบข้อเสนอ",
    summary_en: "Waiting for the landlord to answer the offer.",
    open_items: [{ code: "AWAITING_COUNTER", text_th: "รอข้อเสนอกลับ" }],
    suggested_actions: [
      { action: "SEND_COUNTER", label_th: "ยื่นข้อเสนอกลับ" },
    ],
    risks: [{ code: "OFFER_EXPIRES_SOON", severity: "HIGH" }],
  },
  meta: aiMeta,
};

export const aiDetectDuplicateResponse = {
  data: {
    candidates: [
      {
        property_id: "prp_01JOTHER",
        similarity: 0.94,
        is_duplicate: true,
        evidence: ["same unit number", "cover photo pHash distance 3"],
      },
    ],
  },
  meta: aiMeta,
};

export const aiPropertyReviewResponse = {
  data: {
    quality_score: 78,
    missing: ["floorplan"],
    suggestions: [
      {
        field: "description",
        reason: "Too short to describe the unit",
        proposed_th: "คอนโดหนึ่งห้องนอน วิวเมือง ใกล้ BTS พระโขนง",
      },
    ],
    duplicate_candidates: [],
    policy_flags: [],
  },
  meta: aiMeta,
};

// ---- §18.10 ----------------------------------------------------------------

export const insightsResponse = {
  panels: [
    {
      code: "DEMAND_PRESSURE",
      area: "Thong Lo",
      value: 2.4,
      unit: "requirements_per_listing",
      trend: "+12%",
    },
    { code: "ASKING_VS_AGREED", median_gap_pct: -6.2, sample_size: 31 },
    { code: "DAYS_TO_FIRST_INTEREST", median: 4, sample_size: 58 },
    {
      code: "UNMET_DEMAND_ATTRIBUTES",
      items: [
        { attribute: "PET_FRIENDLY", demand_share: 0.31, supply_share: 0.11 },
      ],
    },
  ],
  suppressed_panels: ["AGREED_PRICE_BY_PROJECT"],
  suppression_reason: "sample_below_k10",
};

export const healthResponse = {
  status: "ok",
  db: "ok",
  queue: "not_configured",
  ai: "not_configured",
  version: "1f37e29",
};

// ---- §16.2 -----------------------------------------------------------------

export const eventEnvelope = {
  event_name: "interest_expressed",
  occurred_at: "2026-09-07T10:22:31.412Z",
  user_id: "usr_01JCLIENT",
  anonymous_id: "anon_7f3a",
  session_id: "ses_91bc",
  role: "CLIENT",
  source: "WEB",
  schema_version: 1,
  subject_type: "MATCH",
  subject_id: "mch_01JMATCH",
  props: {
    side: "DEMAND",
    action: "INTERESTED",
    score: 87,
    position_in_deck: 3,
  },
};
