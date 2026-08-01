import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase-server";
import { generateWithFallback } from "@/lib/ai-gateway";

function cleanText(text: string): string {
  if (!text) return "";
  let cleaned = text;
  // Strip <think>...</think>
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/g, "");
  // Strip tool_code / thought prefixes
  cleaned = cleaned.replace(/^(?:tool_code|thought)[\s\S]*?(?=\n##|\n\w|$)/gi, "");
  return cleaned.trim();
}

export async function POST(req: Request) {
  try {
    const user = await getServerUser(req);
    if (!user) {
      return new NextResponse("Unauthorized. Please sign in.", { status: 401 });
    }

    const body = await req.json();
    const { prompt, history, systemPrompt, json, grounding, mode } = body;

    if (!prompt || typeof prompt !== "string") {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const result = await generateWithFallback({
      prompt,
      history: history || [],
      systemPrompt: systemPrompt || "",
      json: !!json,
      grounding: !!grounding,
      mode,
    });

    result.text = cleanText(result.text);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("AI Generate Route Error:", error);
    return new NextResponse(error.message || "Internal Server Error", {
      status: 500,
    });
  }
}
