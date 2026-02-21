"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-context";
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  Calendar,
  Sparkles,
  FileText,
  MessageSquare,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { subjects } = useDashboard();

  const accents = [
    { bg: "bg-purple-500", light: "bg-purple-500/10", text: "text-purple-500" },
    { bg: "bg-blue-500", light: "bg-blue-500/10", text: "text-blue-500" },
    { bg: "bg-emerald-500", light: "bg-emerald-500/10", text: "text-emerald-500" },
    { bg: "bg-orange-500", light: "bg-orange-500/10", text: "text-orange-500" },
    { bg: "bg-pink-500", light: "bg-pink-500/10", text: "text-pink-500" },
    { bg: "bg-cyan-500", light: "bg-cyan-500/10", text: "text-cyan-500" },
  ];

  return (
    <main className="h-full overflow-auto"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-10">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border bg-background px-4 py-1.5 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" />
          Dashboard
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Your Subjects
        </h1>
        <p className="mt-2 text-muted-foreground">
          Select a subject to ask questions, generate quizzes, or create notes.
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-24">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-xl font-semibold">No subjects yet</h2>
          <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
            Click &quot;New Subject&quot; in the top bar to create your first
            subject and start uploading materials.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, idx) => {
            const accent = accents[idx % accents.length];
            const date = new Date(subject.created_at).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            );

            return (
              <button
                key={subject.id}
                onClick={() => router.push(`/dashboard/${subject.id}`)}
                className="group relative flex flex-col rounded-2xl border bg-card p-6 text-left transition-all hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Accent top strip */}
                <div
                  className={`absolute inset-x-0 top-0 h-1 rounded-t-2xl ${accent.bg}`}
                />

                <div className="mb-5 flex items-start justify-between">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${accent.light}`}
                  >
                    <BookOpen className={`h-6 w-6 ${accent.text}`} />
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted opacity-0 transition-all group-hover:opacity-100">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>

                <h3 className="text-lg font-semibold tracking-tight">
                  {subject.name}
                </h3>

                {subject.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                    {subject.description}
                  </p>
                )}

                <div className="mt-5 flex items-center gap-4 border-t pt-4">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    {date}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div></main>
  );
}
