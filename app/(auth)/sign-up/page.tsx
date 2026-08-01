"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUp() {
  const router = useRouter();

  const {
    signUp,
    signInWithGoogle,
    isSigningUp,
  } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      await toast.promise(
        signUp({
          fullName,
          email,
          password,
        }),
        {
          loading: "Hisob yaratilmoqda...",
          success: "Hisob muvaffaqiyatli yaratildi!",
          error: (err) =>
            err?.message ??
            "Ro'yxatdan o'tishda xatolik yuz berdi.",
        }
      );

      router.push("/");
    } catch {
      // toast.promise xatoni o'zi ko'rsatadi
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await toast.promise(signInWithGoogle(), {
        loading: "Google orqali davom etilmoqda...",
        success: "Muvaffaqiyatli tizimga kirildi!",
        error: (err) =>
          err?.message ??
          "Google orqali davom etishda xatolik yuz berdi.",
      });
    } catch {
      // toast.promise xatoni o'zi ko'rsatadi
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="border-slate-800/80 bg-[#0f0f12] shadow-none">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-semibold text-white">
            Ro'yxatdan o'tish
          </CardTitle>

          <CardDescription className="text-slate-500">
            Yangi hisob yaratish uchun ma'lumotlaringizni kiriting.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label
                htmlFor="fullName"
                className="text-sm text-slate-400"
              >
                To'liq ism
              </Label>

              <Input
                id="fullName"
                type="text"
                autoComplete="name"
                required
                placeholder="Asadbek Aliyev"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                className="h-11 border-slate-800 bg-slate-900/40 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm text-slate-400"
              >
                Email
              </Label>

              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="h-11 border-slate-800 bg-slate-900/40 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm text-slate-400"
              >
                Parol
              </Label>

              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                className="h-11 border-slate-800 bg-slate-900/40 text-white focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-offset-0"
              />
            </div>

            <Button
              type="submit"
              disabled={isSigningUp}
              className="h-11 w-full bg-indigo-600 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isSigningUp
                ? "Yaratilmoqda..."
                : "Hisob yaratish"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-slate-800/60 pt-5">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>

            <div className="relative flex justify-center">
              <span className="bg-[#0f0f12] px-3 text-xs uppercase text-slate-500">
                yoki
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isSigningUp}
            onClick={handleGoogleSignUp}
            className="h-11 w-full border-slate-800 bg-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            Google orqali davom etish
          </Button>

          <p className="text-center text-sm text-slate-500">
            Hisobingiz bormi?{" "}
            <Link
              href="/sign-in"
              className="font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              Kirish
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}