import { z } from "zod";
import {
  NextStep,
  OtpChannel,
  OtpPurpose,
  Role,
  SelfServiceRole,
  VerificationTier,
} from "./enums";
import {
  DocumentId,
  Locale,
  MediumText,
  OpaqueId,
  OpenObject,
  OtpChallengeId,
  ShortText,
  Timestamp,
  Url,
  UserId,
} from "./primitives";
import { dto } from "./registry";
import { VerificationDTO } from "./verification";

// ---- §18.1 -----------------------------------------------------------------

export const UserDTO = dto(
  "UserDTO",
  z.object({
    id: UserId,
    display_name: z.string(),
    avatar_url: Url.nullable(),
    locale: Locale,
    verification_tier: VerificationTier,
    roles: z.array(Role),
    created_at: Timestamp,
  }),
);
export type UserDTO = z.infer<typeof UserDTO>;

// POST /api/auth/otp/request
export const OtpRequestBody = dto(
  "OtpRequestBody",
  z.object({
    channel: OtpChannel,
    destination: z.string().min(3).max(320),
    purpose: OtpPurpose,
    captcha_token: z.string().min(1).max(4096).optional(),
  }),
);
export type OtpRequestBody = z.infer<typeof OtpRequestBody>;

export const OtpRequestResponse = dto(
  "OtpRequestResponse",
  z.object({
    challenge_id: OtpChallengeId,
    expires_at: Timestamp,
    resend_after_seconds: z.int().min(0),
  }),
);
export type OtpRequestResponse = z.infer<typeof OtpRequestResponse>;

// POST /api/auth/otp/verify — the code has six digits (§14.1).
export const OtpVerifyBody = dto(
  "OtpVerifyBody",
  z.object({
    challenge_id: OtpChallengeId,
    code: z.string().regex(/^\d{6}$/),
  }),
);
export type OtpVerifyBody = z.infer<typeof OtpVerifyBody>;

export const OtpVerifyResponse = dto(
  "OtpVerifyResponse",
  z.object({ user: UserDTO, next_step: NextStep }),
);
export type OtpVerifyResponse = z.infer<typeof OtpVerifyResponse>;

// GET /api/me — `active_role` is null until a role is chosen; `flags` are the
// feature flags of §21.4.
export const MeResponse = dto(
  "MeResponse",
  z.object({
    user: UserDTO,
    roles: z.array(Role),
    tier: VerificationTier,
    active_role: Role.nullable(),
    flags: z.record(z.string(), z.boolean()),
  }),
);
export type MeResponse = z.infer<typeof MeResponse>;

// PATCH /api/me/profile
export const ProfilePatchBody = dto(
  "ProfilePatchBody",
  z.object({
    display_name: ShortText,
    avatar_media_id: DocumentId.optional(),
    locale: Locale.optional(),
    preferred_contact: ShortText.optional(),
  }),
);
export type ProfilePatchBody = z.infer<typeof ProfilePatchBody>;

// Derived from `profiles` (§8.2.1) without the encrypted LINE id.
export const ProfileDTO = dto(
  "ProfileDTO",
  z.object({
    user_id: UserId,
    display_name: z.string(),
    avatar_url: Url.nullable(),
    bio: z.string().nullable(),
    locale: Locale,
    preferred_contact: z.string().nullable(),
    timezone: z.string().nullable(),
  }),
);
export type ProfileDTO = z.infer<typeof ProfileDTO>;

// POST /api/me/roles — additive only.
export const RoleAddBody = dto(
  "RoleAddBody",
  z.object({ role: SelfServiceRole }),
);
export const RolesResponse = dto(
  "RolesResponse",
  z.object({ roles: z.array(Role) }),
);

// GET /api/me/trust — the shape of `response_stats` is not given.
export const TrustResponse = dto(
  "TrustResponse",
  z.object({
    tier: VerificationTier,
    verifications: z.array(VerificationDTO),
    trust_score: z.int().nullable(),
    response_stats: OpenObject,
  }),
);

// Derived from `sessions` (§8.2.1) without the token hash.
export const SessionDTO = dto(
  "SessionDTO",
  z.object({
    id: OpaqueId,
    ip: z.string().nullable(),
    user_agent: z.string().nullable(),
    expires_at: Timestamp,
  }),
);
export const SessionsResponse = dto(
  "SessionsResponse",
  z.object({ sessions: z.array(SessionDTO) }),
);

// POST /api/me/export, POST /api/me/delete
export const ExportResponse = dto(
  "ExportResponse",
  z.object({ job_id: OpaqueId }),
);
export const AccountDeleteBody = dto(
  "AccountDeleteBody",
  z.object({ reason: MediumText.optional() }),
);
export const AccountDeleteResponse = dto(
  "AccountDeleteResponse",
  z.object({ deletion_request_id: OpaqueId, effective_at: Timestamp }),
);
