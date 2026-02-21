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
import {
  ArrowLeft,
  FileText,
  Loader2,
  BookOpen,
  Upload,
  MessageSquare,
  Calendar,
} from "lucide-react";

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const { subjects } = useDashboard();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);

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

  if (!subject) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* ── Left: Main Content (70%) ── */}
      <div className="flex flex-[7] flex-col overflow-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          {/* Back + Subject Header */}
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to subjects
          </button>

          <div className="mb-8 flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <BookOpen className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  {subject.name}
                </h1>
                {subject.description && (
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {subject.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Tool Cards Row */}
          <div className="mb-8 grid grid-cols-3 gap-4">
            <UploadDialog subject={subject} onUploadComplete={fetchDocuments} />
            <QuizDialog subject={subject} />
            <NotesDialog subject={subject} />
          </div>

          {/* Documents Section */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Documents
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({documents.length})
                </span>
              </h2>
            </div>

            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20 py-16">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                  <Upload className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="font-medium text-muted-foreground">
                  No documents yet
                </p>
                <p className="mt-1 text-sm text-muted-foreground/70">
                  Upload a PDF using the card above to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <FileText className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {doc.filename}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(doc.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right: Chat (30%) ── */}
      <div className="flex flex-[3] flex-col border-l">
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
