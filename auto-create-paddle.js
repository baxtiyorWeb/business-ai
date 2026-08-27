/**
 * auto-create-paddle.js
 * Automatically creates Starter ($9/mo) and Pro ($19/mo) Products & Prices in Paddle
 * via API and saves their Price IDs directly into .env.local!
 */
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

if (!apiKey) {
  console.error("❌ PADDLE_API_KEY .env.local da topilmadi.");
  process.exit(1);
}

const paddle = new Paddle(apiKey, {
  environment: Environment.production,
});

async function createProductAndPrice(name, amountUsd, description) {
  console.log(`\n🚀 [${name}] Mahsulotini Paddle'da avtomatik yaratish boshlandi...`);
  
  // 1. Create Product
  const product = await paddle.products.create({
    name: name,
    taxCategory: "standard",
    description: description,
  });

  console.log(`  ✅ Mahsulot yaratildi! ID: ${product.id}`);

  // 2. Create Price ($9.00 -> '900', $19.00 -> '1900')
  const amountInCents = (parseFloat(amountUsd) * 100).toString();

  const price = await paddle.prices.create({
    productId: product.id,
    description: `${name} Monthly Subscription`,
    unitPrice: {
      amount: amountInCents,
      currencyCode: "USD",
    },
    billingCycle: {
      interval: "month",
      frequency: 1,
    },
    taxMode: "account_setting",
  });

  console.log(`  🎉 Narx (Price) yaratildi! ID: ${price.id}`);
  return { productId: product.id, priceId: price.id };
}

async function main() {
  try {
    const starter = await createProductAndPrice(
      "Starter",
      "9",
      "For individual creators and freelancers"
    );

    const pro = await createProductAndPrice(
      "Pro",
      "19",
      "Best for professionals & power users"
    );

    console.log("\n📝 Topilgan ID larni .env.local fayliga saqlash...");
    let content = fs.readFileSync(envPath, "utf-8");

    content = content.replace(
      /NEXT_PUBLIC_PADDLE_PRICE_STARTER=.*/,
      `NEXT_PUBLIC_PADDLE_PRICE_STARTER=${starter.priceId}`
    );
    content = content.replace(
      /NEXT_PUBLIC_PADDLE_PRICE_PRO=.*/,
      `NEXT_PUBLIC_PADDLE_PRICE_PRO=${pro.priceId}`
    );

    fs.writeFileSync(envPath, content, "utf-8");

    console.log("\n✅ BARCHA MAHSULOTLAR VA NARXLAR AUTOMATIK YARATILDI VA .ENV.LOCAL GA SAQLANDI!");
    console.log(`  - STARTER PRICE ID: ${starter.priceId}`);
    console.log(`  - PRO PRICE ID:     ${pro.priceId}`);
  } catch (err) {
    console.error("❌ Avtomatik yaratishda xatolik:", err.message);
    if (err.errors) {
      console.error("Details:", JSON.stringify(err.errors, null, 2));
    }
  }
}

main();
