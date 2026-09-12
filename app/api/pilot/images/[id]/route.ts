import { endpoint, putImage, getImage } from "@/src/services/pilot";
type Context = { params: Promise<{ id: string }> };
export const PUT = (request: Request, context: Context) =>
  endpoint(async () => putImage(request, (await context.params).id));
export const GET = (request: Request, context: Context) =>
  endpoint(async () => getImage(request, (await context.params).id));
