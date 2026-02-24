"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CheckCircle2,
  Pencil,
  Save,
  Plus,
  Sparkles,
  Loader2,
  Trash2,
  X,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { QuizQuestion } from "@/types";
import api from "@/lib/api";

interface QuizViewerProps {
  open: boolean;
  onClose: () => void;
  quizId: string;
  subjectId: string;
  topic: string;
  initialQuestions: QuizQuestion[];
  onUpdated: () => void;
}

export function QuizViewerDialog({
  open,
  onClose,
  quizId,
  subjectId,
  topic,
  initialQuestions,
  onUpdated,
}: QuizViewerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(initialQuestions);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [marked, setMarked] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genCount, setGenCount] = useState("5");
  const [showGenInput, setShowGenInput] = useState(false);
  const [addingManual, setAddingManual] = useState(false);
  const [newQ, setNewQ] = useState({ question: "", a: "", b: "", c: "", d: "", correct: 0 });

  useEffect(() => {
    setQuestions(initialQuestions);
    setEditing(false);
    setShowGenInput(false);
    setAddingManual(false);
  }, [initialQuestions, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/update-quiz", {
        quiz_id: quizId,
        title: topic,
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
        })),
      });
      toast.success("Assessment updated successfully!");
      setEditing(false);
      onUpdated();
    } catch {
      toast.error("Failed to update questions.");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateMore = async () => {
    const count = parseInt(genCount) || 5;
    setGenerating(true);
    try {
      const { data } = await api.post("/generate-quiz", {
        subject_id: subjectId,
        topic: topic || undefined,
        num_questions: count,
      });
      setQuestions((prev) => [...prev, ...data.questions]);
      setShowGenInput(false);
      toast.success(`${data.questions.length} questions added!`);
    } catch {
      toast.error("Failed to generate questions.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddManual = () => {
    const opts = [newQ.a, newQ.b, newQ.c, newQ.d].filter(Boolean);
    if (!newQ.question || opts.length < 2) {
      toast.error("Enter a question and at least 2 options.");
      return;
    }
    const q: QuizQuestion = {
      question: newQ.question,
      options: opts.length === 4 ? opts : [...opts, ...Array(4 - opts.length).fill("")].filter(Boolean),
      correct_answer: opts[newQ.correct] || opts[0],
    };
    setQuestions((prev) => [...prev, q]);
    setNewQ({ question: "", a: "", b: "", c: "", d: "", correct: 0 });
    setAddingManual(false);
    toast.success("Question added!");
  };

  const handleDeleteQuestion = (idx: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateQuestion = (idx: number, field: string, value: string) => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== idx) return q;
        if (field === "question") return { ...q, question: value };
        if (field.startsWith("opt_")) {
          const optIdx = parseInt(field.split("_")[1]);
          const newOpts = [...(q.options || [])];
          newOpts[optIdx] = value;
          const newCorrect = q.correct_answer === (q.options?.[optIdx]) ? value : q.correct_answer;
          return { ...q, options: newOpts, correct_answer: newCorrect };
        }
        if (field === "correct") return { ...q, correct_answer: value };
        return q;
      })
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-w-6xl flex-col h-[90vh]">
        <DialogHeader>
          <DialogTitle>Questions — {topic}</DialogTitle>
          <DialogDescription>{questions.length} questions total</DialogDescription>
        </DialogHeader>

        {/* Toolbar */}
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2">
          <Button
            variant={editing ? "default" : "outline"}
            size="sm"
            onClick={() => setEditing(!editing)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {editing ? "Editing Mode" : "Edit Questions"}
          </Button>

          <Button
            variant={marked ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setMarked(!marked);
              toast.success(marked ? "Unmarked" : "Marked!");
            }}
          >
            {marked ? (
              <BookmarkCheck className="mr-1.5 h-3.5 w-3.5" />
            ) : (
              <Bookmark className="mr-1.5 h-3.5 w-3.5" />
            )}
            {marked ? "Marked" : "Mark"}
          </Button>

          <div className="mx-1 h-5 w-px bg-border" />

          {showGenInput ? (
            <div className="flex items-center gap-1.5">
              <Input
                type="number"
                min={1}
                max={20}
                value={genCount}
                onChange={(e) => setGenCount(e.target.value)}
                className="h-8 w-16 text-center"
              />
              <Button size="sm" onClick={handleGenerateMore} disabled={generating}>
                {generating ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                )}
                Generate
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowGenInput(false)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setShowGenInput(true)}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Generate More
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setAddingManual(!addingManual)}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Manually
          </Button>

          <div className="flex-1" />

          {editing && (
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              )}
              Save Changes
            </Button>
          )}
        </div>

        {/* Add manually form */}
        {addingManual && (
          <div className="space-y-3 rounded-lg border bg-card p-4">
            <p className="text-sm font-semibold">Add New Question</p>
            <Input
              placeholder="Question text..."
              value={newQ.question}
              onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              {["a", "b", "c", "d"].map((label, i) => (
                <div key={label} className="flex items-center gap-2">
                  <button
                    onClick={() => setNewQ({ ...newQ, correct: i })}
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${newQ.correct === i
                      ? "bg-green-500/20 text-green-500"
                      : "bg-muted text-muted-foreground"
                      }`}
                  >
                    {label}
                  </button>
                  <Input
                    placeholder={`Option ${label}`}
                    value={newQ[label as "a" | "b" | "c" | "d"]}
                    onChange={(e) =>
                      setNewQ({ ...newQ, [label]: e.target.value })
                    }
                    className="h-9"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Click a letter badge to mark it as the correct answer
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleAddManual}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add Question
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setAddingManual(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Questions list */}
        <ScrollArea className="flex-1">
          <div className="space-y-4 pr-4">
            {questions.map((q, qIdx) => (
              <div key={qIdx} className="relative rounded-lg border bg-card p-4">
                <div className="mb-3 flex items-start gap-2">
                  <span className="flex h-6 w-6 mt-1 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {qIdx + 1}
                  </span>
                  <div className="flex-1 flex items-start gap-2">
                    {editing ? (
                      <Input
                        value={q.question}
                        onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                        className="h-9 flex-1 text-sm font-medium"
                      />
                    ) : (
                      <p className="text-sm font-medium leading-relaxed flex-1 mt-0.5">
                        {q.question}
                      </p>
                    )}

                    {editing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(qIdx)}
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div className="ml-8 space-y-1.5">
                  {q.options?.slice(0, 4).map((opt, oIdx) => {
                    const isCorrect = q.correct_answer === opt;
                    const label = String.fromCharCode(97 + oIdx);
                    return (
                      <div
                        key={oIdx}
                        className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-sm ${isCorrect
                          ? "border-green-500/50 bg-green-500/10 text-green-500 dark:text-green-400"
                          : "border-border text-muted-foreground"
                          }`}
                      >
                        <button
                          onClick={() => editing && updateQuestion(qIdx, "correct", opt)}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${isCorrect
                            ? "bg-green-500/20 text-green-500"
                            : "bg-muted text-muted-foreground"
                            } ${editing ? "cursor-pointer hover:ring-2 hover:ring-primary/30" : ""}`}
                        >
                          {label}
                        </button>
                        {isCorrect && (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                        )}
                        {editing ? (
                          <Input
                            value={opt}
                            onChange={(e) =>
                              updateQuestion(qIdx, `opt_${oIdx}`, e.target.value)
                            }
                            className="h-7 flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
                          />
                        ) : (
                          <span>{opt}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
