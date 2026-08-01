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

export default function SignIn() {
  const router = useRouter();

  const {
    signIn,
    signInWithGoogle,
    isSigningIn,
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    try {
      await toast.promise(
        signIn({
          email,
          password,
        }),
        {
          loading: "Signing in...",
          success: "Successfully signed in!",
          error: (err) =>
            err?.message ??
            "An error occurred while signing in.",
        }
      );

    } catch {
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await toast.promise(signInWithGoogle(), {
        loading: "Signing in with Google...",
        success: "Successfully signed in with Google!",
        error: (err) =>
          err?.message ??
          "An error occurred while signing in with Google.",
      });
    } catch {
      // toast.promise handles showing the error
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <Card className="border-slate-800/80 bg-[#0f0f12] shadow-none">
        <CardHeader className="space-y-1 pb-4">
          <CardTitle className="text-lg font-semibold text-white">
            Sign In
          </CardTitle>

          <CardDescription className="text-slate-500">
            Enter your details below to sign in to your account.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >
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
                placeholder="name@example.com"
                required
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                className="h-11 border-slate-800 bg-slate-900/40 text-white placeholder:text-slate-600 focus-visible:ring-1 focus-visible:ring-indigo-500 focus-visible:ring-offset-0"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="password"
                  className="text-sm text-slate-400"
                >
                  Password
                </Label>

                <Link
                  href="/forgot-password"
                  className="text-xs text-slate-500 transition hover:text-slate-300"
                >
                  Forgot password?
                </Link>
              </div>

              <Input
                id="password"
                type="password"
                autoComplete="current-password"
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
              disabled={isSigningIn}
              className="h-11 w-full bg-indigo-600 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isSigningIn
                ? "Signing in..."
                : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 border-t border-slate-800/60 pt-5">
          <div className="relative w-full">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-800" />
            </div>

            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#0f0f12] px-3 text-slate-500">
                or
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={isSigningIn}
            onClick={handleGoogleSignIn}
            className="h-11 w-full border-slate-800 bg-transparent text-slate-300 hover:bg-slate-900 hover:text-white"
          >
            Sign in with Google
          </Button>

          <p className="text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link
              href="/sign-up"
              className="font-medium text-indigo-400 transition hover:text-indigo-300"
            >
              Sign Up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}