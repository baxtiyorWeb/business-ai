"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

interface AuthCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
    });

    return () => subscription.unsubscribe();
  }, [queryClient]);

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ["user-profile", session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  const signInMutation = useMutation({
    mutationFn: async ({ email, password }: AuthCredentials) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      router.push("/profile");
    },
  });

  const signUpMutation = useMutation({
    mutationFn: async ({ email, password, fullName }: AuthCredentials) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      router.push("/profile");
    },
  });

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/profile`,
      },
    });
    if (error) throw error;
  };

  const signOutMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/sign-in");
    },
  });

  return {
    user: session?.user ?? null,
    profile,
    session,
    isLoading: isProfileLoading,
    signIn: signInMutation.mutateAsync,
    isSigningIn: signInMutation.isPending,
    signUp: signUpMutation.mutateAsync,
    isSigningUp: signUpMutation.isPending,
    signInWithGoogle,
    signOut: signOutMutation.mutateAsync,
  };
};