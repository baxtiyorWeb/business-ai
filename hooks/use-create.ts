// ==========================================
// USE-CREATE HOOK (Triple Fallback: Runware -> Gemini -> Hugging Face)
// ==========================================

import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function useCreate() {
  const [prompt, setPrompt] = useState<string>("");
  const [selectedStyle, setSelectedStyle] = useState<string>("3D Render");
  const [selectedRatio, setSelectedRatio] = useState<string>("1:1");
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) {
      toast.error("Iltimos, tasvir uchun prompt kiriting!");
      return;
    }

    try {
      setIsGenerating(true);
      setGeneratedImage(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const response = await fetch("/api/ai/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token && { "Authorization": `Bearer ${token}` }),
          },
          body: JSON.stringify({
            prompt: prompt.trim(),
            selectedStyle,
            selectedRatio,
          }),
        });

        if (!response.ok) {
          const errorMsg = await response.text();
          throw new Error(errorMsg || "Rasm yaratishda xatolik yuz berdi");
        }

        const data = await response.json();
        imageUrl = data.imageUrl;
      } catch (err: any) {
        console.error("AI Generation failed:", err);
        throw new Error(err.message || "Hozirda barcha AI generatsiya serverlari band yoki vaqtincha ishlamayapti.");
      }

      if (!imageUrl) {
        throw new Error("Rasm generatsiya qilinmadi");
      }

      setGeneratedImage(imageUrl);

      // Supabase'ga saqlash
      const { error } = await supabase.from("ai_creations").insert([
        {
          user_id: user ? user.id : null,
          prompt: cleanPrompt,
          style: selectedStyle,
          ratio: selectedRatio,
          image_url: imageUrl,
          is_public: isPublic,
        },
      ]);

      if (error) {
        console.warn("Supabase xatosi:", error.message);
      }
    } catch (error: any) {
      console.error("AI Generation error:", error);
      toast.error(error.message || "Dizayn yaratishda xatolik yuz berdi");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, selectedStyle, selectedRatio, isPublic]);

  const handleDownload = useCallback(() => {
    if (!generatedImage) return;
    window.open(generatedImage, "_blank");
  }, [generatedImage]);

  return {
    prompt,
    setPrompt,
    selectedStyle,
    setSelectedStyle,
    selectedRatio,
    setSelectedRatio,
    isPublic,
    setIsPublic,
    isGenerating,
    setIsGenerating,
    generatedImage,
    handleGenerate,
    handleDownload,
  };
}