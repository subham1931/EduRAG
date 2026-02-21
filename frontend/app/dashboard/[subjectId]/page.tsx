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
import { ArrowLeft, FileText, Loader2, BookOpen } from "lucide-react";

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
    <div className="flex h-full flex-col">
      {/* Subject bar */}
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
          <UploadDialog
            subject={subject}
            onUploadComplete={fetchDocuments}
          />
          <QuizDialog subject={subject} />
          <NotesDialog subject={subject} />
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden">
        <ChatPanel subject={subject} />
      </div>
    </div>
  );
}
