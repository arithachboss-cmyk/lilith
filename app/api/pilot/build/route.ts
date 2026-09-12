export function GET() {
  return Response.json(
    {
      project: "Middle Property",
      source_sha: __READINESS_BUILD_SHA__,
      mode: "mock-only",
      real_leads: false,
      paid_traffic: false,
      google_ads: false,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
