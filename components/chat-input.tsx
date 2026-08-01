"use client";

// ============================================================
// components/chat/chat-input.tsx
//
// NEGA ALOHIDA FAYLGA CHIQARILDI:
// Avval `input` state ChatbotPage'ning o'zida edi. Har bir harf
// bosilganda BUTUN sahifa (jumladan yuzlab xabar va formulalarni
// har safar qayta render qilib, katex.renderToString'ni qayta
// ishga tushiradigan xabarlar ro'yxati) qayta render bo'lardi —
// shu sabab yozish "qotib" qolardi.
//
// Bu yerda `input` matni FAQAT shu komponent ichida yashaydi.
// Parent (ChatbotPage) uni umuman bilmaydi — faqat foydalanuvchi
// "Yuborish"ni bosganda `onSend(text)` chaqiriladi. Shu tufayli
// yozish paytida parent va xabarlar ro'yxati QAYTA RENDER
// BO'LMAYDI.
//
// Muhim: ChatbotPage'dan "Quick start" tugmasi bosilganda
// (bo'sh suhbatda kategoriya kartochkasi tanlanganda) inputga
// matn yozib qo'yish kerak bo'ladi — shuning uchun ref orqali
// `setValue` / `focus` metodlari chiqarilgan (useImperativeHandle).
// ============================================================

import {
  forwardRef,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Plus,
  Send,
  Mic,
  Wrench,
  ChevronDown,
  Loader2,
  Sparkles,
  Briefcase,
  Calculator,
  Code2,
  FlaskConical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { ChatMode } from "@/hooks/use-chatbot";
import { CATEGORIES, classifyCategory, type CategoryId } from "@/lib/chat-categories";

const MODE_OPTIONS: { id: ChatMode; label: string; icon: typeof Wrench }[] = [
  { id: "general", label: "General", icon: Sparkles },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "math", label: "Mathematics", icon: Calculator },
  { id: "code", label: "Code", icon: Code2 },
  { id: "science", label: "Science", icon: FlaskConical },
];

export interface ChatInputHandle {
  /** Matnni tashqaridan (masalan "quick start" kartochkasidan) o'rnatish */
  setValue: (text: string, selectFrom?: number) => void;
  focus: () => void;
}

interface ChatInputProps {
  isSending: boolean;
  mode: ChatMode;
  onModeChange: (mode: ChatMode) => void;
  selectedCategory: CategoryId | null;
  onPickCategory: (categoryId: CategoryId, mode: ChatMode) => void;
  onSend: (text: string) => void;
}

const ChatInput = forwardRef<ChatInputHandle, ChatInputProps>(
  function ChatInput(
    { isSending, mode, onModeChange, selectedCategory, onPickCategory, onSend },
    ref,
  ) {
    // Matn FAQAT shu yerda yashaydi — parent bundan bexabar.
    const [value, setValue] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => ({
      setValue: (text, selectFrom) => {
        setValue(text);
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
          const pos = selectFrom ?? text.length;
          textareaRef.current?.setSelectionRange(pos, pos);
        });
      },
      focus: () => textareaRef.current?.focus(),
    }));

    // Faqat shu komponent ichida qayta hisoblanadi — parentga ta'siri yo'q.
    const detectedCategory = useMemo(() => classifyCategory(value), [value]);

    function handleSend() {
      const prompt = value;
      if (!prompt.trim() || isSending) return;
      setValue("");
      onSend(prompt);
    }

    const activeMode = MODE_OPTIONS.find((m) => m.id === mode) ?? MODE_OPTIONS[0];

    return (
      <div className="mx-auto max-w-3xl space-y-2.5">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => {
            const isActive = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onPickCategory(cat.id, cat.mode)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200",
                  isActive
                    ? cat.accentChipActive
                    : "border-slate-800 bg-slate-950/40 text-slate-400 hover:border-slate-700 hover:text-slate-200",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {cat.label}
              </button>
            );
          })}
          {!selectedCategory && detectedCategory && (
            <span
              className={cn(
                "ml-1 inline-flex items-center gap-1 rounded-full border border-dashed border-slate-700 px-2.5 py-1 text-[11px]",
                detectedCategory.accentText,
              )}
            >
              <detectedCategory.icon className="h-3 w-3" />
              Detected: {detectedCategory.label}
            </span>
          )}
        </div>

        <div className="flex items-end gap-2 rounded-2xl border border-slate-800 bg-slate-950/50 p-2 transition-colors focus-within:border-slate-700">
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <Plus className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger>
              <div className="flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs text-slate-400 transition-colors hover:bg-slate-800">
                <Wrench className="h-3.5 w-3.5" />
                {activeMode.label}
                <ChevronDown className="h-3 w-3" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {MODE_OPTIONS.map(({ id, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={id}
                  onClick={() => onModeChange(id)}
                  className={cn("gap-2 text-xs", mode === id && "text-indigo-400")}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            rows={1}
            className="max-h-32 min-h-[2rem] flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none"
          />
          <button
            type="button"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-800 hover:text-slate-300"
          >
            <Mic className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!value.trim() || isSending}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-sm transition-opacity disabled:opacity-40"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    );
  },
);

export default ChatInput;