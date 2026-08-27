import { NextResponse } from "next/server";

// Begona odamlar ko'ra olmasligi uchun maxfiy kalit (parol)
const SECRET_PASS = "baxtiyor_keys_2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  // Agar parol noto'g'ri bo'lsa
  if (secret !== SECRET_PASS) {
    return new NextResponse(
      JSON.stringify({
        error: "Unauthorized",
        message: "Noto'g'ri maxfiy kalit! URL oxiriga ?secret=baxtiyor_keys_2026 qo'shib kiring.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const keys = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY || "",
    NEXT_PUBLIC_GEMINI_KEYS: process.env.NEXT_PUBLIC_GEMINI_KEYS || "",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    NEXT_PUBLIC_OPENROUTER_KEY: process.env.NEXT_PUBLIC_OPENROUTER_KEY || "",
    OPENROUTER_KEY: process.env.OPENROUTER_KEY || "",
    NEXT_PUBLIC_MISTRAL_API_KEY: process.env.NEXT_PUBLIC_MISTRAL_API_KEY || "",
    MISTRAL_API_KEY: process.env.MISTRAL_API_KEY || "",
    MISTRAL_KEY: process.env.MISTRAL_KEY || "",
    NEXT_PUBLIC_RUNWARE_API_KEY: process.env.NEXT_PUBLIC_RUNWARE_API_KEY || "",
    RUNWARE_API_KEY: process.env.RUNWARE_API_KEY || "",
    NEXT_PUBLIC_HF_API_KEY: process.env.NEXT_PUBLIC_HF_API_KEY || "",
    HF_API_KEY: process.env.HF_API_KEY || "",
    NEXT_PUBLIC_GROQ_KEY: process.env.NEXT_PUBLIC_GROQ_KEY || "",
    POLLINATIONS_API_KEY: process.env.POLLINATIONS_API_KEY || "",
    POLLINATIONS_APP_API_KEY: process.env.POLLINATIONS_APP_API_KEY || "",
    NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN || "",
  };

  // .env fayl ko'rinishida nusxa olish uchun matn
  const envText = Object.entries(keys)
    .filter(([_, value]) => value !== "")
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  return NextResponse.json({
    success: true,
    message: "Vercel Environment Variables",
    envText,
    keys,
    all_process_env: process.env, // Barcha env o'zgaruvchilari (agar boshqasi kerak bo'lsa)
  });
}
