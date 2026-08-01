"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  explanation?: string;
}

export function CircularProgress({
  value,
  size = 128,
  strokeWidth = 10,
  label = "Potensial",
  explanation,
}: CircularProgressProps) {
  const [showTip, setShowTip] = useState(false);
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const gradientId = "circular-progress-gradient";

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label}: ${clamped}%`}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
      onClick={() => setShowTip((v) => !v)}
    >
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center">
        <span className="bg-gradient-to-br from-indigo-300 to-purple-300 bg-clip-text text-2xl font-bold text-transparent">
          {clamped}%
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
          {label}
        </span>
      </div>

      {/* Tooltip */}
      {showTip && explanation && (
        <div
          className={cn(
            "absolute left-1/2 top-full z-50 mt-3 w-64 -translate-x-1/2 rounded-xl border border-slate-700 bg-[#0f0f14] p-3 shadow-xl",
            "animate-in fade-in zoom-in-95 duration-200",
          )}
        >
          <p className="text-[11px] leading-relaxed text-slate-300">
            {explanation}
          </p>
          <div className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-slate-700 bg-[#0f0f14]" />
        </div>
      )}
    </div>
  );
}

export default CircularProgress;