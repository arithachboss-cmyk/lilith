export class RequestError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}
export async function api<T>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch(path, {
    method: method ?? (body ? "POST" : "GET"),
    credentials: "same-origin",
    cache: "no-store",
    ...(body
      ? {
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const result = (await response.json()) as {
    data?: T;
    error?: {
      code: string;
      message: string;
      fields?: { path: string; message: string }[];
    };
  };
  if (!response.ok || result.error)
    throw new RequestError(
      result.error?.fields
        ?.map((field) => `${field.path}: ${field.message}`)
        .join(" · ") ||
        result.error?.message ||
        "Request failed. Please try again.",
      result.error?.code ?? "REQUEST_FAILED",
    );
  return result.data as T;
}
