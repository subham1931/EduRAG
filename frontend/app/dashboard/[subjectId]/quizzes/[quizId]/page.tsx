"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    CheckCircle2,
    Pencil,
    Save,
    Plus,
    Sparkles,
    Loader2,
    Trash2,
    ChevronLeft,
    Bookmark,
    BookmarkCheck,
    HelpCircle,
    X,
} from "lucide-react";
import { QuizQuestion } from "@/types";
import api from "@/lib/api";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function QuizDetailsPage() {
    const { subjectId, quizId } = useParams() as { subjectId: string; quizId: string };
    const router = useRouter();

    const [quiz, setQuiz] = useState<any>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [marked, setMarked] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [genCount, setGenCount] = useState("5");
    const [showGenInput, setShowGenInput] = useState(false);
    const [addingManual, setAddingManual] = useState(false);
    const [newQ, setNewQ] = useState<{ question: string; options: string[]; correct: number }>({
        question: "",
        options: ["", "", "", ""],
        correct: 0
    });

    const fetchQuiz = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/quiz/${quizId}`);
            setQuiz(data);
            setQuestions(data.questions || []);
        } catch (err) {
            console.error("Failed to fetch assessment:", err);
            toast.error("Failed to load questions.");
        } finally {
            setLoading(false);
        }
    }, [quizId]);

    useEffect(() => {
        fetchQuiz();
    }, [fetchQuiz]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put("/update-quiz", {
                quiz_id: quizId,
                title: quiz.title,
                questions: questions.map((q) => ({
                    question: q.question,
                    options: q.options,
                    correct_answer: q.correct_answer,
                })),
            });
            toast.success("Assessment updated successfully!");
            setEditing(false);
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
                topic: quiz.title || undefined,
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
        const opts = newQ.options.filter(opt => opt.trim() !== "");
        if (!newQ.question || opts.length < 4) {
            toast.error("Enter a question and at least 4 options.");
            return;
        }
        const q: QuizQuestion = {
            type: "mcq",
            question: newQ.question,
            options: opts,
            correct_answer: opts[newQ.correct] || opts[0],
        };
        setQuestions((prev) => [...prev, q]);
        setNewQ({ question: "", options: ["", "", "", ""], correct: 0 });
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
                    const oldOptValue = q.options?.[optIdx];
                    const newCorrect = q.correct_answer === oldOptValue ? value : q.correct_answer;
                    return { ...q, options: newOpts, correct_answer: newCorrect };
                }
                if (field === "correct") return { ...q, correct_answer: value };
                return q;
            })
        );
    };

    if (loading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4">
                <p className="text-muted-foreground font-medium">Quiz not found.</p>
                <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b bg-card/50 px-6 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full h-9 w-9"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div className="min-w-0">
                        <h1 className="text-lg font-bold truncate">{quiz.title}</h1>
                        <p className="text-xs text-muted-foreground font-medium">{questions.length} Questions</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Dynamic add questions section */}
                    <div className="flex items-center gap-2 mr-2">
                        {showGenInput ? (
                            <div className="flex items-center gap-1.5 animate-in slide-in-from-right-2">
                                <Input
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={genCount}
                                    onChange={(e) => setGenCount(e.target.value)}
                                    className="h-9 w-16 text-center rounded-xl bg-muted/50"
                                />
                                <Button size="sm" onClick={handleGenerateMore} disabled={generating} className="rounded-xl h-9">
                                    {generating ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-1.5 h-3.5 w-3.5" />}
                                    Generate
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setShowGenInput(false)} className="rounded-xl h-9 w-9 p-0">
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        ) : (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="rounded-xl h-9 gap-2">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add Questions
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                                    <DropdownMenuItem onClick={() => setShowGenInput(true)} className="rounded-lg py-2 cursor-pointer">
                                        <Sparkles className="mr-2 h-4 w-4 text-primary" />
                                        <div className="flex flex-col">
                                            <span className="font-bold">Generate with AI</span>
                                            <span className="text-[10px] text-muted-foreground">Extract from documents</span>
                                        </div>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => setAddingManual(true)} className="rounded-lg py-2 cursor-pointer">
                                        <Pencil className="mr-2 h-4 w-4 text-orange-500" />
                                        <div className="flex flex-col">
                                            <span className="font-bold">Add Manually</span>
                                            <span className="text-[10px] text-muted-foreground">Type your own question</span>
                                        </div>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>

                    <div className="h-6 w-px bg-border mx-1" />

                    <Button
                        variant={editing ? "default" : "outline"}
                        size="sm"
                        onClick={() => setEditing(!editing)}
                        className="rounded-xl h-9"
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
                        className="rounded-xl h-9"
                    >
                        {marked ? (
                            <BookmarkCheck className="mr-1.5 h-3.5 w-3.5 text-primary" />
                        ) : (
                            <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                        )}
                        {marked ? "Bookmarked" : "Bookmark"}
                    </Button>

                    {editing && (
                        <Button size="sm" onClick={handleSave} disabled={saving} className="rounded-xl h-9 shadow-lg shadow-primary/20">
                            {saving ? (
                                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Save className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            Save Changes
                        </Button>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto p-6 lg:p-10 space-y-10 pb-32">

                    {/* Add manually form */}
                    {addingManual && (
                        <div className="space-y-4 rounded-3xl border border-primary/20 bg-primary/5 p-6 animate-in zoom-in-95 duration-300">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-black uppercase tracking-widest text-primary">New Question</p>
                                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                    <HelpCircle className="h-3.5 w-3.5" />
                                    MANUAL ENTRY
                                </div>
                            </div>

                            <Input
                                placeholder="Type your question here..."
                                value={newQ.question}
                                onChange={(e) => setNewQ({ ...newQ, question: e.target.value })}
                                className="h-12 text-base font-medium rounded-xl border-primary/10 bg-background"
                            />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {newQ.options.map((opt, i) => (
                                    <div key={i} className="relative group">
                                        <button
                                            onClick={() => setNewQ({ ...newQ, correct: i })}
                                            className={`absolute left-3 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black uppercase transition-all shadow-sm ${newQ.correct === i
                                                ? "bg-emerald-500 text-white shadow-emerald-500/20"
                                                : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/20"
                                                }`}
                                        >
                                            {String.fromCharCode(97 + i)}
                                        </button>
                                        <Input
                                            placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                            value={opt}
                                            onChange={(e) => {
                                                const newOpts = [...newQ.options];
                                                newOpts[i] = e.target.value;
                                                setNewQ({ ...newQ, options: newOpts });
                                            }}
                                            className={`h-11 pl-12 rounded-xl transition-all ${newQ.correct === i ? "border-emerald-500/50 bg-emerald-500/5" : "bg-background"}`}
                                        />
                                        {newQ.options.length > 4 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    const newOpts = newQ.options.filter((_, idx) => idx !== i);
                                                    setNewQ({ ...newQ, options: newOpts, correct: newQ.correct >= newOpts.length ? 0 : newQ.correct });
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                ))}
                                <Button
                                    variant="outline"
                                    onClick={() => setNewQ({ ...newQ, options: [...newQ.options, ""] })}
                                    className="h-11 rounded-xl border-dashed border-primary/20 bg-primary/2 text-primary font-bold gap-2"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add Option
                                </Button>
                            </div>

                            <div className="flex items-center justify-between pt-2">
                                <p className="text-[10px] font-bold text-muted-foreground/60 italic">
                                    Tip: Select the highlighted letter to mark the correct answer.
                                </p>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => setAddingManual(false)} className="rounded-xl h-9 font-bold px-4">
                                        Cancel
                                    </Button>
                                    <Button size="sm" onClick={handleAddManual} className="rounded-xl h-9 font-bold px-6">
                                        Add to Quiz
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Questions list */}
                    <div className="space-y-12">
                        {questions.map((q, qIdx) => (
                            <div key={qIdx} className="group relative flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${qIdx * 50}ms` }}>
                                <div className="flex items-start gap-5">
                                    <div className="flex flex-col items-center gap-4">
                                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">
                                            {qIdx + 1}
                                        </span>
                                        <div className="w-[2px] flex-1 bg-gradient-to-b from-primary/20 via-primary/5 to-transparent rounded-full" />
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-6">
                                        <div className="flex items-start justify-between gap-4">
                                            {editing ? (
                                                <Input
                                                    value={q.question}
                                                    onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                                                    className="h-auto py-2 flex-1 text-lg font-bold border-none bg-muted/20 focus-visible:ring-primary/20 px-4 rounded-xl"
                                                />
                                            ) : (
                                                <h3 className="text-xl md:text-2xl font-bold leading-tight pt-1">
                                                    {q.question}
                                                </h3>
                                            )}

                                            {editing && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteQuestion(qIdx)}
                                                    className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full transition-all"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {q.type === 'mcq' && q.options && q.options.map((opt, oIdx) => {
                                                const isCorrect = q.correct_answer === opt;
                                                const label = String.fromCharCode(97 + oIdx);
                                                return (
                                                    <div
                                                        key={oIdx}
                                                        className={`relative group/opt flex items-center gap-4 border p-4 transition-all rounded-3xl ${isCorrect
                                                            ? "border-emerald-500/50 bg-emerald-500/5 shadow-sm"
                                                            : "border-border bg-card hover:bg-muted/5 font-medium"
                                                            }`}
                                                    >
                                                        <button
                                                            onClick={() => editing && updateQuestion(qIdx, "correct", opt)}
                                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black uppercase transition-all ${isCorrect
                                                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                                                                : "bg-muted text-muted-foreground group-hover/opt:bg-muted-foreground group-hover/opt:text-white"
                                                                } ${editing ? "cursor-pointer" : "cursor-default"}`}
                                                        >
                                                            {label}
                                                        </button>

                                                        <div className="flex-1 min-w-0 flex items-center gap-2">
                                                            {editing ? (
                                                                <Input
                                                                    value={opt}
                                                                    onChange={(e) =>
                                                                        updateQuestion(qIdx, `opt_${oIdx}`, e.target.value)
                                                                    }
                                                                    className="h-8 flex-1 border-none bg-transparent p-0 text-sm shadow-none focus-visible:ring-0 font-medium"
                                                                />
                                                            ) : (
                                                                <span className="text-sm md:text-base">{opt}</span>
                                                            )}
                                                            {isCorrect && (
                                                                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 animate-in zoom-in-50 duration-300" />
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {q.type !== 'mcq' && (
                                            <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                                                    {q.type === 'fill_blanks' ? 'Fill in the Blanks' : q.type === 'short' ? 'Short Answer' : 'Long Answer'}
                                                </p>
                                                {editing ? (
                                                    <Input
                                                        value={q.correct_answer}
                                                        onChange={(e) => updateQuestion(qIdx, "correct", e.target.value)}
                                                        className="h-auto py-2.5 w-full text-sm font-medium bg-background border-none px-4 rounded-xl"
                                                        placeholder="Sample Answer / Key"
                                                    />
                                                ) : (
                                                    <p className="text-sm font-medium text-foreground/80">
                                                        <span className="text-emerald-500 font-bold mr-2 text-[10px] uppercase">Answer Key:</span>
                                                        {q.correct_answer}
                                                    </p>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {questions.length === 0 && (
                        <div className="py-20 flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-muted">
                                <HelpCircle className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <div className="space-y-1">
                                <p className="font-bold text-lg text-muted-foreground">No questions found</p>
                                <p className="text-sm text-muted-foreground/60">Generate or add questions to build your quiz.</p>
                            </div>
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}

