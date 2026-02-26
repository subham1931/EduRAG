"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
    GripVertical,
    ChevronLeft,
    ChevronRight,
    Search,
    Check,
    Bookmark,
    BookmarkCheck,
    HelpCircle,
    X,
    MoreVertical,
    Download,
    Copy,
    FileEdit,
} from "lucide-react";
import { Subject, QuizQuestion } from "@/types";
import api from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboard } from "@/lib/dashboard-context";

interface SortableQuestion extends QuizQuestion {
    id: string;
}

function SortableQuestionItem({
    q,
    qIdx,
    editing,
    updateQuestion,
    handleDeleteQuestion
}: {
    q: SortableQuestion,
    qIdx: number,
    editing: boolean,
    updateQuestion: (idx: number, field: string, value: string) => void,
    handleDeleteQuestion: (idx: number) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: q.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={{ ...style, animationDelay: `${qIdx * 50}ms` }}
            className="group/sortable relative"
        >
            {editing && (
                <div
                    {...attributes}
                    {...listeners}
                    className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 cursor-grab active:cursor-grabbing hover:bg-primary/5 rounded-xl transition-all hidden md:flex items-center justify-center no-pdf"
                >
                    <GripVertical className="h-6 w-6 text-muted-foreground/30" />
                </div>
            )}

            <div
                className={`flex flex-col gap-4 bg-card border border-border p-4 md:p-5 rounded-xl transition-colors ${isDragging ? "bg-muted/20 opacity-70 ring-1 ring-primary/30" : "hover:bg-muted/20"}`}
            >
                <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-[11px] font-semibold text-muted-foreground">
                            {qIdx + 1}
                        </span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                {editing ? (
                                    <Input
                                        value={q.question}
                                        onChange={(e) => updateQuestion(qIdx, "question", e.target.value)}
                                        className="h-auto py-1.5 w-full text-base font-bold border-none bg-muted/20 focus-visible:ring-primary/20 px-3 rounded-lg"
                                    />
                                ) : (
                                    <h3 className="text-base md:text-lg font-bold leading-snug pt-0.5">
                                        {q.question}
                                    </h3>
                                )}
                            </div>

                            {editing && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteQuestion(qIdx)}
                                    className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-full transition-all no-pdf"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* MCQ Rendering: Show if type is mcq/multiple_choice OR if type is missing but options exist */}
                            {((!q.type && q.options && q.options.length > 0) ||
                                q.type?.toLowerCase() === 'mcq' ||
                                q.type?.toLowerCase() === 'multiple_choice') &&
                                q.options && q.options.map((opt, oIdx) => {
                                    const isCorrect = q.correct_answer === opt;
                                    const label = String.fromCharCode(97 + oIdx);
                                    return (
                                        <div
                                            key={oIdx}
                                            className={`relative group/opt flex items-center gap-3 border p-3 transition-colors rounded-lg ${isCorrect
                                                ? "border-emerald-500/50"
                                                : "border-border"
                                                }`}
                                        >
                                            <button
                                                onClick={() => editing && updateQuestion(qIdx, "correct", opt)}
                                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-semibold uppercase transition-colors ${isCorrect
                                                    ? "border-emerald-500 text-emerald-600"
                                                    : "border-border text-muted-foreground"
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
                                                        className="h-6 flex-1 border-none bg-transparent p-0 text-xs shadow-none focus-visible:ring-0 font-medium"
                                                    />
                                                ) : (
                                                    <span className="text-xs md:text-sm">{opt}</span>
                                                )}
                                                {isCorrect && (
                                                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>

                        {/* Non-MCQ Rendering */}
                        {((q.type && q.type.toLowerCase() !== 'mcq' && q.type.toLowerCase() !== 'multiple_choice') ||
                            (!q.type && (!q.options || q.options.length === 0))) && (
                                <div className="p-4 rounded-lg border border-border">
                                    <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                                        {q.type?.toLowerCase() === 'fill_blanks' ? 'Fill in the Blanks' : q.type?.toLowerCase() === 'short' ? 'Short Answer' : 'Long Answer'}
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
        </div>
    );
}

export default function QuizDetailsPage() {
    const { subjectId, quizId } = useParams() as { subjectId: string; quizId: string };
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialEdit = searchParams.get("edit") === "true";
    const isNew = searchParams.get("new") === "true";

    const [quiz, setQuiz] = useState<any>(null);
    const [questions, setQuestions] = useState<SortableQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const { setQuizTitle } = useDashboard();
    const [editing, setEditing] = useState(initialEdit);
    const [saving, setSaving] = useState(false);
    const [marked, setMarked] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // New Add Dialog State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [addStep, setAddStep] = useState<"method" | "ai_config" | "manual_type">("method");
    const [addTopic, setAddTopic] = useState("");
    const [addStyle, setAddStyle] = useState("");
    const [addCounts, setAddCounts] = useState({
        mcq: 5,
        short: 0,
        long: 0,
        fill_blanks: 0
    });
    const [genError, setGenError] = useState("");
    const [isRenameOpen, setIsRenameOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [tempTitle, setTempTitle] = useState("");

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const fetchQuiz = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/quiz/${quizId}`);
            setQuiz(data);
            setQuizTitle(data.title);
            const qs = (data.questions || []).map((q: any, i: number) => ({
                ...q,
                id: q.id || `${Date.now()}-${i}-${Math.random()}`
            }));
            setQuestions(qs);
        } catch (err) {
            console.error("Failed to fetch assessment:", err);
            toast.error("Failed to load questions.");
        } finally {
            setLoading(false);
        }
    }, [quizId]);

    useEffect(() => {
        fetchQuiz();
        return () => setQuizTitle(null);
    }, [fetchQuiz, setQuizTitle]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put("/update-quiz", {
                quiz_id: quizId,
                title: quiz.title,
                questions: questions.map((q) => ({
                    type: q.type,
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

    const handleDeleteQuiz = async () => {
        try {
            await api.delete(`/quiz/${quizId}`);
            toast.success("Moved to Recycle Bin");
            router.push(`/dashboard/${subjectId}?tab=quizzes`);
        } catch (err) {
            toast.error("Failed to delete assessment");
        } finally {
            setIsDeleteOpen(false);
        }
    };

    const handleRename = async () => {
        if (!tempTitle.trim()) return;
        try {
            await api.put("/update-quiz", {
                quiz_id: quizId,
                title: tempTitle,
                questions: questions.map((q) => ({
                    type: q.type,
                    question: q.question,
                    options: q.options,
                    correct_answer: q.correct_answer,
                })),
            });
            setQuiz({ ...quiz, title: tempTitle });
            setQuizTitle(tempTitle);
            setIsRenameOpen(false);
            toast.success("Assessment renamed!");
        } catch {
            toast.error("Failed to rename");
        }
    };

    const handleGenerateMore = async () => {
        setGenerating(true);
        setGenError("");
        try {
            const { data } = await api.post("/generate-quiz", {
                subject_id: subjectId,
                topic: addTopic,
                instructions: addStyle || undefined,
                mcq_count: addCounts.mcq,
                short_count: addCounts.short,
                long_count: addCounts.long,
                fill_blanks_count: addCounts.fill_blanks
            });

            if (data.questions && data.questions.length > 0) {
                const mapped: SortableQuestion[] = data.questions.map((q: any, i: number) => ({
                    ...q,
                    id: `${Date.now()}-${questions.length + i}-${Math.random()}`
                }));
                setQuestions(prev => [...prev, ...mapped]);
                setIsAddOpen(false);
                setAddTopic("");
                setAddStyle("");
                toast.success(`${mapped.length} questions added! Review them in the editor.`);
            } else {
                setGenError("No questions returned. Try a broader topic.");
            }
        } catch (err: any) {
            setGenError(err.response?.data?.detail || "Failed to generate questions.");
        } finally {
            setGenerating(false);
        }
    };

    const handleAddManualStep = (type: string) => {
        const id = `${Date.now()}-${questions.length}-${Math.random()}`;
        let q: SortableQuestion;
        if (type === "mcq") {
            q = { id, type: "mcq", question: "New Multiple Choice Question", options: ["Option 1", "Option 2", "Option 3", "Option 4"], correct_answer: "Option 1" };
        } else if (type === "short") {
            q = { id, type: "short", question: "New Short Answer Question", correct_answer: "Answer" };
        } else if (type === "long") {
            q = { id, type: "long", question: "New Long Answer Question", correct_answer: "Rubric" };
        } else {
            q = { id, type: "fill_blanks", question: "Fill in the ____.", correct_answer: "blank" };
        }
        setQuestions(prev => [...prev, q]);
        setIsAddOpen(false);
        toast.success("Question template added!");
    };


    const updateAddCount = (key: keyof typeof addCounts, val: string) => {
        const n = parseInt(val, 10);
        if (!isNaN(n)) {
            setAddCounts(prev => ({ ...prev, [key]: Math.min(Math.max(0, n), 20) }));
        } else if (val === "") {
            setAddCounts(prev => ({ ...prev, [key]: 0 }));
        }
    };

    const totalToAdd = Object.values(addCounts).reduce((a, b) => a + b, 0);

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

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            setQuestions((items) => {
                const oldIndex = items.findIndex((item) => item.id === active.id);
                const newIndex = items.findIndex((item) => item.id === over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    };

    const handleExportPDF = async () => {
        const element = document.getElementById("quiz-paper-view");
        if (!element || !quiz) return;

        setIsExporting(true);
        const toastId = toast.loading("Generating High Quality PDF...");

        try {
            const canvas = await html2canvas(element, {
                scale: 3, // Higher scale for text clarity
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const paper = clonedDoc.getElementById("quiz-paper-view");
                    if (paper) {
                        paper.style.display = "block";
                        paper.style.width = "800px";
                        paper.style.padding = "60px";
                        paper.style.paddingBottom = "120px";
                        paper.style.height = "auto";
                    }
                }
            });

            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: "a4"
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pageMargin = 24;
            const usableWidth = pageWidth - pageMargin * 2;
            const usableHeight = pageHeight - pageMargin * 2;
            // Slice the full canvas into exact page-height chunks to avoid overlap/duplication.
            const scaleToPdf = usableWidth / canvas.width;
            const pageSliceHeightPx = Math.floor(usableHeight / scaleToPdf);
            let sourceY = 0;
            let pageIndex = 0;

            while (sourceY < canvas.height) {
                const sliceHeight = Math.min(pageSliceHeightPx, canvas.height - sourceY);
                const pageCanvas = document.createElement("canvas");
                pageCanvas.width = canvas.width;
                pageCanvas.height = sliceHeight;

                const pageCtx = pageCanvas.getContext("2d");
                if (!pageCtx) break;

                pageCtx.drawImage(
                    canvas,
                    0,
                    sourceY,
                    canvas.width,
                    sliceHeight,
                    0,
                    0,
                    canvas.width,
                    sliceHeight
                );

                const pageImgData = pageCanvas.toDataURL("image/png");
                const pageImgHeightInPdf = sliceHeight * scaleToPdf;

                if (pageIndex > 0) {
                    pdf.addPage();
                }

                pdf.addImage(
                    pageImgData,
                    "PNG",
                    pageMargin,
                    pageMargin,
                    usableWidth,
                    pageImgHeightInPdf
                );

                sourceY += sliceHeight;
                pageIndex += 1;
            }

            pdf.save(`${quiz.title.replace(/\s+/g, "_")}_Question_Paper.pdf`);
            toast.success("Professional PDF exported!", { id: toastId });
        } catch (error) {
            console.error("PDF Export Error:", error);
            toast.error("Failed to export PDF", { id: toastId });
        } finally {
            setIsExporting(false);
        }
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
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="flex h-16 shrink-0 items-center justify-between border-b bg-card/50 px-6 gap-4">
                <div className="flex items-center gap-4 min-w-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full h-9 w-9 -ml-2"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    {!editing ? (
                        <>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56 rounded-lg p-1 border bg-background/95 backdrop-blur-sm shadow-lg">
                                    <DropdownMenuItem onClick={() => setEditing(true)} className="rounded-xl py-2.5 cursor-pointer font-bold">
                                        <Pencil className="mr-2 h-4 w-4" />
                                        Edit Questions
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setTempTitle(quiz.title);
                                            setIsRenameOpen(true);
                                        }}
                                        className="rounded-xl py-2.5 cursor-pointer font-bold"
                                    >
                                        <FileEdit className="mr-2 h-4 w-4" />
                                        Rename Assessment
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => {
                                            setMarked(!marked);
                                            toast.success(marked ? "Unmarked" : "Marked!");
                                        }}
                                        className="rounded-xl py-2.5 cursor-pointer font-bold"
                                    >
                                        {marked ? (
                                            <>
                                                <BookmarkCheck className="mr-2 h-4 w-4 text-primary" />
                                                Bookmarked
                                            </>
                                        ) : (
                                            <>
                                                <Bookmark className="mr-2 h-4 w-4" />
                                                Bookmark
                                            </>
                                        )}
                                    </DropdownMenuItem>

                                    <div className="h-px bg-muted my-1 mx-1" />

                                    <DropdownMenuItem
                                        onClick={handleExportPDF}
                                        disabled={isExporting}
                                        className="rounded-xl py-2.5 cursor-pointer font-bold"
                                    >
                                        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                                        Export as PDF
                                    </DropdownMenuItem>

                                    <DropdownMenuItem className="rounded-xl py-2.5 font-bold opacity-50 cursor-not-allowed">
                                        <Copy className="mr-2 h-4 w-4" />
                                        Duplicate
                                    </DropdownMenuItem>

                                    <div className="h-px bg-muted my-1 mx-1" />

                                    <DropdownMenuItem
                                        onClick={() => setIsDeleteOpen(true)}
                                        className="rounded-xl py-2.5 cursor-pointer font-bold text-destructive hover:text-destructive hover:bg-destructive/5"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Assessment
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    ) : (
                        <>
                            {/* New Add Questions Dialog Trigger */}
                            <Button variant="outline" size="sm" onClick={() => {
                                setAddStep("method");
                                setIsAddOpen(true);
                            }} className="h-9 gap-2">
                                <Plus className="h-3.5 w-3.5" />
                                Add Questions
                            </Button>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setEditing(false);
                                    fetchQuiz(); // Revert any unsaved changes
                                }}
                                className="h-9 text-muted-foreground"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSave}
                                disabled={saving}
                                className="h-9 font-medium px-4"
                            >
                                {saving ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Save className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                {isNew ? "Save Question" : "Save Changes"}
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="w-full p-4 lg:p-6 space-y-6 pb-32" id="quiz-content">
                    {/* Paper View (Hidden in UI, only for PDF capture) */}
                    <div id="quiz-paper-view" style={{ display: "none" }} className="bg-white text-black p-12 pb-24 relative font-serif">
                        {/* Subtle Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none z-0">
                            <h1 className="text-[10rem] font-black -rotate-45 uppercase tracking-[0.2em]">EDURAG</h1>
                        </div>

                        <div className="relative z-10">
                            <div className="text-center mb-12 border-b-4 border-double border-black pb-6">
                                <h1 className="text-2xl font-bold uppercase tracking-[0.2em] mb-2 text-black">Question Bank</h1>
                                <h2 className="text-xl font-bold uppercase text-black/80">{quiz?.title}</h2>
                            </div>

                            <div className="space-y-10">
                                {questions.map((q, idx) => (
                                    <div key={q.id} className="text-[13px] text-black">
                                        <div className="flex gap-4 mb-4">
                                            <span className="font-bold min-w-[35px] text-sm">{idx + 1}.</span>
                                            <span className="font-medium leading-relaxed flex-1 text-sm">{q.question}</span>
                                        </div>
                                        {q.options && q.options.length > 0 && (
                                            <div className="pl-12 space-y-2 mt-2">
                                                {q.options.map((opt, oIdx) => (
                                                    <div key={oIdx} className="flex gap-4 items-start">
                                                        <span className="font-bold min-w-[15px]">{String.fromCharCode(97 + oIdx)})</span>
                                                        <span className="flex-1">{opt}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-24 pt-10 border-t border-black/10 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-black/20 italic">Generated by EduRAG Artificial Intelligence</p>
                            </div>
                        </div>
                    </div>


                    {/* Questions list */}
                    <div className="space-y-4">
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={questions.map(q => q.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {questions.map((q, qIdx) => (
                                    <SortableQuestionItem
                                        key={q.id}
                                        q={q}
                                        qIdx={qIdx}
                                        editing={editing}
                                        updateQuestion={updateQuestion}
                                        handleDeleteQuestion={handleDeleteQuestion}
                                    />
                                ))}
                            </SortableContext>
                        </DndContext>
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

            {/* Add Questions Modal */}
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogContent className={`${addStep === 'method' ? "max-w-xl" : "max-w-md"} flex max-h-[90vh] flex-col rounded-lg border p-0`}>
                    <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
                        <div className="flex items-center gap-2 mb-1">
                            {addStep !== "method" && (
                                <Button variant="ghost" size="icon" onClick={() => {
                                    if (addStep === "ai_config") setAddStep("method");
                                    else if (addStep === "manual_type") setAddStep("method");
                                }} className="h-8 w-8 -ml-1">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                            )}
                            <DialogTitle className="text-lg font-semibold">
                                {addStep === "method" && "Select Method"}
                                {addStep === "ai_config" && "AI Generator"}
                                {addStep === "manual_type" && "Question Type"}
                            </DialogTitle>
                        </div>
                        <DialogDescription className="text-sm text-muted-foreground">
                            {addStep === "method" && "How would you like to build this assessment?"}
                            {addStep === "ai_config" && "Extract intelligent questions from your subject materials."}
                            {addStep === "manual_type" && "Choose the format for your manual question."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 pb-6">
                        {addStep === "method" && (
                            <div className="grid grid-cols-2 gap-4 py-2">
                                <button
                                    onClick={() => setAddStep("ai_config")}
                                    className="flex flex-col gap-3 rounded-lg border bg-background p-4 text-left hover:bg-muted/30"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground">
                                        <Sparkles className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-medium">Generate by AI</h3>
                                        <p className="text-xs text-muted-foreground">Auto-extract questions from your uploaded documents.</p>
                                    </div>
                                </button>

                                <button
                                    onClick={() => setAddStep("manual_type")}
                                    className="flex flex-col gap-3 rounded-lg border bg-background p-4 text-left hover:bg-muted/30"
                                >
                                    <div className="flex h-9 w-9 items-center justify-center rounded-md border text-muted-foreground">
                                        <Pencil className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-base font-medium">Create Manually</h3>
                                        <p className="text-xs text-muted-foreground">Handcraft your own questions with full control.</p>
                                    </div>
                                </button>
                            </div>
                        )}

                        {addStep === "ai_config" && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wide flex items-center justify-between">
                                        Topic
                                        <span className="text-[10px] text-muted-foreground">required</span>
                                    </Label>
                                    <Input
                                        value={addTopic}
                                        onChange={(e) => setAddTopic(e.target.value)}
                                        placeholder="e.g. React Lifecycle or Photosynthesis"
                                        className="h-10 rounded-md border bg-background px-3"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground flex items-center justify-between">
                                        Context / Style
                                        <span className="text-[10px] text-muted-foreground">optional</span>
                                    </Label>
                                    <Input
                                        value={addStyle}
                                        onChange={(e) => setAddStyle(e.target.value)}
                                        placeholder="e.g. focusing on Hooks"
                                        className="h-10 rounded-md border bg-background px-3"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4 pt-2">
                                    {(['mcq', 'short', 'long', 'fill_blanks'] as const).map(key => (
                                        <div key={key} className="space-y-2">
                                            <Label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                                {key.replace('_', ' ')}
                                            </Label>
                                            <Input
                                                type="number"
                                                value={addCounts[key]}
                                                onChange={(e) => updateAddCount(key, e.target.value)}
                                                className="h-9 rounded-md border bg-background px-3 no-spinner"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {genError && <p className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">{genError}</p>}

                                <Button
                                    onClick={handleGenerateMore}
                                    disabled={generating || totalToAdd === 0 || !addTopic.trim()}
                                    className="mt-2 h-10 w-full"
                                >
                                    {generating ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating {totalToAdd} Questions...
                                        </>
                                    ) : (
                                        `Generate ${totalToAdd} Questions`
                                    )}
                                </Button>
                            </div>
                        )}

                        {addStep === "manual_type" && (
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { id: 'mcq', label: 'Multiple Choice' },
                                    { id: 'short', label: 'Short Answer' },
                                    { id: 'long', label: 'Long Answer' },
                                    { id: 'fill_blanks', label: 'Fill Blanks' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => handleAddManualStep(t.id)}
                                        className="rounded-lg border bg-background p-4 text-left text-sm font-medium hover:bg-muted/30"
                                    >
                                        {t.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Rename Dialog */}
            <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
                <DialogContent className="max-w-md rounded-lg p-6 border">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Rename Assessment</DialogTitle>
                        <DialogDescription>Enter a new name for this assessment.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Input
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            placeholder="Assessment Title"
                            className="h-11 rounded-md bg-muted/40 border px-3"
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                        />
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setIsRenameOpen(false)}>Cancel</Button>
                        <Button onClick={handleRename}>Save Name</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-md rounded-lg p-6 border">
                    <DialogHeader>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-xl font-semibold">Move to Recycle Bin?</DialogTitle>
                        <DialogDescription>
                            This assessment will be moved to the recycle bin. You can restore it later if needed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button onClick={handleDeleteQuiz} variant="destructive">Move to Bin</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

