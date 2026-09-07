const CONFIGURATION_UNAVAILABLE_EXIT_CODE = 78;

console.error(
  JSON.stringify({
    event: "worker.not_configured",
    message:
      "Worker scaffold only. PostgreSQL and pg-boss are not configured; no jobs were processed.",
  }),
);
process.exitCode = CONFIGURATION_UNAVAILABLE_EXIT_CODE;
export {};
