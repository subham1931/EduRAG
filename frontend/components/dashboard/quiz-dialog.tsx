"use client";

import React, { useState } from "react";
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
import { HelpCircle, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Subject, QuizQuestion } from "@/types";
import api from "@/lib/api";

interface QuizDialogProps {
  subject: Subject;
}

export function QuizDialog({ subject }: QuizDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setQuestions([]);
    setSelectedAnswers({});
    setShowResults(false);

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

  const handleSelectAnswer = (qIdx: number, answer: string) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: answer }));
  };

  const handleCheckAnswers = () => {
    setShowResults(true);
  };

  const score = questions.reduce((acc, q, i) => {
    return acc + (selectedAnswers[i] === q.correct_answer ? 1 : 0);
  }, 0);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setQuestions([]);
          setSelectedAnswers({});
          setShowResults(false);
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <button className="flex w-full items-center gap-3 rounded-xl border bg-card p-3.5 text-left transition-all hover:shadow-md hover:shadow-primary/5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
            <HelpCircle className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-sm font-semibold">Generate Quiz</p>
            <p className="text-xs text-muted-foreground">
              Create MCQs from your materials
            </p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Quiz — {subject.name}</DialogTitle>
          <DialogDescription>
            Generate MCQ questions from your uploaded materials.
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
            {showResults && (
              <div className="rounded-lg bg-primary/10 p-3 text-center">
                <p className="text-lg font-bold">
                  Score: {score}/{questions.length}
                </p>
              </div>
            )}

            <ScrollArea className="h-[60vh]">
              <div className="space-y-6 pr-4">
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="space-y-2">
                    <p className="text-sm font-medium">
                      {qIdx + 1}. {q.question}
                    </p>
                    <div className="space-y-1">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = selectedAnswers[qIdx] === opt;
                        const isCorrect = q.correct_answer === opt;
                        let optionClass =
                          "flex items-center gap-2 rounded-md border px-3 py-2 text-sm cursor-pointer transition-colors ";

                        if (showResults) {
                          if (isCorrect) {
                            optionClass +=
                              "border-green-500 bg-green-500/10 text-green-400";
                          } else if (isSelected && !isCorrect) {
                            optionClass +=
                              "border-red-500 bg-red-500/10 text-red-400";
                          } else {
                            optionClass +=
                              "border-border text-muted-foreground";
                          }
                        } else {
                          optionClass += isSelected
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50";
                        }

                        return (
                          <div
                            key={oIdx}
                            className={optionClass}
                            onClick={() => handleSelectAnswer(qIdx, opt)}
                          >
                            {showResults && isCorrect && (
                              <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                            )}
                            {showResults && isSelected && !isCorrect && (
                              <XCircle className="h-4 w-4 shrink-0 text-red-500" />
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

            {!showResults && (
              <Button
                onClick={handleCheckAnswers}
                disabled={
                  Object.keys(selectedAnswers).length !== questions.length
                }
                className="w-full"
              >
                Check Answers
              </Button>
            )}

            {showResults && (
              <Button
                variant="outline"
                onClick={() => {
                  setQuestions([]);
                  setSelectedAnswers({});
                  setShowResults(false);
                }}
                className="w-full"
              >
                Generate New Quiz
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
