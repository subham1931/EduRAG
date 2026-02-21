"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Subject, Document as Doc } from "@/types";
import { useDashboard } from "@/lib/dashboard-context";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { UploadDialog } from "@/components/dashboard/upload-dialog";
import { QuizDialog } from "@/components/dashboard/quiz-dialog";
import { NotesDialog } from "@/components/dashboard/notes-dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  MessageSquare,
  HelpCircle,
  FileText,
  Clock,
  Sparkles,
} from "lucide-react";

interface GeneratedItem {
  id: string;
  type: "quiz" | "notes";
  topic: string;
  detail: string;
  timestamp: Date;
}

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const { subjects } = useDashboard();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);

  const fetchDocuments = useCallback(async () => {
    try {
      const { data } = await api.get(`/documents/${subjectId}`);
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }, [subjectId]);

  useEffect(() => {
    const found = subjects.find((s) => s.id === subjectId);
    if (found) {
      setSubject(found);
      fetchDocuments();
    } else if (subjects.length > 0) {
      router.push("/dashboard");
    }
  }, [subjects, subjectId, router, fetchDocuments]);

  const handleQuizGenerated = (topic: string, count: number) => {
    setGeneratedItems((prev) => [
      {
        id: crypto.randomUUID(),
        type: "quiz",
        topic: topic || subject?.name || "General",
        detail: `${count} MCQs`,
        timestamp: new Date(),
      },
      ...prev,
    ]);
  };

  const handleNotesGenerated = (topic: string) => {
    setGeneratedItems((prev) => [
      {
        id: crypto.randomUUID(),
        type: "notes",
        topic: topic || subject?.name || "General",
        detail: "Study notes",
        timestamp: new Date(),
      },
      ...prev,
    ]);
  };

  if (!subject) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* ── Left: Subject Content ── */}
      <div className="flex flex-1 flex-col overflow-auto border-r">
        {/* Subject header */}
        <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              onClick={() => router.push("/dashboard")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <BookOpen className="h-4 w-4 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">{subject.name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UploadDialog subject={subject} onUploadComplete={fetchDocuments} />
            <QuizDialog subject={subject} onGenerated={handleQuizGenerated} />
            <NotesDialog subject={subject} onGenerated={handleNotesGenerated} />
          </div>
        </div>

        {/* Generated Quizzes & Notes */}
        <div className="flex-1 p-4 sm:p-6">
          {generatedItems.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Sparkles className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-muted-foreground">
                No content generated yet
              </p>
              <p className="mt-1 max-w-xs text-center text-sm text-muted-foreground/70">
                {documents.length > 0
                  ? "Use the Quiz or Notes buttons above to generate study materials"
                  : "Upload a PDF first, then generate quizzes and notes"}
              </p>
            </div>
          ) : (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                Generated Content
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {generatedItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 rounded-xl border bg-card p-4"
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                        item.type === "quiz"
                          ? "bg-violet-500/10"
                          : "bg-emerald-500/10"
                      }`}
                    >
                      {item.type === "quiz" ? (
                        <HelpCircle className="h-5 w-5 text-violet-500" />
                      ) : (
                        <FileText className="h-5 w-5 text-emerald-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          item.type === "quiz"
                            ? "bg-violet-500/10 text-violet-500"
                            : "bg-emerald-500/10 text-emerald-500"
                        }`}
                      >
                        {item.type}
                      </span>
                      <p className="mt-1 truncate text-sm font-medium">
                        {item.topic}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.detail}
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/60">
                        <Clock className="h-3 w-3" />
                        {item.timestamp.toLocaleTimeString("en-US", {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Chat (30%) ── */}
      <div className="flex w-[30%] shrink-0 flex-col">
        <div className="flex items-center gap-2 border-b bg-muted/30 px-4 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">AI Chat</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel subject={subject} />
        </div>
      </div>
    </div>
  );
}
