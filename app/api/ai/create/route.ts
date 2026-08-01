import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/supabase-server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  try {
    const user = await getServerUser(req);
    if (!user) {
      return new NextResponse("Unauthorized. Please sign in.", { status: 401 });
    }

    const body = await req.json();
    const { prompt, selectedStyle, selectedRatio } = body;

    if (!prompt || typeof prompt !== "string") {
      return new NextResponse("Prompt is required", { status: 400 });
    }

    const dimensions =
      selectedRatio === "16:9"
        ? { width: 1024, height: 576 }
        : selectedRatio === "9:16"
        ? { width: 576, height: 1024 }
        : { width: 512, height: 512 };

    const styleModifiers: Record<string, string> = {
      Realistik: ", photorealistic, highly detailed, realistic lighting, 8k resolution, masterpiece",
      "3D Render": ", 3d render, octane render, blender, unreal engine 5, smooth textures, professional lighting",
      Minimalistik: ", minimalist design, clean lines, simple shapes, flat design, elegant",
      Kiberpank: ", cyberpunk style, neon lights, futuristic city, dark background, glowing details, sci-fi",
      Anime: ", anime style, Japanese animation, vibrant colors, detailed manga art, high quality",
      "Eskiz (Sketch)": ", pencil sketch, line art, hand drawn, rough sketch, monochrome",
    };

    const cleanPrompt = prompt.trim();
    const finalPrompt = `${cleanPrompt}${styleModifiers[selectedStyle] || ""}`;

    let imageUrl: string | null = null;

    // ==========================================
    // 1-URINISH: Runware API
    // ==========================================
    try {
      const runwareApiKey = process.env.RUNWARE_API_KEY || process.env.NEXT_PUBLIC_RUNWARE_API_KEY;
      if (!runwareApiKey) throw new Error("Runware API key not found");

      const response = await fetch("https://api.runware.ai/v1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${runwareApiKey}`,
        },
        body: JSON.stringify([
          {
            taskType: "imageInference",
            model: "google:nano-banana@2-lite",
            positivePrompt: finalPrompt,
            width: dimensions.width,
            height: dimensions.height,
            numberResults: 1,
            outputType: "URL",
            outputFormat: "JPG",
            outputQuality: 90,
          },
        ]),
      });

      const data = await response.json();
      if (response.ok && data.data?.[0]?.imageURL) {
        imageUrl = data.data[0].imageURL;
      } else {
        throw new Error("Runware response invalid");
      }
    } catch (runwareErr: any) {
      console.warn("Server Runware error, falling back to Gemini...", runwareErr?.message || runwareErr);

      // ==========================================
      // 2-URINISH: Google Gemini (Gemini 3.1 Flash Image)
      // ==========================================
      try {
        const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!geminiApiKey) throw new Error("Gemini API key not found");

        const ai = new GoogleGenAI({ apiKey: geminiApiKey });
        const geminiResponse = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image',
          contents: finalPrompt,
        });

        if (geminiResponse.text) {
          imageUrl = geminiResponse.text;
        } else {
          throw new Error("Gemini returned no image text");
        }
      } catch (geminiErr: any) {
        console.warn("Server Gemini error, falling back to Hugging Face...", geminiErr?.message || geminiErr);

        // ==========================================
        // 3-URINISH: Hugging Face (Stable Diffusion)
        // ==========================================
        try {
          const hfApiKey = process.env.HF_API_KEY || process.env.NEXT_PUBLIC_HF_API_KEY;
          const hfHeaders: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (hfApiKey) {
            hfHeaders["Authorization"] = `Bearer ${hfApiKey}`;
          }

          const hfResponse = await fetch(
            "https://api-inference.huggingface.co/models/stable-diffusion-v1-5/stable-diffusion-v1-5",
            {
              method: "POST",
              headers: hfHeaders,
              body: JSON.stringify({ inputs: finalPrompt }),
            }
          );

          if (!hfResponse.ok) {
            throw new Error("Hugging Face server busy or returned status " + hfResponse.status);
          }

          const buffer = await hfResponse.arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");
          imageUrl = `data:image/jpeg;base64,${base64}`;
        } catch (hfErr: any) {
          console.error("All image generation options failed:", hfErr);
          return new NextResponse("All image generation options failed: " + (hfErr?.message || String(hfErr)), { status: 500 });
        }
      }
    }

    if (!imageUrl) {
      return new NextResponse("Image URL not generated", { status: 500 });
    }

    return NextResponse.json({ imageUrl });
  } catch (error: any) {
    console.error("AI Create Route Error:", error);
    return new NextResponse(error.message || "Internal Server Error", {
      status: 500,
    });
  }
}
