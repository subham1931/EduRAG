"use client";

import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Subject, Document as Doc, QuizQuestion } from "@/types";
import { useDashboard } from "@/lib/dashboard-context";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { UploadDialog } from "@/components/dashboard/upload-dialog";
import { QuizDialog } from "@/components/dashboard/quiz-dialog";
import { NotesDialog } from "@/components/dashboard/notes-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Loader2,
  BookOpen,
  MessageSquare,
  HelpCircle,
  FileText,
  Clock,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

interface GeneratedItem {
  id: string;
  type: "quiz" | "notes";
  topic: string;
  detail: string;
  timestamp: Date;
  questions?: QuizQuestion[];
  content?: string;
}

export default function SubjectPage() {
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;
  const { subjects } = useDashboard();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [viewItem, setViewItem] = useState<GeneratedItem | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      const { data } = await api.get(`/documents/${subjectId}`);
      setDocuments(data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    }
  }, [subjectId]);

  const fetchGeneratedContent = useCallback(async () => {
    setContentLoading(true);
    try {
      const [quizRes, notesRes] = await Promise.allSettled([
        api.get(`/quizzes/${subjectId}`),
        api.get(`/notes/${subjectId}`),
      ]);

      const quizItems: GeneratedItem[] =
        quizRes.status === "fulfilled"
          ? quizRes.value.data.map((q: any) => ({
              id: q.id,
              type: "quiz" as const,
              topic: q.title || "General",
              detail: `${q.questions?.length || 0} MCQs`,
              timestamp: new Date(q.created_at),
              questions: q.questions,
            }))
          : [];

      const noteItems: GeneratedItem[] =
        notesRes.status === "fulfilled"
          ? notesRes.value.data.map((n: any) => ({
              id: n.id,
              type: "notes" as const,
              topic: n.title || "General",
              detail: "Study notes",
              timestamp: new Date(n.created_at),
              content: n.content,
            }))
          : [];

      const merged = [...quizItems, ...noteItems].sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
      );
      setGeneratedItems(merged);
    } catch (err) {
      console.error("Failed to load generated content:", err);
    } finally {
      setContentLoading(false);
    }
  }, [subjectId]);

  useEffect(() => {
    const found = subjects.find((s) => s.id === subjectId);
    if (found) {
      setSubject(found);
      fetchDocuments();
      fetchGeneratedContent();
    } else if (subjects.length > 0) {
      router.push("/dashboard");
    }
  }, [subjects, subjectId, router, fetchDocuments, fetchGeneratedContent]);

  const handleQuizGenerated = () => {
    fetchGeneratedContent();
  };

  const handleNotesGenerated = () => {
    fetchGeneratedContent();
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
        <div className="flex h-12 shrink-0 items-center justify-between border-b bg-muted/30 px-4 sm:px-6">
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

        {/* Quizzes & Notes sections */}
        <div className="flex-1 p-4 sm:p-6">
          {contentLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : generatedItems.filter((i) => i.type === "quiz").length === 0 &&
            generatedItems.filter((i) => i.type === "notes").length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
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
            <div className="space-y-8">
              {/* Quizzes Section */}
              {generatedItems.filter((i) => i.type === "quiz").length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                      <HelpCircle className="h-4 w-4 text-violet-500" />
                    </div>
                    <h3 className="text-sm font-semibold">Quizzes</h3>
                    <span className="ml-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[11px] font-medium text-violet-500">
                      {generatedItems.filter((i) => i.type === "quiz").length}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {generatedItems
                      .filter((i) => i.type === "quiz")
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setViewItem(item)}
                          className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:shadow-violet-500/10"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                            <HelpCircle className="h-5 w-5 text-violet-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.topic}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.detail}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/60">
                              <Clock className="h-3 w-3" />
                              {item.timestamp.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              {item.timestamp.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              {generatedItems.filter((i) => i.type === "notes").length > 0 && (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                      <FileText className="h-4 w-4 text-emerald-500" />
                    </div>
                    <h3 className="text-sm font-semibold">Notes</h3>
                    <span className="ml-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-500">
                      {generatedItems.filter((i) => i.type === "notes").length}
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {generatedItems
                      .filter((i) => i.type === "notes")
                      .map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setViewItem(item)}
                          className="flex items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md hover:shadow-emerald-500/10"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                            <FileText className="h-5 w-5 text-emerald-500" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {item.topic}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.detail}
                            </p>
                            <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground/60">
                              <Clock className="h-3 w-3" />
                              {item.timestamp.toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                              })}{" "}
                              {item.timestamp.toLocaleTimeString("en-US", {
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Chat (30%) ── */}
      <div className="flex w-[30%] shrink-0 flex-col">
        <div className="flex h-12 shrink-0 items-center gap-2 border-b bg-muted/30 px-4">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
            <MessageSquare className="h-3.5 w-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold">AI Chat</h2>
        </div>
        <div className="flex-1 overflow-hidden">
          <ChatPanel subject={subject} />
        </div>
      </div>

      {/* ── Viewer Dialog ── */}
      <Dialog open={!!viewItem} onOpenChange={(open) => !open && setViewItem(null)}>
        <DialogContent className="max-w-4xl">
          {viewItem?.type === "quiz" && (
            <>
              <DialogHeader>
                <DialogTitle>Quiz — {viewItem.topic}</DialogTitle>
                <DialogDescription>
                  {viewItem.questions?.length || 0} questions
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[60vh]">
                <div className="space-y-4 pr-4">
                  {viewItem.questions?.map((q, qIdx) => (
                    <div key={qIdx} className="rounded-lg border bg-card p-4">
                      <div className="mb-3 flex items-start gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {qIdx + 1}
                        </span>
                        <p className="text-sm font-medium leading-relaxed">
                          {q.question}
                        </p>
                      </div>
                      <div className="ml-8 space-y-1.5">
                        {q.options.slice(0, 4).map((opt, oIdx) => {
                          const isCorrect = q.correct_answer === opt;
                          const label = String.fromCharCode(97 + oIdx);
                          return (
                            <div
                              key={oIdx}
                              className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm ${
                                isCorrect
                                  ? "border-green-500/50 bg-green-500/10 text-green-500 dark:text-green-400"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              <span
                                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                  isCorrect
                                    ? "bg-green-500/20 text-green-500"
                                    : "bg-muted text-muted-foreground"
                                }`}
                              >
                                {label}
                              </span>
                              {isCorrect && (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                              )}
                              <span>{opt}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}

          {viewItem?.type === "notes" && (
            <>
              <DialogHeader>
                <DialogTitle>Notes — {viewItem.topic}</DialogTitle>
                <DialogDescription>Study notes</DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-[70vh]">
                <div className="prose dark:prose-invert max-w-none pr-4 prose-h1:text-xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-primary prose-h3:text-base prose-h3:font-medium prose-h3:mt-4 prose-h3:mb-2 prose-ol:my-2 prose-ol:space-y-2 prose-ul:my-1 prose-ul:space-y-1 prose-li:my-0 prose-li:leading-relaxed prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-hr:my-6 prose-hr:border-border prose-p:my-1 prose-p:leading-relaxed">
                  <ReactMarkdown>{viewItem.content || ""}</ReactMarkdown>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
