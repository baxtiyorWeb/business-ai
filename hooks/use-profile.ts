"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  role: string | null;
  bio: string | null;
  avatar_url: string | null;
  updated_at?: string;
};

export function useProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err: any) {
      console.error("Profilni yuklashda xatolik:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();
        if (error) throw error;

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };

    getInitialSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: "Foydalanuvchi aniqlanmadi" };

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
      return { success: true, data };
    } catch (err: any) {
      console.error("Profilni yangilashda xatolik:", err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: "Foydalanuvchi aniqlanmadi" };

    try {
      setLoading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const res = await updateProfile({ avatar_url: publicUrl });
      return res;
    } catch (err: any) {
      console.error("Avatarni yuklashda xatolik:", err.message);
      return { error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Parolni yangilash funksiyasi
  const updatePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  // Hisobni o'chirish funksiyasi
  const deleteAccount = async () => {
    if (!user) return { error: "Foydalanuvchi topilmadi" };
    try {
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", user.id);
      if (profileError) throw profileError;

      await supabase.auth.signOut();
      return { success: true };
    } catch (err: any) {
      return { error: err.message };
    }
  };

  return {
    user,
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    updatePassword,
    deleteAccount,
    refetch: () => user && fetchProfile(user.id),
  };
}