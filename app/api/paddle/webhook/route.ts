import { NextRequest, NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getPlanByPriceId, getPlanConfig } from "@/lib/paddle-plans";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("paddle-signature") || "";
  const rawRequestBody = await req.text();
  const secretKey = process.env.PADDLE_WEBHOOK_SECRET_KEY || "";

  if (!secretKey) {
    console.warn("⚠️ PADDLE_WEBHOOK_SECRET_KEY .env.local da o'rnatilmagan.");
    return NextResponse.json(
      { error: "Webhook secret key is not configured" },
      { status: 500 }
    );
  }

  let eventData: any;
  try {
    eventData = await paddle.webhooks.unmarshal(
      rawRequestBody,
      secretKey,
      signature
    );
  } catch (err: any) {
    console.error("❌ Paddle webhook imzosi tekshiruvdan o'tmadi:", err.message);
    return NextResponse.json(
      { error: "Invalid webhook signature" },
      { status: 400 }
    );
  }

  const eventType = eventData.eventType;
  const data = eventData.data;

  try {
    switch (eventType) {
      case "subscription.created":
      case "subscription.activated":
      case "subscription.updated": {
        const customData = data.customData as
          | { userId?: string; planName?: string }
          | undefined;
        const userId = customData?.userId;
        const customerId = data.customerId;
        const subscriptionId = data.id;
        const priceId = data.items?.[0]?.price?.id || "";
        const planConfig =
          getPlanByPriceId(priceId) ||
          (customData?.planName ? getPlanConfig(customData.planName) : null);
        const planName = planConfig?.name || customData?.planName || "Pro";
        const generationsLimit = planConfig?.limit || 400;
        const currentPeriodEnd = data.currentBillingPeriod?.endsAt || null;
        const status = data.status || "active";

        if (userId) {
          await supabaseAdmin.from("subscriptions").upsert(
            {
              user_id: userId,
              plan_name: planName,
              status: status,
              generations_limit: generationsLimit,
              paddle_customer_id: customerId,
              paddle_subscription_id: subscriptionId,
              paddle_price_id: priceId,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
          );
        } else if (subscriptionId || customerId) {
          await supabaseAdmin
            .from("subscriptions")
            .update({
              plan_name: planName,
              status: status,
              generations_limit: generationsLimit,
              paddle_price_id: priceId,
              current_period_end: currentPeriodEnd,
              updated_at: new Date().toISOString(),
            })
            .or(
              `paddle_subscription_id.eq.${subscriptionId},paddle_customer_id.eq.${customerId}`
            );
        }
        break;
      }

      case "subscription.canceled":
      case "subscription.past_due": {
        const subscriptionId = data.id;
        const customerId = data.customerId;
        const isCanceled = eventType === "subscription.canceled";

        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: isCanceled ? "canceled" : "past_due",
            plan_name: isCanceled ? "Free" : "Free",
            generations_limit: 20,
            updated_at: new Date().toISOString(),
          })
          .or(
            `paddle_subscription_id.eq.${subscriptionId},paddle_customer_id.eq.${customerId}`
          );
        break;
      }

      case "transaction.completed":
      case "transaction.paid": {
        // Tranzaksiya muvaffaqiyatli o'tgani haqida qayd
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ success: true, event: eventType });
  } catch (dbError: any) {
    console.error("Webhook bazani yangilashda xatolik:", dbError);
    return NextResponse.json(
      { error: "Database update failed", message: dbError.message },
      { status: 500 }
    );
  }
}
