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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [error, setError] = useState("");

  const dragIdx = useRef<number | null>(null);
  const dragOverIdx = useRef<number | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setSaved(false);

    try {
      const { data } = await api.post("/generate-quiz", {
        subject_id: subject.id,
        topic: topic || undefined,
        num_questions: 10,
      });
      setQuestions(data.questions);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to generate quiz. Try again."
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
        title: topic || "General",
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
        })),
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

  const handleDragStart = (idx: number) => {
    dragIdx.current = idx;
  };

  const handleDragEnter = (idx: number) => {
    dragOverIdx.current = idx;
  };

  const handleDragEnd = () => {
    if (dragIdx.current === null || dragOverIdx.current === null) return;
    if (dragIdx.current === dragOverIdx.current) {
      dragIdx.current = null;
      dragOverIdx.current = null;
      return;
    }

    const reordered = [...questions];
    const [removed] = reordered.splice(dragIdx.current, 1);
    reordered.splice(dragOverIdx.current, 0, removed);
    setQuestions(reordered);
    setSaved(false);

    dragIdx.current = null;
    dragOverIdx.current = null;
  };

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
        <Button variant="outline" size="sm">
          <HelpCircle className="mr-2 h-4 w-4" />
          Generate Quiz
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh]">
        <DialogHeader>
          <DialogTitle>Quiz — {subject.name}</DialogTitle>
          <DialogDescription>
            Generate MCQ questions from your uploaded materials. Drag to
            reorder questions.
          </DialogDescription>
        </DialogHeader>

        {questions.length === 0 ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Topic (optional)</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quantum mechanics, Chapter 3..."
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating quiz...
                </>
              ) : (
                "Generate 10 Questions"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <ScrollArea className="flex-1">
              <div className="space-y-4 pr-4">
                {questions.map((q, qIdx) => (
                  <div
                    key={qIdx}
                    draggable
                    onDragStart={() => handleDragStart(qIdx)}
                    onDragEnter={() => handleDragEnter(qIdx)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    className="group rounded-lg border bg-card p-4 transition-shadow hover:shadow-md"
                  >
                    <div className="mb-3 flex items-start gap-2">
                      <div className="flex cursor-grab items-center pt-0.5 text-muted-foreground/40 active:cursor-grabbing group-hover:text-muted-foreground">
                        <GripVertical className="h-4 w-4" />
                      </div>
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

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQuestions([]);
                  setSaved(false);
                }}
                className="flex-1"
              >
                Generate New Quiz
              </Button>

              <Button
                variant={saved ? "secondary" : "default"}
                onClick={handleSave}
                disabled={saving || saved}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saved ? "Saved" : "Save Quiz"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
