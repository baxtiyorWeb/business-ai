// ============================================================
// lib/ai-gateway.ts
// - Strict sequential model/provider attempts (never parallel)
// - Longer timeouts so a slow-starting model is not abandoned early
// - No console logs
// - Only one active request at a time per generation
// ============================================================

import { GoogleGenAI } from "@google/genai";

export interface GatewayMessage {
  role: "user" | "assistant";
  content: string;
}

export interface GatewaySource {
  title: string;
  domain: string;
  year: string;
  uri: string;
}

export interface GatewayResult {
  text: string;
  sources: GatewaySource[];
  provider: "gemini" | "openrouter" | "mistral";
}

const GENERIC_ERROR =
  "All AI providers are currently busy or unavailable. Please try again in a moment.";

// ------------------------------------------------------------
// Gemini models by mode
// ------------------------------------------------------------
const GEMINI_MODELS_BY_MODE: Record<string, string[]> = {
  general: [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash",
    "gemini-2.5-flash-lite",
  ],
  code: [
    "gemini-3.1-pro-preview",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ],
  math: [
    "gemini-3.1-pro-preview",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ],
  science: [
    "gemini-3.1-pro-preview",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-2.5-flash",
  ],
  business: [
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-2.5-flash",
  ],
};
 
const GEMINI_FALLBACK_MODELS = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-3.1-pro-preview",
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
];
 

const COOLDOWN_MS = 60_000;
const MAX_CYCLES = 2;
const CYCLE_DELAY_MS = 1200;

const MODEL_TIMEOUT_MS = 25_000;
const STREAM_START_TIMEOUT_MS = 18_000;

const OPENROUTER_MODELS = {
  GENERAL: "google/gemini-2.5-flash-lite:free",
  THINKING: "deepseek/deepseek-r1:free",
  MATH: "nvidia/nemotron-3-super-120b-a12b:free",
  CODE: "qwen/qwen-2.5-coder-32b-instruct:free",
  DOCS: "google/gemini-2.5-flash-lite:free",
  FREE_ROUTER: "openrouter/free",
};

const OPENROUTER_KEYWORD_RULES: Array<{ test: RegExp; model: string }> = [
  {
    test: /masala|matem|formula|math|equation/i,
    model: OPENROUTER_MODELS.MATH,
  },
  { test: /kod|function|bug|code/i, model: OPENROUTER_MODELS.CODE },
  { test: /tahlil|chuqur|analysis|deep/i, model: OPENROUTER_MODELS.THINKING },
  { test: /doc|word|excel/i, model: OPENROUTER_MODELS.DOCS },
];

const OPENROUTER_MODE_MODELS: Record<string, string> = {
  math: OPENROUTER_MODELS.MATH,
  code: OPENROUTER_MODELS.CODE,
  science: OPENROUTER_MODELS.THINKING,
};

const MISTRAL_MODELS = ["mistral-large-latest", "mistral-small-latest"];

function parseKeyList(raw: string | undefined): string[] {
  return (raw || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

const GEMINI_KEYS = parseKeyList(process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY);
const OPENROUTER_KEY = (process.env.OPENROUTER_KEY || process.env.NEXT_PUBLIC_OPENROUTER_KEY || "").trim();
const MISTRAL_KEY = (process.env.MISTRAL_API_KEY || process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "").trim();

const cooldowns = new Map<string, number>();
let geminiKeyCursor = 0;
let geminiModelCursor = 0;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function withTimeout<T>(
  promise: Promise<T>,
  ms: number = MODEL_TIMEOUT_MS,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

function timeoutSignal(ms: number = MODEL_TIMEOUT_MS): {
  signal: AbortSignal;
  clear: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

function isCoolingDown(id: string) {
  const until = cooldowns.get(id);
  return typeof until === "number" && Date.now() < until;
}

function markCooldown(id: string) {
  cooldowns.set(id, Date.now() + COOLDOWN_MS);
}

function isQuotaError(err: unknown) {
  const message = (
    err instanceof Error ? err.message : String(err)
  ).toLowerCase();
  return (
    message.includes("429") ||
    message.includes("resource_exhausted") ||
    message.includes("quota") ||
    message.includes("rate limit") ||
    message.includes("timeout")
  );
}

function getGeminiModelsForMode(mode?: string): string[] {
  return (mode && GEMINI_MODELS_BY_MODE[mode]) || GEMINI_FALLBACK_MODELS;
}

function rotate<T>(list: T[], cursor: number): T[] {
  if (list.length === 0) return [];
  const start = cursor % list.length;
  return [...list.slice(start), ...list.slice(0, start)];
}

function orderedGeminiKeys(): string[] {
  if (GEMINI_KEYS.length === 0) return [];
  const fresh = GEMINI_KEYS.filter(
    (key) => !isCoolingDown(`gemini-key:${key}`),
  );
  const pool = fresh.length > 0 ? fresh : GEMINI_KEYS;
  return rotate(pool, geminiKeyCursor++);
}

function orderedModels(models: string[]): string[] {
  return rotate(models, geminiModelCursor++);
}

function extractDomain(uri: string) {
  try {
    return new URL(uri).hostname.replace("www.", "");
  } catch {
    return uri;
  }
}

function extractGeminiSources(candidate: any): GatewaySource[] {
  const chunks = candidate?.groundingMetadata?.groundingChunks ?? [];
  return chunks
    .map((chunk: any) => chunk.web)
    .filter(Boolean)
    .map((web: any) => ({
      title: web.title || extractDomain(web.uri || ""),
      domain: extractDomain(web.uri || ""),
      year: String(new Date().getFullYear()),
      uri: web.uri || "",
    }))
    .filter(
      (source: GatewaySource, i: number, arr: GatewaySource[]) =>
        arr.findIndex((s) => s.domain === source.domain) === i,
    );
}

function toGeminiContents(prompt: string, history: GatewayMessage[]) {
  return [
    ...history.slice(-6).map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
    { role: "user", parts: [{ text: prompt }] },
  ];
}

function toOpenAiMessages(prompt: string, history: GatewayMessage[]) {
  return [
    ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: prompt },
  ];
}

function pickOpenRouterModel(
  prompt: string,
  json: boolean,
  mode?: string,
  grounding?: boolean,
) {
  let model =
    (json && OPENROUTER_MODELS.GENERAL) ||
    (mode && OPENROUTER_MODE_MODELS[mode]) ||
    OPENROUTER_KEYWORD_RULES.find((rule) => rule.test.test(prompt))?.model ||
    OPENROUTER_MODELS.GENERAL;

  if (grounding && !model.endsWith(":online")) {
    model = `${model}:online`;
  }

  return model;
}

// ============================================================
// NON-STREAM
// ============================================================

async function tryGemini(options: {
  prompt: string;
  history: GatewayMessage[];
  systemPrompt: string;
  json: boolean;
  grounding: boolean;
  mode?: string;
}): Promise<{ text: string; sources: GatewaySource[] } | null> {
  const keys = orderedGeminiKeys();
  if (keys.length === 0) return null;

  const models = orderedModels(getGeminiModelsForMode(options.mode));
  const contents = toGeminiContents(options.prompt, options.history);

  // Strict sequential: one model + one key at a time
  for (const model of models) {
    for (const key of keys) {
      const cooldownId = `gemini:${model}:${key}`;
      if (isCoolingDown(cooldownId)) continue;

      try {
        const client = new GoogleGenAI({ apiKey: key });
        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents,
            config: {
              systemInstruction: options.systemPrompt,
              ...(options.json ? { responseMimeType: "application/json" } : {}),
              ...(options.grounding ? { tools: [{ googleSearch: {} }] } : {}),
            },
          }),
          MODEL_TIMEOUT_MS,
        );

        const text = response.text || "";
        if (text.trim().length > 0) {
          return {
            text,
            sources: options.grounding
              ? extractGeminiSources(response.candidates?.[0])
              : [],
          };
        }
      } catch (err) {
        if (isQuotaError(err)) {
          markCooldown(cooldownId);
          markCooldown(`gemini-key:${key}`);
        }
        // Continue to next model/key only after this attempt fully finishes
      }
    }
  }
  return null;
}

async function tryOpenRouter(options: {
  prompt: string;
  history: GatewayMessage[];
  systemPrompt: string;
  json: boolean;
  mode?: string;
  grounding?: boolean;
}): Promise<{ text: string } | null> {
  if (!OPENROUTER_KEY) return null;

  const preferred = pickOpenRouterModel(
    options.prompt,
    options.json,
    options.mode,
    options.grounding,
  );
  const fallbackGeneral = options.grounding
    ? `${OPENROUTER_MODELS.GENERAL}:online`
    : OPENROUTER_MODELS.GENERAL;
  const fallbackRouter = options.grounding
    ? `${OPENROUTER_MODELS.FREE_ROUTER}:online`
    : OPENROUTER_MODELS.FREE_ROUTER;
  const modelsToTry = Array.from(
    new Set([preferred, fallbackGeneral, fallbackRouter]),
  );

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...toOpenAiMessages(options.prompt, options.history),
  ];

  for (const model of modelsToTry) {
    const cooldownId = `openrouter:${model}`;
    if (isCoolingDown(cooldownId)) continue;

    const { signal, clear } = timeoutSignal(MODEL_TIMEOUT_MS);
    try {
      const response = await fetch(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_KEY}`,
            "HTTP-Referer":
              typeof window !== "undefined" ? window.location.origin : "",
            "X-Title": "NicheFX Agent",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model, messages }),
          signal,
        },
      );

      if (!response.ok) {
        if (response.status === 429) markCooldown(cooldownId);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (text.trim().length > 0) return { text };
    } catch {
      // move to next model
    } finally {
      clear();
    }
  }
  return null;
}

async function tryMistral(options: {
  prompt: string;
  history: GatewayMessage[];
  systemPrompt: string;
}): Promise<{ text: string } | null> {
  if (!MISTRAL_KEY) return null;

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...toOpenAiMessages(options.prompt, options.history),
  ];

  for (const model of MISTRAL_MODELS) {
    const cooldownId = `mistral:${model}`;
    if (isCoolingDown(cooldownId)) continue;

    const { signal, clear } = timeoutSignal(MODEL_TIMEOUT_MS);
    try {
      const response = await fetch(
        "https://api.mistral.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${MISTRAL_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ model, messages }),
          signal,
        },
      );

      if (!response.ok) {
        if (response.status === 429) markCooldown(cooldownId);
        continue;
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      if (text.trim().length > 0) return { text };
    } catch {
      // move to next model
    } finally {
      clear();
    }
  }
  return null;
}

async function runNonStreamCycle(options: {
  prompt: string;
  history: GatewayMessage[];
  systemPrompt: string;
  json: boolean;
  grounding: boolean;
  mode?: string;
}): Promise<GatewayResult | null> {
  // Strict order: Gemini → OpenRouter → Mistral (never parallel)
  const gemini = await tryGemini(options);
  if (gemini && gemini.text.trim().length > 0) {
    return { text: gemini.text, sources: gemini.sources, provider: "gemini" };
  }

  const openRouter = await tryOpenRouter(options);
  if (openRouter && openRouter.text.trim().length > 0) {
    return { text: openRouter.text, sources: [], provider: "openrouter" };
  }

  const mistral = await tryMistral(options);
  if (mistral && mistral.text.trim().length > 0) {
    return { text: mistral.text, sources: [], provider: "mistral" };
  }

  return null;
}

export async function generateWithFallback(options: {
  prompt: string;
  history: GatewayMessage[];
  systemPrompt: string;
  json?: boolean;
  grounding?: boolean;
  mode?: string;
}): Promise<GatewayResult> {
  const cycleOptions = {
    ...options,
    json: options.json ?? false,
    grounding: options.grounding ?? false,
  };

  for (let cycle = 0; cycle < MAX_CYCLES; cycle++) {
    const result = await runNonStreamCycle(cycleOptions);
    if (result) return result;
    if (cycle < MAX_CYCLES - 1) await sleep(CYCLE_DELAY_MS);
  }

  throw new Error(GENERIC_ERROR);
}

// ============================================================
// STREAM
// ============================================================

export interface StreamCallbacks {
  onToken: (chunk: string) => void;
  onSources?: (sources: GatewaySource[]) => void;
  onProvider?: (provider: GatewayResult["provider"]) => void;
}

async function streamGemini(
  options: {
    prompt: string;
    history: GatewayMessage[];
    systemPrompt: string;
    grounding: boolean;
    mode?: string;
  },
  cb: StreamCallbacks,
): Promise<boolean> {
  const keys = orderedGeminiKeys();
  if (keys.length === 0) return false;

  const models = orderedModels(getGeminiModelsForMode(options.mode));
  const contents = toGeminiContents(options.prompt, options.history);

  // Strict sequential – never start the next model until the current one is finished or fully failed
  for (const model of models) {
    for (const key of keys) {
      const cooldownId = `gemini:${model}:${key}`;
      if (isCoolingDown(cooldownId)) continue;

      try {
        const client = new GoogleGenAI({ apiKey: key });

        // Only timeout the stream *opening*. Once tokens start flowing we let it finish.
        const stream = await withTimeout(
          client.models.generateContentStream({
            model,
            contents,
            config: {
              systemInstruction: options.systemPrompt,
              ...(options.grounding ? { tools: [{ googleSearch: {} }] } : {}),
            },
          }),
          STREAM_START_TIMEOUT_MS,
        );

        let wroteAny = false;
        let lastCandidate: any = null;

        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) {
              wroteAny = true;
              cb.onToken(text);
            }
            if (chunk.candidates?.[0]) lastCandidate = chunk.candidates[0];
          }
        } catch {
          // If we already received tokens, accept the partial result and stop.
          // Do NOT fall through to another model (that would waste tokens).
          if (wroteAny) {
            cb.onProvider?.("gemini");
            if (options.grounding && lastCandidate) {
              cb.onSources?.(extractGeminiSources(lastCandidate));
            }
            return true;
          }
          // No tokens received → try next model/key
          continue;
        }

        if (wroteAny) {
          cb.onProvider?.("gemini");
          if (options.grounding && lastCandidate) {
            cb.onSources?.(extractGeminiSources(lastCandidate));
          }
          return true;
        }
      } catch (err) {
        if (isQuotaError(err)) {
          markCooldown(cooldownId);
          markCooldown(`gemini-key:${key}`);
        }
        // Continue only after this attempt is completely done
      }
    }
  }
  return false;
}

async function streamSse(
  url: string,
  headers: Record<string, string>,
  body: Record<string, unknown>,
  cb: StreamCallbacks,
): Promise<boolean> {
  const { signal, clear } = timeoutSignal(STREAM_START_TIMEOUT_MS);
  let response: Response;

  try {
    response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ ...body, stream: true }),
      signal,
    });
  } finally {
    clear();
  }

  if (!response.ok || !response.body) {
    if (response.status === 429) {
      throw Object.assign(new Error("rate limit"), { status: 429 });
    }
    throw new Error("provider error");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let wroteAny = false;

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          const delta = json.choices?.[0]?.delta?.content;
          if (delta) {
            wroteAny = true;
            cb.onToken(delta);
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
  } catch {
    // If we already got tokens, keep them and stop (do not retry another model)
    if (wroteAny) return true;
    throw new Error("stream interrupted");
  }

  return wroteAny;
}

async function streamOpenRouter(
  options: {
    prompt: string;
    history: GatewayMessage[];
    systemPrompt: string;
    mode?: string;
    grounding?: boolean;
  },
  cb: StreamCallbacks,
): Promise<boolean> {
  if (!OPENROUTER_KEY) return false;

  const preferred = pickOpenRouterModel(
    options.prompt,
    false,
    options.mode,
    options.grounding,
  );
  const fallbackGeneral = options.grounding
    ? `${OPENROUTER_MODELS.GENERAL}:online`
    : OPENROUTER_MODELS.GENERAL;
  const fallbackRouter = options.grounding
    ? `${OPENROUTER_MODELS.FREE_ROUTER}:online`
    : OPENROUTER_MODELS.FREE_ROUTER;
  const modelsToTry = Array.from(
    new Set([preferred, fallbackGeneral, fallbackRouter]),
  );

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...toOpenAiMessages(options.prompt, options.history),
  ];

  for (const model of modelsToTry) {
    const cooldownId = `openrouter:${model}`;
    if (isCoolingDown(cooldownId)) continue;

    try {
      const ok = await streamSse(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          Authorization: `Bearer ${OPENROUTER_KEY}`,
          "HTTP-Referer":
            typeof window !== "undefined" ? window.location.origin : "",
          "X-Title": "NicheFX Agent",
          "Content-Type": "application/json",
        },
        { model, messages },
        cb,
      );
      if (ok) {
        cb.onProvider?.("openrouter");
        return true;
      }
    } catch (err: any) {
      if (err?.status === 429) markCooldown(cooldownId);
    }
  }
  return false;
}

async function streamMistral(
  options: {
    prompt: string;
    history: GatewayMessage[];
    systemPrompt: string;
  },
  cb: StreamCallbacks,
): Promise<boolean> {
  if (!MISTRAL_KEY) return false;

  const messages = [
    { role: "system", content: options.systemPrompt },
    ...toOpenAiMessages(options.prompt, options.history),
  ];

  for (const model of MISTRAL_MODELS) {
    const cooldownId = `mistral:${model}`;
    if (isCoolingDown(cooldownId)) continue;

    try {
      const ok = await streamSse(
        "https://api.mistral.ai/v1/chat/completions",
        {
          Authorization: `Bearer ${MISTRAL_KEY}`,
          "Content-Type": "application/json",
        },
        { model, messages },
        cb,
      );
      if (ok) {
        cb.onProvider?.("mistral");
        return true;
      }
    } catch (err: any) {
      if (err?.status === 429) markCooldown(cooldownId);
    }
  }
  return false;
}

async function runStreamCycle(
  options: {
    prompt: string;
    history: GatewayMessage[];
    systemPrompt: string;
    grounding: boolean;
    mode?: string;
  },
  cb: StreamCallbacks,
): Promise<boolean> {
  // Strict sequential – only one provider/model runs at a time
  if (await streamGemini(options, cb)) return true;
  if (await streamOpenRouter(options, cb)) return true;
  if (await streamMistral(options, cb)) return true;
  return false;
}

export async function generateWithFallbackStream(
  options: {
    prompt: string;
    history: GatewayMessage[];
    systemPrompt: string;
    grounding?: boolean;
    mode?: string;
  },
  cb: StreamCallbacks,
): Promise<void> {
  const cycleOptions = { ...options, grounding: options.grounding ?? false };

  for (let cycle = 0; cycle < MAX_CYCLES; cycle++) {
    if (await runStreamCycle(cycleOptions, cb)) return;
    if (cycle < MAX_CYCLES - 1) await sleep(CYCLE_DELAY_MS);
  }

  throw new Error(GENERIC_ERROR);
}
