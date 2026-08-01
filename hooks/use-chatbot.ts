// ============================================================
// hooks/use-chatbot.ts (v4 — til-avtomatik aniqlash + "aqlli agent"
// rejimi: oddiy suhbat uchun yengil, murakkab so'rov uchun to'liq
// tuzilma bilan)
//
// v3'dan farqi:
// 1. TIL AVTOMATIK ANIQLASH — AI endi foydalanuvchi qaysi tilda
//    yozgan bo'lsa (o'zbek, rus, ingliz va h.k.), o'sha tilda javob
//    beradi. Agar foydalanuvchi "qaysi tillarni bilasan?" kabi savol
//    bersa, AI buni tasdiqlab, biladigan tillarini sanab o'tadi.
// 2. AQLLI AGENT / OG'IRLIK DARAJASI — oddiy salomlashuv, rahmat,
//    kichik suhbat kabi xabarlar uchun endi bosqichma-bosqich
//    "thinking steps", "key insights", majburiy "## sarlavha"/"- "
//    formatlash va web-grounding ISHLATILMAYDI. Bunday xabarlarga AI
//    oddiy, samimiy va qisqa javob beradi — xuddi tabiiy suhbatdagidek.
//    Murakkab yoki mazmunli so'rovlarda esa avvalgidek to'liq
//    tuzilma (rejalashtirish, bosqichlar, formula formatlash,
//    kategoriya aniqlash) ishlaydi.
// 3. Bu tanlov har bir xabar uchun avtomatik (isCasualChat orqali)
//    aniqlanadi — foydalanuvchi hech narsani qo'lda tanlashi shart
//    emas.
// ============================================================

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  generateWithFallback,
  generateWithFallbackStream,
} from "@/lib/ai-client";
import type {
  GatewayMessage,
  GatewaySource,
} from "@/lib/ai-gateway";

const STEP_REVEAL_DELAY_MS = 450;

export type StepStatus = "pending" | "active" | "done";
export type ChatMode = "general" | "math" | "code" | "science" | "business";
export type Reaction = "like" | "dislike" | null;

export interface AgentStep {
  id: string;
  index: number;
  title: string;
  description: string;
  status: StepStatus;
}

export interface KeyInsight {
  label: string;
  detail: string;
}

export type SourceRef = GatewaySource;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  steps?: AgentStep[];
  insights?: KeyInsight[];
  sources?: SourceRef[];
  suggestedQuestions?: string[];
  provider?: "gemini" | "openrouter" | "mistral";
  isThinking?: boolean; // rejalashtirish bosqichi
  isStreaming?: boolean; // matn hozir real-time yozilyapti
  isComplete?: boolean; // false bo'lsa — "Davom ettirish" tugmasi ko'rinadi
  reaction?: Reaction;
  mode?: ChatMode;
}

export interface ConversationSummary {
  id: string;
  title: string;
  preview: string;
  updatedAt: string;
  mode: ChatMode;
}

interface AgentPlan {
  steps: { title: string; description: string }[];
  key_insights: { label: string; detail: string }[];
  suggested_questions: string[];
}

interface AgentProfile {
  total_likes: number;
  total_dislikes: number;
  like_streak: number;
  dislike_streak: number;
  idea_heavy_dislikes: number;
}

const DEFAULT_PROFILE: AgentProfile = {
  total_likes: 0,
  total_dislikes: 0,
  like_streak: 0,
  dislike_streak: 0,
  idea_heavy_dislikes: 0,
};

// ------------------------------------------------------------
// JSON extractor (rejalashtirish bosqichi uchun)
// ------------------------------------------------------------
function extractJson(rawText: string): any {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("AI javobi bo'sh");
  }

  let cleaned = rawText
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    // davom etamiz
  }

  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("AI javobida to'g'ri JSON topilmadi");
  }

  const candidate = cleaned.slice(firstBrace, lastBrace + 1);
  try {
    return JSON.parse(candidate);
  } catch {
    let depth = 0;
    let start = -1;
    let end = -1;
    for (let i = 0; i < cleaned.length; i++) {
      if (cleaned[i] === "{") {
        if (depth === 0) start = i;
        depth++;
      } else if (cleaned[i] === "}") {
        depth--;
        if (depth === 0 && start !== -1) {
          end = i;
          break;
        }
      }
    }
    if (start !== -1 && end !== -1) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        // fallthrough
      }
    }
    throw new Error("AI javobini JSON formatida o'qib bo'lmadi");
  }
}

function toGatewayHistory(history: ChatMessage[]): GatewayMessage[] {
  return history
    .filter((m) => m.content && m.content.trim().length > 0)
    .map((m) => ({ role: m.role, content: m.content }));
}

// ------------------------------------------------------------
// OG'IRLIK DARAJASINI ANIQLASH — "aqlli agent" mantig'i
// Oddiy salomlashuv / kichik suhbat bo'lsa, og'ir tuzilma
// (rejalashtirish, bosqichlar, majburiy formatlash) kerak emas.
// ------------------------------------------------------------
const CASUAL_PATTERNS: RegExp[] = [
  /^(salom|assalomu ?alaykum|hey|hi{1,2}|hello|привет|salam|hola)\b/i,
  /^(rahmat|tashakkur|thanks?( you)?|спасибо|merci)\b/i,
  /^(qalaysiz|qalaysan|yaxshimisiz|yahshimisiz|how are you|как дела|ne ?gap)\b/i,
  /^(xayr|xo['`]sh|bye|goodbye|ok(ay)?|mayli|tushunarli|zo['`]r|yaxshi|good|super|zo'r ekan)\b/i,
  /^(kimsan|sen kimsan|who are you|ismingiz|ismi ?ng ?nima)\b/i,
];

// So'rov murakkab/vazifaga oid ekanini ko'rsatuvchi belgilar — bular
// bo'lsa, xabar qisqa bo'lsa ham CASUAL deb hisoblanmaydi.
const TASK_SIGNAL_REGEX =
  /[?]|kod|code|yoz(ib)?\b|tahlil|hisobla|strategiya|reja|formula|nima uchun|qanday qilib|tuzat|xato|bug|deploy|funksiya|component|sql|api/i;

function isCasualChat(text: string): boolean {
  const t = (text || "").trim();
  if (!t) return false;

  if (CASUAL_PATTERNS.some((re) => re.test(t))) return true;

  const wordCount = t.split(/\s+/).filter(Boolean).length;
  if (wordCount <= 4 && !TASK_SIGNAL_REGEX.test(t)) return true;

  return false;
}

// ------------------------------------------------------------
// Mode bo'yicha tizim prompt qo'shimchalari ("tools")
// ------------------------------------------------------------
const MODE_LABELS: Record<ChatMode, string> = {
  general: "General / Startup Strategy",
  math: "Mathematics",
  code: "Coding",
  science: "Science / Deep Analysis",
  business: "Business Strategy",
};

function modeInstruction(mode: ChatMode): string {
  switch (mode) {
    case "math":
      return `You are currently in MATHEMATICS mode. Show every solution step-by-step with formulas.
Clearly highlight the final answer. If there are multiple ways to solve, choose the shortest one
and explain why you chose it in a single sentence. Write all formulas in strict compliance with the
"MATHEMATICAL FORMULA FORMAT" rule below.`;

    case "code":
      return `You are currently in CODE mode. Act as a PRINCIPAL/SENIOR developer with 30 years of experience
who has built many production systems and learned from failures. Think and write like a professional engineer:

1. ARCHITECTURE FIRST — before writing code, justify in 1-2 sentences why you chose a specific approach (trade-offs).
   If there is a significant alternative solution, explain why you did not choose it.
2. CORRECTNESS & EDGE CASES — handle empty arrays, null/undefined, boundary values, parallel requests,
   and network interruptions inside the code or comments. Review and check the code yourself before delivering it.
3. SECURITY — never trust user inputs: mention SQL/NoSQL injection, XSS, authentication, and authorization
   checks if the requested code relates to them.
4. PERFORMANCE & SCALABILITY — briefly mention time/space complexity (Big-O) where relevant; avoid premature
   optimization — write correct and readable code first, then optimize if needed.
5. ERROR HANDLING — use try/catch, clear error messages, and avoid silent failures; show how the system fails gracefully.
6. CLEAN CODE — use clear, meaningful variable and function names; write comments only to explain "why"
   (the "what" should be obvious from the code itself, do not repeat it).
7. TEST STRATEGY — if appropriate, briefly mention how to test (unit/integration, which cases), but do not write
   entire test files unless explicitly requested.
8. COMPLETE & RUNNABLE CODE — always provide complete, copy-pasteable code blocks for the target language/framework.
   Avoid unnecessary fluff — make every sentence count. Be short, precise, and honest like a senior engineer (e.g. "this solution is not ideal because...").`;

    case "science":
      return `You are currently in SCIENCE mode. Rely on facts, verified data, and real research.
Openly state if something is unverified ("this is not yet confirmed"). Distinguish speculation from fact.
If you mention numerical results, statistics, or formulas, comply with the "MATHEMATICAL FORMULA FORMAT" rule.`;

    case "business":
      return `You are currently in BUSINESS / PLATFORM mode. Answer startup, marketing, monetization,
and market-entry questions based on numbers, benchmarks, and real-world market conditions. If you include percentages,
formulas, or calculations, comply with the "MATHEMATICAL FORMULA FORMAT" rule.`;

    default:
      return `You are in general adviser mode — choose the most useful format (list, table, step-by-step plans)
based on the question. If your answer contains code, follow the CODE mode standards (correctness, edge cases, security);
if it contains calculations or formulas, follow the "MATHEMATICAL FORMULA FORMAT" rule.`;
  }
}

// ------------------------------------------------------------
// Matematik formulalarni frontend AnswerRenderer bilan mos qilib
// yozish qoidasi — bu og'ir (non-casual) rejimlarga qo'shiladi
// ------------------------------------------------------------
const MATH_FORMAT_INSTRUCTION = `

### MATHEMATICAL FORMULA FORMAT (mandatory)
Whenever you write any mathematical expression, equation, formula, or calculation, you MUST wrap it in the following delimiters so that it renders beautifully on the frontend:
- For inline expressions within a line: $expression$ (e.g., $x^2 + 2x - 3 = 0$, $CAC = \\frac{expenses}{new\\_customers}$)
- For block/centered formulas on their own line: $$expression$$ (opened on a new line and closed on a new line)
Use LaTeX style formatting: \\frac{a}{b}, \\sqrt{x}, \\sum, \\int, ^{power}, _{index}, Greek letters like \\alpha \\beta \\pi, and operators like \\times \\cdot \\leq \\geq \\neq \\infty.
Never leave raw LaTeX (like \\frac{}) naked in the text without the $ or $$ delimiters — it will display as raw code to the user. If you need complex tables or matrices, use standard markdown tables instead of LaTeX formulas.`;

// ------------------------------------------------------------
// TIL QOIDASI — barcha rejimlarga (casual va og'ir) qo'shiladi
// ------------------------------------------------------------
const LANGUAGE_INSTRUCTION = `

### LANGUAGE RULE (mandatory)
You MUST respond entirely in the SAME LANGUAGE that the user used in their last message (e.g., Uzbek, Russian, English, or any other language). Automatically detect the language from the text of the message — do not ask the user which language they prefer, and never switch the language mid-conversation.
If the user asks questions like "what languages do you speak", "can you speak English", "can we chat in Russian" — clearly confirm in that language that you support multiple languages (including Uzbek, Russian, English, and other widely used languages) and list them.`;

// ------------------------------------------------------------
// AVTOMATIK KATEGORIYA ANIQLASH — frontenddagi task chiplariga mos
// (Task / Research / Strategy / Brainstorm / Marketing / Deep Analysis)
// Foydalanuvchi biror rejimni qo'lda tanlamagan bo'lsa ham, so'rov
// matniga qarab tizim prompti mos ohangga moslashadi.
// ------------------------------------------------------------
type CategoryId =
  | "task"
  | "research"
  | "strategy"
  | "brainstorm"
  | "marketing"
  | "deep-analysis";
const CATEGORY_KEYWORDS: Record<CategoryId, string[]> = {
  task: ["task", "complete", "do", "todo", "assignment", "checklist"],
  research: ["research", "study", "learn", "source", "investigation"],
  strategy: [
    "strategy",
    "startup",
    "market",
    "launch",
    "gtm",
    "market entry plan",
  ],
  brainstorm: ["idea", "brainstorm", "suggestion", "creative", "concept"],
  marketing: [
    "marketing",
    "smm",
    "advertising",
    "instagram",
    "tiktok",
    "campaign",
    "audience",
  ],
  "deep-analysis": [
    "deep analysis",
    "statistics",
    "calculate",
    "model",
    "analyze",
    "metrics",
  ],
};

const CATEGORY_INSTRUCTIONS: Record<CategoryId, string> = {
  task: `This is a TASK-type request. Avoid long theoretical introductions and move directly
to actionable steps. Focus on practical, verifiable results that can be implemented.`,

  research: `This is a RESEARCH-type request. Explore the topic comprehensively, compare different
perspectives when possible, and pay special attention to numbers, data, and facts.`,

  strategy: `This is a STRATEGY-type request. Create a step-by-step strategic plan considering
the market, competition, resources, and risks. Separate short-term and long-term impacts.`,

  brainstorm: `This is a BRAINSTORM-type request. Provide diverse ideas, but briefly explain
the feasibility and implementation difficulty of each one. Do not list dozens of unsupported ideas;
focus on the 2-4 strongest options.`,

  marketing: `This is a MARKETING-type request. Provide practical recommendations considering
the audience, channels, budget, and expected outcomes (such as CTR, conversion rate, and engagement rate).`,

  "deep-analysis": `This is a DEEP ANALYSIS-type request. Analyze the data systematically,
support conclusions with reasoning, and use numerical metrics and formulas when possible.
Write formulas according to the "MATHEMATICAL FORMULA FORMAT" rule.`,
};

function detectCategory(text: string): CategoryId | null {
  const t = (text || "").toLowerCase();
  if (!t.trim()) return null;

  let best: CategoryId | null = null;
  let bestScore = 0;

  (Object.keys(CATEGORY_KEYWORDS) as CategoryId[]).forEach((id) => {
    let score = 0;
    for (const kw of CATEGORY_KEYWORDS[id]) {
      if (t.includes(kw)) score++;
    }
    if (score > bestScore) {
      bestScore = score;
      best = id;
    }
  });

  return bestScore > 0 ? best : null;
}

function categoryInstruction(prompt: string): string {
  const category = detectCategory(prompt);
  if (!category) return "";
  return `\n\n### DETECTED REQUEST TYPE (automatic, do not tell the user)\n${CATEGORY_INSTRUCTIONS[category]}`;
}

// ------------------------------------------------------------
// Profile-based personalization
// ------------------------------------------------------------
function personalizationInstruction(profile: AgentProfile): string {
  const lines: string[] = [];

  if (profile.dislike_streak >= 2) {
    lines.push(
      `Attention: The user disliked your last ${profile.dislike_streak} responses.
Avoid excessive praise and generic explanations — be direct, concise, and critical.
Do not hide weaknesses.`
    );
  }

  if (profile.idea_heavy_dislikes >= 3) {
    lines.push(
      `The user previously gave feedback that "you are suggesting too many baseless ideas without execution details."
Therefore, before proposing new ideas, critically evaluate the existing plan and emphasize only 1-2 most important, executable steps. Do not list dozens of options.`
    );
  }

  if (profile.like_streak >= 3 && profile.dislike_streak === 0) {
    lines.push(
      `The user is pleased with your recent responses — continue with the current format and depth,
but remain honest: if you see weaknesses in the requested topic, do not hesitate to highlight them.`
    );
  }

  if (lines.length === 0) return "";
  return `\n\n### PERSONAL TONE DIRECTION (for your eyes only, do not tell the user)\n${lines.join("\n")}`;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ------------------------------------------------------------
// Vaqt konteksti — modelni 2023/2024 deb o'ylashdan to'xtatadi
// ------------------------------------------------------------
function currentDateInstruction() {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `\n\n### TIME CONTEXT (mandatory)
Today's date: ${today} (year 2026). You must ALWAYS treat this date as the current time.

Rules:
1. By default, all answers, statistics, prices, versions, and "current" information must be based on the year 2026.
2. Never consider 2023, 2024, or 2025 as the current year.
3. ONLY switch to a specific year or context when the user explicitly mentions a year, date, or uses terms such as "history", "past", "in 2020", "old version", etc.
4. If the question relates to rapidly changing information such as "current", "latest", "newest", prices, statistics, or versions — prioritize GROUNDING (web search) results, but do not manually add source links to the response text. They will be automatically added in a separate block.
5. When mentioning your knowledge cutoff or knowledge limitations, use ${today} as the reference date.
`;
}

// ------------------------------------------------------------
// Rejalashtirish bosqichi (kichik JSON, stream shart emas — tez)
// FAQAT casual bo'lmagan xabarlar uchun chaqiriladi.
// ------------------------------------------------------------
async function planAgentSteps(
  prompt: string,
  history: ChatMessage[],
  mode: ChatMode,
) {
  const category = detectCategory(prompt);

  const categoryLine = category
    ? `\nThe request type has been automatically identified as: ${category}. Choose step names that are
specific, relevant, and practical for this category (for example, for marketing use "Audience Analysis",
for strategy use "Market and Competition Analysis").`
    : "";

  const systemPrompt = `You are NicheFX Agent — an expert AI agent specialized in ${MODE_LABELS[mode]}.

Analyze the user's request and determine the real, logical work steps required to complete it.
For simple questions, generate 2-3 steps; for complex requests, generate 4-6 steps.
The number and content of steps MUST be determined dynamically by you based only on the user's request.${categoryLine}

Do not mention sources (links) in your response. They will be added separately by the system.

Respond ONLY in the following JSON format and in the same language as the user.
Do not add any other text, explanations, or markdown:

{
  "steps": [
    {
      "title": "short step name",
      "description": "one sentence explaining what will be done in this step"
    }
  ],
  "key_insights": [
    {
      "label": "short title",
      "detail": "short explanation based on specific numbers or facts"
    }
  ],
  "suggested_questions": [
    "question 1",
    "question 2",
    "question 3"
  ]
}`;

  try {
    const { text } = await generateWithFallback({
      prompt,
      history: toGatewayHistory(history),
      systemPrompt,
      json: true,
      mode,
    });

    const parsed = extractJson(text || "{}");

    return {
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      key_insights: Array.isArray(parsed.key_insights)
        ? parsed.key_insights
        : [],
      suggested_questions: Array.isArray(parsed.suggested_questions)
        ? parsed.suggested_questions
        : [],
    } as AgentPlan;
  } catch (err) {
    console.error("planAgentSteps error, using fallback:", err);

    return {
      steps: [
        {
          title: "Analyze the request",
          description: "Identify the main goal and context",
        },
        {
          title: "Prepare the answer",
          description: "Create a clear and practical response",
        },
      ],
      key_insights: [],
      suggested_questions: [],
    } as AgentPlan;
  }
}

// ------------------------------------------------------------
// Asosiy javob uchun tizim prompti — CASUAL bo'lsa yengil, aks
// holda to'liq tuzilma (mode, format, kategoriya, shaxsiylashtirish)
// ------------------------------------------------------------
function buildAnswerSystemPrompt(
  mode: ChatMode,
  profile: AgentProfile,
  userPrompt: string = "",
  isCasual: boolean = false,
) {
  if (isCasual) {
    return `You are NicheFX Agent — an AI agent capable of having friendly, natural, and concise conversations.

This is a casual, everyday conversation message (greeting, small question, thanks, etc.). For such messages,
DO NOT respond with an overly formal structure: "## headings", "- " bullet lists, step-by-step analysis,
or mandatory statistics/sources are NOT required. Respond naturally, briefly, and warmly like a real conversation.

If during the conversation the user suddenly requests deeper analysis, code, calculations, or a plan,
you can then choose and apply the appropriate format (headings, lists, formulas) based on the topic.
You should understand when a structured response is necessary.

${LANGUAGE_INSTRUCTION}${currentDateInstruction()}`;
  }

  return `You are NicheFX Agent — a highly knowledgeable, honest, and practical AI agent.

Always rely on facts, data, numbers, and real-world market conditions. Do not always praise the user —
when necessary, provide honest criticism, identify weak points, and highlight problems while maintaining
a respectful and constructive tone.

${modeInstruction(mode)}

### MANDATORY BUSINESS AND ANALYSIS GUIDELINES:
1. **Local Competitors**: If the prompt refers to a specific regional/local market (such as Uzbekistan, Central Asia, etc.), do NOT mention generic global competitors like Reddit or Quora. Instead, identify actual local competitors (e.g. local Telegram channels, specialized Telegram groups, Facebook communities, or local forum-like channels) and analyze how they operate.
2. **Definitive MVP Recommendation**: Do not give vague suggestions (e.g. "either a website or a bot"). Provide a clear, definitive recommendation on the most cost-effective and fastest MVP format (e.g. a Telegram Bot, a mobile app, or a simple landing page website) and explain exactly why this choice is ideal for initial market validation.
3. **Actionable 30-Day Action Plan**: Provide a concrete, step-by-step "First 30 Days Action Plan" that details exactly what the entrepreneur should do tomorrow, next week, and throughout the month to start building and testing.
4. **Deep Key Insights**: Avoid generic statements. For example, instead of saying "sharing household problems is popular", specify exactly what categories of household issues (e.g. plumbing repairs, utilities, local service search) will drive the highest user engagement and conversion based on local behaviors.

If GROUNDING (web search) is enabled, do not manually write the sources you used in your answer.
They will automatically be added as a separate "Sources" block. You should only write answers based on
the information provided by those sources.

### SOURCE REFERENCES (CITATIONS)

If you use any facts, statistics, or information from web search (grounding) results, add the source
number in brackets [1], [2] at the end of the sentence or paragraph where the information is used.
Numbering starts from 1 and continues sequentially. The system will automatically link these numbers
to the correct sources. Do not write raw links (https://...) yourself.

Write your answer using the following format:

- Use "## Section title" headings for each section.
- Write important practical points using "- " bullet lists.
- **Tables and Data**: Use markdown tables (\`| Column 1 | Column 2 |\`) whenever comparing options, showing metrics, or presenting structured data.
- **Quotes and Highlights**: Use blockquotes (\`> text\`) to highlight quotes, critical tips, warnings, or core advice.
- End with one short practical recommendation starting with "> " (blockquote).
- Whenever possible, rely on real statistics, percentages, and sources.

${MATH_FORMAT_INSTRUCTION}${LANGUAGE_INSTRUCTION}${currentDateInstruction()}${categoryInstruction(userPrompt)}${personalizationInstruction(profile)}`;
}

export function useChatBot() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [mode, setMode] = useState<ChatMode>("general");
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;

  const profileRef = useRef<AgentProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    loadConversations();
    loadProfile();
  }, []);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("user_agent_profile")
      .select(
        "total_likes, total_dislikes, like_streak, dislike_streak, idea_heavy_dislikes",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) profileRef.current = data as AgentProfile;
  }, []);

  const loadConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setIsLoadingConversations(false);
      return;
    }

    const { data } = await supabase
      .from("chat_conversations")
      .select("id, title, preview, updated_at, mode")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    setConversations(
      (data ?? []).map((c) => ({
        id: c.id,
        title: c.title,
        preview: c.preview ?? "",
        updatedAt: c.updated_at,
        mode: (c.mode ?? "general") as ChatMode,
      })),
    );
    setIsLoadingConversations(false);
  }, []);

  const loadMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select(
        "id, role, content, steps, insights, sources, suggested_questions, provider, reaction, is_complete, mode, created_at",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages(
      (data ?? []).map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
        steps: m.steps ?? undefined,
        insights: m.insights ?? undefined,
        sources: m.sources ?? undefined,
        suggestedQuestions: m.suggested_questions ?? undefined,
        provider: m.provider ?? undefined,
        reaction: (m.reaction ?? null) as Reaction,
        isComplete: m.is_complete ?? true,
        mode: (m.mode ?? "general") as ChatMode,
      })),
    );
  }, []);

  const selectConversation = useCallback(
    (id: string) => {
      setActiveConversationId(id);
      loadMessages(id);
      const conv = conversations.find((c) => c.id === id);
      if (conv) setMode(conv.mode);
    },
    [loadMessages, conversations],
  );

  const newChat = useCallback((initialMode: ChatMode = "general") => {
    setActiveConversationId(null);
    setMessages([]);
    setError(null);
    setMode(initialMode);
  }, []);

  const ensureConversation = useCallback(
    async (firstPrompt: string, currentMode: ChatMode) => {
      if (activeConversationId) return activeConversationId;

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Bu amal uchun avval tizimga kiring.");

      const { data, error: insertError } = await supabase
        .from("chat_conversations")
        .insert({
          user_id: user.id,
          title: firstPrompt.slice(0, 60),
          preview: firstPrompt.slice(0, 80),
          mode: currentMode,
        })
        .select("id")
        .single();

      if (insertError || !data) throw new Error("Suhbat yaratib bo'lmadi.");

      setActiveConversationId(data.id);
      loadConversations();
      return data.id as string;
    },
    [activeConversationId, loadConversations],
  );

  // ----------------------------------------------------------
  // Asosiy xabar yuborish — real-time streaming bilan.
  // "Aqlli agent" mantig'i: har bir xabar uchun avval CASUAL yoki
  // yo'qligi aniqlanadi. CASUAL bo'lsa — rejalashtirish bosqichi
  // (steps/insights) va web-grounding butunlay o'tkazib yuboriladi,
  // AI darhol qisqa va tabiiy javob bilan stream qila boshlaydi.
  // ----------------------------------------------------------
  const sendMessage = useCallback(
    async (prompt: string) => {
      const trimmed = prompt.trim();
      if (!trimmed || isSending) return;

      setError(null);
      setIsSending(true);

      const casual = isCasualChat(trimmed);

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      const historySoFar = [...messagesRef.current, userMessage];
      setMessages(historySoFar);

      const assistantId = crypto.randomUUID();
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString(),
          // Casual xabarlarda "o'ylayapman" bosqichini ko'rsatmaymiz —
          // to'g'ridan-to'g'ri stream boshlanadi.
          isThinking: !casual,
          isStreaming: casual,
          isComplete: true,
          steps: [],
          mode,
        },
      ]);

      try {
        const conversationId = await ensureConversation(trimmed, mode);

        await supabase.from("chat_messages").insert({
          conversation_id: conversationId,
          role: "user",
          content: trimmed,
          mode,
        });

        let steps: AgentStep[] = [];
        let planInsights: KeyInsight[] = [];
        let suggestedQuestions: string[] = [];

        if (!casual) {
          // 1) Rejalashtirish (tez, kichik JSON — stream shart emas)
          // FAQAT og'ir/mazmunli so'rovlar uchun ishga tushadi.
          const plan = await planAgentSteps(trimmed, historySoFar, mode);
          steps = plan.steps.map((s, i) => ({
            id: `${assistantId}-step-${i}`,
            index: i + 1,
            title: s.title,
            description: s.description,
            status: "pending",
          }));
          planInsights = plan.key_insights;
          suggestedQuestions = plan.suggested_questions;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, steps, insights: planInsights }
                : m,
            ),
          );

          for (let i = 0; i < steps.length; i++) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      steps: m.steps?.map((s, idx) =>
                        idx === i ? { ...s, status: "active" } : s,
                      ),
                    }
                  : m,
              ),
            );
            await delay(STEP_REVEAL_DELAY_MS);
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? {
                      ...m,
                      steps: m.steps?.map((s, idx) =>
                        idx === i ? { ...s, status: "done" } : s,
                      ),
                    }
                  : m,
              ),
            );
          }
        }

        // 2) Asosiy javob — REAL-TIME STREAM
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, isThinking: false, isStreaming: true }
              : m,
          ),
        );

        let fullText = "";
        let finalSources: GatewaySource[] = [];
        let finalProvider: ChatMessage["provider"] = undefined;

        const systemPrompt = buildAnswerSystemPrompt(
          mode,
          profileRef.current,
          trimmed,
          casual,
        );

        await generateWithFallbackStream(
          {
            prompt: trimmed,
            history: toGatewayHistory(historySoFar),
            systemPrompt,
            // Oddiy suhbatda web-qidiruvga hojat yo'q — tezroq va
            // arzonroq javob uchun grounding faqat og'ir so'rovlarda yoqiladi.
            grounding: !casual,
            mode,
          },
          {
            onToken: (chunk) => {
              fullText += chunk;
              // Har bir tokenda UI'ni yangilaymiz — foydalanuvchi real-time yozilishini ko'radi.
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId ? { ...m, content: fullText } : m,
                ),
              );
            },
            onSources: (sources) => {
              finalSources = sources;
            },
            onProvider: (provider) => {
              finalProvider = provider;
            },
          },
        );

        // 3) Stream tugadi — endigina bazaga BITTA marta yozamiz.
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: fullText,
                  sources: finalSources,
                  provider: finalProvider,
                  suggestedQuestions,
                  isStreaming: false,
                  isComplete: true,
                }
              : m,
          ),
        );

        await supabase.from("chat_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: fullText,
          steps,
          insights: planInsights,
          sources: finalSources,
          suggested_questions: suggestedQuestions,
          provider: finalProvider,
          mode,
          is_complete: true,
        });

        await supabase
          .from("chat_conversations")
          .update({
            updated_at: new Date().toISOString(),
            preview: fullText.slice(0, 80),
          })
          .eq("id", conversationId);

        loadConversations();
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "Kutilmagan xatolik yuz berdi. Qaytadan urinib ko'ring.";
        setError(message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  isThinking: false,
                  isStreaming: false,
                  content: m.content || message,
                  isComplete: false,
                }
              : m,
          ),
        );
      } finally {
        setIsSending(false);
      }
    },
    [ensureConversation, isSending, loadConversations, mode],
  );

  // ----------------------------------------------------------
  // CONTINUE GENERATING — uzilgan yoki qisqa javobni davom ettirish
  // ----------------------------------------------------------
  const continueGenerating = useCallback(
    async (messageId: string) => {
      if (isSending) return;
      const target = messagesRef.current.find((m) => m.id === messageId);
      if (!target || target.role !== "assistant" || !activeConversationId)
        return;

      setIsSending(true);
      setError(null);

      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isStreaming: true } : m)),
      );

      try {
        const continuePrompt = `Oldingi javobing shu joyda uzilib qoldi:\n\n"""${target.content}"""\n\nShu matnni AYNAN
davom ettir — boshidan qaytarma, faqat qolgan qismini yoz. Formatlashni (## sarlavha, - ro'yxat, $formula$)
saqlab qol, va foydalanuvchi qaysi tilda yozgan bo'lsa o'sha tilda davom et.`;

        // Kategoriya va til aniqlash uchun original foydalanuvchi so'rovini topamiz
        // (target — assistant xabari, undan oldingi user xabari kontekst beradi)
        const targetIndex = messagesRef.current.findIndex(
          (m) => m.id === messageId,
        );
        const originatingUserMessage = [
          ...messagesRef.current.slice(0, targetIndex),
        ]
          .reverse()
          .find((m) => m.role === "user");

        const originatingPrompt =
          originatingUserMessage?.content ?? target.content;

        const systemPrompt = buildAnswerSystemPrompt(
          (target.mode ?? mode) as ChatMode,
          profileRef.current,
          originatingPrompt,
          isCasualChat(originatingPrompt),
        );

        let appended = "";
        await generateWithFallbackStream(
          {
            prompt: continuePrompt,
            history: toGatewayHistory(messagesRef.current),
            systemPrompt,
            grounding: false,
            mode: target.mode ?? mode,
          },
          {
            onToken: (chunk) => {
              appended += chunk;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === messageId
                    ? { ...m, content: target.content + appended }
                    : m,
                ),
              );
            },
          },
        );

        const finalContent = target.content + appended;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? {
                  ...m,
                  content: finalContent,
                  isStreaming: false,
                  isComplete: true,
                }
              : m,
          ),
        );

        await supabase
          .from("chat_messages")
          .update({ content: finalContent, is_complete: true })
          .eq("id", messageId);

        await supabase
          .from("chat_conversations")
          .update({
            updated_at: new Date().toISOString(),
            preview: finalContent.slice(0, 80),
          })
          .eq("id", activeConversationId);
      } catch (e) {
        const message =
          e instanceof Error
            ? e.message
            : "Davom ettirishda xatolik yuz berdi.";
        setError(message);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isStreaming: false } : m,
          ),
        );
      } finally {
        setIsSending(false);
      }
    },
    [isSending, activeConversationId, mode],
  );

  // ----------------------------------------------------------
  // LIKE / DISLIKE — record_feedback RPC orqali
  // ----------------------------------------------------------
  const setReaction = useCallback(
    async (messageId: string, reaction: Reaction, isIdeaHeavy = false) => {
      const previous =
        messagesRef.current.find((m) => m.id === messageId)?.reaction ?? null;

      // Optimistik UI yangilanishi
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reaction } : m)),
      );

      try {
        if (reaction === null) {
          await supabase.rpc("remove_feedback", { p_message_id: messageId });
        } else {
          await supabase.rpc("record_feedback", {
            p_message_id: messageId,
            p_reaction: reaction,
            p_is_idea_heavy: isIdeaHeavy,
          });
        }
        await loadProfile();
      } catch (e) {
        console.error("Reaction saqlashda xato:", e);
        // Xato bo'lsa eski holatga qaytaramiz
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, reaction: previous } : m,
          ),
        );
      }
    },
    [loadProfile],
  );

  return {
    conversations,
    activeConversationId,
    messages,
    mode,
    setMode,
    isLoadingConversations,
    isSending,
    error,
    selectConversation,
    newChat,
    sendMessage,
    continueGenerating,
    setReaction,
    loadConversations,
  };
}

export default useChatBot;
