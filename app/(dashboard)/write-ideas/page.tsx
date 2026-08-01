"use client";

import { SetStateAction, useEffect, useState } from "react";
import {
  Sparkles,
  History,
  TrendingUp,
  ThumbsUp,
  ThumbsDown,
  Lightbulb,
  Loader2,
  CheckCircle2,
  Circle,
  Wand2,
  HelpCircle,
  Eye,
  ChevronRight,
  Rocket,
  Megaphone,
  Boxes,
  Users2,
  Compass,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import useAi, { AiResult, AiProvider } from "@/hooks/use-ai";
import { GradientBorder } from "@/components/idea-lab/gradient-border";
import { CircularProgress } from "@/components/idea-lab/circular-progress";
import {
  IdeaDetailModal,
  DetailTab,
} from "@/components/idea-lab/idea-detail-modal";
import { RATING_LABEL, RATING_TEXT_COLOR } from "@/lib/idea-ratings";

interface GenerationRow {
  id: string;
  title: string | null;
  category: string | null;
  result: AiResult | null;
  created_at: string;
}

const TONE_OPTIONS = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "persuasive", label: "Persuasive" },
  { value: "friendly", label: "Friendly" },
];

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "uz", label: "Uzbek" },
  { value: "ru", label: "Russian" },
];

const POPULAR_SUGGESTIONS = [
  "SaaS startup idea",
  "E-commerce product",
  "Mobile app concept",
  "Marketing campaign",
  "Personal brand",
];

const MAX_CONTENT_LENGTH = 2000;

const RECENT_ICONS = [Rocket, Megaphone, Boxes, Users2];
const RECENT_ICON_COLORS = [
  "bg-indigo-500/15 text-indigo-300",
  "bg-rose-500/15 text-rose-300",
  "bg-emerald-500/15 text-emerald-300",
  "bg-amber-500/15 text-amber-300",
];

const PROVIDER_LABEL: Record<AiProvider, string> = {
  gemini: "Gemini",
  openrouter: "OpenRouter",
  mistral: "Mistral",
};

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function WriteIdeasPage() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tone, setTone] =
    useState<SetStateAction<string | any>>("professional");
  const [language, setLanguage] =
    useState<SetStateAction<string | null | undefined>>("en");
  const [recent, setRecent] = useState<GenerationRow[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<DetailTab>("strengths");
  const [viewingHistory, setViewingHistory] = useState<GenerationRow | null>(
    null,
  );

  const { steps, result, isGenerating, error, provider, generate } = useAi();

  useEffect(() => {
    loadRecent();
  }, []);

  async function loadRecent() {
    setLoadingRecent(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoadingRecent(false);
      return;
    }

    const { data } = await supabase
      .from("generations")
      .select("id, title, category, result, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5);

    setRecent(data ?? []);
    setLoadingRecent(false);
  }

  async function handleGenerate() {
    if (content.trim().length < 10 || isGenerating) return;
    setViewingHistory(null);
    await generate(title, content);
    loadRecent();
  }

  function handleSuggestTitle() {
    if (content.trim().length < 10) return;
    const words = content.trim().split(/\s+/).slice(0, 6).join(" ");
    setTitle(words.charAt(0).toUpperCase() + words.slice(1));
  }

  function openDetail(tab: DetailTab) {
    setViewingHistory(null);
    setModalTab(tab);
    setModalOpen(true);
  }

  function viewHistoryItem(g: GenerationRow) {
    if (!g.result) return;
    setViewingHistory(g);
    setModalTab("strengths");
    setModalOpen(true);
  }

  const canGenerate = content.trim().length >= 10 && !isGenerating;
  const hasPanelContent = isGenerating || result !== null;
  const charCount = content.trim().length;
  const charPct = Math.min(100, (charCount / MAX_CONTENT_LENGTH) * 100);

  const strengthsCount = result?.pros?.length ?? 0;
  const weaknessesCount = result?.cons?.length ?? 0;
  const marketLabel =
    result?.market_demand_rating && result.market_demand_rating !== "past"
      ? "High"
      : result
        ? "Medium"
        : "—";

  const modalTitle = viewingHistory ? (viewingHistory.title ?? "") : title;
  const modalResult = viewingHistory ? viewingHistory.result : result;

  return (
    <div className="flex flex-1 flex-col p-4 md:p-8">
      <div className="mx-auto w-full max-w-dvw space-y-6">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-6 xl:col-span-7">
            <GradientBorder>
              <Card className="border-0 bg-transparent">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-base font-medium text-slate-200">
                    What&apos;s on your mind?
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-400 sm:text-sm">
                    Describe your idea in detail. The more context, the better
                    results.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between space-y-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Idea title"
                        maxLength={120}
                        className="border-slate-800 bg-slate-950/50 pr-10 text-slate-100 placeholder:text-slate-600 focus-visible:ring-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={handleSuggestTitle}
                        disabled={content.trim().length < 10}
                        title="Suggest a title with AI"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-indigo-400 transition-colors hover:bg-indigo-500/10 disabled:cursor-not-allowed disabled:text-slate-700"
                      >
                        <Sparkles className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="space-y-1.5">
                      <Textarea
                        value={content}
                        onChange={(e) =>
                          setContent(
                            e.target.value.slice(0, MAX_CONTENT_LENGTH),
                          )
                        }
                        onKeyDown={(e) => {
                          if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                            e.preventDefault();
                            handleGenerate();
                          }
                        }}
                        placeholder="Example: An AI assistant that automatically creates and publishes social media posts for small business owners..."
                        rows={9}
                        className="resize-none border-slate-800 bg-slate-950/50 text-slate-200 placeholder:text-slate-600 focus-visible:ring-indigo-500"
                      />
                      <div className="h-0.5 w-full overflow-hidden rounded-full bg-slate-800/60">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            charPct >= 95
                              ? "bg-rose-500"
                              : charPct >= 75
                                ? "bg-amber-500"
                                : "bg-indigo-500",
                          )}
                          style={{ width: `${charPct}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Select value={tone} onValueChange={setTone}>
                        <SelectTrigger className="w-[160px] border-slate-800 bg-slate-950/50 text-xs text-slate-300">
                          <SelectValue placeholder="Tone" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-800 bg-[#0d0d10] text-slate-200">
                          {TONE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={language} onValueChange={setLanguage}>
                        <SelectTrigger className="w-[140px] border-slate-800 bg-slate-950/50 text-xs text-slate-300">
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent className="border-slate-800 bg-[#0d0d10] text-slate-200">
                          {LANGUAGE_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs text-slate-500">
                        {charCount} / {MAX_CONTENT_LENGTH}
                        {charCount > 0 && charCount < 10
                          ? " · at least 10 characters required"
                          : ""}
                        {charCount >= 10 && (
                          <span className="ml-2 hidden text-slate-600 sm:inline">
                            · Press Ctrl/⌘ + Enter to submit
                          </span>
                        )}
                      </span>
                      <Button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-slate-100 shadow-md shadow-indigo-900/20 transition-all hover:from-indigo-500 hover:to-purple-500 hover:shadow-lg hover:shadow-indigo-900/30 active:scale-[0.98] disabled:opacity-50"
                      >
                        {isGenerating ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                        Generate ideas
                      </Button>
                    </div>
                    {error && (
                      <p className="animate-in fade-in text-xs text-rose-400 duration-200">
                        {error}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </GradientBorder>

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <Wand2 className="h-3.5 w-3.5" />
                Popular suggestions
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() =>
                      setContent((prev) => (prev ? `${prev}\n${s}` : s))
                    }
                    className="rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs text-slate-400 transition-all duration-150 hover:border-indigo-500/40 hover:bg-slate-900 hover:text-slate-200 active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <Card className="border-slate-800 bg-slate-900/40">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="flex items-center gap-2 text-base font-medium text-slate-200">
                  <History className="h-4 w-4 text-slate-500" />
                  Recent generations
                </CardTitle>
                <button className="text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300">
                  View all
                </button>
              </CardHeader>
              <CardContent>
                {loadingRecent ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <Skeleton
                        key={i}
                        className="h-12 w-full rounded-lg bg-slate-900"
                      />
                    ))}
                  </div>
                ) : recent.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-500 sm:text-sm">
                    No analyses yet. Write your first idea to get started.
                  </p>
                ) : (
                  <ScrollArea className="max-h-64">
                    <div className="scroll-smooth space-y-2">
                      {recent.map((g, i) => {
                        const Icon = RECENT_ICONS[i % RECENT_ICONS.length];
                        return (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => viewHistoryItem(g)}
                            disabled={!g.result}
                            className="flex w-full items-center justify-between rounded-lg border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-left transition-colors duration-150 hover:border-slate-700 hover:bg-slate-900/50 disabled:cursor-default disabled:hover:border-slate-800/80 disabled:hover:bg-slate-950/40"
                          >
                            <div className="flex min-w-0 items-center gap-3 pr-4">
                              <div
                                className={cn(
                                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                                  RECENT_ICON_COLORS[
                                    i % RECENT_ICON_COLORS.length
                                  ],
                                )}
                              >
                                <Icon className="h-4 w-4" />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate text-xs font-medium text-slate-200 sm:text-sm">
                                  {g.title || "Untitled idea"}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {g.category || "Idea Lab"} ·{" "}
                                  {relativeTime(g.created_at)}
                                </p>
                              </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {typeof g.result?.overall_potential ===
                                "number" && (
                                <Badge
                                  variant="outline"
                                  className="border-slate-800 bg-slate-900 text-slate-400"
                                >
                                  {g.result.overall_potential}%
                                </Badge>
                              )}
                              <span className="rounded-md p-1 text-slate-600 transition-colors group-hover:text-slate-300">
                                <Eye className="h-4 w-4" />
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 xl:col-span-5">
            <Card className="border-slate-800 bg-slate-900/40">
              <CardHeader className="flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-medium text-slate-200">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    AI Analysis
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs text-slate-500">
                    Your idea has been analyzed and evaluated.
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col">
                {!hasPanelContent && (
                  <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
                    <Lightbulb className="h-8 w-8 text-slate-700" />
                    <p className="text-xs text-slate-500 sm:text-sm">
                      Write your idea and hit generate —
                      <br />
                      analysis and results will appear here automatically
                    </p>
                  </div>
                )}

                {hasPanelContent && (
                  <div className="space-y-5">
                    {isGenerating && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-[11px] text-slate-500">
                          <span>Analyzing</span>
                          <span className="font-medium text-slate-400">
                            {steps.filter((s) => s.status === "done").length}/
                            {steps.length}
                          </span>
                        </div>
                        <Progress
                          value={
                            (steps.filter((s) => s.status === "done").length /
                              steps.length) *
                            100
                          }
                          className="h-1 bg-slate-800"
                        />
                        <div className="space-y-2">
                          {steps.map((step) => (
                            <div
                              key={step.id}
                              className={cn(
                                "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors duration-200 sm:text-sm",
                                step.status === "active" && "bg-indigo-500/10",
                              )}
                            >
                              {step.status === "done" ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                              ) : step.status === "active" ? (
                                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-indigo-400" />
                              ) : (
                                <Circle className="h-4 w-4 shrink-0 text-slate-700" />
                              )}
                              <span
                                className={cn(
                                  step.status === "done" && "text-slate-300",
                                  step.status === "active" && "text-indigo-300",
                                  step.status === "idle" && "text-slate-600",
                                )}
                              >
                                {step.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {typeof result?.overall_potential === "number" && (
                      <>
                        <Separator className="bg-slate-800" />
                        <div className="flex items-center gap-5 animate-in fade-in duration-300">
                          <CircularProgress
                            value={result.overall_potential}
                            size={104}
                            strokeWidth={9}
                            explanation={result.overall_potential_explanation}
                          />
                          <div className="flex-1 space-y-2">
                            {[
                              {
                                label: "Market demand",
                                rating: result.market_demand_rating,
                              },
                              {
                                label: "Feasibility",
                                rating: result.implementation_rating,
                              },
                              {
                                label: "Competition",
                                rating: result.competition_rating,
                              },
                              {
                                label: "Monetization",
                                rating: result.monetization_rating,
                              },
                            ].map((row) =>
                              row.rating ? (
                                <div
                                  key={row.label}
                                  className="flex items-center justify-between gap-3 text-xs"
                                >
                                  <span className="flex items-center gap-1.5 text-slate-400">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                    {row.label}
                                  </span>
                                  <span
                                    className={cn(
                                      "font-medium",
                                      RATING_TEXT_COLOR[row.rating],
                                    )}
                                  >
                                    {RATING_LABEL[row.rating]}
                                  </span>
                                </div>
                              ) : null,
                            )}
                            {typeof result.usefulness_score === "number" && (
                              <div className="flex items-center justify-between gap-3 text-xs">
                                <span className="flex items-center gap-1.5 text-slate-400">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  Usefulness
                                </span>
                                <span className="font-medium text-emerald-400">
                                  {result.usefulness_score >= 8
                                    ? "Excellent"
                                    : result.usefulness_score >= 5
                                      ? "Good"
                                      : "Average"}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    )}

                    {result?.market_potential && (
                      <div className="animate-in fade-in space-y-1.5 duration-300">
                        <p className="flex items-center gap-1.5 text-xs font-medium text-slate-300">
                          <Compass className="h-3.5 w-3.5 text-sky-400" />
                          Market potential
                        </p>
                        <p className="text-xs leading-relaxed text-slate-500 sm:text-sm">
                          {result.market_potential}
                        </p>
                      </div>
                    )}

                    {result?.suggested_directions &&
                      result.suggested_directions.length > 0 && (
                        <div className="animate-in fade-in space-y-2 duration-300">
                          <p className="text-xs font-medium text-slate-300">
                            Suggested directions
                          </p>
                          <div className="flex flex-wrap gap-1.5">
                            {result.suggested_directions.map((d) => (
                              <Badge
                                key={d}
                                variant="outline"
                                className="border-slate-800 bg-slate-950/40 text-xs text-slate-400"
                              >
                                {d}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                    {typeof result?.usefulness_score === "number" && (
                      <div className="animate-in fade-in space-y-1.5 duration-300">
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>Usefulness score</span>
                          <span className="font-medium text-slate-300">
                            {result.usefulness_score}/10
                          </span>
                        </div>
                        <Progress
                          value={result.usefulness_score * 10}
                          className="h-1.5 bg-slate-800"
                        />
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {result && (
              <div className="animate-in fade-in space-y-3 duration-300">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Quick directions
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <QuickDirectionCard
                    accent="green"
                    icon={ThumbsUp}
                    label="Strengths"
                    value={`${strengthsCount}`}
                    onClick={() => openDetail("strengths")}
                  />
                  <QuickDirectionCard
                    accent="purple"
                    icon={ThumbsDown}
                    label="Weaknesses"
                    value={`${weaknessesCount}`}
                    onClick={() => openDetail("weaknesses")}
                  />
                  <QuickDirectionCard
                    accent="orange"
                    icon={TrendingUp}
                    label="Market potential"
                    value={marketLabel}
                    valueSublabel="Growth signal"
                    onClick={() => openDetail("market")}
                  />
                </div>
              </div>
            )}

            {result?.next_steps && result.next_steps.length > 0 && (
              <Card className="animate-in fade-in border-slate-800 bg-slate-900/40 duration-300">
                <CardHeader>
                  <CardTitle className="text-base font-medium text-slate-200">
                    Next steps
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {result.next_steps.map((step, i) => (
                    <button
                      key={i}
                      onClick={() => openDetail("next_steps")}
                      className="flex w-full items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3.5 py-2.5 text-left transition-colors duration-150 hover:border-indigo-500/30 hover:bg-slate-900/60"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-[10px] font-semibold text-indigo-300">
                        {i + 1}
                      </span>
                      <span className="flex-1 text-xs text-slate-300 sm:text-sm">
                        {step}
                      </span>
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
                    </button>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <IdeaDetailModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setViewingHistory(null);
        }}
        title={modalTitle}
        result={modalResult}
        defaultTab={modalTab}
      />
    </div>
  );
}

function QuickDirectionCard({
  accent,
  icon: Icon,
  label,
  value,
  valueSublabel,
  onClick,
}: {
  accent: "green" | "purple" | "orange";
  icon: React.ElementType;
  label: string;
  value: string;
  valueSublabel?: string;
  onClick: () => void;
}) {
  const theme = {
    green: {
      border: "from-emerald-500/60 via-emerald-500/10 to-emerald-500/60",
      icon: "text-emerald-400",
      value: "text-emerald-300",
      link: "text-emerald-400",
    },
    purple: {
      border: "from-purple-500/60 via-purple-500/10 to-purple-500/60",
      icon: "text-purple-400",
      value: "text-purple-300",
      link: "text-purple-400",
    },
    orange: {
      border: "from-amber-500/60 via-amber-500/10 to-amber-500/60",
      icon: "text-amber-400",
      value: "text-amber-300",
      link: "text-amber-400",
    },
  }[accent];

  return (
    <div className={cn("rounded-xl bg-gradient-to-br p-[1px]", theme.border)}>
      <button
        onClick={onClick}
        className="flex h-full w-full flex-col items-start gap-2 rounded-[11px] bg-[#0c0c10] p-3.5 text-left transition-all duration-150 hover:bg-slate-900/60 active:scale-[0.98]"
      >
        <Icon className={cn("h-4 w-4", theme.icon)} />
        <span className={cn("text-lg font-bold leading-none", theme.value)}>
          {value}
        </span>
        {valueSublabel && (
          <span className="text-[10px] text-slate-500">{valueSublabel}</span>
        )}
        <span className="text-[11px] text-slate-500">{label}</span>
        <span
          className={cn(
            "mt-1 flex items-center gap-1 text-[11px] font-medium",
            theme.link,
          )}
        >
          View details
          <ChevronRight className="h-3 w-3" />
        </span>
      </button>
    </div>
  );
}