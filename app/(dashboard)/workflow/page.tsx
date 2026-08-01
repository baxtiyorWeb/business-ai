"use client";

import React, { useState } from "react";
import {
  Workflow,
  Plus,
  Play,
  MoreHorizontal,
  ArrowRight,
  Clock,
  CheckCircle2,
  Pause,
  Copy,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const workflows = [
  {
    id: 1,
    title: "E-commerce Product Pack",
    description: "Mahsulot rasmi → toza fon → banner → Instagram post",
    steps: 4,
    lastRun: "2 soat oldin",
    status: "active",
    runs: 28,
  },
  {
    id: 2,
    title: "Interior Moodboard",
    description: "Xona fotosurati → moodboard → rang palitrasi → shopping list",
    steps: 4,
    lastRun: "Kecha",
    status: "active",
    runs: 15,
  },
  {
    id: 3,
    title: "Brand Starter Kit",
    description: "Brend nomi → logo → ranglar → social media set",
    steps: 5,
    lastRun: "3 kun oldin",
    status: "draft",
    runs: 0,
  },
  {
    id: 4,
    title: "Fashion Lookbook",
    description: "Model rasmi → outfit variantlari → lookbook sahifa",
    steps: 3,
    lastRun: "1 hafta oldin",
    status: "paused",
    runs: 9,
  },
];

const templates = [
  {
    id: "t1",
    title: "Amazon Listing Pack",
    description: "Asosiy rasm + 6 ta variant + A+ content",
    steps: 3,
  },
  {
    id: "t2",
    title: "Instagram Content Set",
    description: "Post + Story + Carousel + Highlight cover",
    steps: 4,
  },
  {
    id: "t3",
    title: "Full Brand Identity",
    description: "Logo + packaging + website + ads",
    steps: 6,
  },
];

const WorkflowPage = () => {
  const [activeTab, setActiveTab] = useState<"my" | "templates">("my");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Workflow
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Takroriy ishlarni avtomatlashtiring va vaqt tejang
          </p>
        </div>
        <Button className="h-9 bg-indigo-600 hover:bg-indigo-500 text-sm">
          <Plus className="mr-2 h-4 w-4" />
          Yangi workflow
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-slate-800/80 bg-[#0f0f12] p-1 w-fit">
        <button
          onClick={() => setActiveTab("my")}
          className={cn(
            "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
            activeTab === "my"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Mening workflowlarim
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={cn(
            "rounded-md px-4 py-1.5 text-xs font-medium transition-colors",
            activeTab === "templates"
              ? "bg-slate-800 text-white"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          Tayyor shablonlar
        </button>
      </div>

      {/* My Workflows */}
      {activeTab === "my" && (
        <div className="space-y-3">
          {workflows.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-20 text-center">
              <Workflow className="h-10 w-10 text-slate-700" />
              <p className="mt-3 text-sm text-slate-500">
                Hali workflow yaratilmagan
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Takroriy jarayonlarni avtomatlashtirish uchun yangi workflow yarating
              </p>
              <Button className="mt-4 h-9 bg-indigo-600 hover:bg-indigo-500 text-sm">
                <Plus className="mr-2 h-4 w-4" />
                Birinchi workflowni yaratish
              </Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {workflows.map((wf) => (
                <div
                  key={wf.id}
                  className="group rounded-xl border border-slate-800/80 bg-[#0f0f12] p-4 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    {/* Left info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-medium text-white truncate">
                          {wf.title}
                        </h3>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-medium",
                            wf.status === "active" &&
                              "bg-emerald-500/10 text-emerald-400",
                            wf.status === "draft" &&
                              "bg-slate-800 text-slate-400",
                            wf.status === "paused" &&
                              "bg-amber-500/10 text-amber-400"
                          )}
                        >
                          {wf.status === "active" && "Faol"}
                          {wf.status === "draft" && "Qoralama"}
                          {wf.status === "paused" && "To‘xtatilgan"}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                        {wf.description}
                      </p>
                      <div className="mt-2.5 flex items-center gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          {wf.steps} qadam
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {wf.lastRun}
                        </span>
                        <span>·</span>
                        <span>{wf.runs} marta ishlatilgan</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {wf.status === "active" && (
                        <Button
                          size="sm"
                          className="h-8 bg-indigo-600 hover:bg-indigo-500 text-xs"
                        >
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          Ishga tushirish
                        </Button>
                      )}
                      {wf.status === "paused" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-slate-800 bg-transparent text-slate-300 hover:bg-slate-900 text-xs"
                        >
                          <Play className="mr-1.5 h-3.5 w-3.5" />
                          Davom ettirish
                        </Button>
                      )}
                      {wf.status === "draft" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 border-slate-800 bg-transparent text-slate-300 hover:bg-slate-900 text-xs"
                        >
                          Tahrirlash
                        </Button>
                      )}
                      <button className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-800 hover:text-slate-300">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Templates */}
      {activeTab === "templates" && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">
            Tayyor shablonlardan birini tanlab, o‘zingizga moslashtiring
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="rounded-xl border border-slate-800/80 bg-[#0f0f12] p-5 hover:border-slate-700 transition-colors cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600/10">
                    <Workflow className="h-4 w-4 text-indigo-400" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <h3 className="mt-3 text-sm font-medium text-white">
                  {tpl.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                  {tpl.description}
                </p>
                <div className="mt-3 text-[11px] text-slate-600">
                  {tpl.steps} qadam
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info tip */}
      <div className="rounded-xl border border-slate-800/60 bg-[#0f0f12] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600/10">
            <Zap className="h-4 w-4 text-indigo-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              Workflow nima beradi?
            </p>
            <p className="mt-1 text-xs text-slate-500 leading-relaxed">
              Bir marta sozlab qo‘ying — keyin bir tugma bilan butun zanjirni
              ishga tushiring. Masalan: mahsulot rasmini yuklaysiz → AI fonni
              tozalaydi → banner yasaydi → Instagram uchun variantlar chiqaradi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowPage;