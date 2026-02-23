"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraduationCap, Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmationSent, setConfirmationSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace("/dashboard");
    });
  }, [router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (authError) {
      setError(authError.message);
    } else {
      setConfirmationSent(true);
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel - decorative */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-primary via-purple-600 to-violet-700 lg:block">
        <div className="absolute inset-0">
          <div className="absolute right-10 top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-10 left-20 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
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
              Start your AI-powered teaching journey
            </h2>
            <p className="mt-4 text-lg text-white/70">
              Join thousands of educators using EduRAG to upload materials,
              generate quizzes, and get instant answers from their own content.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Upload PDFs and build your knowledge base",
                "Ask questions and get AI answers from your docs",
                "Generate quizzes and notes in seconds",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm text-white/80">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-sm text-white/40">
            &copy; {new Date().getFullYear()} EduRAG
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex w-full items-center justify-center px-4 lg:w-1/2">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <div className="lg:hidden mb-6 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold">EduRAG</span>
          </div>

          {confirmationSent ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
                <MailCheck className="h-8 w-8 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                Check your email
              </h1>
              <p className="mt-3 text-muted-foreground">
                We&apos;ve sent a confirmation link to{" "}
                <span className="font-medium text-foreground">{email}</span>.
                Click the link to verify your account.
              </p>

              <div className="mt-6 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <p className="text-sm text-green-600 dark:text-green-400">
                  Check your spam folder if you don&apos;t see the email within
                  a few minutes.
                </p>
              </div>

              <Link href="/login" className="mt-6 inline-block">
                <Button className="h-11 w-full rounded-lg text-base" size="lg">
                  Go to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Create your account
              </h1>
              <p className="mt-2 text-muted-foreground">
                Sign up to start using EduRAG for free
              </p>

              <form onSubmit={handleRegister} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Jane Smith"
                    className="h-11"
                    required
                  />
                </div>
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
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="h-11"
                    minLength={6}
                    required
                  />
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
                  Create Account
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-primary hover:underline"
                  >
                    Sign In
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
