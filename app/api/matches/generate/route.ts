import { actor } from "@/src/services/platform/auth";
import { endpoint, input, json } from "@/src/services/platform/http";
import {
  generateInput,
  generateMatches,
} from "@/src/services/platform/matching";
export const POST = (request: Request) =>
  endpoint(async () =>
    json(
      await generateMatches(
        await actor(request),
        await input(request, generateInput),
      ),
    ),
  );
