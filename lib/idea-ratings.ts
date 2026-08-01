export type RatingTier = "past" | "orta" | "yaxshi" | "juda_yaxshi" | "alo";

export const RATING_ORDER: RatingTier[] = [
  "past",
  "orta",
  "yaxshi",
  "juda_yaxshi",
  "alo",
];

export const RATING_LABEL: Record<RatingTier, string> = {
  past: "Past",
  orta: "O'rta",
  yaxshi: "Yaxshi",
  juda_yaxshi: "Juda yaxshi",
  alo: "A'lo",
};

export const RATING_SCORE: Record<RatingTier, number> = {
  past: 1,
  orta: 2,
  yaxshi: 3,
  juda_yaxshi: 4,
  alo: 5,
};

export const RATING_TEXT_COLOR: Record<RatingTier, string> = {
  past: "text-rose-400",
  orta: "text-amber-400",
  yaxshi: "text-emerald-400",
  juda_yaxshi: "text-emerald-400",
  alo: "text-indigo-300",
};

export const RATING_DOT_COLOR: Record<RatingTier, string> = {
  past: "bg-rose-500",
  orta: "bg-amber-500",
  yaxshi: "bg-emerald-500",
  juda_yaxshi: "bg-emerald-500",
  alo: "bg-indigo-400",
};

export interface MetricDefinition {
  id: string;
  label: string;
  weight: number;
}

export const METRIC_DEFINITIONS: MetricDefinition[] = [
  { id: "market_demand", label: "Bozor talabi", weight: 1.2 },
  { id: "implementation", label: "Amalga oshirish", weight: 1 },
  { id: "usefulness", label: "Foydalilik", weight: 1.3 },
  { id: "competition", label: "Raqobat darajasi", weight: 0.8 },
  { id: "monetization", label: "Monetizatsiya", weight: 1.2 },
];

export function normalizeRating(raw: string | undefined): RatingTier {
  const value = (raw ?? "").toLowerCase().replace(/['\u2019]/g, "").trim();
  if (value.includes("alo")) return "alo";
  if (value.includes("juda")) return "juda_yaxshi";
  if (value.includes("yaxshi")) return "yaxshi";
  if (value.includes("orta")) return "orta";
  if (value.includes("past") || value.includes("yomon")) return "past";
  return "orta";
}

export function scoreToRating(score: number): RatingTier {
  if (score >= 9) return "alo";
  if (score >= 7) return "juda_yaxshi";
  if (score >= 5) return "yaxshi";
  if (score >= 3) return "orta";
  return "past";
}

export function computeOverallPotential(
  ratings: Partial<Record<string, RatingTier>>
): number {
  let weightedSum = 0;
  let weightTotal = 0;

  for (const metric of METRIC_DEFINITIONS) {
    const tier = ratings[metric.id];
    if (!tier) continue;
    weightedSum += RATING_SCORE[tier] * metric.weight;
    weightTotal += 5 * metric.weight;
  }

  if (weightTotal === 0) return 0;
  return Math.round((weightedSum / weightTotal) * 100);
}