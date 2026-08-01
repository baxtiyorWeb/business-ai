"use client";

import React from "react";
import {
  Search,
  Sparkles,
  Heart,
  Bookmark,
  Filter,
  TrendingUp,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useDiscover } from "@/hooks/use-discover";

const categories = [
  "Barchasi",
  "E-commerce",
  "Interyer",
  "Moda",
  "Brending",
  "Product",
  "Social Media",
];

export default function DiscoverPage() {
  const {
    items,
    loading,
    search,
    setSearch,
    activeCategory,
    setActiveCategory,
    handleLike,
    actionLoading,
  } = useDiscover();

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Discover
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Boshqa yaratuvchilarning ishlaridan ilhom oling
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="h-9 pl-9 border-slate-800 bg-slate-900/40 text-sm text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0 border-slate-800 bg-transparent text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
              activeCategory === cat
                ? "bg-indigo-600 text-white"
                : "bg-slate-900/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Trending this week</span>
        </div>
        <span>·</span>
        <span>{items.length} ta natija</span>
      </div>

      {/* Loading holati */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
        </div>
      ) : items.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative overflow-hidden rounded-xl border border-slate-800/80 bg-[#0f0f12] transition-colors hover:border-slate-700 flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-900">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              {/* Info & Visible Like Button */}
              <div className="flex flex-1 flex-col justify-between p-2.5">
                <div className="min-w-0">
                  <h3 className="truncate text-xs font-medium text-white leading-tight">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">
                    {item.author}
                  </p>
                </div>

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="shrink-0 rounded bg-slate-800/80 px-1.5 py-0.5 text-[9px] text-slate-400">
                    {item.category}
                  </span>

                  <div className="flex items-center gap-2">
                    {/* Ochiq va ko'rinib turadigan Like tugmasi */}
                    <button
                      onClick={() => handleLike(item.id, item.likes)}
                      disabled={actionLoading === item.id}
                      className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors bg-rose-500/10 px-2 py-1 rounded-md border border-rose-500/20"
                    >
                      {actionLoading === item.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Heart className="h-3 w-3 fill-rose-400 text-rose-400" />
                      )}
                      <span>{item.likes}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 py-20 text-center">
          <ImageIcon className="h-10 w-10 text-slate-700" />
          <p className="mt-3 text-sm text-slate-500">Hech narsa topilmadi</p>
          <p className="mt-1 text-xs text-slate-600">
            Boshqa kategoriya yoki qidiruv so‘zini sinab ko‘ring
          </p>
        </div>
      )}
    </div>
  );
}
