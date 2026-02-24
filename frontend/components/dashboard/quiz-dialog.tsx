"use client";

import React, { useState, useRef } from "react";
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
} from "lucide-react";
import { Subject, QuizQuestion } from "@/types";
import api from "@/lib/api";

interface QuizDialogProps {
  subject: Subject;
  onGenerated?: () => void;
}

export function QuizDialog({ subject, onGenerated }: QuizDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
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

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setSaved(false);

    try {
      const { data } = await api.post("/generate-quiz", {
        subject_id: subject.id,
        topic: topic || undefined,
        mcq_count: counts.mcq,
        short_count: counts.short,
        long_count: counts.long,
        fill_blanks_count: counts.fill_blanks
      });
      setQuestions(data.questions);
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
      await api.post("/save-quiz", {
        subject_id: subject.id,
        title: topic || "Practice Set",
        questions: questions
      });
      setSaved(true);
      onGenerated?.();
      setIsOpen(false);
      toast.success("Quiz saved successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save quiz.");
    } finally {
      setSaving(false);
    }
  };

  const updateCount = (key: keyof typeof counts, val: string) => {
    const n = parseInt(val) || 0;
    setCounts(prev => ({ ...prev, [key]: Math.min(Math.max(0, n), 20) }));
  };

  const totalQuestions = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setQuestions([]);
          setError("");
          setSaved(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2">
          <HelpCircle className="h-4 w-4" />
          Add Questions
        </Button>
      </DialogTrigger>
      <DialogContent className={`${questions.length > 0 ? "max-w-4xl h-[90vh]" : "max-w-md"} transition-all duration-300 rounded-3xl`}>
        <DialogHeader>
          <DialogTitle className="text-2xl font-black">Generate Questions</DialogTitle>
          <DialogDescription>
            Customize your assessment and generate questions from your materials.
          </DialogDescription>
        </DialogHeader>

        {questions.length === 0 ? (
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Topic (optional)</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Molecular Biology, Chapter 4..."
                className="rounded-xl h-11 bg-muted/50 border-none px-4"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">MCQ Questions</Label>
                <Input
                  type="number"
                  value={counts.mcq}
                  onChange={(e) => updateCount("mcq", e.target.value)}
                  className="rounded-xl h-11 bg-muted/50 border-none px-4"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Short Answer</Label>
                <Input
                  type="number"
                  value={counts.short}
                  onChange={(e) => updateCount("short", e.target.value)}
                  className="rounded-xl h-11 bg-muted/50 border-none px-4"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Long Answer</Label>
                <Input
                  type="number"
                  value={counts.long}
                  onChange={(e) => updateCount("long", e.target.value)}
                  className="rounded-xl h-11 bg-muted/50 border-none px-4"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fill in Blanks</Label>
                <Input
                  type="number"
                  value={counts.fill_blanks}
                  onChange={(e) => updateCount("fill_blanks", e.target.value)}
                  className="rounded-xl h-11 bg-muted/50 border-none px-4"
                />
              </div>
            </div>

            {error && <p className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-xl">{error}</p>}

            <Button
              onClick={handleGenerate}
              disabled={loading || totalQuestions === 0}
              className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20"
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
        ) : (
          <div className="flex flex-col h-full overflow-hidden mt-4 bg-muted/20 rounded-2xl border">
            <ScrollArea className="flex-1 p-6">
              <div className="space-y-8">
                {questions.map((q, idx) => (
                  <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="flex gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-[11px] font-black text-primary-foreground shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
                              {q.type || 'MCQ'}
                            </span>
                          </div>
                          <p className="text-lg font-bold leading-snug tracking-tight">
                            {q.question}
                          </p>
                        </div>

                        {q.options && q.options.length > 0 && (
                          <div className="grid grid-cols-2 gap-3">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`p-3 rounded-xl border text-sm flex items-center gap-2 transition-all ${opt === q.correct_answer
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 font-bold"
                                  : "bg-background/50 border-border text-muted-foreground font-medium"
                                  }`}
                              >
                                {opt === q.correct_answer && <CheckCircle2 className="h-3.5 w-3.5" />}
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                          <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Answer Key</p>
                          <p className="text-sm font-medium">{q.correct_answer}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="p-4 bg-background border-t flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setQuestions([]);
                  setSaved(false);
                }}
                className="flex-1 rounded-xl h-11 font-bold"
              >
                Start Over
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving || saved}
                className="flex-1 rounded-xl h-11 font-bold shadow-lg shadow-primary/20"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Questions
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
