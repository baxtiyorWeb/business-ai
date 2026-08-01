const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

function loadEnv() {
  try {
    const envPath = path.join(__dirname, '../.env');
    if (!fs.existsSync(envPath)) {
      console.error('.env file not found');
      return;
    }
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        } else if (value.startsWith("'") && value.endsWith("'")) {
          value = value.slice(1, -1);
        }
        process.env[key] = value.trim();
      }
    }
  } catch (err) {
    console.error('Error loading .env:', err);
  }
}

loadEnv();

function parseKeyList(raw) {
  return (raw || "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
}

const rawKeys = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
const geminiKeys = parseKeyList(rawKeys);

const models = [
  "gemini-3.6-flash",
  "gemini-3.5-flash",
  "gemini-2.5-flash",
];

async function run() {
  for (const model of models) {
    for (let i = 0; i < geminiKeys.length; i++) {
      const apiKey = geminiKeys[i];
      try {
        const client = new GoogleGenAI({ apiKey });
        console.log(`\nStarting stream for ${model} using Key #${i+1}...`);
        const stream = await client.models.generateContentStream({
          model,
          contents: "Calculate the sum of the first 50 prime numbers and explain your thoughts.",
          config: {
            // Enable code execution to force tool_code output
            tools: [{ codeExecution: {} }],
          },
        });

        for await (const chunk of stream) {
          const parts = chunk.candidates?.[0]?.content?.parts || [];
          console.log('\n--- CHUNK PART(S) ---');
          console.log(JSON.stringify(parts, null, 2));
        }
        return;
      } catch (err) {
        console.warn(`Failed: ${err.message || err}`);
      }
    }
  }
}

run();
