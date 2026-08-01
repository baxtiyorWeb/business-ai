"use client";

import React from "react";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Clock,
  MessageSquare,
  CheckCircle2,
  FolderDot,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useCollaborations } from "@/hooks/use-collabrations";

const tabs = ["Barchasi", "Jarayonda", "Tekshirilmoqda", "Yakunlangan"];

export default function CollaborationsPage() {
  const {
    projects,
    loading,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    createNewProject,
    isCreating,
  } = useCollaborations();

  return (
    <div className="space-y-6 pb-10 text-slate-100">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-indigo-400" />
            Hamkorliklar
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Jamoangiz bilan birgalikda ishlayotgan loyihalarni boshqaring.
          </p>
        </div>

        <Button
          onClick={createNewProject}
          disabled={isCreating}
          className="bg-indigo-600 hover:bg-indigo-500 text-white w-full sm:w-auto h-10 shadow-lg shadow-indigo-600/20 transition-all"
        >
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Yangi loyiha
        </Button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b border-slate-800/80 pb-4">
        <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 md:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "whitespace-nowrap rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
                activeTab === tab
                  ? "bg-slate-800 text-white shadow-sm"
                  : "bg-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-300"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Loyihalarni qidirish..."
            className="h-9 pl-9 border-slate-800 bg-[#121215] text-sm text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500"
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : projects.length > 0 ? (
        /* Projects Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project) => (
            <div
              key={project.id}
              className="group flex flex-col justify-between rounded-xl border border-slate-800/80 bg-[#0f0f12] p-5 transition-all duration-300 hover:border-slate-700 hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-medium text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {project.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {project.description}
                  </p>
                </div>
                <button className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors">
                  <MoreVertical className="h-4 w-4" />
                </button>
              </div>

              {/* Progress Section */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span
                    className={cn(
                      "font-medium",
                      project.status === "Yakunlangan"
                        ? "text-emerald-400"
                        : project.status === "Tekshirilmoqda"
                        ? "text-amber-400"
                        : "text-indigo-400"
                    )}
                  >
                    {project.status}
                  </span>
                  <span className="text-slate-400">{project.progress}%</span>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-500",
                      project.status === "Yakunlangan"
                        ? "bg-emerald-500"
                        : project.status === "Tekshirilmoqda"
                        ? "bg-amber-500"
                        : "bg-indigo-500"
                    )}
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-6 flex items-center justify-between border-t border-slate-800/60 pt-4">
                {/* Team Avatars */}
                <div className="flex -space-x-2 overflow-hidden">
                  {project.team?.slice(0, 3).map((avatar, index) => (
                    <img
                      key={index}
                      className="inline-block h-7 w-7 rounded-full border-2 border-[#0f0f12] object-cover"
                      src={avatar}
                      alt="Team member"
                    />
                  ))}
                  {project.team?.length > 3 && (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#0f0f12] bg-slate-800 text-[10px] font-medium text-white">
                      +{project.team.length - 3}
                    </div>
                  )}
                </div>

                {/* Meta Info */}
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    <span>{project.comments_count}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {project.status === "Yakunlangan" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/70" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    <span>Faol</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-24 text-center bg-[#121215]/50 animate-in fade-in duration-300">
          <FolderDot className="h-12 w-12 text-slate-700" />
          <p className="mt-4 text-sm font-medium text-slate-300">
            Loyiha topilmadi
          </p>
          <p className="mt-1 text-xs text-slate-500 max-w-sm">
            Hozircha bu bo'limda hech qanday ma'lumot yo'q yoki qidiruvga mos loyiha topilmadi.
          </p>
        </div>
      )}
    </div>
  );
}