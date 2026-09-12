import { endpoint, inbox, progress } from "@/src/services/pilot";
export const GET = (request: Request) => endpoint(() => inbox(request));
export const PATCH = (request: Request) => endpoint(() => progress(request));
