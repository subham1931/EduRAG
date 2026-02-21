"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-context";
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { subjects } = useDashboard();

  const colors = [
    "from-blue-500/20 to-blue-600/5 border-blue-500/20",
    "from-purple-500/20 to-purple-600/5 border-purple-500/20",
    "from-emerald-500/20 to-emerald-600/5 border-emerald-500/20",
    "from-orange-500/20 to-orange-600/5 border-orange-500/20",
    "from-pink-500/20 to-pink-600/5 border-pink-500/20",
    "from-cyan-500/20 to-cyan-600/5 border-cyan-500/20",
  ];

  const iconColors = [
    "text-blue-400",
    "text-purple-400",
    "text-emerald-400",
    "text-orange-400",
    "text-pink-400",
    "text-cyan-400",
  ];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Your Subjects</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a subject to ask questions, generate quizzes, or create notes.
        </p>
      </div>

      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-muted-foreground/25 py-20">
          <GraduationCap className="mb-4 h-16 w-16 text-muted-foreground/20" />
          <h2 className="text-lg font-medium text-muted-foreground">
            No subjects yet
          </h2>
          <p className="mt-1 text-sm text-muted-foreground/70">
            Click &quot;New Subject&quot; to create your first one.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {subjects.map((subject, idx) => {
            const colorClass = colors[idx % colors.length];
            const iconColor = iconColors[idx % iconColors.length];
            const date = new Date(subject.created_at).toLocaleDateString(
              "en-US",
              { month: "short", day: "numeric", year: "numeric" }
            );

            return (
              <button
                key={subject.id}
                onClick={() => router.push(`/dashboard/${subject.id}`)}
                className={`group relative flex flex-col rounded-xl border bg-gradient-to-br p-5 text-left transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-primary/10 ${colorClass}`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-background/50 ${iconColor}`}
                  >
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <h3 className="text-base font-semibold">{subject.name}</h3>

                {subject.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {subject.description}
                  </p>
                )}

                <div className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted-foreground/70">
                  <Calendar className="h-3 w-3" />
                  {date}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </main>
  );
}
