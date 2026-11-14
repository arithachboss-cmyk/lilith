import { createHealthHandler } from "@/lib/server/health-handler";
import { readSystemHealth } from "@/lib/server/system";

// Asked fresh on every request; never rendered at build time.
export const dynamic = "force-dynamic";

export const GET = createHealthHandler(readSystemHealth);
