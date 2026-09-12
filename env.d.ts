declare namespace Cloudflare {
  interface Env {
    MIDDLE_READINESS_MODE?: "mock";
    MIDDLE_OPERATIONS_USER_IDS?: string;
    LILITH_ADMIN_EMAIL?: string;
    LEAD_IMPORT_TOKEN?: string;
    MATCH_WEIGHTS_JSON?: string;
  }
}

declare const __READINESS_BUILD_SHA__: string;
