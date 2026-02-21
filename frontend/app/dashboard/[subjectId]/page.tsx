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
  FileText,
  Loader2,
  BookOpen,
  Upload,
  HelpCircle,
  Sparkles,
  MessageSquare,
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
      {/* ── Left Panel: Subject Hub ── */}
      <div className="flex w-80 shrink-0 flex-col border-r lg:w-96">
        <div className="flex-1 overflow-auto p-5">
          {/* Back + Subject info */}
          <div className="mb-6">
            <button
              onClick={() => router.push("/dashboard")}
              className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">
                  {subject.name}
                </h1>
                {subject.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {subject.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Action Cards */}
          <div className="mb-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tools
            </p>

            <UploadDialog subject={subject} onUploadComplete={fetchDocuments} />
            <QuizDialog subject={subject} />
            <NotesDialog subject={subject} />
          </div>

          {/* Documents */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Documents ({documents.length})
            </p>

            {documents.length === 0 ? (
              <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 p-6 text-center">
                <Upload className="mx-auto mb-2 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">
                  No documents yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  Upload a PDF to get started
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {doc.filename}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(doc.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Panel: Chat ── */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-2 border-b bg-muted/30 px-5 py-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">Chat with {subject.name}</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel subject={subject} />
        </div>
      </div>
    </div>
  );
}
