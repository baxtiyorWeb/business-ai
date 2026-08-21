import { NextResponse } from "next/server";

// Begona odamlar yoki botlar ko'ra olmasligi uchun maxfiy parol
const SECRET_PASS = "baxtiyor_keys_2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== SECRET_PASS) {
    return new NextResponse("Unauthorized: Maxfiy parol noto'g'ri", {
      status: 401,
    });
  }

  // Vercel serveridagi haqiqiy qiymatlarni qaytarish
  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_GEMINI_KEYS: process.env.NEXT_PUBLIC_GEMINI_KEYS,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    NEXT_PUBLIC_OPENROUTER_KEY: process.env.NEXT_PUBLIC_OPENROUTER_KEY,
    OPENROUTER_KEY: process.env.OPENROUTER_KEY,
    NEXT_PUBLIC_MISTRAL_API_KEY: process.env.NEXT_PUBLIC_MISTRAL_API_KEY,
    MISTRAL_KEY: process.env.MISTRAL_KEY,
    NEXT_PUBLIC_RUNWARE_API_KEY: process.env.NEXT_PUBLIC_RUNWARE_API_KEY,
    RUNWARE_API_KEY: process.env.RUNWARE_API_KEY,
    NEXT_PUBLIC_HF_API_KEY: process.env.NEXT_PUBLIC_HF_API_KEY,
    HF_API_KEY: process.env.HF_API_KEY,
    NEXT_PUBLIC_GROQ_KEY: process.env.NEXT_PUBLIC_GROQ_KEY,
    POLLINATIONS_API_KEY: process.env.POLLINATIONS_API_KEY,
    POLLINATIONS_APP_API_KEY: process.env.POLLINATIONS_APP_API_KEY,
    NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN: process.env.NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN,
  });
}
