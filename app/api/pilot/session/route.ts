import { endpoint, createSession } from "@/src/services/pilot";
export const POST = (request: Request) =>
  endpoint(() => createSession(request));
