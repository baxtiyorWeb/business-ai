import { NextRequest, NextResponse } from "next/server";
import { paddle } from "@/lib/paddle";
import { getServerUser } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) {
      return NextResponse.json(
        { error: "Foydalanuvchi tizimga kirmagan" },
        { status: 401 }
      );
    }

    // Foydalanuvchining paddle_customer_id sini bazadan olamiz
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("paddle_customer_id, paddle_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !sub?.paddle_customer_id) {
      return NextResponse.json(
        { error: "Faol obuna yoki Paddle mijoz profili topilmadi" },
        { status: 404 }
      );
    }

    // Paddle Customer Portal sessiyasini yaratish
    const subIds = sub.paddle_subscription_id
      ? [sub.paddle_subscription_id]
      : [];

    const portalSession = await paddle.customerPortalSessions.create(
      sub.paddle_customer_id,
      subIds
    );

    const portalUrl =
      portalSession?.urls?.general?.overview ||
      portalSession?.urls?.subscriptions?.[0]?.updateSubscriptionPaymentMethod ||
      portalSession?.urls?.subscriptions?.[0]?.cancelSubscription;

    if (!portalUrl) {
      return NextResponse.json(
        { error: "Customer portal havolasi yaratilmadi" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: portalUrl });
  } catch (err: any) {
    console.error("Paddle portal yaratishda xatolik:", err.message);
    return NextResponse.json(
      { error: err.message || "Portal yaratishda xatolik" },
      { status: 500 }
    );
  }
}
