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
  Calendar,
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
              <div>
                <h2 className="text-sm font-semibold leading-tight">
                  {subject.name}
                </h2>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <FileText className="h-3 w-3" />
                  {documents.length} document
                  {documents.length !== 1 ? "s" : ""} uploaded
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <UploadDialog subject={subject} onUploadComplete={fetchDocuments} />
            <QuizDialog subject={subject} />
            <NotesDialog subject={subject} />
          </div>
        </div>

        {/* Documents grid */}
        <div className="flex-1 p-4 sm:p-6">
          {documents.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/20">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <Upload className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="font-medium text-muted-foreground">
                No documents yet
              </p>
              <p className="mt-1 text-sm text-muted-foreground/70">
                Upload a PDF to start asking questions
              </p>
            </div>
          ) : (
            <div>
              <h3 className="mb-4 text-sm font-semibold text-muted-foreground">
                Uploaded Documents
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center gap-3 rounded-xl border bg-card p-3.5"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <FileText className="h-4 w-4 text-blue-500" />
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
