"use client";

import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import api from "@/lib/api";
import { Subject, Document as Doc, QuizQuestion } from "@/types";
import { useDashboard } from "@/lib/dashboard-context";
import { ChatPanel } from "@/components/dashboard/chat-panel";
import { UploadDialog } from "@/components/dashboard/upload-dialog";
import { QuizDialog } from "@/components/dashboard/quiz-dialog";
import { NotesDialog } from "@/components/dashboard/notes-dialog";
import { SubjectSettingsDialog } from "@/components/dashboard/subject-settings-dialog";
import { DocumentListDialog } from "@/components/dashboard/document-list-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Loader2,
  MessageSquare,
  HelpCircle,
  FileText,
  Clock,
  Sparkles,
  Files,
  ArrowRight,
  Settings,
  Layers,
  Users,
  LayoutGrid,
  List,
  Search,
  MoreVertical,
  Pencil,
  Trash2,
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
  const searchParams = useSearchParams();
  const subjectId = params.subjectId as string;
  const tab = searchParams.get("tab") || "overview";
  const { subjects, fetchSubjects } = useDashboard();

  const [subject, setSubject] = useState<Subject | null>(null);
  const [documents, setDocuments] = useState<Doc[]>([]);
  const [generatedItems, setGeneratedItems] = useState<GeneratedItem[]>([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [viewItem, setViewItem] = useState<GeneratedItem | null>(null);
  const [quizViewMode, setQuizViewMode] = useState<"grid" | "list">("grid");
  const [quizSearchQuery, setQuizSearchQuery] = useState("");

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

  const handleQuizGenerated = () => fetchGeneratedContent();
  const handleNotesGenerated = () => fetchGeneratedContent();
  const handleDeleteQuiz = async (quizId: string) => {
    try {
      await api.delete(`/quiz/${quizId}`);
      await fetchGeneratedContent();
      toast.success("Quiz moved to recycle bin.");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to delete quiz.");
    }
  };

  if (!subject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const RenderContent = () => {
    if (tab === "chat") {
      return (
        <div className="flex-1 flex flex-col overflow-hidden bg-background">
          <div className="flex h-14 items-center justify-between px-6 border-b bg-card/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold">Interactive AI Tutor</h2>
            </div>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatPanel subject={subject} />
          </div>
        </div>
      );
    }

    if (tab === "settings") {
      return (
        <div className="flex-1 p-8 max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="space-y-1">
            <h2 className="text-3xl font-bold tracking-tight">Subject Settings</h2>
            <p className="text-muted-foreground">Manage your subject configuration and visibility.</p>
          </div>

          <div className="p-8 border rounded-2xl bg-card shadow-sm space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-bold mb-2 block">Subject Name</label>
                <div className="p-3 rounded-xl bg-muted/30 border font-medium text-foreground/80">{subject?.name}</div>
              </div>
              <div>
                <label className="text-sm font-bold mb-2 block">Description</label>
                <div className="p-3 rounded-xl bg-muted/30 border text-sm text-foreground/70 min-h-[100px]">{subject?.description || "No description provided."}</div>
              </div>
            </div>

            <div className="pt-6 border-t flex flex-col gap-4">
              <p className="text-sm font-medium">Quick Actions</p>
              <div className="flex gap-3">
                <SubjectSettingsDialog subject={subject!} onUpdate={fetchSubjects} />
              </div>
            </div>
          </div>

          <div className="p-6 border border-destructive/20 rounded-2xl bg-destructive/5 space-y-4">
            <h3 className="text-sm font-bold text-destructive">Danger Zone</h3>
            <p className="text-xs text-muted-foreground">Once you delete a subject, there is no going back. Please be certain.</p>
            {/* Delete is handled inside SubjectSettingsDialog but we could trigger it here too */}
            <div className="opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all">
              <p className="text-[10px] font-black uppercase text-muted-foreground mb-4">Click Settings above to delete</p>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "quizzes") {
      const quizzes = generatedItems.filter(i => i.type === "quiz");
      const filteredQuizzes = quizzes.filter((quiz) =>
        quiz.topic.toLowerCase().includes(quizSearchQuery.trim().toLowerCase())
      );
      return (
        <div className="flex-1 p-8 space-y-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
              <p className="text-sm text-muted-foreground mt-1">Practice your knowledge with AI-generated assessment questions.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center rounded-md border bg-card p-1">
                <button
                  type="button"
                  onClick={() => setQuizViewMode("list")}
                  aria-label="List view"
                  className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${
                    quizViewMode === "list"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setQuizViewMode("grid")}
                  aria-label="Grid view"
                  className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${
                    quizViewMode === "grid"
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
              </div>
              <QuizDialog subject={subject!} onGenerated={handleQuizGenerated} />
            </div>
          </div>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={quizSearchQuery}
              onChange={(e) => setQuizSearchQuery(e.target.value)}
              placeholder="Search questions by quiz title..."
              className="h-10 pl-9"
            />
          </div>
          <div className={quizViewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "grid gap-4 grid-cols-1"}>
            {quizzes.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
                <Sparkles className="h-10 w-10 mb-4 opacity-20" />
                <p className="font-medium text-lg">No assessments created yet.</p>
                <p className="text-sm text-center max-w-xs mt-1">Generate evaluation questions using the button above to begin your journey.</p>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
                <Search className="h-10 w-10 mb-4 opacity-20" />
                <p className="font-medium text-lg">No matching quizzes found.</p>
                <p className="text-sm text-center max-w-xs mt-1">Try a different keyword.</p>
              </div>
            ) : (
              filteredQuizzes.map(quiz => (
                <div
                  key={quiz.id}
                  onClick={() => router.push(`/dashboard/${subjectId}/quizzes/${quiz.id}`)}
                  className="group flex h-full cursor-pointer flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                    <div className="mb-4 flex items-center justify-between">
                      <span className="rounded-md border bg-muted/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Quiz
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-muted-foreground/70">
                          {quiz.timestamp.toLocaleDateString()}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              onClick={(e) => e.stopPropagation()}
                              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label="Quiz actions"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                router.push(`/dashboard/${subjectId}/quizzes/${quiz.id}?edit=true`);
                              }}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Update
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onSelect={(e) => {
                                e.preventDefault();
                                handleDeleteQuiz(quiz.id);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-snug">
                        {quiz.topic}
                      </h3>
                      <p className="inline-flex items-center rounded-md border bg-primary/5 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
                        {quiz.detail}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-primary">
                      <span className="text-[11px] font-semibold">Open quiz</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (tab === "notes") {
      const notes = generatedItems.filter(i => i.type === "notes");
      return (
        <div className="flex-1 p-8 space-y-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Study Notes</h2>
              <p className="text-sm text-muted-foreground mt-1">AI-extracted summaries and key concepts from your materials.</p>
            </div>
            <NotesDialog subject={subject!} onGenerated={handleNotesGenerated} />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {notes.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
                <FileText className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium text-lg">No study notes found.</p>
                <p className="text-sm text-center max-w-xs mt-1">Ask the AI to generate notes to help you review key topics.</p>
              </div>
            ) : (
              notes.map(note => (
                <div key={note.id} className="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-all flex flex-col shadow-sm group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                      <FileText className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {note.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{note.topic}</h3>
                  <div className="text-sm text-muted-foreground line-clamp-3 mb-6 bg-muted/20 p-3 rounded-xl">
                    <ReactMarkdown>{note.content!}</ReactMarkdown>
                  </div>
                  <Link href={`/dashboard/${subjectId}/notes/${note.id}`} className="w-full">
                    <Button
                      variant="outline"
                      className="w-full rounded-xl gap-2 font-bold group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    >
                      Open Notes
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    if (tab === "students") {
      return (
        <div className="flex-1 p-8 space-y-8 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-3xl font-bold tracking-tight">Students</h2>
              <p className="text-muted-foreground">Manage student access and view progress analytics.</p>
            </div>
            <Button disabled className="rounded-full">
              <Users className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </div>

          <div className="p-20 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-primary/5">
              <Users className="h-10 w-10 text-primary/30" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Feature Coming Soon</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">Student management and class analytics are currently in development.</p>
            </div>
          </div>
        </div>
      );
    }

    if (tab === "docs") {
      return (
        <div className="flex-1 p-8 space-y-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Documents</h2>
              <p className="text-sm text-muted-foreground mt-1">Manage and upload PDF documents for this subject.</p>
            </div>
            <div className="flex items-center gap-2">
              <UploadDialog subject={subject!} onUploadComplete={fetchDocuments} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documents.length === 0 ? (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground">
                <Files className="h-12 w-12 mb-4 opacity-20" />
                <p>No documents found. Start by uploading one!</p>
              </div>
            ) : (
              documents.map(doc => (
                <div key={doc.id} className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-all flex items-center justify-between shadow-sm group">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold truncate max-w-[150px]">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">{doc.page_count || 0} pages</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity">
                    <Settings className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      );
    }

    // Default: overview
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-muted/20">
        <ScrollArea className="flex-1">
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-20">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Documents</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{documents.length}</span>
                  <div className="text-primary bg-primary/10 p-2 rounded-lg"><Files className="h-4 w-4" /></div>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Assessments</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{generatedItems.filter(i => i.type === "quiz").length}</span>
                  <div className="text-primary bg-primary/10 p-2 rounded-lg"><Sparkles className="h-4 w-4" /></div>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{generatedItems.filter(i => i.type === "notes").length}</span>
                  <div className="text-emerald-500 bg-emerald-500/10 p-2 rounded-lg"><FileText className="h-4 w-4" /></div>
                </div>
              </div>
              <div className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Students</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">0</span>
                  <div className="text-primary bg-primary/10 p-2 rounded-lg"><Users className="h-4 w-4" /></div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Knowledge Base Card */}
              <div className="col-span-full rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col group hover:border-primary/50 transition-all duration-300">
                <div className="p-6 border-b bg-muted/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-primary/10 text-primary">
                      <Files className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Knowledge Base</h2>
                      <p className="text-xs text-muted-foreground">PDFs used for AI training</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DocumentListDialog subject={subject!} documents={documents} onRefresh={fetchDocuments} />
                    <UploadDialog subject={subject!} onUploadComplete={fetchDocuments} />
                  </div>
                </div>
                <div className="flex-1 p-6">
                  {documents.length === 0 ? (
                    <div className="h-40 flex flex-col items-center justify-center text-center">
                      <p className="text-sm text-muted-foreground font-medium">No documents uploaded yet.</p>
                      <p className="text-xs text-muted-foreground mt-1">Upload files to enable AI knowledge.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {documents.slice(0, 4).map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors">
                          <div className="flex items-center gap-3 truncate">
                            <FileText className="h-4 w-4 text-primary shrink-0" />
                            <span className="text-xs font-semibold truncate">{doc.filename}</span>
                          </div>
                          <span className="text-[9px] text-muted-foreground font-bold whitespace-nowrap">{doc.page_count} P</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Learning Insights Graph */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 rounded-3xl border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="p-8">
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Line Charts</h2>
                      <div className="mt-4 inline-flex rounded-md border bg-muted/20 p-0.5">
                        {["12 months", "30 days", "7 days", "24 hours"].map((range, idx) => (
                          <button
                            key={range}
                            type="button"
                            className={`rounded px-4 py-2 text-xs font-semibold transition-colors ${
                              idx === 0
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {range}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="h-2.5 w-2.5 rounded-full border border-cyan-400" />
                      Total Profits
                    </div>
                  </div>

                  <div className="relative h-[320px]">
                    <div className="absolute left-0 top-6 bottom-12 flex flex-col justify-between text-xs font-semibold text-muted-foreground/70">
                      <span>60k</span>
                      <span>50k</span>
                      <span>40k</span>
                      <span>30k</span>
                      <span>20k</span>
                      <span>10k</span>
                      <span>0</span>
                    </div>

                    <div className="absolute left-10 right-0 top-6 bottom-12">
                      <div className="absolute inset-0">
                        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                          <div
                            key={i}
                            className="absolute left-0 right-0 border-t border-border/60"
                            style={{ top: `${(i * 100) / 6}%` }}
                          />
                        ))}
                      </div>

                      <svg viewBox="0 0 1200 260" preserveAspectRatio="none" className="h-full w-full">
                        <defs>
                          <linearGradient id="profitAreaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.35" />
                            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.02" />
                          </linearGradient>
                        </defs>

                        <path
                          d="M0,240 C25,180 55,150 95,145 C145,138 175,30 230,28 C280,26 315,40 360,145 C390,212 430,166 470,145 C520,118 555,67 610,95 C655,117 685,190 740,205 C790,216 835,205 885,140 C930,80 970,20 1030,28 C1085,36 1120,95 1160,240 L0,240 Z"
                          fill="url(#profitAreaFill)"
                        />
                        <path
                          d="M0,240 C25,180 55,150 95,145 C145,138 175,30 230,28 C280,26 315,40 360,145 C390,212 430,166 470,145 C520,118 555,67 610,95 C655,117 685,190 740,205 C790,216 835,205 885,140 C930,80 970,20 1030,28 C1085,36 1120,95 1160,240"
                          fill="none"
                          stroke="#22d3ee"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>

                    <div className="absolute bottom-0 left-10 right-0 grid grid-cols-12 text-xs font-semibold text-muted-foreground/80">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m) => (
                        <span key={m} className="text-center">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  };

  return (
    <main className="h-full flex flex-col overflow-hidden">
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
                <h2 className="text-sm font-semibold">AI Assistant</h2>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatPanel subject={subject} />
              </div>
            </div>
          </TabsContent>
          <TabsList className="grid w-full grid-cols-2 rounded-none border-t h-14 bg-background px-2 shrink-0">
            <TabsTrigger value="content" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10">
              <Files className="mr-2 h-4 w-4" />
              Subject
            </TabsTrigger>
            <TabsTrigger value="chat" className="data-[state=active]:bg-primary/5 data-[state=active]:text-primary h-10">
              <MessageSquare className="mr-2 h-4 w-4" />
              Chat
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Desktop view: Single column (AI Chat handles full-width internally when active) */}
      <div className="hidden lg:flex flex-1 overflow-hidden relative">
        <RenderContent />
      </div>

      {/* No viewers here, they are on separate routes now */}
    </main>
  );
}
