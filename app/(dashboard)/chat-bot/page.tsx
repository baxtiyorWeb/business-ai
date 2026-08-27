"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Coins,
  BadgeCheck,
  Link2,
  ExternalLink,
  Calculator,
  Code2,
  MessageSquarePlus,
  BookOpen,
  Target,
  Brain,
  Folder,
  FolderOpen,
  Gauge,
  ShieldCheck,
  Clock,
  Library,
  CheckSquare2,
  SquareArrowLeft,
  ListCheck,
  CheckCircle2Icon,
  Table as TableIcon,
  LayoutList,
  LayoutGrid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import useChatBot, { AgentStep, ChatMode } from "@/hooks/use-chatbot";

import katex from "katex";
import ChatInput, { ChatInputHandle } from "@/components/chat-input";
import {
  CATEGORIES,
  classifyCategory,
  type CategoryDef,
  type CategoryId,
} from "@/lib/chat-categories";

// NOTE: CategoryId / CategoryDef / classifyCategory / CATEGORIES endi
// FAQAT "@/lib/chat-categories" dan import qilinadi. Ular avval shu
// faylning o'zida ham qayta e'lon qilingan edi — bu TypeScript'da
// "duplicate identifier" xatosiga olib kelardi. Endi bitta manba bor.

function CategoryBadge({ text }: { text: string }) {
  const cat = useMemo(() => classifyCategory(text), [text]);
  if (!cat) return null;
  const Icon = cat.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-[10px] font-medium",
        cat.accentText,
      )}
    >
      <Icon className="h-3 w-3" />
      {cat.label}
    </span>
  );
}
function sanitizeMathExpr(expr: string) {
  return expr
    .replace(/[\u2013\u2014]/g, "-") // en-dash (–) va em-dash (—) -> oddiy tire
    .replace(/\u2212/g, "-") // unicode minus (−) -> oddiy tire
    .replace(/[\u2018\u2019]/g, "'") // qayrilgan bir tirnoq
    .replace(/[\u201C\u201D]/g, '"'); // qayrilgan qo'sh tirnoq
}
function MathBlock({ expr }: { expr: string }) {
  let html = "";
  try {
    html = katex.renderToString(sanitizeMathExpr(expr), {
      throwOnError: false,
      displayMode: true,
      strict: false,
    });
  } catch {
    html = expr;
  }

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-violet-500/20 bg-violet-500/[0.05] px-4 py-3.5">
      <div
        className="text-violet-100"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

function timeLabel(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) {
    return date.toLocaleTimeString("uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  return date.toLocaleDateString("uz-UZ", { month: "short", day: "numeric" });
}

function splitMarkdownTableRow(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.includes("|")) return [];

  let s = trimmed;
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);

  const cells: string[] = [];
  let current = "";
  let inBacktick = false;
  let inQuote = false;
  let quoteChar = "";

  for (let idx = 0; idx < s.length; idx++) {
    const ch = s[idx];
    const prev = idx > 0 ? s[idx - 1] : "";

    if (ch === "`" && prev !== "\\") {
      inBacktick = !inBacktick;
      current += ch;
    } else if ((ch === '"' || ch === "'") && !inBacktick && prev !== "\\") {
      if (!inQuote) {
        inQuote = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inQuote = false;
      }
      current += ch;
    } else if (ch === "|" && prev !== "\\" && !inBacktick) {
      cells.push(current.trim().replace(/\\\|/g, "|"));
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current.trim().replace(/\\\|/g, "|"));
  return cells;
}

function parseTableRows(
  lines: string[],
  startIndex: number,
): { rows: string[][]; endIndex: number } {
  const rawRows: string[][] = [];
  let i = startIndex;
  let headerColCount = 0;

  while (i < lines.length) {
    const t = lines[i].trim();
    if (!t.includes("|")) break;

    const cells = splitMarkdownTableRow(t);
    if (cells.length === 0) break;

    const isSeparator = cells.every((c) => /^:?-{2,}:?$/.test(c) || c === "");
    if (!isSeparator) {
      if (rawRows.length === 0) {
        headerColCount = cells.length;
        rawRows.push(cells);
      } else {
        if (headerColCount > 0 && cells.length > headerColCount) {
          const normalized = cells.slice(0, headerColCount - 1);
          const restJoined = cells.slice(headerColCount - 1).join(" | ");
          normalized.push(restJoined);
          rawRows.push(normalized);
        } else if (headerColCount > 0 && cells.length < headerColCount) {
          const padded = [...cells];
          while (padded.length < headerColCount) {
            padded.push("");
          }
          rawRows.push(padded);
        } else {
          rawRows.push(cells);
        }
      }
    }
    i++;
  }
  return { rows: rawRows, endIndex: i - 1 };
}

function isImageUrl(url: string) {
  return (
    /\.(png|jpe?g|gif|webp|svg|bmp)(\?.*)?$/i.test(url) || url.includes("chart")
  );
}

function shortenUrl(url: string) {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    return host;
  } catch {
    return url.length > 42 ? `${url.slice(0, 42)}…` : url;
  }
}

type ParsedSource = { label: string; url: string };

function extractInlineSources(
  lines: string[],
  startIndex: number,
): { sources: ParsedSource[]; endIndex: number } {
  const sources: ParsedSource[] = [];
  let j = startIndex;
  while (j < lines.length) {
    const t = lines[j].trim();
    if (!t) {
      j++;
      continue;
    }
    const linkMdMatch = t.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (linkMdMatch) {
      sources.push({ label: linkMdMatch[1], url: linkMdMatch[2] });
      j++;
      continue;
    }
    const bareMatch = t.match(/^(.*?)\s*(https?:\/\/\S+)\s*$/);
    if (bareMatch) {
      const label = bareMatch[1]
        .replace(/^[-*•\d.)\s]+/, "")
        .replace(/[\s.:–-]+$/, "")
        .trim();
      sources.push({
        label: label || shortenUrl(bareMatch[2]),
        url: bareMatch[2],
      });
      j++;
      continue;
    }
    break;
  }
  return { sources, endIndex: j - 1 };
}

function SourcesSection({ sources }: { sources: ParsedSource[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-3 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/40">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left transition-colors duration-200 hover:bg-slate-900/60"
      >
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-300">
          <Library className="h-3.5 w-3.5" />
        </span>
        <span className="flex-1 text-sm font-semibold text-slate-200">
          Resources
        </span>
        <span className="shrink-0 rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
          {sources.length}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-500 transition-transform duration-300",
            open && "rotate-180",
          )}
        />
      </button>
      <div
        className={cn(
          "grid transition-all duration-300 ease-in-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="space-y-1 border-t border-slate-800/60 p-2">
            {sources.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs text-slate-300 transition-colors duration-150 hover:bg-slate-900/70 hover:text-indigo-300"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-medium text-slate-400">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1 truncate">{s.label}</span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-600" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTableCell(content: string): React.ReactNode {
  const trimmed = content.trim();
  if (!trimmed) return <span className="text-slate-600">—</span>;

  const rawParts = trimmed
    .split(/<br\s*\/?>|\\n|\n/gi)
    .map((p) => p.trim())
    .filter(Boolean);

  if (rawParts.length > 1) {
    return (
      <div className="space-y-2 py-0.5">
        {rawParts.map((part, idx) => {
          const isBullet = /^[•\-*]\s+/.test(part);
          const isNumbered = /^(\d+)[.)]\s+/.test(part);
          if (isBullet) {
            return (
              <div key={idx} className="flex items-start gap-2 text-slate-200">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                <span className="min-w-0 flex-1 leading-relaxed">
                  {formatInline(part.replace(/^[•\-*]\s+/, ""))}
                </span>
              </div>
            );
          }
          if (isNumbered) {
            const numMatch = part.match(/^(\d+)[.)]\s+(.+)$/);
            return (
              <div key={idx} className="flex items-start gap-1.5 text-slate-200">
                <span className="shrink-0 text-xs font-bold text-indigo-400">
                  {numMatch ? numMatch[1] : idx + 1}.
                </span>
                <span className="min-w-0 flex-1 leading-relaxed">
                  {formatInline(numMatch ? numMatch[2] : part)}
                </span>
              </div>
            );
          }
          return (
            <div key={idx} className="leading-relaxed text-slate-200">
              {formatInline(part)}
            </div>
          );
        })}
      </div>
    );
  }

  return <span className="leading-relaxed">{formatInline(trimmed)}</span>;
}

function TableBlock({
  header,
  body,
}: {
  header: string[];
  body: string[][];
}) {
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const colWidths = header.map((h, ci) => {
      const maxBody = body.reduce(
        (max, row) => Math.max(max, (row[ci] || "").length),
        0,
      );
      return Math.max(h.length, maxBody, 3);
    });

    const headerLine = `| ${header.map((h, i) => h.padEnd(colWidths[i])).join(" | ")} |`;
    const sepLine = `| ${colWidths.map((w) => "-".repeat(w)).join(" | ")} |`;
    const bodyLines = body.map(
      (row) =>
        `| ${row.map((c, i) => (c || "").padEnd(colWidths[i] || 3)).join(" | ")} |`,
    );

    const fullMd = [headerLine, sepLine, ...bodyLines].join("\n");
    navigator.clipboard.writeText(fullMd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const totalCols = header.length;
  const totalRows = body.length;

  return (
    <div className="my-5 overflow-hidden rounded-2xl border border-slate-700/70 bg-gradient-to-b from-slate-900/90 to-slate-950/90 shadow-2xl backdrop-blur-md">
      {/* Table Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/95 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/15 text-indigo-400">
            <TableIcon className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-slate-300">
            Jadval
          </span>
          <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            {totalCols} ustun • {totalRows} qator
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* View mode toggle */}
          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-950/60 p-0.5">
            <button
              type="button"
              onClick={() => setViewMode("table")}
              title="Jadval ko'rinishi"
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                viewMode === "table"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <LayoutList className="h-3 w-3" />
              <span className="hidden sm:inline">Jadval</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cards")}
              title="Karta ko'rinishi (Katta matnlar uchun qulay)"
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition-colors",
                viewMode === "cards"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200",
              )}
            >
              <LayoutGrid className="h-3 w-3" />
              <span className="hidden sm:inline">Kartalar</span>
            </button>
          </div>

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            title="Jadvalni nusxalash"
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1 text-[11px] font-medium text-slate-400 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-slate-200"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Nusxalandi</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Nusxa olish</span>
              </>
            )}
          </button>
        </div>
      </div>

      {viewMode === "table" ? (
        /* TABLE VIEW */
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-indigo-500/20 bg-slate-900/95">
                {header.map((cell, ci) => (
                  <th
                    key={ci}
                    className={cn(
                      "border-r border-slate-800/80 px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-indigo-300 last:border-r-0",
                      ci === 0
                        ? "min-w-[160px] max-w-[220px]"
                        : "min-w-[200px] max-w-[420px]",
                    )}
                  >
                    {formatInline(cell)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {body.map((row, ri) => (
                <tr
                  key={ri}
                  className="transition-colors hover:bg-indigo-950/20 even:bg-slate-950/30"
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        "align-top border-r border-slate-800/50 px-4 py-3.5 text-sm text-slate-200 break-words last:border-r-0",
                        ci === 0
                          ? "min-w-[160px] max-w-[220px] bg-slate-900/20 font-semibold text-slate-100"
                          : "min-w-[200px] max-w-[420px]",
                      )}
                    >
                      {formatTableCell(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 gap-3.5 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {body.map((row, ri) => (
            <div
              key={ri}
              className="flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/70 p-4 shadow-sm transition-all hover:border-indigo-500/40 hover:bg-slate-900"
            >
              <div className="space-y-3">
                {row.map((cell, ci) => {
                  const headerTitle = header[ci] || `Ustun ${ci + 1}`;
                  if (ci === 0) {
                    return (
                      <div
                        key={ci}
                        className="border-b border-slate-800 pb-2.5"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                          {headerTitle}
                        </span>
                        <div className="mt-1 text-base font-semibold text-slate-100">
                          {formatTableCell(cell)}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={ci} className="space-y-1">
                      <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        {headerTitle}:
                      </div>
                      <div className="text-sm leading-relaxed text-slate-200">
                        {formatTableCell(cell)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerRenderer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      elements.push(<div key={`sp-${i}`} className="h-3" />);
      i++;
      continue;
    }

    const sourcesHeadingMatch = trimmed.match(
      /^#{0,4}\s*(manbalar|manba|sources|references)\s*:?\s*$/i,
    );
    if (sourcesHeadingMatch) {
      const { sources, endIndex } = extractInlineSources(lines, i + 1);
      if (sources.length > 0) {
        elements.push(<SourcesSection key={`src-${i}`} sources={sources} />);
        i = endIndex + 1;
        continue;
      }
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      elements.push(
        <hr
          key={`hr-${i}`}
          className="my-5 border-0 border-t border-slate-800/80"
        />,
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("$$")) {
      if (trimmed.length > 4 && trimmed.endsWith("$$")) {
        elements.push(
          <MathBlock key={`math-${i}`} expr={trimmed.slice(2, -2)} />,
        );
        i++;
        continue;
      }
      const mathLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== "$$") {
        mathLines.push(lines[j]);
        j++;
      }
      elements.push(<MathBlock key={`math-${i}`} expr={mathLines.join(" ")} />);
      i = j < lines.length ? j + 1 : j;
      continue;
    }

    if (trimmed.includes("|") && (trimmed.match(/\|/g) || []).length >= 2) {
      const { rows, endIndex } = parseTableRows(lines, i);
      if (rows.length > 0) {
        const header = rows[0];
        const body = rows.slice(1);
        elements.push(
          <TableBlock key={`tbl-${i}`} header={header} body={body} />,
        );
        i = endIndex + 1;
        continue;
      }
    }

    const headingMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const text = headingMatch[2];
      const cls =
        level === 1
          ? "pt-3 text-2xl font-semibold tracking-tight text-indigo-300"
          : level === 2
            ? "pt-3 text-md font-semibold tracking-tight text-amber-400"
            : level === 3
              ? "pt-3 text-lg font-semibold tracking-tight text-violet-300"
              : "pt-2 text-base font-semibold tracking-tight text-sky-300";
      const Tag =
        level === 1 ? "h2" : level === 2 ? "h3" : level === 3 ? "h4" : "h5";
      elements.push(
        <Tag key={`h-${i}`} className={cls}>
          {formatInline(text)}
        </Tag>,
      );
      i++;
      continue;
    }

    const emojiList = trimmed.match(
      /^(✅|❌|⚠️|✔️|☑|✓|✔|🟢|🔴|🟡|📌|💡|🔹|▪|•)\s+(.+)$/,
    );
    if (emojiList) {
      elements.push(
        <div
          key={`em-${i}`}
          className="flex items-start gap-3 pl-0.5 text-md leading-relaxed text-slate-300"
        >
          <span className="mt-1 shrink-0 text-lg leading-none">
            {emojiList[1]}
          </span>
          <span className="min-w-0 flex-1">{formatInline(emojiList[2])}</span>
        </div>,
      );
      i++;
      continue;
    }

    const checkboxMatch = trimmed.match(/^[-*•]\s+\[([ xX])\]\s+(.+)$/);
    if (checkboxMatch) {
      const checked = checkboxMatch[1].toLowerCase() === "x";
      elements.push(
        <div
          key={`chk-${i}`}
          className="flex items-start gap-3 pl-0.5 text-md leading-relaxed"
        >
          {checked ? (
            <CheckSquare2 className="mt-1 h-5 w-5 shrink-0 text-emerald-400" />
          ) : (
            <CheckCircle2Icon className="mt-1 h-5 w-5 shrink-0 text-slate-500" />
          )}
          <span
            className={cn(
              "min-w-0 flex-1",
              checked ? "text-slate-500 line-through" : "text-slate-300",
            )}
          >
            {formatInline(checkboxMatch[2])}
          </span>
        </div>,
      );
      i++;
      continue;
    }

    if (
      trimmed.startsWith("[] ") ||
      trimmed.startsWith("- ") ||
      trimmed.startsWith("* ") ||
      trimmed.startsWith("• ")
    ) {
      elements.push(
        <div
          key={`li-${i}`}
          className="flex items-start gap-3 pl-0.5 text-md leading-relaxed text-slate-300"
        >
          <span className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-slate-500" />
          <span className="min-w-0 flex-1">
            {formatInline(trimmed.replace(/^[-*•]\s+/, ""))}
          </span>
        </div>,
      );
      i++;
      continue;
    }

    const numMatch = trimmed.match(/^(\d+)[.)]\s+(.+)$/);
    if (numMatch) {
      elements.push(
        <div
          key={`ol-${i}`}
          className="flex items-start gap-3 pl-0.5 text-md leading-relaxed text-slate-300"
        >
          <span className="mt-0.5 min-w-[1.5rem] shrink-0 text-base font-medium text-slate-500">
            {numMatch[1]}.
          </span>
          <span className="min-w-0 flex-1">{formatInline(numMatch[2])}</span>
        </div>,
      );
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      elements.push(
        <div
          key={`q-${i}`}
          className="mt-3 rounded-xl border border-indigo-500/25 bg-indigo-500/5 p-4"
        >
          <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-indigo-300">
            <BadgeCheck className="h-4 w-4" />
            Tavsiya
          </div>
          <p className="text-md leading-relaxed text-slate-300">
            {formatInline(trimmed.replace(/^>\s?/, ""))}
          </p>
        </div>,
      );
      i++;
      continue;
    }

    if (trimmed.startsWith("```")) {
      const lang = trimmed.slice(3).trim().toLowerCase();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;

      const inner = codeLines.join("\n");
      const isMarkdownFence =
        lang === "markdown" ||
        lang === "md" ||
        lang === "" ||
        /^#{1,4}\s/.test(inner.trim());

      if (isMarkdownFence && inner.trim().length > 0) {
        elements.push(
          <div
            key={`mdfence-${i}`}
            className="my-4 overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/50 p-4"
          >
            <div className="mb-3 flex items-center gap-2 border-b border-slate-800/60 pb-2">
              <span className="rounded-md bg-indigo-500/15 px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-indigo-300">
                Template
              </span>
              <span className="text-sm text-slate-500">Hisobot namunasi</span>
            </div>
            <AnswerRenderer content={inner} />
          </div>,
        );
      } else {
        elements.push(
          <pre
            key={`code-${i}`}
            className="my-3 overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/90 px-4 py-3.5 font-mono text-base leading-relaxed text-slate-300"
          >
            <code>{inner}</code>
          </pre>,
        );
      }
      continue;
    }

    const imgMd = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    const linkMd = trimmed.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (imgMd || (linkMd && isImageUrl(linkMd[2]))) {
      const alt = imgMd ? imgMd[1] : linkMd![1];
      const src = imgMd ? imgMd[2] : linkMd![2];
      elements.push(
        <a
          key={`img-${i}`}
          href={src}
          target="_blank"
          rel="noreferrer"
          className="my-3 flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-base text-indigo-300 transition-colors hover:border-slate-700"
        >
          <Link2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{alt || src}</span>
        </a>,
      );
      i++;
      continue;
    }

    const soloLinkMatch = trimmed.match(/^(https?:\/\/\S+)$/);
    if (soloLinkMatch) {
      elements.push(
        <a
          key={`solo-link-${i}`}
          href={soloLinkMatch[1]}
          target="_blank"
          rel="noreferrer"
          className="my-2 flex items-center gap-2.5 rounded-lg border border-slate-800 bg-slate-950/50 px-3.5 py-2.5 text-base text-indigo-300 transition-colors hover:border-slate-700"
        >
          <Link2 className="h-4 w-4 shrink-0" />
          <span className="truncate">{shortenUrl(soloLinkMatch[1])}</span>
          <ExternalLink className="ml-auto h-4 w-4 shrink-0 text-slate-600" />
        </a>,
      );
      i++;
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="text-md leading-relaxed text-slate-300">
        {formatInline(trimmed)}
      </p>,
    );
    i++;
  }

  return (
    <div className="space-y-2 animate-in fade-in slide-in-from-bottom-1 duration-300">
      {elements}
    </div>
  );
}

function formatInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const re =
    /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$\n]+\$|!\[[^\]]*\]\([^)]+\)|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s)]+)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let key = 0;

  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const token = m[0];

    if (token.startsWith("**") && token.endsWith("**")) {
      parts.push(
        <strong key={key++} className="font-semibold text-slate-100">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith("$") && token.endsWith("$")) {
      let html = "";
      try {
        html = katex.renderToString(sanitizeMathExpr(token.slice(1, -1)), {
          throwOnError: false,
          displayMode: false,
          strict: false,
        });
      } catch {
        html = token.slice(1, -1);
      }

      parts.push(
        <span
          key={key++}
          className="rounded bg-violet-500/10 px-1 py-0.5 text-violet-200"
          dangerouslySetInnerHTML={{ __html: html }}
        />,
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      parts.push(
        <em key={key++} className="italic text-slate-200">
          {token.slice(1, -1)}
        </em>,
      );
    } else if (token.startsWith("`") && token.endsWith("`")) {
      parts.push(
        <code
          key={key++}
          className="rounded bg-slate-800/80 px-1 py-0.5 font-mono text-[0.8em] text-amber-200/90"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else if (token.startsWith("![")) {
      const im = token.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
      if (im) {
        parts.push(
          <a
            key={key++}
            href={im[2]}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 underline underline-offset-2"
          >
            <Link2 className="h-3 w-3" />
            {im[1] || "image"}
          </a>,
        );
      }
    } else if (token.startsWith("[")) {
      const lm = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (lm) {
        parts.push(
          <a
            key={key++}
            href={lm[2]}
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
          >
            {lm[1]}
          </a>,
        );
      }
    } else if (/^https?:\/\//.test(token)) {
      parts.push(
        <a
          key={key++}
          href={token}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-indigo-400 underline underline-offset-2 hover:text-indigo-300"
        >
          <Link2 className="h-3 w-3" />
          {shortenUrl(token)}
        </a>,
      );
    }

    last = m.index + token.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : text;
}

const STEP_ICON_RULES: { test: RegExp; icon: typeof Brain }[] = [
  { test: /tushun|aniqlash kerak|understand/i, icon: Brain },
  { test: /aniqla|detect|bosqich/i, icon: CheckCircle2 },
  { test: /raqib|competitor/i, icon: Search },
  { test: /bozor|market/i, icon: Gauge },
  { test: /strategi|gtm|kirish rejasi/i, icon: Target },
  { test: /narx|pricing/i, icon: Coins },
  { test: /manba|source|tadqiqot/i, icon: BookOpen },
  { test: /hisob|calculat|formula/i, icon: Calculator },
  { test: /kod|code/i, icon: Code2 },
  { test: /yakun|final|javob/i, icon: Sparkles },
];

function stepIcon(title: string, index: number, total: number) {
  for (const rule of STEP_ICON_RULES) {
    if (rule.test.test(title)) return rule.icon;
  }
  if (index === total) return Sparkles;
  if (index === 1) return Brain;
  return CheckCircle2;
}

function StepRow({ step, total }: { step: AgentStep; total: number }) {
  const StepTitleIcon = stepIcon(step.title, step.index, total);
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200",
        step.status === "active" && "bg-indigo-500/10",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold transition-colors",
          step.status === "done" &&
          "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
          step.status === "active" &&
          "border-indigo-400/50 bg-indigo-500/10 text-indigo-300",
          step.status === "pending" && "border-slate-700 text-slate-600",
        )}
      >
        {step.status === "done" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : step.status === "active" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          step.index
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium",
            step.status === "pending" ? "text-slate-500" : "text-slate-200",
          )}
        >
          <StepTitleIcon
            className={cn(
              "h-3.5 w-3.5 shrink-0",
              step.status === "pending" ? "text-slate-600" : "text-indigo-400",
            )}
          />
          {step.index}. {step.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500">{step.description}</p>
      </div>
    </div>
  );
}

function StatCell({
  icon: Icon,
  label,
  value,
  bar,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
  bar?: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="text-sm font-semibold text-slate-200">{value}</div>
      {typeof bar === "number" && (
        <div className="h-1 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${bar}%` }}
          />
        </div>
      )}
    </div>
  );
}

function computeMessageStats(message: {
  content: string;
  steps?: AgentStep[];
  sources?: { uri: string }[];
}) {
  const words = message.content.trim().split(/\s+/).filter(Boolean).length;
  const readingMin = Math.max(1, Math.round(words / 180));
  const sourcesCount = message.sources?.length ?? 0;
  const stepsTotal = message.steps?.length ?? 0;
  const stepsDone =
    message.steps?.filter((s) => s.status === "done").length ?? 0;
  const completeness = stepsTotal ? stepsDone / stepsTotal : 1;
  const lengthScore = Math.min(1, words / 220);
  const quality = Math.round(
    Math.min(97, 55 + completeness * 25 + lengthScore * 20),
  );
  const confidence =
    quality >= 85 ? "Yuqori" : quality >= 65 ? "O'rta" : "Past";
  return { readingMin, sourcesCount, quality, confidence };
}

function CopyMessageButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard.writeText(content).catch(() => { });
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="rounded-md p-1.5 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
      aria-label="Copy"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export default function ChatbotPage() {
  const {
    conversations,
    activeConversationId,
    messages,
    mode,
    setMode,
    isSending,
    error: chatError,
    selectConversation,
    newChat,
    sendMessage,
    continueGenerating,
    setReaction,
  } = useChatBot();

  // "input" matni endi bu yerda YO'Q — u faqat <ChatInput> ichida
  // yashaydi (chat-input.tsx). Shu tufayli har bir harf bosilganda
  // BU komponent (va u bilan birga butun xabarlar ro'yxati) qayta
  // render bo'lmaydi — chat yozayotganda "qotish" muammosi shu yerdan
  // kelib chiqqan edi.
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(
    null,
  );
  const [collapsedFolders, setCollapsedFolders] = useState<
    Record<string, boolean>
  >({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandle>(null);

  // Yangi xabar qo'shilganda pastga tushish — endi `messages.length`ga
  // bog'liq, shuning uchun HAR safar yangi xabar kelganda ishlaydi
  // (avval dependency bo'sh bo'lgani uchun faqat mount paytida ishlardi).
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages.length]);

  function handleSend(overridePrompt?: string) {
    if (!overridePrompt?.trim() || isSending) return;
    sendMessage(overridePrompt);
  }

  function handleNewChat() {
    newChat(mode);
    setSelectedCategory(null);
  }

  function handleRegenerate(message: (typeof messages)[number]) {
    if (isSending) return;
    const idx = messages.indexOf(message);
    const priorUser = messages[idx - 1];
    if (priorUser?.content) sendMessage(priorUser.content);
  }

  // Kategoriya chipini bosganda — mode'ni o'zgartiradi va inputga
  // fokus beradi (matnni o'zi yozmaydi).
  function handlePickCategory(id: CategoryId, catMode: ChatMode) {
    setSelectedCategory((prev) => (prev === id ? null : id));
    setMode(catMode);
    chatInputRef.current?.focus();
  }

  // Bo'sh suhbatdagi "Quick start" kartochkasi — mode'ni o'rnatadi va
  // ChatInput'ga tayyor matnni yozib beradi (ref orqali).
  function handleQuickStart(cat: CategoryDef) {
    setSelectedCategory(cat.id);
    setMode(cat.mode);
    chatInputRef.current?.setValue(cat.starter);
  }

  function toggleFolder(key: string) {
    setCollapsedFolders((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const groupedConversations = useMemo(() => {
    const groups: Record<string, typeof filteredConversations> = {};
    for (const c of filteredConversations) {
      const cat = classifyCategory(`${c.title} ${c.preview}`);
      const key = cat?.id ?? "other";
      if (!groups[key]) groups[key] = [];
      groups[key].push(c);
    }
    const order = [...CATEGORIES.map((c) => c.id), "other"];
    return order
      .filter((key) => groups[key]?.length)
      .map((key) => ({
        key,
        conversations: groups[key],
        def: CATEGORIES.find((c) => c.id === key) ?? null,
      }));
  }, [filteredConversations]);

  const lastAssistant = [...messages]
    .reverse()
    .find((m) => m.role === "assistant");
  const activeSteps = lastAssistant?.steps ?? [];
  const doneCount = activeSteps.filter((s) => s.status !== "pending").length;
  const currentStep = activeSteps.find((s) => s.status === "active");
  const currentStepProgress = currentStep
    ? Math.round(
      ((activeSteps.indexOf(currentStep) + 0.6) / activeSteps.length) * 100,
    )
    : 100;

  // O'ng paneldagi "aktiv kategoriya" endi faqat FOYDALANUVCHI tanlagan
  // chipga (`selectedCategory`) qarab ko'rsatiladi. Avval bu yerda
  // top-level `input` state'idan jonli aniqlangan kategoriya ham
  // hisobga olinardi — lekin `input` endi ChatInput ichida yashiringan
  // (typing lag'ni tuzatish uchun), shuning uchun uni bu yerga qaytarib
  // qo'yish yana o'sha qotish muammosini keltirib chiqaradi.
  const activeCategory =
    CATEGORIES.find((c) => c.id === selectedCategory) ?? null;

  return (
    <div className="-m-4 flex h-[calc(100vh-3.5rem)] flex-col overflow-hidden md:-m-6 lg:-m-8">
      <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[280px_1fr_320px]">
        <aside className="hidden min-h-0 flex-col overflow-hidden border-r border-slate-800/60 bg-[#0a0a0c] lg:flex">
          <div className="shrink-0 p-3 pb-0">
            <button
              type="button"
              onClick={handleNewChat}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-900/30 transition-all duration-200 hover:from-indigo-500 hover:to-purple-500 hover:shadow-lg hover:shadow-indigo-900/40 active:scale-[0.98]"
            >
              <MessageSquarePlus className="h-4 w-4 transition-transform duration-200 group-hover:rotate-12" />
              New conversation
            </button>
          </div>

          <div className="shrink-0 flex items-center justify-between px-3 pt-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Workspace
            </span>
            <span className="text-[10px] text-slate-600">
              {filteredConversations.length} conversations
            </span>
          </div>

          <div className="shrink-0 flex items-center gap-2 border-b border-slate-800/60 p-3">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-600" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="h-8 border-slate-800 bg-slate-950/50 pl-8 text-xs text-slate-300 placeholder:text-slate-600"
              />
            </div>
            <button
              type="button"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="scroll-smooth space-y-3 p-3">
              {groupedConversations.map(
                ({ key, conversations: convs, def }) => {
                  const label = def?.label ?? "Boshqa";
                  const collapsed = collapsedFolders[key];
                  return (
                    <div key={key}>
                      <button
                        type="button"
                        onClick={() => toggleFolder(key)}
                        className="flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left transition-colors hover:bg-slate-900/60"
                      >
                        {collapsed ? (
                          <Folder className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                        ) : (
                          <FolderOpen
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              def ? def.accentText : "text-amber-400",
                            )}
                          />
                        )}
                        <span className="flex-1 truncate text-xs font-semibold text-slate-300">
                          {label}
                        </span>
                        <span className="shrink-0 text-[10px] text-slate-600">
                          {convs.length}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-3 w-3 shrink-0 text-slate-600 transition-transform duration-200",
                            collapsed && "-rotate-90",
                          )}
                        />
                      </button>
                      {!collapsed && (
                        <div className="ml-2.5 mt-1 space-y-1.5 border-l border-slate-800/60 pl-3">
                          {convs.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => selectConversation(c.id)}
                              className={cn(
                                "w-full rounded-lg border px-3 py-2.5 text-left transition-all duration-200",
                                activeConversationId === c.id
                                  ? "border-indigo-500/40 bg-indigo-500/10"
                                  : "border-transparent hover:bg-slate-900/60",
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="truncate text-xs font-medium text-slate-200">
                                  {c.title}
                                </span>
                                <span className="shrink-0 text-[10px] text-slate-600">
                                  {timeLabel(c.updatedAt)}
                                </span>
                              </div>
                              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                                {c.preview}
                              </p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                },
              )}
              {filteredConversations.length === 0 && (
                <p className="px-2 py-6 text-center text-xs text-slate-600">
                  No conversations found
                </p>
              )}
            </div>
          </ScrollArea>

          <div className="shrink-0 border-t border-slate-800/60 p-3">
            <button
              type="button"
              className="flex w-full items-center justify-center gap-1 text-xs font-medium text-indigo-400 transition-colors hover:text-indigo-300"
            >
              View all conversations
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </aside>

        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden bg-[#09090b]">
          <div className="min-h-0 flex-1 scroll-smooth overflow-y-auto overscroll-contain">
            <div className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-6 py-16 text-center animate-in fade-in duration-500">
                  <p className="max-w-xl text-md text-shadow-3xs text-slate-400">
                    Ask a question about SMM, market entry strategy, startup
                    validation, or a career plan.
                  </p>
                  <div className="grid w-full max-w-2xl grid-cols-2 gap-2.5 sm:grid-cols-3">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleQuickStart(cat)}
                          className="group flex flex-col items-start gap-1.5 rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 text-left transition-all duration-200 hover:border-indigo-500/40 hover:bg-slate-900/60"
                        >
                          <span
                            className={cn(
                              "flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105",
                              cat.accentBg,
                            )}
                          >
                            <Icon
                              className={cn("h-4.5 w-4.5", cat.accentText)}
                            />
                          </span>
                          <span className="text-xs font-semibold text-slate-200">
                            {cat.label}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {cat.description}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {messages.map((message) =>
                message.role === "user" ? (
                  <div
                    key={message.id}
                    className="flex justify-end gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    <div className="max-w-[80%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-indigo-600 to-purple-600 px-4 py-3 shadow-md shadow-indigo-900/20">
                      <p className="text-sm leading-relaxed text-white whitespace-pre-wrap">
                        {message.content}
                      </p>
                      <p className="mt-1.5 text-right text-[10px] text-indigo-200/80">
                        {timeLabel(message.createdAt)}
                      </p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-xs font-semibold text-white shadow-sm">
                      A
                    </div>
                  </div>
                ) : (
                  <div
                    key={message.id}
                    className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-400"
                  >
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {!message.isThinking && message.content && (
                          <CategoryBadge text={message.content} />
                        )}
                        {message.isThinking && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Analyzing your request...
                          </span>
                        )}
                        {message.isStreaming && !message.isThinking && (
                          <span className="inline-flex items-center gap-1.5 text-xs text-indigo-400">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-indigo-400" />
                            Writing...
                          </span>
                        )}
                      </div>

                      {message.steps && message.steps.length > 0 && (
                        <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-1.5">
                          {message.steps.map((step) => (
                            <StepRow
                              key={step.id}
                              step={step}
                              total={message.steps!.length}
                            />
                          ))}
                        </div>
                      )}

                      {!message.isThinking &&
                        !message.isStreaming &&
                        message.content &&
                        (() => {
                          const stats = computeMessageStats(message);
                          return (
                            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3.5 sm:grid-cols-4 animate-in fade-in duration-300">
                              <StatCell
                                icon={Gauge}
                                label="Estimated quality"
                                value={`${stats.quality}%`}
                                bar={stats.quality}
                              />
                              <StatCell
                                icon={ShieldCheck}
                                label="Confidence"
                                value={stats.confidence}
                              />
                              <StatCell
                                icon={Library}
                                label="Sources"
                                value={String(
                                  stats.sourcesCount ||
                                  (message.id === lastAssistant?.id
                                    ? (lastAssistant?.sources?.length ?? 0)
                                    : 0),
                                )}
                              />
                              <StatCell
                                icon={Clock}
                                label="Reading time"
                                value={`${stats.readingMin} min`}
                              />
                            </div>
                          );
                        })()}

                      {message.content && (
                        <AnswerRenderer content={message.content} />
                      )}

                      {!message.isThinking && message.content && (
                        <div className="flex flex-wrap items-center gap-2 pt-1 animate-in fade-in duration-300">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSending || message.isStreaming}
                            onClick={() => continueGenerating(message.id)}
                            className="gap-1.5 border-slate-800 bg-slate-900/60 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                          >
                            {message.isStreaming ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5" />
                            )}
                            Continue generating
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isSending}
                            onClick={() => handleRegenerate(message)}
                            className="gap-1.5 border-slate-800 bg-slate-900/60 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Regenerate
                          </Button>
                          <div className="ml-auto flex items-center gap-0.5">
                            <CopyMessageButton content={message.content} />
                            <button
                              type="button"
                              onClick={() =>
                                setReaction(
                                  message.id,
                                  message.reaction === "like" ? null : "like",
                                )
                              }
                              className={cn(
                                "rounded-md p-1.5 transition-colors",
                                message.reaction === "like"
                                  ? "bg-emerald-500/15 text-emerald-400"
                                  : "text-slate-500 hover:bg-slate-800 hover:text-emerald-400",
                              )}
                              aria-label="Like"
                            >
                              <ThumbsUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setReaction(
                                  message.id,
                                  message.reaction === "dislike"
                                    ? null
                                    : "dislike",
                                )
                              }
                              className={cn(
                                "rounded-md p-1.5 transition-colors",
                                message.reaction === "dislike"
                                  ? "bg-rose-500/15 text-rose-400"
                                  : "text-slate-500 hover:bg-slate-800 hover:text-rose-400",
                              )}
                              aria-label="Dislike"
                            >
                              <ThumbsDown className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ),
              )}
              <div ref={messagesEndRef} className="h-px " />
            </div>
          </div>

          {/* Butun input paneli — kategoriya chiplari, mode dropdown,
              textarea, send tugmasi — endi shu bitta <ChatInput/> ichida.
              O'z ichki state'i borligi uchun bu yerda yozish parentni
              qayta render qilmaydi. */}
          <div className="shrink-0 border-t border-slate-800/60 bg-[#0a0a0c] p-4">
            <ChatInput
              ref={chatInputRef}
              isSending={isSending}
              mode={mode}
              onModeChange={setMode}
              selectedCategory={selectedCategory}
              onPickCategory={handlePickCategory}
              onSend={(text) => sendMessage(text)}
            />
            <p className="mt-2 text-center text-[11px] text-slate-600">
              NicheFX Agent can make mistakes. Always verify important
              information.
            </p>
            {chatError && (
              <p className="mt-1 text-center text-[11px] text-rose-400 animate-in fade-in">
                {chatError}
              </p>
            )}
          </div>
        </main>

        <aside className="hidden min-h-0 flex-col overflow-hidden border-l border-slate-800/60 bg-[#0a0a0c] lg:flex">
          <ScrollArea className="min-h-0 flex-1">
            <div className="scroll-smooth space-y-6 p-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  AI Analysis
                </h2>
              </div>

              {activeCategory && (
                <div className="flex items-center gap-2 rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
                  <span
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                      activeCategory.accentBg,
                    )}
                  >
                    <activeCategory.icon
                      className={cn("h-4 w-4", activeCategory.accentText)}
                    />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-200">
                      {activeCategory.label}
                    </p>
                    <p className="truncate text-[11px] text-slate-500">
                      {activeCategory.description}
                    </p>
                  </div>
                </div>
              )}

              {activeSteps.length > 0 ? (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">
                        Step by step progress
                      </span>
                      <span className="font-medium text-slate-300">
                        {doneCount}/{activeSteps.length} qadam
                      </span>
                    </div>
                    <Progress
                      value={(doneCount / activeSteps.length) * 100}
                      className="h-1.5 bg-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-medium text-slate-500">
                      Current step
                    </p>
                    {currentStep ? (
                      <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3.5 animate-in fade-in duration-300">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-500/20 text-[11px] font-semibold text-indigo-300">
                              {currentStep.index}
                            </span>
                            <div>
                              <p className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                                {(() => {
                                  const CurrentStepIcon = stepIcon(
                                    currentStep.title,
                                    currentStep.index,
                                    activeSteps.length,
                                  );
                                  return (
                                    <CurrentStepIcon className="h-3.5 w-3.5 shrink-0 text-indigo-400" />
                                  );
                                })()}
                                {currentStep.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-500">
                                {currentStep.description}
                              </p>
                            </div>
                          </div>
                          <span className="shrink-0 text-xs font-semibold text-indigo-300">
                            {currentStepProgress}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3.5 text-xs text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                        The process has been completed.
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-slate-600">
                  Send a question, and the analysis will appear here.
                </p>
              )}

              {lastAssistant?.insights && lastAssistant.insights.length > 0 && (
                <div className="space-y-2.5 animate-in fade-in duration-300">
                  <Separator className="bg-slate-800" />
                  <p className="text-sm font-semibold text-slate-100">
                    Key Insights
                  </p>
                  <div className="space-y-2.5">
                    {lastAssistant.insights.map((insight, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs">
                        <span
                          className={cn(
                            "mt-1 h-1.5 w-1.5 shrink-0 rounded-full",
                            [
                              "bg-indigo-400",
                              "bg-purple-400",
                              "bg-amber-400",
                              "bg-emerald-400",
                            ][i % 4],
                          )}
                        />
                        <p className="text-slate-400">
                          <span className="font-medium text-slate-200">
                            {insight.label}:
                          </span>{" "}
                          {insight.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {lastAssistant?.sources && lastAssistant.sources.length > 0 && (
                <div className="space-y-2.5 animate-in fade-in duration-300">
                  <Separator className="bg-slate-800" />
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-100">
                      Sources & References
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {lastAssistant.sources.length} sources found
                  </p>
                  <div className="space-y-2">
                    {lastAssistant.sources.map((source, i) => (
                      <a
                        key={i}
                        href={source.uri}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2.5 rounded-lg border border-slate-800/80 bg-slate-950/40 p-2.5 transition-colors hover:border-slate-700"
                      >
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-indigo-500/10 text-indigo-300">
                          <Link2 className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-slate-200">
                            {source.title}
                          </p>
                          <p className="truncate text-[10px] text-slate-500">
                            {source.domain} · {source.year}
                          </p>
                        </div>
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] text-slate-400">
                          {i + 1}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {lastAssistant?.suggestedQuestions &&
                lastAssistant.suggestedQuestions.length > 0 && (
                  <div className="space-y-2.5 animate-in fade-in duration-300">
                    <Separator className="bg-slate-800" />
                    <p className="text-sm font-semibold text-slate-100">
                      Suggested Next Questions
                    </p>
                    <div className="space-y-1.5">
                      {lastAssistant.suggestedQuestions.map((q, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => handleSend(q)}
                          className="flex w-full items-center justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-950/40 px-3 py-2 text-left text-xs text-slate-300 transition-colors hover:border-indigo-500/30 hover:bg-slate-900/60"
                        >
                          {q}
                          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </ScrollArea>
        </aside>
      </div>
    </div>
  );
}
