import { endpoint, createSession, closeSession } from "@/src/services/pilot";
export const POST = (request: Request) =>
  endpoint(() => createSession(request));
export const DELETE = (request: Request) =>
  endpoint(() => closeSession(request));
