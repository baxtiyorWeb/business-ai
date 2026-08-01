import {
  Briefcase,
  BookOpen,
  Target,
  Lightbulb,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { ChatMode } from "@/hooks/use-chatbot";

export type CategoryId =
  | "task"
  | "research"
  | "strategy"
  | "brainstorm"
  | "marketing"
  | "deep-analysis";

export type CategoryDef = {
  id: CategoryId;
  label: string;
  icon: typeof Briefcase;
  mode: ChatMode;
  starter: string;
  description: string;
  keywords: string[];
  accentText: string;
  accentBg: string;
  accentChipActive: string;
};

export const CATEGORIES: CategoryDef[] = [
  {
    id: "task",
    label: "Task",
    icon: Briefcase,
    mode: "general",
    starter: "Help me complete the following task step by step: ",
    description: "Complete a specific task",
    keywords: ["task", "complete", "do", "todo", "assignment", "checklist"],
    accentText: "text-indigo-300",
    accentBg: "bg-indigo-500/10",
    accentChipActive: "border-indigo-500/50 bg-indigo-500/15 text-indigo-300",
  },
  {
    id: "research",
    label: "Research",
    icon: BookOpen,
    mode: "general",
    starter: "Conduct in-depth research on the following topic: ",
    description: "Explore a topic in depth",
    keywords: ["research", "study", "analyze", "sources", "investigation"],
    accentText: "text-sky-300",
    accentBg: "bg-sky-500/10",
    accentChipActive: "border-sky-500/50 bg-sky-500/15 text-sky-300",
  },
  {
    id: "strategy",
    label: "Strategy",
    icon: Target,
    mode: "business",
    starter: "Create a strategy for the following goal: ",
    description: "Business and growth strategy",
    keywords: [
      "strategy",
      "startup",
      "market",
      "launch",
      "go-to-market",
      "gtm",
      "growth",
    ],
    accentText: "text-emerald-300",
    accentBg: "bg-emerald-500/10",
    accentChipActive:
      "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
  },
  {
    id: "brainstorm",
    label: "Brainstorm",
    icon: Lightbulb,
    mode: "general",
    starter: "Generate creative ideas for the following problem: ",
    description: "Idea generation",
    keywords: ["ideas", "brainstorm", "creative", "suggestions", "innovation"],
    accentText: "text-amber-300",
    accentBg: "bg-amber-500/10",
    accentChipActive: "border-amber-500/50 bg-amber-500/15 text-amber-300",
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: TrendingUp,
    mode: "business",
    starter: "Create a marketing campaign plan for the following product: ",
    description: "Marketing and social media planning",
    keywords: [
      "marketing",
      "social media",
      "advertising",
      "instagram",
      "tiktok",
      "campaign",
      "audience",
    ],
    accentText: "text-rose-300",
    accentBg: "bg-rose-500/10",
    accentChipActive: "border-rose-500/50 bg-rose-500/15 text-rose-300",
  },
  {
    id: "deep-analysis",
    label: "Deep Analysis",
    icon: Zap,
    mode: "science",
    starter:
      "Perform a detailed and comprehensive analysis of the following data: ",
    description: "Statistical and data analysis",
    keywords: [
      "deep analysis",
      "statistics",
      "calculate",
      "model",
      "analyze",
      "metrics",
      "data",
    ],
    accentText: "text-violet-300",
    accentBg: "bg-violet-500/10",
    accentChipActive: "border-violet-500/50 bg-violet-500/15 text-violet-300",
  },
];

export function classifyCategory(text: string): CategoryDef | null {
  const t = text.toLowerCase();
  if (!t.trim()) return null;
  let best: CategoryDef | null = null;
  let bestScore = 0;
  for (const cat of CATEGORIES) {
    let score = 0;
    for (const kw of cat.keywords) {
      if (t.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  return bestScore > 0 ? best : null;
}