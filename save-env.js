/**
 * save-env.js
 * 
 * Vercel'dan olingan JSON ma'lumotni to'g'ri va chiroyli .env.local faylga aylantirib beruvchi script.
 * 
 * Ishlatish:
 * 1. `raw-keys.json` fayliga brauzerdan nusxalangan JSON ni qo'ying.
 * 2. `node save-env.js` buyrug'ini ishga tushiring.
 */

const fs = require("fs");
const path = require("path");

const RAW_KEYS_FILE = path.join(__dirname, "raw-keys.json");
const ENV_LOCAL_FILE = path.join(__dirname, ".env.local");

function isSystemVariable(key) {
  if (
    key.startsWith("AWS_") ||
    key.startsWith("VERCEL") ||
    key.startsWith("TURBO_") ||
    key.startsWith("LAMBDA_") ||
    key.startsWith("LD_") ||
    key.startsWith("_")
  ) {
    return true;
  }

  const exactSystemKeys = [
    "LANG",
    "TZ",
    "PATH",
    "PWD",
    "SHLVL",
    "NODE_ENV",
    "NODE_PATH",
    "NOW_REGION",
    "NX_DAEMON",
    "OPENSSL_CONF",
  ];

  return exactSystemKeys.includes(key);
}

function parseInputData() {
  if (!fs.existsSync(RAW_KEYS_FILE)) {
    console.error(`❌ Xatolik: '${RAW_KEYS_FILE}' fayli topilmadi!`);
    console.log(`Iltimos, oldin 'raw-keys.json' faylini ochib, unga Vercel'dan olgan JSON ni joylashtiring.`);
    process.exit(1);
  }

  const rawContent = fs.readFileSync(RAW_KEYS_FILE, "utf-8").trim();

  if (!rawContent) {
    console.error(`❌ Xatolik: 'raw-keys.json' fayli bo'sh!`);
    console.log(`Iltimos, faylga Vercel'dan olgan JSON matnini joylashtiring.`);
    process.exit(1);
  }

  try {
    const data = JSON.parse(rawContent);
    return data;
  } catch (err) {
    console.error("❌ Xatolik: JSON formati noto'g'ri o'qildi:", err.message);
    process.exit(1);
  }
}

function organizeKeys(data) {
  const allVars = {};

  // 1. Agar 'all_process_env' mavjud bo'lsa
  if (data.all_process_env && typeof data.all_process_env === "object") {
    for (const [key, value] of Object.entries(data.all_process_env)) {
      if (value && !isSystemVariable(key) && typeof value === "string") {
        allVars[key] = value.trim();
      }
    }
  }

  // 2. Agar 'keys' obyekti mavjud bo'lsa (aniqroq qiymatlar)
  if (data.keys && typeof data.keys === "object") {
    for (const [key, value] of Object.entries(data.keys)) {
      if (value && typeof value === "string" && value.trim() !== "") {
        allVars[key] = value.trim();
      }
    }
  }

  // 3. Agar to'g'ridan-to'g'ri JSON obyekt berilgan bo'lsa
  if (!data.keys && !data.all_process_env && typeof data === "object") {
    for (const [key, value] of Object.entries(data)) {
      if (value && !isSystemVariable(key) && typeof value === "string" && key !== "success" && key !== "message" && key !== "envText") {
        allVars[key] = value.trim();
      }
    }
  }

  return allVars;
}

function formatEnvContent(vars) {
  const sections = {
    supabase: {
      title: "# ============================================================\n# SUPABASE DATABASE & AUTH\n# ============================================================",
      keys: [
        "NEXT_PUBLIC_SUPABASE_URL",
        "NEXT_PUBLIC_SUPABASE_ANON_KEY",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
      ],
      lines: [],
    },
    gemini: {
      title: "# ============================================================\n# GEMINI AI CONFIGURATION\n# ============================================================",
      keys: [
        "GEMINI_API_KEY",
        "NEXT_PUBLIC_GEMINI_API_KEY",
        "NEXT_PUBLIC_GEMINI_KEYS",
      ],
      lines: [],
    },
    ai_providers: {
      title: "# ============================================================\n# OTHER AI PROVIDERS (OPENROUTER, MISTRAL, GROQ, POLLINATIONS)\n# ============================================================",
      keys: [
        "OPENROUTER_KEY",
        "NEXT_PUBLIC_OPENROUTER_KEY",
        "MISTRAL_KEY",
        "MISTRAL_API_KEY",
        "NEXT_PUBLIC_MISTRAL_API_KEY",
        "NEXT_PUBLIC_GROQ_KEY",
        "GROQ_API_KEY",
        "POLLINATIONS_API_KEY",
        "POLLINATIONS_APP_API_KEY",
      ],
      lines: [],
    },
    image_gen: {
      title: "# ============================================================\n# IMAGE GENERATION & HUGGING FACE (RUNWARE, HF)\n# ============================================================",
      keys: [
        "RUNWARE_API_KEY",
        "NEXT_PUBLIC_RUNWARE_API_KEY",
        "HF_API_KEY",
        "NEXT_PUBLIC_HF_API_KEY",
      ],
      lines: [],
    },
    storage: {
      title: "# ============================================================\n# VERCEL STORAGE & BLOB\n# ============================================================",
      keys: [
        "NEXT_PUBLIC_BLOB_READ_WRITE_TOKEN",
        "BLOB_READ_WRITE_TOKEN",
      ],
      lines: [],
    },
    other: {
      title: "# ============================================================\n# ADDITIONAL / CUSTOM KEYS\n# ============================================================",
      keys: [],
      lines: [],
    },
  };

  const processed = new Set();

  // Guruhlarga ajratish
  for (const [sectionKey, section] of Object.entries(sections)) {
    if (sectionKey === "other") continue;
    for (const key of section.keys) {
      if (vars[key] !== undefined && vars[key] !== "") {
        section.lines.push(`${key}=${vars[key]}`);
        processed.add(key);
      }
    }
  }

  // Qolgan boshqa kalitlarni 'other' bo'limiga qo'shish
  for (const [key, value] of Object.entries(vars)) {
    if (!processed.has(key)) {
      sections.other.lines.push(`${key}=${value}`);
    }
  }

  // Matnni yig'ish
  const outputBlocks = [];

  for (const section of Object.values(sections)) {
    if (section.lines.length > 0) {
      outputBlocks.push(`${section.title}\n${section.lines.join("\n")}`);
    }
  }

  return outputBlocks.join("\n\n") + "\n";
}

function main() {
  console.log("🚀 Vercel kalitlarini .env.local ga o'tkazish boshlandi...");

  const data = parseInputData();
  const vars = organizeKeys(data);

  const keysCount = Object.keys(vars).length;
  if (keysCount === 0) {
    console.warn("⚠️ Hech qanday kalit topilmadi!");
    return;
  }

  const envContent = formatEnvContent(vars);

  fs.writeFileSync(ENV_LOCAL_FILE, envContent, "utf-8");

  console.log(`\n✅ MUVAFFAQITYATLI BAJARILDI!`);
  console.log(`📁 Fayl yaratildi: ${ENV_LOCAL_FILE}`);
  console.log(`🔑 Jami ${keysCount} ta kalit tartibli va toza syntaxda saqlandi:\n`);

  for (const key of Object.keys(vars)) {
    console.log(`  ✔️  ${key}`);
  }

  console.log("\n💡 Eslatma: Endi loyihani `pnpm run dev` bilan ishga tushirsangiz barcha kalitlar ishlaydi.");
}

main();
