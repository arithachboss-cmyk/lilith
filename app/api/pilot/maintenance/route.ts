import { endpoint, expireSessions } from "@/src/services/pilot";
export const POST = (request: Request) =>
  endpoint(() => expireSessions(request));
