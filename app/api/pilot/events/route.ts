import { endpoint, recordEvent } from "@/src/services/pilot";
export const POST = (request: Request) => endpoint(() => recordEvent(request));
