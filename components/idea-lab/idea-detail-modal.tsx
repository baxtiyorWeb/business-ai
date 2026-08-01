"use client";

import { useState } from "react";
import {
  ThumbsUp,
  ThumbsDown,
  TrendingUp,
  Gauge,
  ListChecks,
  Tag,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { AiResult } from "@/hooks/use-ai";
import {
  METRIC_DEFINITIONS,
  RATING_LABEL,
  RATING_SCORE,
  RATING_TEXT_COLOR,
  RatingTier,
} from "@/lib/idea-ratings";
import { CircularProgress } from "@/components/idea-lab/circular-progress";

export type DetailTab =
  | "strengths"
  | "weaknesses"
  | "market"
  | "metrics"
  | "next_steps";

interface IdeaDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  result: AiResult | null;
  defaultTab?: DetailTab;
}

const TAB_CONFIG: { id: DetailTab; label: string; icon: React.ElementType }[] =
  [
    { id: "strengths", label: "Ijobiy", icon: ThumbsUp },
    { id: "weaknesses", label: "Salbiy", icon: ThumbsDown },
    { id: "market", label: "Bozor", icon: TrendingUp },
    { id: "metrics", label: "Metrikalar", icon: Gauge },
    { id: "next_steps", label: "Keyingi qadam", icon: ListChecks },
  ];

function metricRating(result: AiResult, id: string): RatingTier | undefined {
  switch (id) {
    case "market_demand":
      return result.market_demand_rating;
    case "implementation":
      return result.implementation_rating;
    case "usefulness":
      return result.usefulness_score
        ? (["past", "orta", "yaxshi", "juda_yaxshi", "alo"] as RatingTier[])[
            Math.min(4, Math.floor(result.usefulness_score / 2))
          ]
        : undefined;
    case "competition":
      return result.competition_rating;
    case "monetization":
      return result.monetization_rating;
    default:
      return undefined;
  }
}

export function IdeaDetailModal({
  open,
  onOpenChange,
  title,
  result,
  defaultTab = "strengths",
}: IdeaDetailModalProps) {
  const [tab, setTab] = useState<DetailTab>(defaultTab);

  if (!result) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setTab(defaultTab);
      }}
    >
      <DialogContent className="flex flex-col max-h-[85vh] w-full max-w-3xl border-slate-800 bg-[#0a0a0c] p-0 overflow-hidden text-slate-100 shadow-2xl">
        {/* Yuqori qism (Header & Potensial) */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-800/60 p-6 shrink-0 bg-[#0a0a0c]">
          <div className="min-w-0 space-y-2">
            <DialogHeader className="space-y-1 text-left">
              <DialogTitle className="text-xl font-bold text-slate-100 tracking-tight">
                {title || "Sarlavhasiz g'oya"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-400">
                To'liq AI tahlili — batafsil ko'rsatkichlar va tavsiyalar
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {result.category && (
                <Badge className="border-0 bg-indigo-500/15 text-indigo-300 font-medium hover:bg-indigo-500/20">
                  {result.category}
                </Badge>
              )}
              {result.tags?.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-slate-800 bg-slate-950/40 text-xs text-slate-400"
                >
                  <Tag className="mr-1 h-3 w-3 text-slate-500" />
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
          <div className="shrink-0">
            <CircularProgress
              value={result.overall_potential ?? 0}
              size={72}
              strokeWidth={6}
              label="Potensial"
            />
          </div>
        </div>

        {/* Tabs qismi */}
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as DetailTab)}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Tab tugmalari paneli */}
          <div className="px-6 pt-5 shrink-0 bg-[#0a0a0c]">
            <TabsList className="flex h-auto w-full items-center justify-between gap-1.5 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800/80">
              {TAB_CONFIG.map((t) => {
                const IconComponent = t.icon;
                const isActive = tab === t.id;
                return (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className={`flex flex-1 items-center justify-center gap-2 py-2 px-3 text-xs font-medium transition-all rounded-lg ${
                      isActive
                        ? "bg-indigo-600 text-white shadow-md"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <IconComponent
                      className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`}
                    />
                    <span className="truncate">{t.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Scroll bo'ladigan asosiy kontent qismi */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-4">
            <TabsContent
              value="strengths"
              className="mt-0 space-y-3 focus-visible:outline-none"
            >
              {result.pros && result.pros.length > 0 ? (
                result.pros.map((pro, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm"
                  >
                    <ThumbsUp className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {pro}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState text="Kuchli tomonlar hali aniqlanmagan." />
              )}
            </TabsContent>

            <TabsContent
              value="weaknesses"
              className="mt-0 space-y-3 focus-visible:outline-none"
            >
              {result.cons && result.cons.length > 0 ? (
                result.cons.map((con, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-sm"
                  >
                    <ThumbsDown className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {con}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState text="Zaif tomonlar hali aniqlanmagan." />
              )}
            </TabsContent>

            <TabsContent
              value="market"
              className="mt-0 space-y-4 focus-visible:outline-none"
            >
              {result.market_potential && (
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <p className="text-sm leading-relaxed text-slate-200">
                    {result.market_potential}
                  </p>
                </div>
              )}
              {result.suggested_directions &&
                result.suggested_directions.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Tavsiya qilingan yo'nalishlar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {result.suggested_directions.map((d) => (
                        <Badge
                          key={d}
                          variant="outline"
                          className="border-slate-800 bg-slate-900/80 text-slate-300 py-1 px-3 text-xs"
                        >
                          {d}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </TabsContent>

            <TabsContent
              value="metrics"
              className="mt-0 space-y-4 focus-visible:outline-none"
            >
              <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-4 space-y-4">
                {METRIC_DEFINITIONS.map((metric) => {
                  const rating = metricRating(result, metric.id);
                  if (!rating) return null;
                  const pct = (RATING_SCORE[rating] / 5) * 100;
                  return (
                    <div key={metric.id} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium">
                          {metric.label}
                        </span>
                        <span
                          className={`font-semibold ${RATING_TEXT_COLOR[rating]}`}
                        >
                          {RATING_LABEL[rating]}
                        </span>
                      </div>
                      <Progress value={pct} className="h-2 bg-slate-800" />
                    </div>
                  );
                })}
              </div>
              {typeof result.usefulness_score === "number" && (
                <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-xs">
                  <span className="text-slate-300 font-medium">
                    Foydalilik bahosi
                  </span>
                  <span className="font-bold text-sm text-indigo-400">
                    {result.usefulness_score} / 10
                  </span>
                </div>
              )}
            </TabsContent>

            <TabsContent
              value="next_steps"
              className="mt-0 space-y-3 focus-visible:outline-none"
            >
              {result.next_steps && result.next_steps.length > 0 ? (
                result.next_steps.map((step, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 shadow-sm"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-xs font-bold text-indigo-300">
                      {i + 1}
                    </span>
                    <p className="flex-1 text-sm text-slate-200 leading-relaxed">
                      {step}
                    </p>
                    <ArrowRight className="h-4 w-4 shrink-0 text-slate-500" />
                  </div>
                ))
              ) : (
                <EmptyState text="Keyingi qadamlar hali tayyorlanmagan." />
              )}
              {result.suggestions && result.suggestions.length > 0 && (
                <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-800/60">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Qo'shimcha tavsiyalar
                  </p>
                  <div className="space-y-1.5 rounded-xl border border-slate-800/60 bg-slate-900/20 p-3.5">
                    {result.suggestions.map((s, i) => (
                      <p
                        key={i}
                        className="text-xs text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-indigo-400 font-bold">•</span> {s}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ text }: { text: string }) {
  return <p className="py-12 text-center text-xs text-slate-500">{text}</p>;
}

export default IdeaDetailModal;
