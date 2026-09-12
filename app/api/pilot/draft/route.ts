import { endpoint, readDraft, changeImages } from "@/src/services/pilot";
export const GET = (request: Request) => endpoint(() => readDraft(request));
export const PATCH = (request: Request) =>
  endpoint(() => changeImages(request));
