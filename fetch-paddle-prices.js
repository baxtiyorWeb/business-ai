const { Paddle, Environment } = require("@paddle/paddle-node-sdk");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, ".env.local");

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      process.env[match[1].trim()] = match[2].trim();
    }
  });
}

const apiKey = process.env.PADDLE_API_KEY;

async function checkEnv(isProd) {
  console.log(`\n🔍 Checking Paddle ${isProd ? "PRODUCTION" : "SANDBOX"} environment...`);
  try {
    const paddle = new Paddle(apiKey, {
      environment: isProd ? Environment.production : Environment.sandbox,
    });

    const productsColl = paddle.products.list();
    const products = await productsColl.next();
    console.log(`  📦 Topilgan mahsulotlar (Products): ${products.length} ta`);
    for (const prod of products) {
      console.log(`     - [${prod.id}] ${prod.name} (Status: ${prod.status})`);
    }

    const pricesColl = paddle.prices.list();
    const prices = await pricesColl.next();
    console.log(`  🏷️ Topilgan narxlar (Prices): ${prices.length} ta`);
    for (const pr of prices) {
      console.log(`     - [${pr.id}] ${pr.name || pr.productId} -> $${(parseInt(pr.unitPrice.amount, 10) / 100).toFixed(2)}`);
    }
    return { products, prices };
  } catch (err) {
    console.log(`  ❌ Xatolik (${isProd ? "Production" : "Sandbox"}): ${err.message}`);
    return null;
  }
}

async function main() {
  if (!apiKey) {
    console.error("PADDLE_API_KEY missing");
    return;
  }

  await checkEnv(true);
  await checkEnv(false);
}

main();
