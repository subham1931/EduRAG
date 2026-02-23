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
import { QuizViewerDialog } from "@/components/dashboard/quiz-viewer-dialog";
import { SubjectSettingsDialog } from "@/components/dashboard/subject-settings-dialog";
import { DocumentListDialog } from "@/components/dashboard/document-list-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Files,
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
  const { subjects, fetchSubjects } = useDashboard();

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

  const RenderContent = () => (
    <div className="flex flex-1 flex-col overflow-auto h-full lg:border-r">
      {/* Subject header */}
      <div className="flex h-14 lg:h-12 shrink-0 items-center justify-between border-b bg-muted/30 px-3 sm:px-6">
        <div className="flex items-center gap-1 sm:gap-3 overflow-hidden">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shrink-0"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden">
            <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 shrink-0">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-sm font-semibold truncate max-w-[120px] sm:max-w-none">
              {subject.name}
            </h2>
            <SubjectSettingsDialog subject={subject} onUpdate={fetchSubjects} />
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <DocumentListDialog
            subject={subject}
            documents={documents}
            onRefresh={fetchDocuments}
          />
          <UploadDialog subject={subject} onUploadComplete={fetchDocuments} />
          <QuizDialog subject={subject} onGenerated={handleQuizGenerated} />
          <NotesDialog subject={subject} onGenerated={handleNotesGenerated} />
        </div>
      </div>

      {/* Quizzes & Notes sections */}
      <div className="flex-1 p-3 sm:p-6 overflow-auto">
        {contentLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : generatedItems.filter((i) => i.type === "quiz").length === 0 &&
          generatedItems.filter((i) => i.type === "notes").length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center py-12">
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
            <div className="mt-6 md:hidden">
              <DocumentListDialog
                subject={subject}
                documents={documents}
                onRefresh={fetchDocuments}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="md:hidden flex justify-end">
              <DocumentListDialog
                subject={subject}
                documents={documents}
                onRefresh={fetchDocuments}
              />
            </div>

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
  );

  return (
    <main className="h-full flex flex-col">
      {/* Mobile view: Tabs */}
      <div className="flex flex-1 flex-col lg:hidden overflow-hidden">
        <Tabs defaultValue="content" className="flex-1 flex flex-col overflow-hidden">
          <TabsContent value="content" className="flex-1 overflow-hidden m-0 border-none">
            <RenderContent />
          </TabsContent>
          <TabsContent value="chat" className="flex-1 overflow-hidden m-0 border-none">
            <div className="flex flex-col h-full overflow-hidden">
              <div className="flex h-14 shrink-0 items-center gap-2 border-b bg-muted/30 px-4">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                  <MessageSquare className="h-3.5 w-3.5 text-primary" />
                </div>
                <h2 className="text-sm font-semibold">AI Chat</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel subject={subject} />
              </div>
            </div>
          </TabsContent>
          <TabsList className="grid w-full grid-cols-2 rounded-none border-t h-14 bg-background px-2">
            <TabsTrigger value="content" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10">
              <Files className="mr-2 h-4 w-4" />
              Content
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10">
              <MessageSquare className="mr-2 h-4 w-4" />
              AI Chat
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop view: Side-by-side */}
      <div className="hidden lg:flex flex-1 overflow-hidden">
        {/* Left: Content */}
        <RenderContent />

        {/* Right: Chat (350px - 450px suggested) */}
        <div className="flex w-[350px] xl:w-[400px] shrink-0 flex-col overflow-hidden">
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
      </div>

      {/* ── Viewers (Dialogs/Modals) ── */}
      {viewItem?.type === "quiz" && (
        <QuizViewerDialog
          open
          onClose={() => setViewItem(null)}
          quizId={viewItem.id}
          subjectId={subjectId}
          topic={viewItem.topic}
          initialQuestions={viewItem.questions || []}
          onUpdated={fetchGeneratedContent}
        />
      )}

      {viewItem?.type === "notes" && (
        <Dialog open onOpenChange={() => setViewItem(null)}>
          <DialogContent className="flex max-w-5xl flex-col h-[90vh] w-[95vw]">
            <DialogHeader className="pr-12">
              <DialogTitle className="truncate">Notes — {viewItem.topic}</DialogTitle>
              <DialogDescription>Study notes</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1">
              <div className="prose dark:prose-invert max-w-none pr-4 pb-12 prose-h1:text-xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-primary prose-h3:text-base prose-h3:font-medium prose-h3:mt-4 prose-h3:mb-2 prose-ol:my-2 prose-ol:space-y-2 prose-ul:my-1 prose-ul:space-y-1 prose-li:my-0 prose-li:leading-relaxed prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-hr:my-6 prose-hr:border-border prose-p:my-1 prose-p:leading-relaxed">
                <ReactMarkdown>{viewItem.content || ""}</ReactMarkdown>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
