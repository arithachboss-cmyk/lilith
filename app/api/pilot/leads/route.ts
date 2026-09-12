import { endpoint, saveLead } from "@/src/services/pilot";
export const POST = (request: Request) => endpoint(() => saveLead(request));
