import {
  createSystemRepository,
  getSystemHealth,
  type SystemHealth,
} from "@lilith/core/system";

/** The running build. `APP_VERSION` is injected at build time (Blueprint §20). */
export function appVersion(
  env: Readonly<Record<string, string | undefined>> = process.env,
): string {
  const version = env["APP_VERSION"]?.trim();
  return version === undefined || version === "" ? "dev" : version;
}

/** Composition root of the health path: core service + its repository. */
export function readSystemHealth(): Promise<SystemHealth> {
  return getSystemHealth({
    database: createSystemRepository(),
    version: appVersion(),
  });
}
