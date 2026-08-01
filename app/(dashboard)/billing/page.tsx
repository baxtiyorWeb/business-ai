"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Check,
  Sparkles,
  Zap,
  Building2,
  Rocket,
  Crown,
  ArrowRight,
  Loader2,
  Lock,
  Clock,
  Bell,
} from "lucide-react";
import { useBilling } from "@/hooks/use-billing";
import { toast } from "sonner";

const plansConfig = [
  {
    name: "Free",
    price: "0",
    limit: 20,
    description: "Perfect for trying the platform",
    features: [
      "20 generations per month",
      "Access to basic AI models",
      "Standard quality output",
      "Community support",
    ],
    icon: Zap,
  },
  {
    name: "Starter",
    price: "9",
    limit: 150,
    description: "For individual creators & freelancers",
    features: [
      "150 generations per month",
      "Basic + mid-tier AI models",
      "Good quality output",
      "Private collections",
      "Email support",
    ],
    icon: Rocket,
  },
  {
    name: "Pro",
    price: "19",
    limit: 400,
    description: "Best for professionals & power users",
    features: [
      "400 generations per month",
      "Access to all AI models",
      "High-quality output",
      "Priority generation queue",
      "Private collections",
      "Commercial usage rights",
    ],
    popular: true,
    icon: Sparkles,
  },
  {
    name: "Pro+",
    price: "29",
    limit: 800,
    description: "More power for serious work",
    features: [
      "800 generations per month",
      "Everything in Pro",
      "Faster generation speed",
      "Advanced prompt templates",
    ],
    icon: Crown,
  },
  {
    name: "Business",
    price: "49",
    limit: 2000,
    description: "Built for small teams",
    features: [
      "2,000 generations per month",
      "Everything in Pro+",
      "Up to 5 team members",
      "Shared workspace",
      "API access",
      "Custom brand kit",
    ],
    icon: Building2,
  },
  {
    name: "Enterprise",
    price: "99",
    limit: 5000,
    description: "For large teams and brands",
    features: [
      "5,000 generations per month",
      "Everything in Business",
      "Up to 20 team members",
      "SSO & Admin panel",
      "Dedicated support",
      "Custom model fine-tuning",
    ],
    icon: Building2,
  },
];

export default function BillingPage() {
  const { subscription, loading } = useBilling();

  if (loading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-[#09090b]">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const currentPlanName = subscription?.plan_name || "Free";
  const usedGenerations = subscription?.generations_used || 0;
  const limitGenerations = subscription?.generations_limit || 20;

  return (
    <div className="relative h-[calc(100vh-3.5rem)] overflow-hidden bg-[#09090b] text-slate-100">
      {/* ── Blurred Background (Pricing Cards) ── */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <div className="h-full w-full blur-[5px] opacity-50 scale-[0.97] origin-top">
          {/* Current plan status */}
          <div className="mx-auto max-w-6xl px-4 pt-6 pb-4">
            <div className="rounded-xl border border-slate-800/80 bg-[#0f0f12] p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Current plan</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-white">
                      {currentPlanName}
                    </span>
                    <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[11px] text-indigo-400 font-medium">
                      Active
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">
                    {usedGenerations} / {limitGenerations} generations used
                  </p>
                </div>
                <Button
                  variant="outline"
                  className="h-9 border-slate-800 bg-transparent text-slate-300 text-xs"
                  disabled
                >
                  Manage payment method
                </Button>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="mx-auto max-w-[1400px] px-4">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
              {plansConfig.map((plan) => {
                const Icon = plan.icon;
                return (
                  <div
                    key={plan.name}
                    className={`relative rounded-xl border p-5 flex flex-col justify-between ${
                      plan.popular
                        ? "border-indigo-500/50 bg-[#0f0f12] shadow-lg shadow-indigo-500/5 ring-1 ring-indigo-500/30"
                        : "border-slate-800/80 bg-[#0f0f12]"
                    }`}
                  >
                    {plan.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-indigo-600 px-3 py-0.5 text-[11px] font-medium text-white shadow-md">
                          Most Popular
                        </span>
                      </div>
                    )}

                    <div>
                      <div className="mb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Icon
                            className={`h-4 w-4 ${
                              plan.popular ? "text-indigo-400" : "text-slate-400"
                            }`}
                          />
                          <h3 className="text-base font-medium text-white">
                            {plan.name}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 min-h-[32px]">
                          {plan.description}
                        </p>
                      </div>

                      <div className="mb-5">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-semibold tracking-tight text-white">
                            ${plan.price}
                          </span>
                          <span className="text-xs text-slate-500">/mo</span>
                        </div>
                      </div>

                      <ul className="mb-6 space-y-2.5">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2">
                            <Check className="h-3.5 w-3.5 text-indigo-400 mt-0.5 shrink-0" />
                            <span className="text-xs text-slate-400 leading-tight">
                              {feature}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <Button
                      disabled
                      className={`w-full h-9 text-xs font-medium ${
                        plan.popular
                          ? "bg-indigo-600 text-white"
                          : "bg-transparent border border-slate-800 text-slate-300"
                      }`}
                    >
                      Upgrade to {plan.name}
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Overlay + Centered Modal ── */}
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <div className="relative w-full max-w-md rounded-2xl border border-slate-700/80 bg-[#0f0f12]/95 backdrop-blur-md p-8 shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-300">
          {/* Lock icon */}
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/10 border border-indigo-500/20">
            <Lock className="h-6 w-6 text-indigo-400" />
          </div>

          <h2 className="text-center text-xl font-semibold text-white mb-2">
            Billing is temporarily unavailable
          </h2>

          <p className="text-center text-sm text-slate-400 leading-relaxed mb-6">
            We are currently finalizing payment integration and plan management.
            Very soon you will be able to upgrade, manage subscriptions, and
            unlock the full power of NicheFX.
          </p>

          <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-200">
                  Coming very soon
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  All paid plans and features will be available shortly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-slate-200">
                  Full access is on the way
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  You will enjoy unlimited generations, advanced models, team
                  workspaces, and more.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            <Button
              onClick={() =>
                toast.success("You will be notified when billing goes live!")
              }
              className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
            >
              <Bell className="mr-2 h-4 w-4" />
              Notify me when it’s ready
            </Button>

            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full h-10 border-slate-700 bg-transparent text-slate-300 hover:bg-slate-800 hover:text-white text-sm"
            >
              Go back
            </Button>
          </div>

          <p className="mt-5 text-center text-[11px] text-slate-600">
            Thank you for your patience. We’re working hard to deliver the best
            experience.
          </p>
        </div>
      </div>
    </div>
  );
}