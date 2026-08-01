"use client";

import { useCallback, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateWithFallback } from "@/lib/ai-client";
import type { GatewayResult } from "@/lib/ai-gateway";
import {
  RatingTier,
  computeOverallPotential,
  normalizeRating,
  scoreToRating,
} from "@/lib/idea-ratings";

export type AiStepId =
  | "category"
  | "pros_cons"
  | "metrics"
  | "market"
  | "next_steps";

export interface AiStep {
  id: AiStepId;
  label: string;
  status: "idle" | "active" | "done";
}

export interface AiResult {
  category?: string;
  tags?: string[];
  pros?: string[];
  cons?: string[];
  usefulness_score?: number;
  market_demand_rating?: RatingTier;
  implementation_rating?: RatingTier;
  competition_rating?: RatingTier;
  monetization_rating?: RatingTier;
  overall_potential?: number;
  overall_potential_explanation?: string;
  market_potential?: string;
  suggested_directions?: string[];
  suggestions?: string[];
  next_steps?: string[];
}

export type AiProvider = GatewayResult["provider"];

const STEP_DEFINITIONS: { id: AiStepId; label: string }[] = [
  { id: "category", label: "Analyzing category and tags" },
  { id: "pros_cons", label: "Evaluating strengths and weaknesses" },
  { id: "metrics", label: "Computing market fit metrics" },
  { id: "market", label: "Assessing market potential" },
  { id: "next_steps", label: "Generating recommendations" },
];

const STEP_DELAY_MS = 450;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SYSTEM_PROMPT = `You are an experienced startup mentor and product strategist.

IMPORTANT RULES (mandatory):
1. If the user does not specify a year, always base your analysis on the year 2026.
2. If the user explicitly specifies a year (for example: 2024, 2025, 2027), base your analysis only on that year.
3. Previous years may only be mentioned for comparison, but the primary analysis must always focus on 2026 (or the year specified by the user).
4. Respond in the SAME LANGUAGE that the user uses in their request.
5. If the request is focused on the Uzbekistan market, prioritize local competitors (e.g. Telegram channels, local communities, Maslahat groups) over generic global ones, and adapt recommendations to local consumer behaviors.
6. Return ONLY the following JSON object. Do not include any additional text, explanations, markdown, or code fences.

{
  "category": "short category name",
  "tags": ["3 or 4 keywords"],
  "pros": ["3-4 concise and practical strengths"],
  "cons": ["2-3 clear weaknesses or risks"],
  "usefulness_score": "integer from 1 to 10",
  "market_demand_rating": "low" | "medium" | "good" | "very_good" | "excellent",
  "implementation_rating": "low" | "medium" | "good" | "very_good" | "excellent",
  "competition_rating": "low" | "medium" | "good" | "very_good" | "excellent",
  "monetization_rating": "low" | "medium" | "good" | "very_good" | "excellent",
  "overall_potential_explanation": "Explain in 1-2 sentences how the overall score was determined based on market demand, implementation difficulty, competition, monetization, and usefulness. Mention the 2026 context (or the user-specified year).",
  "market_potential": "2-3 sentences about the market potential based on the year 2026 (or the user-specified year).",
  "suggested_directions": ["3-5 short industry or niche names"],
  "suggestions": ["2-3 practical and specific recommendations. Include a definitive MVP choice (e.g. Telegram Bot vs Website) and mention specific target niches or local platforms instead of generic advice."],
  "next_steps": ["3-4 concrete and actionable next steps for the first 30 days, explaining exactly what to do tomorrow and next week to get started."]
}

For competition_rating:
The lower the competition and the easier the market entry, the higher the rating should be ("excellent"). If the market is highly competitive, assign a lower rating ("low").`;

export function useAi() {
  const [steps, setSteps] = useState<AiStep[]>(
    STEP_DEFINITIONS.map((s) => ({ ...s, status: "idle" })),
  );
  const [result, setResult] = useState<AiResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [provider, setProvider] = useState<AiProvider | null>(null);

  const reset = useCallback(() => {
    setSteps(STEP_DEFINITIONS.map((s) => ({ ...s, status: "idle" })));
    setResult(null);
    setError(null);
    setProvider(null);
  }, []);

  const generate = useCallback(
    async (title: string, content: string) => {
      reset();
      setIsGenerating(true);

      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          throw new Error("Please sign in to continue.");
        }

        if (
          !content ||
          typeof content !== "string" ||
          content.trim().length < 10
        ) {
          throw new Error(
            "Idea text is too short. Please write at least a few sentences.",
          );
        }

        const gateway = await generateWithFallback({
          prompt: `Title: ${title || "(untitled)"}\n\nIdea text:\n${content}`,
          history: [],
          systemPrompt: SYSTEM_PROMPT,
          json: true,
          grounding: false,
          mode: "business",
        });

        setProvider(gateway.provider);

        const rawText = gateway.text || "{}";

        let cleaned = rawText
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();

        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error("Valid JSON not found in AI response");
        }

        let parsed: any;
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          throw new Error("Failed to parse AI response as JSON");
        }

        const usefulnessScore =
          typeof parsed.usefulness_score === "number"
            ? parsed.usefulness_score
            : 6;

        const marketDemandRating = normalizeRating(parsed.market_demand_rating);
        const implementationRating = normalizeRating(
          parsed.implementation_rating,
        );
        const usefulnessRating = scoreToRating(usefulnessScore);
        const competitionRating = normalizeRating(parsed.competition_rating);
        const monetizationRating = normalizeRating(parsed.monetization_rating);

        const overallPotential = computeOverallPotential({
          market_demand: marketDemandRating,
          implementation: implementationRating,
          usefulness: usefulnessRating,
          competition: competitionRating,
          monetization: monetizationRating,
        });

        const full: AiResult = {
          category: parsed.category,
          tags: parsed.tags ?? [],
          pros: parsed.pros ?? [],
          cons: parsed.cons ?? [],
          usefulness_score: usefulnessScore,
          market_demand_rating: marketDemandRating,
          implementation_rating: implementationRating,
          competition_rating: competitionRating,
          monetization_rating: monetizationRating,
          overall_potential: overallPotential,
          overall_potential_explanation:
            parsed.overall_potential_explanation ||
            "This percentage is calculated based on market demand, ease of implementation, competition level, monetization potential, and usefulness score for the year 2026.",
          market_potential: parsed.market_potential,
          suggested_directions: parsed.suggested_directions ?? [],
          suggestions: parsed.suggestions ?? [],
          next_steps: parsed.next_steps ?? [],
        };

        await supabase.from("generations").insert({
          user_id: user.id,
          title: title || null,
          prompt: content,
          category: full.category ?? null,
          status: "completed",
          result: full,
        });

        const partial: AiResult = {};
        const reveal: { id: AiStepId; apply: () => void }[] = [
          {
            id: "category",
            apply: () => {
              partial.category = full.category;
              partial.tags = full.tags;
            },
          },
          {
            id: "pros_cons",
            apply: () => {
              partial.pros = full.pros;
              partial.cons = full.cons;
            },
          },
          {
            id: "metrics",
            apply: () => {
              partial.usefulness_score = full.usefulness_score;
              partial.market_demand_rating = full.market_demand_rating;
              partial.implementation_rating = full.implementation_rating;
              partial.competition_rating = full.competition_rating;
              partial.monetization_rating = full.monetization_rating;
              partial.overall_potential = full.overall_potential;
              partial.overall_potential_explanation =
                full.overall_potential_explanation;
            },
          },
          {
            id: "market",
            apply: () => {
              partial.market_potential = full.market_potential;
              partial.suggested_directions = full.suggested_directions;
            },
          },
          {
            id: "next_steps",
            apply: () => {
              partial.suggestions = full.suggestions;
              partial.next_steps = full.next_steps;
            },
          },
        ];

        for (const step of reveal) {
          setSteps((prev) =>
            prev.map((s) =>
              s.id === step.id ? { ...s, status: "active" } : s,
            ),
          );
          await delay(STEP_DELAY_MS);
          step.apply();
          setResult({ ...partial });
          setSteps((prev) =>
            prev.map((s) => (s.id === step.id ? { ...s, status: "done" } : s)),
          );
        }
      } catch {
        setError("error");
      } finally {
        setIsGenerating(false);
      }
    },
    [reset],
  );

  return { steps, result, isGenerating, error, provider, generate, reset };
}

export default useAi;
