"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GradientBorderProps {
  children: ReactNode;
  className?: string;
  from?: string;
  via?: string;
  to?: string;
}

export function GradientBorder({
  children,
  className,
  from = "from-fuchsia-500/50",
  via = "via-indigo-500/40",
  to = "to-purple-500/50",
}: GradientBorderProps) {
  return (
    <div className={cn("rounded-xl bg-gradient-to-br p-[1px]", from, via, to, className)}>
      <div className="h-full rounded-[11px] bg-[#0c0c10]">{children}</div>
    </div>
  );
}

export default GradientBorder;