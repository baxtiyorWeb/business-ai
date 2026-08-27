"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { toast } from "sonner";

export type SubscriptionPlan = {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  generations_used: number;
  generations_limit: number;
  paddle_customer_id?: string | null;
  paddle_subscription_id?: string | null;
  paddle_price_id?: string | null;
  current_period_end: string | null;
};

export function useBilling() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const paddleRef = useRef<Paddle | null>(null);

  // Paddle SDK client-side initialization
  useEffect(() => {
    const initPaddle = async () => {
      const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
      if (!clientToken || paddleRef.current) return;

      const isProduction =
        (process.env.NEXT_PUBLIC_PADDLE_ENV || "").toLowerCase() === "production";

      try {
        const paddle = await initializePaddle({
          environment: isProduction ? "production" : "sandbox",
          token: clientToken,
          eventCallback: (event) => {
            if (event.name === "checkout.completed") {
              toast.success("Payment successful! Updating your subscription...");
              if (user) {
                setTimeout(() => fetchSubscription(user.id), 2500);
              }
            }
          },
        });
        if (paddle) {
          paddleRef.current = paddle;
        }
      } catch (err) {
        console.warn("Paddle client initialization warning:", err);
      }
    };

    initPaddle();
  }, [user]);

  const fetchSubscription = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Auto-create Free tier subscription if not found
        const { data: newData, error: insertError } = await supabase
          .from("subscriptions")
          .insert([
            {
              user_id: userId,
              plan_name: "Free",
              generations_limit: 20,
              status: "active",
            },
          ])
          .select()
          .single();

        if (!insertError) {
          setSubscription(newData);
        }
      } else {
        setSubscription(data);
      }
    } catch (err: any) {
      console.error("Error loading subscription:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchSubscription(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initSession();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchSubscription(session.user.id);
      } else {
        setUser(null);
        setSubscription(null);
        setLoading(false);
      }
    });

    return () => {
      authListener.unsubscribe();
    };
  }, [fetchSubscription]);

  // Open Paddle Checkout overlay
  const openCheckout = async (priceId: string, planName: string) => {
    if (!user) {
      toast.error("Please sign in first to subscribe");
      return;
    }

    if (!priceId) {
      toast.error(
        `Paddle Price ID is not configured for ${planName}. Please check environment settings.`
      );
      return;
    }

    try {
      setActionLoading(planName);

      let paddle = paddleRef.current;
      if (!paddle) {
        const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
        if (!clientToken) {
          toast.error("Paddle Client Token is not configured.");
          return;
        }
        const isProduction =
          (process.env.NEXT_PUBLIC_PADDLE_ENV || "").toLowerCase() === "production";
        const initialized = await initializePaddle({
          environment: isProduction ? "production" : "sandbox",
          token: clientToken,
        });
        paddle = initialized ?? null;
        if (paddle) {
          paddleRef.current = paddle;
        }
      }

      if (!paddle) {
        toast.error("Failed to load Paddle checkout.");
        return;
      }

      paddle.Checkout.open({
        items: [{ priceId, quantity: 1 }],
        customer: user.email ? { email: user.email } : undefined,
        customData: {
          userId: user.id,
          planName: planName,
        },
        settings: {
          displayMode: "overlay",
          theme: "dark",
          locale: "en",
        },
      });
    } catch (err: any) {
      console.error("Error opening Paddle checkout:", err);
      toast.error(err.message || "Failed to open checkout window");
    } finally {
      setActionLoading(null);
    }
  };

  // Open Paddle Customer Portal
  const openCustomerPortal = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    try {
      setActionLoading("portal");
      const res = await fetch("/api/paddle/portal", { method: "POST" });
      const data = await res.json();

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        toast.error(
          data.error || "Failed to open customer portal"
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Error generating customer portal session");
    } finally {
      setActionLoading(null);
    }
  };

  // Direct plan upgrade fallback/test
  const upgradePlan = async (planName: string, limit: number) => {
    if (!user) return { error: "User not authenticated" };

    try {
      setActionLoading(planName);

      const { data, error } = await supabase
        .from("subscriptions")
        .update({
          plan_name: planName,
          generations_limit: limit,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setSubscription(data);
      return { success: true };
    } catch (err: any) {
      console.error("Error upgrading plan:", err.message);
      return { error: err.message };
    } finally {
      setActionLoading(null);
    }
  };

  return {
    user,
    subscription,
    loading,
    actionLoading,
    openCheckout,
    openCustomerPortal,
    upgradePlan,
    refetch: () => user && fetchSubscription(user.id),
  };
}