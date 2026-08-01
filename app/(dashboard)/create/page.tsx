"use client";

import React from "react";
import { 
  Sparkles, 
  Wand2, 
  Image as ImageIcon, 
  Download, 
  Share2, 
  Layers, 
  Square, 
  RectangleHorizontal, 
  RectangleVertical,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCreate } from "@/hooks/use-create";
import { toast } from "sonner";

const styles = [
  "Realistik",
  "3D Render",
  "Minimalistik",
  "Kiberpank",
  "Anime",
  "Eskiz (Sketch)",
];

const aspectRatios = [
  { id: "1:1", icon: Square, label: "1:1" },
  { id: "16:9", icon: RectangleHorizontal, label: "16:9" },
  { id: "9:16", icon: RectangleVertical, label: "9:16" },
];

export default function CreateWithAiPage() {
  const {
    prompt,
    setPrompt,
    selectedStyle,
    setSelectedStyle,
    selectedRatio,
    setSelectedRatio,
    isGenerating,
    setIsGenerating,
    generatedImage,
    handleGenerate,
    handleDownload
  } = useCreate();

  return (
    <div className="space-y-6 pb-10 text-slate-100 animate-in fade-in duration-700 slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <Wand2 className="h-5 w-5" />
          </div>
          AI Studio
        </h1>
        <p className="text-sm text-slate-400 max-w-2xl mt-1">
          O'z g'oyalaringizni yozing va sun'iy intellekt ularni bir necha soniya ichida professional va yuqori sifatli dizaynga aylantiradi.
        </p>
      </div>

      {/* Main Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        
        {/* Chap panel - Sozlamalar */}
        <div className="flex flex-col gap-6 rounded-2xl border border-slate-800/60 bg-[#121215]/85 backdrop-blur-xl p-5 shadow-2xl lg:col-span-1 transition-all duration-300 hover:border-slate-700/80">
          
          {/* Prompt kiritish */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-400" />
              Tasvirlab bering
            </label>
            <div className="relative group">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Masalan: Qorong'i o'rmonda neon chiroqlar ostida turgan kiberpank uslubidagi sport mashinasi..."
                className="min-h-[140px] w-full resize-none rounded-xl border border-slate-700/50 bg-[#0a0a0c] p-4 text-sm text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all duration-300"
              />
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-500 bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-sm pointer-events-none">
                {prompt.length} / 500
              </div>
            </div>
          </div>

          {/* Dizayn uslubi */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-400" />
              Uslubni tanlang
            </label>
            <div className="flex flex-wrap gap-2">
              {styles.map((style) => (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-xs font-medium transition-all duration-300 hover:scale-105 active:scale-95",
                    selectedStyle === style
                      ? "border-indigo-500 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
                      : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200 hover:bg-slate-800"
                  )}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Tomonlar nisbati */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-slate-200">
              Tomonlar nisbati
            </label>
            <div className="grid grid-cols-3 gap-3">
              {aspectRatios.map((ratio) => {
                const Icon = ratio.icon;
                return (
                  <button
                    key={ratio.id}
                    onClick={() => setSelectedRatio(ratio.id)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 rounded-xl border p-3 transition-all duration-300 hover:scale-105 active:scale-95",
                      selectedRatio === ratio.id
                        ? "border-indigo-500 bg-gradient-to-b from-indigo-500/10 to-transparent text-indigo-400 shadow-inner"
                        : "border-slate-800 bg-[#0a0a0c] text-slate-400 hover:border-slate-700 hover:text-slate-300"
                    )}
                  >
                    <Icon className="h-6 w-6 mb-1" />
                    <span className="text-[11px] font-semibold tracking-wider">{ratio.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generatsiya tugmasi */}
          <div className="pt-4 mt-auto">
            <Button 
              onClick={handleGenerate} 
              disabled={!prompt.trim() || isGenerating}
              className={cn(
                "w-full text-white font-semibold h-12 rounded-xl transition-all duration-300",
                isGenerating 
                  ? "bg-indigo-600/50 cursor-not-allowed" 
                  : "bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:translate-y-0"
              )}
            >
              {isGenerating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Jarayonda...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  <span>Dizayn Yaratish</span>
                </div>
              )}
            </Button>
          </div>
        </div>

        {/* O'ng panel - Natija ekrani */}
        <div className="flex flex-col rounded-2xl border border-slate-800/80 bg-[#0a0a0c] overflow-hidden lg:col-span-2 min-h-[500px] shadow-2xl relative">
          
          <div className="flex-1 flex items-center justify-center p-6 relative">
            {!generatedImage && !isGenerating ? (
              <div className="flex flex-col items-center justify-center text-center space-y-5 opacity-80 animate-in fade-in zoom-in duration-700">
                <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl animate-[bounce_4s_ease-in-out_infinite]">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-3xl" />
                  <ImageIcon className="h-10 w-10 text-slate-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-slate-300">Hozircha bo'sh</h3>
                  <p className="text-sm text-slate-500 max-w-[280px] leading-relaxed">
                    Chap tomondagi panelga so'rov yozing va <span className="text-indigo-400">"Yaratish"</span> tugmasini bosing.
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full flex items-center justify-center group">
                {isGenerating && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#0a0a0c]/80 backdrop-blur-md transition-all duration-500 rounded-xl">
                    <div className="relative flex h-24 w-24 items-center justify-center mb-6">
                      <div className="absolute inset-0 rounded-full border-t-2 border-l-2 border-indigo-500 animate-[spin_1.5s_linear_infinite]"></div>
                      <div className="absolute inset-2 rounded-full border-b-2 border-r-2 border-violet-500 animate-[spin_2s_linear_infinite_reverse]"></div>
                      <Sparkles className="h-8 w-8 text-indigo-400 animate-pulse" />
                    </div>
                    <h3 className="text-lg font-medium text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-400 animate-pulse">
                      AI tasvirni chizmoqda (Runware)
                    </h3>
                    <p className="text-xs text-slate-500 mt-2 font-mono">Iltimos kuting...</p>
                  </div>
                )}

                {generatedImage && (
                  <img 
                    src={generatedImage} 
                    alt="AI Generated Design" 
                    onLoad={() => {
                      setIsGenerating(false);
                      toast.success("Dizayn tayyor!");
                    }}
                    onError={() => {
                      setIsGenerating(false);
                      toast.error("Rasmni yuklashda xatolik yuz berdi.");
                    }}
                    className={cn(
                      "max-w-full max-h-[600px] object-contain rounded-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out",
                      isGenerating ? "opacity-0 scale-95 blur-xl" : "opacity-100 scale-100 blur-0 hover:scale-[1.01]"
                    )}
                  />
                )}
              </div>
            )}
          </div>

          {generatedImage && !isGenerating && (
            <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800/80 bg-[#121215]/95 backdrop-blur-xl p-4 flex items-center justify-between animate-in slide-in-from-bottom-6 duration-500 rounded-b-2xl">
              <div className="text-xs text-slate-300 flex items-center gap-3">
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-sm">
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {selectedStyle}
                </div>
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800 shadow-sm font-mono">
                  {selectedRatio}
                </div>
              </div>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-10 px-4 border-slate-700 bg-slate-900/50 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all rounded-lg"
                >
                  <Share2 className="mr-2 h-4 w-4 text-slate-400" />
                  Ulashish
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={handleDownload} 
                  className="h-10 px-5 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all hover:-translate-y-0.5 rounded-lg group"
                >
                  <Download className="mr-2 h-4 w-4 group-hover:animate-bounce" />
                  Saqlash
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
