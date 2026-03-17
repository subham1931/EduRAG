"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
    } else if (data.session) {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - decorative */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-cyan-700 lg:block">
        <div className="absolute inset-0">
          <div className="absolute left-10 top-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-20 right-10 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        </div>

        <div className="relative flex h-full flex-col justify-between p-12">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-white/90 transition-colors hover:text-white"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
              <GraduationCap className="h-5 w-5" />
            </div>
            <span className="text-lg font-bold">EduRAG</span>
          </Link>

          <div className="max-w-md">
            <h2 className="text-3xl font-bold text-white">
              Welcome back to your AI teaching assistant
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Pick up right where you left off. Your subjects, documents, and
              AI-generated content are waiting for you.
            </p>
          </div>

          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} EduRAG
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full items-stretch justify-center px-4 lg:w-1/2 lg:items-center">
        <div className="flex min-h-screen w-full max-w-md flex-col justify-center py-8 lg:min-h-0 lg:py-0">
          <Link href="/" className="lg:hidden mb-6 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">EduRAG</span>
          </Link>

          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Sign in to your account
          </h1>
          <p className="mt-2 text-muted-foreground">
            Enter your credentials to access your dashboard
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="h-11"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full rounded-lg text-base"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Sign In
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              <span className="block sm:inline">Don&apos;t have an account?</span>{" "}
              <Link
                href="/register"
                className="mt-1 inline-block font-medium text-primary hover:underline sm:mt-0"
              >
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
