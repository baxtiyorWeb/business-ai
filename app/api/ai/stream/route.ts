import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase-server";
import { generateWithFallbackStream } from "@/lib/ai-gateway";

class StreamCleaner {
  private buffer = "";
  private isThinking = false;
  private hasFlushedThinking = false;
  private onToken: (token: string) => void;

  constructor(onToken: (token: string) => void) {
    this.onToken = onToken;
  }

  process(chunk: string) {
    this.buffer += chunk;

    if (!this.hasFlushedThinking) {
      const trimmed = this.buffer.trim();
      
      // Handle <think> block
      if (trimmed.startsWith("<think>")) {
        this.isThinking = true;
        const thinkEndIndex = this.buffer.indexOf("</think>");
        if (thinkEndIndex !== -1) {
          this.buffer = this.buffer.substring(thinkEndIndex + 8);
          this.isThinking = false;
          this.hasFlushedThinking = true;
          if (this.buffer) {
            this.onToken(this.buffer);
            this.buffer = "";
          }
        }
        return;
      }

      // Handle tool_code / thought block
      if (
        trimmed.startsWith("tool_code") ||
        trimmed.startsWith("thought") ||
        trimmed.startsWith("tool_code\n") ||
        trimmed.startsWith("thought\n")
      ) {
        const cleanPattern = /^(?:tool_code[\s\S]*?thought[\s\S]*?\n(?=##|\w)|tool_code[\s\S]*?\n(?=##|\w)|thought[\s\S]*?\n(?=##|\w))/i;
        const match = this.buffer.match(cleanPattern);
        if (match) {
          this.buffer = this.buffer.substring(match[0].length);
          this.hasFlushedThinking = true;
          if (this.buffer) {
            this.onToken(this.buffer);
            this.buffer = "";
          }
          return;
        }

        const headerIndex = this.buffer.indexOf("\n##");
        if (headerIndex !== -1) {
          this.buffer = this.buffer.substring(headerIndex + 1);
          this.hasFlushedThinking = true;
          this.onToken(this.buffer);
          this.buffer = "";
          return;
        }

        return; // Wait for end of block
      }

      // If it doesn't start with any thinking pattern, just flush
      this.hasFlushedThinking = true;
      this.onToken(this.buffer);
      this.buffer = "";
    } else {
      this.onToken(chunk);
    }
  }

  flush() {
    if (this.buffer) {
      let finalText = this.buffer;
      finalText = finalText.replace(/<think>[\s\S]*?<\/think>/g, "");
      finalText = finalText.replace(/<think>[\s\S]*/g, ""); 
      finalText = finalText.replace(/^(?:tool_code|thought)[\s\S]*?(?=\n##|\n\w|$)/gi, "");
      if (finalText.trim()) {
        this.onToken(finalText);
      }
      this.buffer = "";
    }
  }
}

export async function POST(req: Request) {
  try {
    const user = await getServerUser(req);
    if (!user) {
      return new NextResponse("Unauthorized. Please sign in.", { status: 401 });
    }

    const body = await req.json();
    const { prompt, history, systemPrompt, grounding, mode } = body;

    if (!prompt || typeof prompt !== "string") {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const cleaner = new StreamCleaner((cleanedToken) => {
            const sseData = JSON.stringify({ type: "token", text: cleanedToken });
            controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
          });

          await generateWithFallbackStream(
            {
              prompt,
              history: history || [],
              systemPrompt: systemPrompt || "",
              grounding: !!grounding,
              mode,
            },
            {
              onToken(chunk) {
                cleaner.process(chunk);
              },
              onSources(sources) {
                const sseData = JSON.stringify({ type: "sources", sources });
                controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
              },
              onProvider(provider) {
                const sseData = JSON.stringify({ type: "provider", provider });
                controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
              },
            }
          );
          cleaner.flush();
          controller.close();
        } catch (error: any) {
          const sseError = JSON.stringify({
            type: "error",
            message: error.message || "Streaming failed",
          });
          controller.enqueue(encoder.encode(`data: ${sseError}\n\n`));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error: any) {
    console.error("AI Stream Route Error:", error);
    return new NextResponse(error.message || "Internal Server Error", {
      status: 500,
    });
  }
}
