"use client";

import React, { useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  HelpCircle,
  Loader2,
  CheckCircle2,
  GripVertical,
  Save,
  Check,
  ChevronLeft,
  ArrowRight,
  Sparkles,
  Pencil,
  Plus,
} from "lucide-react";
import { Subject, QuizQuestion } from "@/types";
import api from "@/lib/api";

interface QuizDialogProps {
  subject: Subject;
  onGenerated?: () => void;
}

export function QuizDialog({ subject, onGenerated }: QuizDialogProps) {
  const router = useRouter();
  const params = useParams();
  const [isOpen, setIsOpen] = useState(false);

  // State for the flow
  const [step, setStep] = useState<"details" | "method" | "ai_config" | "manual_type" | "results">("details");
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDescription, setQuizDescription] = useState("");
  const [topic, setTopic] = useState("");
  const [style, setStyle] = useState("");
  const [counts, setCounts] = useState({
    mcq: 5,
    short: 0,
    long: 0,
    fill_blanks: 0
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState("");

  const reset = () => {
    setStep("details");
    setQuizTitle("");
    setQuizDescription("");
    setTopic("");
    setStyle("");
    setCounts({ mcq: 5, short: 0, long: 0, fill_blanks: 0 });
    setQuestions([]);
    setError("");
    setSaved(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setSaved(false);

    try {
      const { data: genData } = await api.post("/generate-quiz", {
        subject_id: subject.id,
        topic: topic,
        instructions: style || undefined,
        mcq_count: counts.mcq,
        short_count: counts.short,
        long_count: counts.long,
        fill_blanks_count: counts.fill_blanks
      });

      if (genData.questions && genData.questions.length > 0) {
        setQuestions(genData.questions);
        setStep("results");
      } else {
        setError("LLM returned 0 questions. Please try again or broaden your topic.");
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to generate questions. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.post("/save-quiz", {
        subject_id: subject.id,
        title: quizTitle || "Practice Set",
        description: quizDescription,
        questions: questions
      });
      setSaved(true);
      onGenerated?.();
      setIsOpen(false);
      toast.success("Assessment saved successfully!");
      router.push(`/dashboard/${params.subjectId}/quizzes/${data.id}?edit=true`);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save questions.");
    } finally {
      setSaving(false);
    }
  };

  const handleManualCreate = async (type: string) => {
    setSaving(true);
    try {
      // Create empty quiz with first question template based on type
      let firstQ: QuizQuestion | null = null;
      if (type === "mcq") {
        firstQ = { type: "mcq", question: "Enter your question here...", options: ["Option A", "Option B", "Option C", "Option D"], correct_answer: "Option A" };
      } else if (type === "short") {
        firstQ = { type: "short", question: "Enter your short answer question...", correct_answer: "Answer Key" };
      } else if (type === "long") {
        firstQ = { type: "long", question: "Enter your long answer question...", correct_answer: "Detailed Rubric" };
      } else if (type === "fill_blanks") {
        firstQ = { type: "fill_blanks", question: "The capital of ____ is Paris.", correct_answer: "France" };
      }

      const { data } = await api.post("/save-quiz", {
        subject_id: subject.id,
        title: quizTitle || "Practice Set",
        description: quizDescription,
        questions: firstQ ? [firstQ] : []
      });

      onGenerated?.();
      setIsOpen(false);
      toast.success("Practice set created!");
      router.push(`/dashboard/${params.subjectId}/quizzes/${data.id}?edit=true`);
    } catch (err: any) {
      toast.error("Failed to create practice set.");
    } finally {
      setSaving(false);
    }
  };

  const updateCount = (key: keyof typeof counts, val: string) => {
    // If the value is empty, set it to 0
    if (val === "") {
      setCounts(prev => ({ ...prev, [key]: 0 }));
      return;
    }

    // Parse the value, removing leading zeros implicitly with parseInt
    const n = parseInt(val, 10);
    if (!isNaN(n)) {
      setCounts(prev => ({ ...prev, [key]: Math.min(Math.max(0, n), 20) }));
    }
  };

  const totalQuestions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2">
          <Plus className="h-4 w-4" />
          Add Questions
        </Button>
      </DialogTrigger>
      <DialogContent className={`${step === "method" || step === "results" ? "max-w-xl" : "max-w-md"} transition-all duration-300 rounded-[2rem] overflow-hidden flex flex-col border-none shadow-2xl p-0`}>
        <DialogHeader className="shrink-0 pt-8 px-8 pb-2">
          <div className="flex items-center gap-2 mb-1">
            {step !== "details" && (
              <Button variant="ghost" size="icon" onClick={() => {
                if (step === "method") setStep("details");
                else if (step === "ai_config") setStep("method");
                else if (step === "manual_type") setStep("method");
                else if (step === "results") setStep("ai_config");
              }} className="h-8 w-8 rounded-full hover:bg-muted transition-colors -ml-2">
                <ChevronLeft className="h-4 w-4" />
              </Button>
            )}
            <DialogTitle className="text-2xl font-black tracking-tight">
              {step === "details" && "Assessment Details"}
              {step === "method" && "Select Method"}
              {step === "ai_config" && "AI Generator"}
              {step === "manual_type" && "Question Type"}
              {step === "results" && "Review Questions"}
            </DialogTitle>
          </div>
          <DialogDescription className="text-sm font-medium opacity-80">
            {step === "details" && "Configure the basic information for your question set."}
            {step === "method" && "How would you like to build this assessment?"}
            {step === "ai_config" && "Extract intelligent questions from your subject materials."}
            {step === "manual_type" && "Choose the format for your first manual question."}
            {step === "results" && `Successfully generated ${questions.length} questions for review.`}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-8 pb-8">
          {/* Step 0: Details */}
          {step === "details" && (
            <div className="space-y-6 pt-2">
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Set Title</Label>
                <Input
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Mid-Term Prep: Chapter 1"
                  className="rounded-2xl h-12 bg-muted/20 border-border/50 px-5 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-medium"
                />
              </div>
              <div className="space-y-3">
                <Label className="text-[11px] font-black uppercase tracking-[0.15em] text-muted-foreground/80 ml-1">Learning Objectives (Optional)</Label>
                <Input
                  value={quizDescription}
                  onChange={(e) => setQuizDescription(e.target.value)}
                  placeholder="e.g. Focus on Operators and Data Types"
                  className="rounded-2xl h-12 bg-muted/20 border-border/50 px-5 focus-visible:ring-primary/20 focus-visible:border-primary/50 transition-all font-medium text-sm text-foreground/80"
                />
              </div>
              <Button
                onClick={() => setStep("method")}
                disabled={!quizTitle.trim()}
                className="w-full h-[52px] rounded-2xl font-bold mt-4 shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
              >
                Continue to Method
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 1: Method selection */}
          {step === "method" && (
            <div className="grid grid-cols-2 gap-4 py-2">
              <button
                onClick={() => setStep("ai_config")}
                className="group flex flex-col gap-3 p-6 rounded-2xl border-2 border-transparent bg-muted/30 hover:bg-primary/5 hover:border-primary/20 transition-all text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Generate by AI</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug">Auto-extract questions from your uploaded documents instantly.</p>
                </div>
              </button>

              <button
                onClick={() => setStep("manual_type")}
                className="group flex flex-col gap-3 p-6 rounded-2xl border-2 border-transparent bg-muted/30 hover:bg-orange-500/5 hover:border-orange-500/20 transition-all text-left"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
                  <Pencil className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg">Create Manually</h3>
                  <p className="text-[11px] text-muted-foreground leading-snug">Handcraft your own questions one by one for full control.</p>
                </div>
              </button>
            </div>
          )}

          {/* Step 2: AI Config */}
          {step === "ai_config" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center justify-between">
                  Assessment Topic
                  <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md lowercase font-normal italic">Compulsory</span>
                </Label>
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. React Lifecycle or Photosynthesis"
                  className={`rounded-xl h-11 bg-muted/50 border-none px-4 focus-visible:ring-primary/20 transition-all ${!topic.trim() ? "ring-2 ring-primary/10" : ""}`}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
                  Additional Context / Style
                  <span className="text-[9px] font-normal lowercase italic bg-muted px-1.5 py-0.5 rounded-md">Optional</span>
                </Label>
                <Input
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  placeholder="e.g. focusing on React Hooks or Advanced level"
                  className="rounded-xl h-11 bg-muted/50 border-none px-4 focus-visible:ring-primary/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">MCQ Questions</Label>
                  <Input
                    type="number"
                    value={counts.mcq === 0 ? "0" : counts.mcq}
                    onChange={(e) => updateCount("mcq", e.target.value)}
                    className="rounded-xl h-9 bg-muted/50 border-none px-4 no-spinner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Short Answer</Label>
                  <Input
                    type="number"
                    value={counts.short === 0 ? "0" : counts.short}
                    onChange={(e) => updateCount("short", e.target.value)}
                    className="rounded-xl h-9 bg-muted/50 border-none px-4 no-spinner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Long Answer</Label>
                  <Input
                    type="number"
                    value={counts.long === 0 ? "0" : counts.long}
                    onChange={(e) => updateCount("long", e.target.value)}
                    className="rounded-xl h-9 bg-muted/50 border-none px-4 no-spinner"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fill in Blanks</Label>
                  <Input
                    type="number"
                    value={counts.fill_blanks === 0 ? "0" : counts.fill_blanks}
                    onChange={(e) => updateCount("fill_blanks", e.target.value)}
                    className="rounded-xl h-9 bg-muted/50 border-none px-4 no-spinner"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-xl">{error}</p>}

              <Button
                onClick={handleGenerate}
                disabled={loading || totalQuestions === 0 || !topic.trim()}
                className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating {totalQuestions} Questions...
                  </>
                ) : (
                  `Generate ${totalQuestions} Questions`
                )}
              </Button>
            </div>
          )}

          {/* Step 2: Manual Selection */}
          {step === "manual_type" && (
            <div className="grid grid-cols-2 gap-3 py-2">
              {[
                { id: 'mcq', label: 'Multiple Choice', desc: 'Questions with options' },
                { id: 'short', label: 'Short Answer', desc: 'Direct responses' },
                { id: 'long', label: 'Long Answer', desc: 'Detailed explanations' },
                { id: 'fill_blanks', label: 'Fill Blanks', desc: 'Completion tasks' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => handleManualCreate(t.id)}
                  disabled={saving}
                  className="flex flex-col gap-1 p-4 rounded-2xl bg-muted/30 border border-transparent hover:border-orange-500/30 hover:bg-orange-500/5 transition-all text-left"
                >
                  <span className="font-bold text-sm">{t.label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{t.desc}</span>
                </button>
              ))}
              {saving && (
                <div className="col-span-2 flex items-center justify-center py-4 gap-2 text-sm font-medium text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating practice set...
                </div>
              )}
            </div>
          )}

          {/* Step 3: Results Preview */}
          {step === "results" && (
            <div className="space-y-6">
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-4">
                  {questions.map((q, idx) => (
                    <div key={idx} className="p-5 rounded-2xl bg-muted/30 border border-border/50 space-y-3 relative group">
                      <div className="flex items-start gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary text-[10px] font-black text-primary-foreground shadow-sm">
                          {idx + 1}
                        </span>
                        <div className="flex-1 space-y-3">
                          <p className="font-bold text-sm leading-tight pr-6">{q.question}</p>

                          {q.type === 'mcq' && q.options && (
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className={`p-2 rounded-xl border text-[10px] font-medium ${opt === q.correct_answer ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-background border-border/50'}`}>
                                  {opt}
                                </div>
                              ))}
                            </div>
                          )}

                          {q.type !== 'mcq' && (
                            <div className="p-2.5 rounded-xl bg-background border border-border/50">
                              <p className="text-[10px] font-bold text-emerald-600">Key Answer: {q.correct_answer}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving Assessment...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save & Continue to Editor
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setStep("ai_config")}
                  className="w-full rounded-xl text-muted-foreground font-medium"
                >
                  Regenerate Questions
                </Button>
              </div>
            </div>
          )}

        </div>
      </DialogContent>
    </Dialog>
  );
}
