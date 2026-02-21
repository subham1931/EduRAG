"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  GraduationCap,
  BookOpen,
  Brain,
  FileText,
  HelpCircle,
  Upload,
  Sparkles,
  ArrowRight,
  Star,
  CheckCircle2,
  Zap,
  Shield,
  MessageSquare,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";

export default function LandingPage() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setLoggedIn(!!session);
      setChecking(false);
    });
  }, []);

  const ctaHref = loggedIn ? "/dashboard" : "/register";

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* ───── Navbar ───── */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <GraduationCap className="h-5 w-5 text-primary" />
            </div>
            <span className="text-lg font-bold tracking-tight">EduRAG</span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              How it works
            </a>
            <a href="#testimonial" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Testimonials
            </a>
            <a href="#stats" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Results
            </a>
          </div>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  {mounted ? (
                    theme === "dark" ? (
                      <Moon className="h-4 w-4" />
                    ) : theme === "light" ? (
                      <Sun className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )
                  ) : (
                    <Sun className="h-4 w-4" />
                  )}
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Monitor className="mr-2 h-4 w-4" />
                  System
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {loggedIn ? (
              <Button onClick={() => router.push("/dashboard")}>
                Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ───── Hero ───── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-0 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute right-0 top-20 h-[400px] w-[400px] rounded-full bg-purple-400/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-[300px] w-[300px] rounded-full bg-violet-400/10 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:pt-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-background/80 px-4 py-1.5 text-sm text-muted-foreground backdrop-blur-sm">
                <Sparkles className="h-4 w-4 text-primary" />
                AI-Powered Teaching Assistant
              </div>

              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Smart knowledge
                <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                  {" "}assistant{" "}
                </span>
                for teachers
              </h1>

              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                Upload your course materials, ask questions instantly, generate
                quizzes and notes — all powered by AI. EduRAG transforms how
                teachers interact with their knowledge base.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link href={ctaHref}>
                  <Button size="lg" className="rounded-full px-8 text-base">
                    Start for Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#how-it-works">
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-full px-8 text-base"
                  >
                    See how it works
                  </Button>
                </a>
              </div>

              <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Free to use
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  No credit card
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  AI-powered
                </span>
              </div>
            </div>

            {/* Hero illustration */}
            <div className="relative hidden lg:flex items-center justify-center">
              <Image
                src="/images/graduation-hat.png"
                alt="Graduation hat illustration"
                width={420}
                height={420}
                className="drop-shadow-2xl"
                priority
              />

              {/* Floating card - Quiz */}
              <div className="absolute -left-4 bottom-16 rounded-xl border bg-card p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500/10">
                    <HelpCircle className="h-4 w-4 text-green-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">Quiz Generated</p>
                    <p className="text-xs text-muted-foreground">
                      10 MCQs ready
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating card - Upload */}
              <div className="absolute -right-4 top-16 rounded-xl border bg-card p-4 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                    <Upload className="h-4 w-4 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium">PDF Uploaded</p>
                    <p className="text-xs text-muted-foreground">
                      Indexed & ready
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Transform your teaching workflow
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                EduRAG uses Retrieval-Augmented Generation to give you instant,
                accurate answers from your own course materials. No more
                searching through piles of documents.
              </p>

              <div className="mt-8 space-y-5">
                {[
                  {
                    icon: Upload,
                    title: "Upload any PDF",
                    desc: "Drop your textbooks, notes, and papers. We extract and index every word.",
                  },
                  {
                    icon: MessageSquare,
                    title: "Ask questions instantly",
                    desc: "Get precise answers sourced directly from your uploaded materials.",
                  },
                  {
                    icon: Sparkles,
                    title: "AI-generated content",
                    desc: "Create quizzes and structured notes from your documents in seconds.",
                  },
                ].map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <f.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{f.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {f.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link href={ctaHref} className="mt-8 inline-block">
                <Button className="rounded-full" size="lg">
                  Start teaching smarter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Feature illustration */}
            <div className="relative hidden lg:flex items-center justify-center">
              <Image
                src="/images/laptop.png"
                alt="Laptop dashboard illustration"
                width={450}
                height={450}
                className="drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ───── How it Works (3 cards) ───── */}
      <section id="how-it-works" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 flex justify-center">
              <Image
                src="/images/test-list.png"
                alt="Quiz and test illustration"
                width={140}
                height={140}
                className="drop-shadow-lg"
              />
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Top-notch AI, limitless learning
            </h2>
            <p className="mt-4 text-muted-foreground">
              Three simple steps to supercharge your teaching preparation and
              make knowledge accessible instantly.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {[
              {
                num: "1",
                icon: Shield,
                title: "Secure & Private",
                desc: "Your documents stay yours. Every query is filtered by your account — no data leaks, no cross-contamination.",
                color: "bg-purple-500/10 text-purple-500",
              },
              {
                num: "2",
                icon: Zap,
                title: "Lightning Fast",
                desc: "Powered by vector embeddings and similarity search. Get answers from hundreds of pages in under a second.",
                color: "bg-orange-500/10 text-orange-500",
              },
              {
                num: "3",
                icon: Brain,
                title: "Context-Aware AI",
                desc: "Our RAG pipeline retrieves the most relevant chunks from your materials so answers are always grounded in your content.",
                color: "bg-blue-500/10 text-blue-500",
              },
            ].map((card) => (
              <div
                key={card.num}
                className="group rounded-2xl border bg-card p-6 transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {card.num}
                  </span>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${card.color}`}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonial ───── */}
      <section id="testimonial" className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="h-5 w-5 fill-yellow-400 text-yellow-400"
                />
              ))}
            </div>

            <blockquote className="text-xl font-medium leading-relaxed sm:text-2xl">
              &ldquo;EduRAG gave me an amazing opportunity to transform how I
              prepare for classes. I upload my materials once and can instantly
              generate quizzes, review notes, and get answers to any question.
              It&apos;s like having a personal research assistant.&rdquo;
            </blockquote>

            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                S
              </div>
              <div className="text-left">
                <p className="font-semibold">Dr. Sarah Mitchell</p>
                <p className="text-sm text-muted-foreground">
                  Physics Professor, Stanford University
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Stats ───── */}
      <section id="stats" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { value: "98.5%", label: "Answer Accuracy", sub: "from your own docs" },
              { value: "12.4k", label: "Documents Processed", sub: "and growing daily" },
              { value: "5,000+", label: "Questions Answered", sub: "across all subjects" },
              { value: "50+", label: "Subjects Created", sub: "by educators worldwide" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="text-center"
              >
                <p className="text-4xl font-bold tracking-tight text-primary sm:text-5xl">
                  {stat.value}
                </p>
                <p className="mt-2 font-medium">{stat.label}</p>
                <p className="text-sm text-muted-foreground">{stat.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="border-t bg-muted/30 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-purple-600 p-10 text-center text-white sm:p-16">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Upgrade your teaching with AI
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
                Join educators who are using EduRAG to save hours of preparation
                time. Upload, ask, generate — it&apos;s that simple.
              </p>

              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <Link href={ctaHref}>
                  <Button
                    size="lg"
                    className="rounded-full bg-white px-8 text-base font-semibold text-primary hover:bg-white/90"
                  >
                    Get Started Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="border-t py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <span className="font-bold">EduRAG</span>
            </div>

            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} EduRAG. Built for educators, powered by AI.
            </p>

            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
              <a href="#" className="hover:text-foreground">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
