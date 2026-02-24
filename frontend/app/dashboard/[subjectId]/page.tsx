"use client";

import React, { useEffect, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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
  Loader2,
  MessageSquare,
  LayoutDashboard,
  HelpCircle,
  FileText,
  Clock,
  Sparkles,
  Files,
  ArrowRight,
  Settings,
  Layers,
  Users,
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
            <p className="text-muted-foreground">Manage your project configuration and visibility.</p>
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
      return (
        <div className="flex-1 p-8 space-y-6 overflow-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">Questions</h2>
              <p className="text-sm text-muted-foreground mt-1">Practice your knowledge with AI-generated assessment questions.</p>
            </div>
            <QuizDialog subject={subject!} onGenerated={handleQuizGenerated} />
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {quizzes.length === 0 ? (
              <div className="col-span-full py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                <HelpCircle className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium text-lg">No questions generated yet.</p>
                <p className="text-sm text-center max-w-xs mt-1">Generate evaluation questions using the button above to test your skills.</p>
              </div>
            ) : (
              quizzes.map(quiz => (
                <div key={quiz.id} className="p-6 rounded-2xl border bg-card hover:border-primary/50 transition-all flex flex-col shadow-sm group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500">
                      <HelpCircle className="h-6 w-6" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                      {quiz.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 truncate">{quiz.topic}</h3>
                  <p className="text-sm text-muted-foreground mb-6">{quiz.detail}</p>
                  <Link href={`/dashboard/${subjectId}/quizzes/${quiz.id}`} className="w-full">
                    <Button
                      className="w-full rounded-xl gap-2 font-bold"
                    >
                      Review Questions
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
              <div className="col-span-full py-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
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

          <div className="p-20 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-center space-y-4 bg-muted/5">
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
              <p className="text-sm text-muted-foreground mt-1">Manage and upload PDF documents for this project.</p>
            </div>
            <div className="flex items-center gap-2">
              <UploadDialog subject={subject!} onUploadComplete={fetchDocuments} />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {documents.length === 0 ? (
              <div className="col-span-full py-20 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-muted-foreground">
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
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Quizzes</p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold">{generatedItems.filter(i => i.type === "quiz").length}</span>
                  <div className="text-orange-500 bg-orange-500/10 p-2 rounded-lg"><HelpCircle className="h-4 w-4" /></div>
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
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                <div className="flex items-baseline gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-lg font-bold">Live</span>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Knowledge Base Card */}
              <div className="col-span-1 md:col-span-2 lg:col-span-2 rounded-2xl border bg-card shadow-sm overflow-hidden flex flex-col group hover:border-primary/50 transition-all duration-300">
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

              {/* Config / Tools Card */}
              <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    Controls
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">Manage project resources</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/10 group hover:bg-muted/30 transition-colors">
                    <span className="text-xs font-medium">Generate Quiz</span>
                    <QuizDialog subject={subject!} onGenerated={handleQuizGenerated} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/10 group hover:bg-muted/30 transition-colors">
                    <span className="text-xs font-medium">Create Notes</span>
                    <NotesDialog subject={subject!} onGenerated={handleNotesGenerated} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/10 group hover:bg-muted/30 transition-colors">
                    <span className="text-xs font-medium">Settings</span>
                    <SubjectSettingsDialog subject={subject!} onUpdate={fetchSubjects} />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    <span>Engine</span>
                    <span className="text-primary">Ollama v0.1.x</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    <span>Model</span>
                    <span className="text-primary">Mistral / Llama3</span>
                  </div>
                </div>
              </div>

              {/* Learning Insights Graph */}
              <div className="col-span-1 md:col-span-2 lg:col-span-3 rounded-3xl border bg-card shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="p-6 border-b bg-muted/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary shadow-inner">
                      <LayoutDashboard className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">Learning Insights</h2>
                      <p className="text-xs text-muted-foreground/70">Activity analytics for the past 7 days</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 group cursor-default">
                      <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 group-hover:text-primary transition-colors">Study Hours</span>
                    </div>
                    <div className="flex items-center gap-2 group cursor-default">
                      <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/80 group-hover:text-orange-500 transition-colors">Avg Score</span>
                    </div>
                  </div>
                </div>

                <div className="p-10 relative bg-gradient-to-b from-transparent to-muted/5">
                  <div className="relative h-[220px] w-full">
                    {/* Y-Axis Labels */}
                    <div className="absolute left-0 h-full flex flex-col justify-between text-[10px] font-black text-muted-foreground/10 pointer-events-none select-none">
                      <span>100</span>
                      <span>50</span>
                      <span>0</span>
                    </div>

                    {/* The Graph Area */}
                    <div className="absolute left-12 right-4 top-0 bottom-0">
                      {/* Subtle Grid System */}
                      <div className="absolute inset-0 grid grid-cols-7 gap-0 pointer-events-none">
                        {[...Array(8)].map((_, i) => (
                          <div key={i} className="border-l border-dashed border-muted-foreground/5 h-full" />
                        ))}
                      </div>
                      {[0, 50, 100].map((v) => (
                        <div
                          key={v}
                          className="absolute w-full border-t border-dashed border-muted-foreground/10"
                          style={{ bottom: `${v}%` }}
                        />
                      ))}

                      {/* SVG Chart */}
                      <svg
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="w-full h-full overflow-visible drop-shadow-2xl"
                      >
                        <defs>
                          <linearGradient id="primaryArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                          </linearGradient>
                          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="2" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                          </filter>
                        </defs>

                        {/* Engagement Area - Smooth Cubic Path */}
                        <path
                          d="M 0,85 C 15,80 25,20 40,40 C 55,60 65,10 80,30 C 90,40 100,20 100,20 V 100 H 0 Z"
                          className="fill-[url(#primaryArea)] stroke-primary stroke-[0.8]"
                        />

                        {/* Accuracy Line - Contrasting Path */}
                        <path
                          d="M 0,70 C 20,60 35,85 50,45 C 65,5 80,40 100,35"
                          className="fill-none stroke-orange-500 stroke-[0.6]"
                          strokeDasharray="1.5,1.5"
                        />

                        {/* Glowing Data Points */}
                        {[
                          { x: 40, y: 40 },
                          { x: 80, y: 30 },
                          { x: 100, y: 20 }
                        ].map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="2.5" className="fill-primary/20 animate-pulse" />
                            <circle cx={p.x} cy={p.y} r="1.2" className="fill-background stroke-primary stroke-[0.5]" />
                          </g>
                        ))}
                      </svg>
                    </div>
                  </div>

                  {/* X-Axis Labels with refined spacing */}
                  <div className="flex justify-between pl-12 pr-4 pt-8 text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground/20">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>

                <div className="px-8 py-5 bg-muted/20 border-t border-border/50 flex items-center justify-between">
                  <div className="flex gap-10">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Knowledge Retention</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-emerald-500">94.8%</span>
                        <div className="h-1 w-12 rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-emerald-500 w-[94%]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Weekly Momentum</span>
                      <span className="text-lg font-bold text-primary">+12.4%</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="bg-background/50 hover:bg-background border-border/50 text-[11px] font-bold h-10 px-6 rounded-2xl shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group">
                    Analytics Dashboard
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
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
              Project
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
