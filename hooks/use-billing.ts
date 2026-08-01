"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export type SubscriptionPlan = {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  generations_used: number;
  generations_limit: number;
  current_period_end: string | null;
};

export function useBilling() {
  const [user, setUser] = useState<User | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

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
        // Bazada yo'q bo'lsa, avtomatik Free reja ochamiz
        const { data: newData, error: insertError } = await supabase
          .from("subscriptions")
          .insert([
            { user_id: userId, plan_name: "Free", generations_limit: 20, status: "active" },
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
      console.error("Obunani yuklashda xatolik:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchSubscription(session.user.id);
      } else {
        setLoading(false);
      }
    };

    initSession();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(async (_, session) => {
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

  // Aqlli reja yangilash logikasi
  const upgradePlan = async (planName: string, limit: number) => {
    if (!user) return { error: "Foydalanuvchi aniqlanmadi" };

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
      console.error("Rejani o'zgartirishda xatolik:", err.message);
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
    upgradePlan,
    refetch: () => user && fetchSubscription(user.id),
  };
}