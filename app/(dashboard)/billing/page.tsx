"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Check,
  Sparkles,
  Zap,
  Rocket,
  ArrowRight,
  Loader2,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useBilling } from "@/hooks/use-billing";
import { PLANS_CONFIG, PlanConfig } from "@/lib/paddle-plans";

const ICONS_MAP: Record<string, React.ElementType> = {
  Free: Zap,
  Starter: Rocket,
  Pro: Sparkles,
};

export default function BillingPage() {
  const {
    subscription,
    loading,
    actionLoading,
    openCheckout,
    openCustomerPortal,
  } = useBilling();

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-3.5rem)] w-full items-center justify-center bg-[#09090b]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
          <p className="text-sm text-slate-400">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  const currentPlanName = subscription?.plan_name || "Free";
  const usedGenerations = subscription?.generations_used || 0;
  const limitGenerations = subscription?.generations_limit || 20;
  const usagePercent = Math.min(
    100,
    Math.round((usedGenerations / Math.max(1, limitGenerations)) * 100)
  );
  const isPaidUser = currentPlanName.toLowerCase() !== "free";

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#09090b] text-slate-100 pb-16">
      {/* ── Top Header & Current Subscription Status ── */}
      <div className="mx-auto max-w-dvw px-4 pt-8 pb-6 sm:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Plans & Pricing
            </h1>
            <p className="mt-1.5 text-sm text-slate-400">
              Choose the perfect plan to unlock the full potential of AI generation.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl shrink-0">
            <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>Guaranteed secure payments powered by <strong>Paddle</strong></span>
          </div>
        </div>

        {/* Current Plan Card */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-slate-950/90 p-6 shadow-xl">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Current Plan:
                </span>
                <span className="text-xl font-bold text-white">
                  {currentPlanName}
                </span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-semibold border ${isPaidUser
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                    : "border-indigo-500/30 bg-indigo-500/10 text-indigo-400"
                    }`}
                >
                  {subscription?.status === "active" ? "Active" : subscription?.status || "Active"}
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-md space-y-1.5 pt-1">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Generation Usage:</span>
                  <span className="font-medium text-slate-200">
                    {usedGenerations} / {limitGenerations} ({usagePercent}%)
                  </span>
                </div>
                <Progress value={usagePercent} className="h-2 bg-slate-800" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isPaidUser && (
                <Button
                  variant="outline"
                  onClick={openCustomerPortal}
                  disabled={actionLoading === "portal"}
                  className="h-10 border-slate-700 bg-slate-800/60 text-slate-200 hover:bg-slate-700 hover:text-white text-xs font-medium"
                >
                  {actionLoading === "portal" ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="mr-2 h-4 w-4 text-indigo-400" />
                  )}
                  Manage Subscription
                  <ExternalLink className="ml-1.5 h-3.5 w-3.5 opacity-60" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Plans Grid (3 Plans: Free, Starter, Pro) ── */}
      <div className="mx-auto max-w-dvw px-4 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3">
          {PLANS_CONFIG.map((plan: PlanConfig) => {
            const Icon = ICONS_MAP[plan.name] || Zap;
            const isCurrent =
              currentPlanName.toLowerCase() === plan.name.toLowerCase();
            const isFree = plan.name.toLowerCase() === "free";
            const isLoadingThis = actionLoading === plan.name;

            return (
              <div
                key={plan.name}
                className={`relative flex flex-col justify-between rounded-2xl border p-6 transition-all duration-200 ${isCurrent
                  ? "border-emerald-500/60 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-lg shadow-emerald-500/5 ring-1 ring-emerald-500/30"
                  : plan.popular
                    ? "border-indigo-500/60 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 shadow-xl shadow-indigo-500/10 ring-1 ring-indigo-500/40"
                    : "border-slate-800/80 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90"
                  }`}
              >
                {plan.popular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                      Most Popular
                    </span>
                  </div>
                )}

                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-emerald-600 px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
                      Current Plan
                    </span>
                  </div>
                )}

                <div>
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${plan.popular
                          ? "bg-indigo-500/20 text-indigo-400"
                          : isCurrent
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-slate-800 text-slate-400"
                          }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-lg font-bold text-white">
                        {plan.name}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-400 min-h-[36px] leading-relaxed">
                      {plan.description}
                    </p>
                  </div>

                  <div className="mb-6 border-y border-slate-800/80 py-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold tracking-tight text-white">
                        ${plan.price}
                      </span>
                      <span className="text-xs font-medium text-slate-400">/mo</span>
                    </div>
                    <span className="mt-1 block text-xs font-semibold text-indigo-400">
                      {plan.limit.toLocaleString()} generations per month
                    </span>
                  </div>

                  <ul className="mb-8 space-y-3">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                        <span className="text-xs text-slate-300 leading-snug">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  {isCurrent ? (
                    <Button
                      disabled
                      className="w-full h-10 text-xs font-semibold bg-emerald-950/40 text-emerald-400 border border-emerald-500/40 cursor-default"
                    >
                      <CheckCircle2 className="mr-1.5 h-4 w-4 text-emerald-400" />
                      Current Plan
                    </Button>
                  ) : isFree ? (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full h-10 text-xs font-medium border-slate-800 bg-transparent text-slate-500"
                    >
                      Free Plan
                    </Button>
                  ) : (
                    <Button
                      onClick={() => openCheckout(plan.priceId || "", plan.name)}
                      disabled={isLoadingThis}
                      className={`w-full h-10 text-xs font-semibold transition-all ${plan.popular
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25"
                        : "bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
                        }`}
                    >
                      {isLoadingThis ? (
                        <>
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          Opening...
                        </>
                      ) : (
                        <>
                          Upgrade to {plan.name}
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}