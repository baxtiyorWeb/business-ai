"use client";

import React from "react";
import { SourceRef } from "@/hooks/use-chatbot";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link as LinkIcon } from "lucide-react";

interface AnswerRendererProps {
  content: string;
  sources?: SourceRef[];
}

export const AnswerRenderer: React.FC<AnswerRendererProps> = ({
  content,
  sources,
}) => {
  // Agar manbalar bo'lmasa yoki bo'sh bo'lsa, matnni o'zini qaytaramiz
  if (!sources || sources.length === 0) {
    // Oddiy matnni render qilishda markdown formatlashni hisobga olish kerak bo'ladi.
    // Hozircha oddiy matn sifatida qaytaramiz.
    return <>{content}</>;
  }

  // Matnni iqtibos belgilari ([1], [2], ...) bo'yicha qismlarga ajratamiz
  // Regex iqtiboslarni topadi va ularni alohida element sifatida saqlaydi.
  const parts = content.split(/(\[\d+\])/g);

  return (
    <TooltipProvider delay={100}>
      {parts.map((part, index) => {
        const match = part.match(/\[(\d+)\]/);

        if (match) {
          const sourceIndex = parseInt(match[1], 10) - 1;
          const source = sources[sourceIndex];

          if (source) {
            return (
              <Tooltip key={index}>
                <TooltipTrigger >
                  <a
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block align-super text-xs font-bold text-indigo-400 bg-indigo-500/10 rounded-md px-1.5 py-0.5 mx-0.5 hover:bg-indigo-500/20 transition-colors"
                  >
                    {sourceIndex + 1}
                  </a>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-slate-800 border-slate-700 text-slate-300">
                  <p className="text-xs font-medium line-clamp-2">
                    {source.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                    <LinkIcon className="h-3 w-3" />
                    <span className="truncate">{source.uri}</span>
                  </p>
                </TooltipContent>
              </Tooltip>
            );
          }
        }

        // Oddiy matn qismi
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </TooltipProvider>
  );
};
