"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  Lightbulb,
  MessageSquare,
  Target,
  BarChart3,
  Zap,
  Users,
  CheckCircle2,
  Search,
  Megaphone,
  Brain,
  Rocket,
  Play,
  Shield,
  Clock,
  Layers,
} from "lucide-react";

const FEATURES = [
  {
    icon: Lightbulb,
    title: "Idea Lab",
    desc: "Turn a rough thought into structured startup, product, and campaign concepts—scored and analyzed by AI.",
  },
  {
    icon: MessageSquare,
    title: "NicheFX Agent",
    desc: "Chat with an agent built for SMM, market entry, startup validation, and career planning—not generic answers.",
  },
  {
    icon: Target,
    title: "Mode-based workflows",
    desc: "Task, Research, Strategy, Brainstorm, Marketing, and Deep Analysis—pick the lens, get focused output.",
  },
  {
    icon: BarChart3,
    title: "AI analysis panel",
    desc: "Every idea and conversation surfaces insights, steps, and next questions so you know what to do next.",
  },
  {
    icon: Zap,
    title: "From idea to plan",
    desc: "Go from “what if…” to metrics, positioning, and go-to-market direction in one workspace.",
  },
  {
    icon: Users,
    title: "Built for builders",
    desc: "Founders, marketers, and operators who need clarity fast—not another endless chat toy.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Describe your idea or goal",
    desc: "Write a startup concept, product angle, or business question. More context means sharper analysis.",
  },
  {
    step: "02",
    title: "Generate or ask the agent",
    desc: "Use Idea Lab for structured concepts, or open the chatbot in Task, Research, Strategy, Marketing, and more.",
  },
  {
    step: "03",
    title: "Act on the analysis",
    desc: "Review scores, key insights, suggested next steps, and follow-up questions—then iterate in the same workspace.",
  },
];

const USE_CASES = [
  {
    icon: Rocket,
    title: "Startup founders",
    desc: "Validate concepts, map market entry, and pressure-test positioning before you build.",
  },
  {
    icon: Megaphone,
    title: "Marketers & SMM",
    desc: "Campaign angles, content strategy, and channel plans grounded in your niche.",
  },
  {
    icon: Search,
    title: "Researchers",
    desc: "Deep dives on markets, competitors, and opportunities with structured takeaways.",
  },
  {
    icon: Brain,
    title: "Operators & career",
    desc: "Role planning, skill roadmaps, and decision frameworks when the path is unclear.",
  },
];

const MODES = [
  { icon: Layers, label: "Task", desc: "Complete a specific task" },
  { icon: Search, label: "Research", desc: "Explore a topic in depth" },
  { icon: Target, label: "Strategy", desc: "Business and growth strategy" },
  { icon: Lightbulb, label: "Brainstorm", desc: "Idea generation" },
  { icon: Megaphone, label: "Marketing", desc: "Marketing and social planning" },
  { icon: BarChart3, label: "Deep Analysis", desc: "Statistical and data analysis" },
];

const STATS = [
  { value: "2", label: "Core workspaces" },
  { value: "6", label: "Agent modes" },
  { value: "1", label: "Place for ideas → plans" },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-slate-100">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/60 bg-[#09090b]/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-semibold tracking-tight">NicheFX</span>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
            <Link href="#features" className="transition-colors hover:text-white">
              Features
            </Link>
            <Link href="#how" className="transition-colors hover:text-white">
              How it works
            </Link>
            <Link href="#modes" className="transition-colors hover:text-white">
              Agent modes
            </Link>
            <Link href="#use-cases" className="transition-colors hover:text-white">
              Who it’s for
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/sign-in">
              <Button
                variant="link"
                className="h-8 text-sm text-slate-500 hover:text-slate-300"
              >
                Sign in
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button className="h-8 bg-indigo-600 text-sm hover:bg-indigo-500">
                Get started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 pb-24 pt-32">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.12),_transparent_55%)]" />
        <div className="relative mx-auto max-w-3xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/50 px-3 py-1 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            Idea Lab + AI Agent for builders
          </div>

          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white sm:text-5xl">
            From rough idea
            <br />
            to clear strategy—
            <br />
            <span className="text-indigo-400">with AI that knows your niche</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-400">
            NicheFX combines Idea Lab and a specialized agent for SMM, market entry,
            startup validation, and career planning. Generate concepts, stress-test
            them, and leave with next steps—not more noise.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up">
              <Button className="h-11 bg-indigo-600 px-6 text-sm font-medium hover:bg-indigo-500">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="#how">
              <Button
                variant="outline"
                className="h-11 border-slate-800 bg-transparent px-6 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                <Play className="mr-2 h-3.5 w-3.5" />
                See how it works
              </Button>
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-6 border-t border-slate-800/60 pt-10">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl font-semibold tracking-tight text-white">
                  {s.value}
                </p>
                <p className="mt-1 text-xs text-slate-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-slate-800/60 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Everything in one workspace
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
              Idea generation, structured analysis, and a strategy-ready agent—
              designed for founders and marketers.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-800/80 bg-[#0f0f12] p-6 transition-colors hover:border-slate-700"
              >
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10">
                  <item.icon className="h-4 w-4 text-indigo-400" />
                </div>
                <h3 className="text-sm font-medium text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" className="border-t border-slate-800/60 px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              How it works
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Three steps from thought to actionable plan
            </p>
          </div>

          <div className="space-y-8">
            {STEPS.map((item) => (
              <div key={item.step} className="flex gap-6">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-800 bg-[#0f0f12] text-xs font-medium text-indigo-400">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{item.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="modes" className="border-t border-slate-800/60 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Agent modes for real work
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Switch the mode—get answers shaped for the job, not generic chat.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MODES.map((m) => (
              <div
                key={m.label}
                className="flex items-start gap-3 rounded-xl border border-slate-800/80 bg-[#0f0f12] p-5 transition-colors hover:border-slate-700"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10">
                  <m.icon className="h-4 w-4 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{m.label}</h3>
                  <p className="mt-1 text-sm text-slate-500">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="use-cases" className="border-t border-slate-800/60 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-16 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Who it’s for
            </h2>
            <p className="mt-3 text-sm text-slate-400">
              Clear problems. Focused tools. Decisions you can act on.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-800/80 bg-[#0f0f12] p-5 transition-colors hover:border-slate-700"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/10">
                  <item.icon className="h-4 w-4 text-indigo-400" />
                </div>
                <h3 className="text-sm font-medium text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800/60 px-4 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Clock,
                title: "Minutes, not meetings",
                desc: "Structure ideas and strategy drafts without a long research rabbit hole.",
              },
              {
                icon: Shield,
                title: "Verify what matters",
                desc: "Agent outputs are a starting point—always cross-check critical decisions.",
              },
              {
                icon: CheckCircle2,
                title: "Clear next steps",
                desc: "Insights, steps, and suggested questions so you know what to do after the answer.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-slate-800/80 bg-[#0f0f12] p-6"
              >
                <item.icon className="mb-3 h-5 w-5 text-indigo-400" />
                <h3 className="text-sm font-medium text-white">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-800/60 px-4 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Ready to turn ideas into plans?
          </h2>
          <p className="mt-3 text-sm text-slate-400">
            Start free. No credit card required. Upgrade when your team needs more.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/sign-up">
              <Button className="h-11 bg-indigo-600 px-8 text-sm font-medium hover:bg-indigo-500">
                Create free account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button
                variant="outline"
                className="h-11 border-slate-800 bg-transparent px-6 text-sm text-slate-300 hover:bg-slate-900 hover:text-white"
              >
                Sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-800/60 px-4 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-medium text-slate-300">NicheFX</span>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500">
            <Link href="#features" className="hover:text-slate-300">
              Features
            </Link>
            <Link href="#how" className="hover:text-slate-300">
              How it works
            </Link>
            <Link href="#modes" className="hover:text-slate-300">
              Agent modes
            </Link>
            <Link href="/sign-in" className="hover:text-slate-300">
              Sign in
            </Link>
          </nav>
          <p className="text-xs text-slate-600">
            © 2026 NicheFX. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}