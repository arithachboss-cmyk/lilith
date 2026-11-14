import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import * as d from "../dto/index";
import * as fixtures from "./fixtures";

/**
 * Round trip: the schema accepts the example, gives back every member of it,
 * and does so again after a trip through JSON text.
 */
function expectRoundTrip(schema: z.ZodType, example: unknown): void {
  const parsed = schema.parse(example);
  expect(parsed).toEqual(example);
  expect(schema.parse(JSON.parse(JSON.stringify(parsed)))).toEqual(example);
}

describe("blueprint examples round-trip through their schemas", () => {
  const cases: [string, z.ZodType, unknown][] = [
    ["OtpRequestBody", d.OtpRequestBody, fixtures.otpRequestBody],
    ["OtpRequestResponse", d.OtpRequestResponse, fixtures.otpRequestResponse],
    ["OtpVerifyBody", d.OtpVerifyBody, fixtures.otpVerifyBody],
    ["OtpVerifyResponse", d.OtpVerifyResponse, fixtures.otpVerifyResponse],
    ["UserDTO", d.UserDTO, fixtures.user],
    [
      "VerificationCreateBody",
      d.VerificationCreateBody,
      fixtures.verificationCreateBody,
    ],
    ["UploadSignBody", d.UploadSignBody, fixtures.uploadSignBody],
    ["UploadSignResponse", d.UploadSignResponse, fixtures.uploadSignResponse],
    ["PropertyPublicDTO", d.PropertyPublicDTO, fixtures.propertyPublic],
    ["PropertyPrivateDTO", d.PropertyPrivateDTO, fixtures.propertyPrivate],
    ["PropertySummaryDTO", d.PropertySummaryDTO, fixtures.propertySummary],
    ["PropertyCreateBody", d.PropertyCreateBody, fixtures.propertyCreateBody],
    [
      "PropertyPatchResponse",
      d.PropertyPatchResponse,
      fixtures.propertyPatchResponse,
    ],
    [
      "PropertyMediaAddBody",
      d.PropertyMediaAddBody,
      fixtures.propertyMediaAddBody,
    ],
    [
      "PropertyPublishBody",
      d.PropertyPublishBody,
      fixtures.propertyPublishBody,
    ],
    ["RequirementDTO", d.RequirementDTO, fixtures.requirement],
    [
      "RequirementSummaryDTO",
      d.RequirementSummaryDTO,
      fixtures.requirementSummary,
    ],
    ["MatchFeedResponse", d.MatchFeedResponse, fixtures.matchFeedResponse],
    [
      "MatchExplanationResponse",
      d.MatchExplanationResponse,
      fixtures.matchExplanation,
    ],
    ["MatchInterestBody", d.MatchInterestBody, fixtures.matchInterestBody],
    [
      "MatchInterestResponse",
      d.MatchInterestResponse,
      fixtures.matchInterestResponse,
    ],
    ["ViewingDTO", d.ViewingDTO, fixtures.viewing],
    ["OfferCreateBody", d.OfferCreateBody, fixtures.offerCreateBody],
    ["OfferDTO", d.OfferDTO, fixtures.offer],
    ["DealDTO", d.DealDTO, fixtures.deal],
    ["DealTransitionBody", d.DealTransitionBody, fixtures.dealTransitionBody],
    [
      "DealTransitionResponse",
      d.DealTransitionResponse,
      fixtures.dealTransitionResponse,
    ],
    ["MessageCreateBody", d.MessageCreateBody, fixtures.messageCreateBody],
    ["ViewingCreateBody", d.ViewingCreateBody, fixtures.viewingCreateBody],
    [
      "AgreementCreateBody",
      d.AgreementCreateBody,
      fixtures.agreementCreateBody,
    ],
    ["DealCloseBody", d.DealCloseBody, fixtures.dealCloseBody],
    ["DealCloseResponse", d.DealCloseResponse, fixtures.dealCloseResponse],
    ["DealCancelBody", d.DealCancelBody, fixtures.dealCancelBody],
    ["DealFeeResponse", d.DealFeeResponse, fixtures.dealFeeResponse],
    ["PaymentCreateBody", d.PaymentCreateBody, fixtures.paymentCreateBody],
    ["AiMeta", d.AiMeta, fixtures.aiMeta],
    [
      "AiExtractPropertyBody",
      d.AiExtractPropertyBody,
      fixtures.aiExtractPropertyBody,
    ],
    [
      "AiExtractPropertyResponse",
      d.AiExtractPropertyResponse,
      fixtures.aiExtractPropertyResponse,
    ],
    [
      "AiExtractRequirementResponse",
      d.AiExtractRequirementResponse,
      fixtures.aiExtractRequirementResponse,
    ],
    ["AiNormalizeBody", d.AiNormalizeBody, fixtures.aiNormalizeBody],
    [
      "AiNormalizeResponse",
      d.AiNormalizeResponse,
      fixtures.aiNormalizeResponse,
    ],
    [
      "AiDealSummaryResponse",
      d.AiDealSummaryResponse,
      fixtures.aiDealSummaryResponse,
    ],
    [
      "AiDetectDuplicateResponse",
      d.AiDetectDuplicateResponse,
      fixtures.aiDetectDuplicateResponse,
    ],
    [
      "AiPropertyReviewResponse",
      d.AiPropertyReviewResponse,
      fixtures.aiPropertyReviewResponse,
    ],
    ["InsightsResponse", d.InsightsResponse, fixtures.insightsResponse],
  ];

  it.each(cases)("%s", (_name, schema, example) => {
    expectRoundTrip(schema, example);
  });

  it("keeps every schema used above under its own name", () => {
    for (const [name, schema] of cases) expect(d.schemaId(schema)).toBe(name);
  });
});

describe("property DTO separation (§18.4)", () => {
  const PRIVATE_ONLY = [
    "address_line",
    "unit_number",
    "geo_point",
    "documents",
    "owner",
    "mandate",
    "quality_flags",
    "completion_score",
    "version",
  ];
  const publicKeys = Object.keys(d.PropertyPublicDTO.shape);
  const privateKeys = Object.keys(d.PropertyPrivateDTO.shape);

  it("private is public plus exactly the members §18.4 lists", () => {
    expect([...d.PROPERTY_PRIVATE_ONLY_FIELDS]).toEqual(PRIVATE_ONLY);
    expect(privateKeys.sort()).toEqual([...publicKeys, ...PRIVATE_ONLY].sort());
  });

  it("the public DTO has no private member, and no contact or exact position", () => {
    for (const key of PRIVATE_ONLY) expect(publicKeys).not.toContain(key);
    for (const key of publicKeys)
      expect(key).not.toMatch(
        /phone|email|line_id|contact|address|unit|document/,
      );
  });

  it("parsing a private listing as public strips every private value", () => {
    const stripped = d.PropertyPublicDTO.parse(fixtures.propertyPrivate);
    expect(stripped).toEqual(fixtures.propertyPublic);
    const text = JSON.stringify(stripped);
    for (const secret of [
      fixtures.propertyPrivate.address_line,
      fixtures.propertyPrivate.unit_number,
      String(fixtures.propertyPrivate.geo_point.lat),
      fixtures.propertyPrivate.owner.user_id,
      fixtures.propertyPrivate.owner.display_name,
      fixtures.propertyPrivate.documents[0]?.document_id ?? "",
    ]) {
      expect(secret.length).toBeGreaterThan(0);
      expect(text).not.toContain(secret);
    }
  });

  it("the summary holds public members and the status only", () => {
    const summaryKeys = Object.keys(d.PropertySummaryDTO.shape);
    for (const key of summaryKeys)
      expect([...publicKeys, "status"]).toContain(key);
    for (const key of PRIVATE_ONLY) expect(summaryKeys).not.toContain(key);
    const summary = d.PropertySummaryDTO.parse({
      ...fixtures.propertyPrivate,
      status: "PUBLISHED",
    });
    expect(summary).toEqual(fixtures.propertySummary);
    expect(JSON.stringify(summary)).not.toContain(
      fixtures.propertyPrivate.address_line,
    );
  });

  it("the detail response picks the private DTO only when its members are there", () => {
    expect(d.PropertyDetailResponse.parse(fixtures.propertyPrivate)).toEqual(
      fixtures.propertyPrivate,
    );
    expect(d.PropertyDetailResponse.parse(fixtures.propertyPublic)).toEqual(
      fixtures.propertyPublic,
    );
  });

  it("accepts a fresh draft as a private DTO", () => {
    const draft = {
      ...fixtures.propertyPrivate,
      project_name: null,
      area: null,
      geo_approx: null,
      price: { currency: "THB", negotiable: false },
      size_sqm: null,
      bedrooms: null,
      bathrooms: null,
      floor: null,
      furnishing: null,
      pet_policy: null,
      available_from: null,
      amenities: [],
      transit: [],
      media: [],
      badges: [],
      published_at: null,
      last_verified_at: null,
      address_line: null,
      unit_number: null,
      geo_point: null,
      documents: [],
      quality_flags: [],
      completion_score: 5,
      version: 0,
    };
    expectRoundTrip(d.PropertyPrivateDTO, draft);
    // A published listing always has an area, a position and a publish date.
    expect(d.PropertyPublicDTO.safeParse(draft).success).toBe(false);
  });

  it("is a type error to read a private member from the public type", () => {
    const listing: d.PropertyPublicDTO = d.PropertyPublicDTO.parse(
      fixtures.propertyPublic,
    );
    // @ts-expect-error the public type has no address
    expect(listing.address_line).toBeUndefined();
    // @ts-expect-error the public type has no owner
    expect(listing.owner).toBeUndefined();
  });
});

describe("deal DTOs (§18.7)", () => {
  it("contact is optional, and the summary has no participants", () => {
    const withoutContact = {
      ...fixtures.deal,
      participants: fixtures.deal.participants.map((participant) => ({
        user_id: participant.user_id,
        display_name: participant.display_name,
        role: participant.role,
        can_negotiate: participant.can_negotiate,
        can_close: participant.can_close,
      })),
    };
    expectRoundTrip(d.DealDTO, withoutContact);
    const summary = d.DealSummaryDTO.parse(fixtures.deal);
    expect(summary).not.toHaveProperty("participants");
    expect(JSON.stringify(summary)).not.toContain("+66812345678");
  });

  it("knows the 14 states of §11.1", () => {
    expect(d.DealStatus.options).toHaveLength(14);
    expect(d.DealStatus.options).toContain("DEAL_CLOSED");
    expect(
      d.DealDTO.safeParse({ ...fixtures.deal, status: "WON" }).success,
    ).toBe(false);
  });

  it("keeps offer terms the contract does not name", () => {
    const body = {
      ...fixtures.offerCreateBody,
      terms: { ...fixtures.offerCreateBody.terms, option_fee_amount: 5000000 },
    };
    expectRoundTrip(d.OfferCreateBody, body);
  });

  it("requires an offer above zero and at least one viewing slot", () => {
    for (const amount of [0, -1])
      expect(
        d.OfferCreateBody.safeParse({ ...fixtures.offerCreateBody, amount })
          .success,
      ).toBe(false);
    expect(
      d.ViewingCreateBody.safeParse({
        ...fixtures.viewingCreateBody,
        slots: [],
      }).success,
    ).toBe(false);
  });

  it("types every server-sent frame of the deal stream", () => {
    expect(Object.keys(d.DEAL_STREAM_EVENTS).sort()).toEqual(
      [
        "deal.transitioned",
        "heartbeat",
        "message.created",
        "offer.updated",
        "participant.typing",
        "viewing.updated",
      ].sort(),
    );
    expectRoundTrip(d.DEAL_STREAM_EVENTS["deal.transitioned"], {
      from: "VIEWING_REQUESTED",
      to: "VIEWING_CONFIRMED",
      deal: fixtures.deal,
    });
    expectRoundTrip(d.DEAL_STREAM_EVENTS.heartbeat, {
      at: "2026-09-07T10:22:31Z",
    });
  });
});

describe("money on the wire (§18.0)", () => {
  it("is a whole, non-negative JSON number of satang", () => {
    for (const amount of [0, 1, 4500000, 125000000000, Number.MAX_SAFE_INTEGER])
      expect(d.Satang.parse(amount)).toBe(amount);
    for (const amount of [
      4500000.5,
      0.1,
      -1,
      Number.MAX_SAFE_INTEGER + 1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      "4500000",
      4500000n,
      null,
    ])
      expect(d.Satang.safeParse(amount).success, String(amount)).toBe(false);
  });

  it("accepts THB only", () => {
    expect(d.Currency.parse("THB")).toBe("THB");
    for (const currency of ["USD", "thb", "", null])
      expect(d.Currency.safeParse(currency).success).toBe(false);
  });

  it("rejects a float anywhere a price is carried", () => {
    const float = {
      ...fixtures.propertyPublic,
      price: { ...fixtures.propertyPublic.price, rent_monthly_amount: 45000.5 },
    };
    expect(d.PropertyPublicDTO.safeParse(float).success).toBe(false);
    expect(
      d.DealCloseBody.safeParse({
        ...fixtures.dealCloseBody,
        transaction_value_amount: 1250000000.25,
      }).success,
    ).toBe(false);
  });

  it("converts to and from core's bigint without loss", () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: BigInt(Number.MAX_SAFE_INTEGER) }),
        (satang) => {
          const wire = d.toWireAmount(satang);
          return (
            d.Satang.safeParse(wire).success &&
            d.fromWireAmount(wire) === satang &&
            JSON.parse(JSON.stringify(wire)) === wire
          );
        },
      ),
      { numRuns: 10_000 },
    );
    expect(d.toWireAmount(1250050n)).toBe(1250050);
    expect(d.fromWireAmount(1250050)).toBe(1250050n);
  });

  it("refuses amounts JSON cannot carry exactly", () => {
    for (const satang of [
      -1n,
      BigInt(Number.MAX_SAFE_INTEGER) + 1n,
      2n ** 63n - 1n,
    ])
      expect(() => d.toWireAmount(satang)).toThrow(RangeError);
    for (const amount of [-1, 0.5, Number.MAX_SAFE_INTEGER + 1, Number.NaN])
      expect(() => d.fromWireAmount(amount)).toThrow(RangeError);
  });
});

describe("identifiers, time and pagination (§18.0)", () => {
  it("accepts an id only with its own prefix", () => {
    const ids: [z.ZodType, string][] = [
      [d.UserId, "usr"],
      [d.PropertyId, "prp"],
      [d.RequirementId, "req"],
      [d.MatchId, "mch"],
      [d.DealRoomId, "drm"],
      [d.DealId, "del"],
      [d.DocumentId, "doc"],
      [d.FeeId, "fee"],
      [d.InvoiceId, "inv"],
      [d.AiRunId, "air"],
      [d.OtpChallengeId, "ch"],
      [d.ViewingSlotId, "slt"],
      [d.LocationId, "loc"],
    ];
    for (const [schema, prefix] of ids) {
      expect(schema.safeParse(`${prefix}_01JABC`).success, prefix).toBe(true);
      expect(
        schema.safeParse(`${prefix}_0190f6a2-7c1e-7b3a-9d2e-3f4a5b6c7d8e`)
          .success,
        prefix,
      ).toBe(true);
      for (const wrong of [
        `${prefix}_`,
        `${prefix}01JABC`,
        `x${prefix}_01JABC`,
        `${prefix}_01J ABC`,
        `${prefix}_${"a".repeat(65)}`,
        "zzz_01JABC",
        "",
      ])
        expect(schema.safeParse(wrong).success, wrong).toBe(false);
    }
    expect(new Set(ids.map(([, prefix]) => prefix)).size).toBe(ids.length);
  });

  it("takes date-times in UTC only, and real calendar dates", () => {
    for (const value of ["2026-09-07T10:22:31Z", "2026-09-07T10:22:31.412Z"])
      expect(d.Timestamp.parse(value)).toBe(value);
    for (const value of [
      "2026-09-07T10:22:31+07:00",
      "2026-09-07T10:22:31",
      "2026-09-07",
      "2026-02-30T00:00:00Z",
      1788776551,
    ])
      expect(d.Timestamp.safeParse(value).success, String(value)).toBe(false);
    expect(d.DateOnly.parse("2026-10-01")).toBe("2026-10-01");
    for (const value of ["2026-02-30", "01/10/2026", "2026-10-01T00:00:00Z"])
      expect(d.DateOnly.safeParse(value).success, value).toBe(false);
  });

  it("pages with { data, next_cursor }", () => {
    const pageOfUsers = d.page(d.UserDTO);
    expectRoundTrip(pageOfUsers, { data: [fixtures.user], next_cursor: null });
    expectRoundTrip(pageOfUsers, { data: [], next_cursor: "abc" });
    expect(pageOfUsers.safeParse({ data: [] }).success).toBe(false);
    expect(
      pageOfUsers.safeParse({ data: [{}], next_cursor: null }).success,
    ).toBe(false);
  });

  it("reads `limit` from a query string, within bounds", () => {
    const query = z.object(d.pageQuery);
    expect(query.parse({ limit: "20", cursor: "abc" })).toEqual({
      limit: 20,
      cursor: "abc",
    });
    expect(query.parse({})).toEqual({});
    for (const limit of ["0", "101", "2.5", "many", "-1"])
      expect(query.safeParse({ limit }).success, limit).toBe(false);
  });
});

describe("input discipline (§15.3)", () => {
  it("strips unknown members from a request body", () => {
    const parsed = d.OtpRequestBody.parse({
      ...fixtures.otpRequestBody,
      is_admin: true,
    });
    expect(parsed).toEqual(fixtures.otpRequestBody);
  });

  it("bounds free text", () => {
    expect(
      d.MessageCreateBody.safeParse({ body: "x".repeat(5001) }).success,
    ).toBe(false);
    expect(d.MessageCreateBody.safeParse({ body: "" }).success).toBe(false);
    expect(
      d.ProfilePatchBody.safeParse({ display_name: "x".repeat(121) }).success,
    ).toBe(false);
    expect(
      d.DealCancelBody.safeParse({
        reason_code: "OTHER",
        reason_text: "x".repeat(501),
      }).success,
    ).toBe(false);
  });

  it("takes a six-digit code and a known role only", () => {
    for (const code of ["48291", "4829134", "48291a", ""])
      expect(
        d.OtpVerifyBody.safeParse({ ...fixtures.otpVerifyBody, code }).success,
      ).toBe(false);
    expect(d.RoleAddBody.safeParse({ role: "OWNER" }).success).toBe(true);
    for (const role of ["ADMIN", "SUPPORT", "ROOT"])
      expect(d.RoleAddBody.safeParse({ role }).success, role).toBe(false);
  });

  it("requires at least one transaction type on a listing", () => {
    expect(
      d.PropertyCreateBody.safeParse({
        transaction_types: [],
        property_type: "CONDO",
      }).success,
    ).toBe(false);
  });
});

describe("schema registry", () => {
  it("names every schema once, in PascalCase", () => {
    const ids = [...d.namedSchemas().keys()];
    expect(ids.length).toBeGreaterThan(200);
    for (const id of ids) expect(id).toMatch(/^[A-Z][A-Za-z0-9]+$/);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("refuses a second schema under a taken name, and a second name for one schema", () => {
    expect(() => d.dto("UserDTO", z.string())).toThrow(/Duplicate DTO id/);
    expect(() => d.dto("UserDTOAgain", d.UserDTO)).toThrow(/already named/);
    expect(d.namedSchemas().has("UserDTOAgain")).toBe(false);
  });
});
