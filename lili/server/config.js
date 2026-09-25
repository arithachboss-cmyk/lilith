/**
 * Configuration and honest mode reporting.
 *
 * The model is OPT-IN. With no OPENAI_API_KEY the server runs in `demo` mode and
 * makes no paid API call of any kind. Nothing here ever reaches the browser except
 * the mode name itself.
 */
export const config = {
  port: Number(process.env.PORT || 4180),
  host: process.env.HOST || "127.0.0.1",

  // Model connector — server side only. Never sent to the client.
  openaiApiKey: process.env.OPENAI_API_KEY || null,
  openaiBaseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com",
  openaiModel: process.env.OPENAI_MODEL || "gpt-4.1-mini",
  modelTimeoutMs: Number(process.env.MODEL_TIMEOUT_MS || 15000),
  modelRetries: Number(process.env.MODEL_RETRIES || 1),

  dataDir: process.env.DATA_DIR || new URL("../data/", import.meta.url).pathname,
};

/** `model` only when a key is actually configured. Never claim more than is true. */
export function runtimeMode() {
  return config.openaiApiKey ? "model" : "demo";
}

export function modeLabel(lang = "th") {
  const mode = runtimeMode();
  if (lang === "en") {
    return mode === "model" ? "Model connected" : "Demo mode — rule-based, no live model";
  }
  return mode === "model" ? "เชื่อมโมเดลแล้ว" : "โหมดสาธิต — ใช้กฎ ไม่ได้ต่อโมเดลสด";
}
