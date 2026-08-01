import type { GatewayResult, GatewayMessage, StreamCallbacks } from "./ai-gateway";
import { supabase } from "./supabase";

export async function generateWithFallback(options: {
  prompt: string;
  history: GatewayMessage[];
  systemPrompt: string;
  json?: boolean;
  grounding?: boolean;
  mode?: string;
}): Promise<GatewayResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch("/api/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "AI generation failed");
  }

  return response.json();
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
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const response = await fetch("/api/ai/stream", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token && { "Authorization": `Bearer ${token}` }),
    },
    body: JSON.stringify(options),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "AI stream initiation failed");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("Response body is not readable");
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith("data:")) continue;
      const dataStr = line.slice(5).trim();
      try {
        const data = JSON.parse(dataStr);
        if (data.type === "token") {
          cb.onToken(data.text);
        } else if (data.type === "sources") {
          cb.onSources?.(data.sources);
        } else if (data.type === "provider") {
          cb.onProvider?.(data.provider);
        } else if (data.type === "error") {
          throw new Error(data.message);
        }
      } catch (err) {
        if (err instanceof Error && err.message !== "Unexpected end of JSON input") {
          throw err;
        }
      }
    }
  }
}
