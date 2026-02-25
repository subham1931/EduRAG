"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Loader2,
    ChevronLeft,
    FileText,
    Clock,
    Sparkles,
    Share2,
    Download,
    Printer,
    Copy,
    Check,
    MoreVertical,
    Trash2,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NoteDetailsPage() {
    const { subjectId, noteId } = useParams() as { subjectId: string; noteId: string };
    const router = useRouter();

    const [note, setNote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const fetchNote = useCallback(async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/note/${noteId}`);
            setNote(data);
        } catch (err) {
            console.error("Failed to fetch note:", err);
            toast.error("Failed to load study note.");
        } finally {
            setLoading(false);
        }
    }, [noteId]);

    useEffect(() => {
        fetchNote();
    }, [fetchNote]);

    const handleDeleteNote = async () => {
        setIsDeleting(true);
        try {
            await api.delete(`/note/${noteId}`);
            toast.success("Moved to Recycle Bin");
            router.push(`/dashboard/${subjectId}?tab=notes`);
        } catch (err) {
            toast.error("Failed to delete note");
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    };

    const handleCopy = () => {
        if (!note?.content) return;
        navigator.clipboard.writeText(note.content);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleExportPDF = async () => {
        const element = document.getElementById("note-paper-view");
        if (!element || !note) return;

        setIsExporting(true);
        const toastId = toast.loading("Generating High Quality PDF...");

        try {
            const canvas = await html2canvas(element, {
                scale: 3, // Higher scale for text clarity
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                onclone: (clonedDoc) => {
                    const paper = clonedDoc.getElementById("note-paper-view");
                    if (paper) {
                        paper.style.display = "block";
                        paper.style.width = "800px";
                        paper.style.padding = "60px";
                        paper.style.height = "auto";
                    }
                }
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({
                orientation: "portrait",
                unit: "px",
                format: "a4"
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            // Handle multi-page if content is long
            let heightLeft = pdfHeight;
            let position = 0;
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - pdfHeight;
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${note.title.replace(/\s+/g, "_")}_Study_Notes.pdf`);
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

    if (!note) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center space-y-4">
                <p className="text-muted-foreground font-medium">Study note not found.</p>
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
                        <h1 className="text-lg font-bold truncate">{note.title}</h1>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(note.created_at).toLocaleDateString()}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3" />
                                AI Generated
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopy}
                        className="rounded-xl h-9"
                    >
                        {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Copy Content"}
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-9 w-9"
                        onClick={() => window.print()}
                    >
                        <Printer className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-9 w-9"
                        onClick={handleExportPDF}
                        disabled={isExporting}
                    >
                        {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    </Button>

                    <Button
                        size="sm"
                        className="rounded-xl h-9 font-bold px-4"
                    >
                        <Share2 className="mr-1.5 h-3.5 w-3.5" />
                        Share
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                                <MoreVertical className="h-5 w-5 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-2xl p-2 shadow-2xl border-none">
                            <DropdownMenuItem
                                onClick={() => setIsDeleteOpen(true)}
                                className="rounded-xl py-2.5 cursor-pointer font-bold text-destructive hover:text-destructive hover:bg-destructive/5"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Note
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto p-8 lg:p-12 pb-32" id="note-content">
                    {/* Paper View (Hidden in UI, only for PDF capture) */}
                    <div id="note-paper-view" style={{ display: "none" }} className="bg-white text-black p-12 relative font-serif">
                        {/* Subtle Watermark */}
                        <div className="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none select-none z-0">
                            <h1 className="text-[10rem] font-black -rotate-45 uppercase tracking-[0.2em]">EDURAG</h1>
                        </div>

                        <div className="relative z-10">
                            <div className="text-center mb-12 border-b-4 border-double border-black pb-6">
                                <h1 className="text-2xl font-bold uppercase tracking-[0.2em] mb-2 text-black">Study Document</h1>
                                <h2 className="text-xl font-bold uppercase text-black/80">{note?.title}</h2>
                                <div className="flex justify-center mt-4 text-xs font-bold border-t border-black/20 pt-4">
                                    <span>Date: {new Date().toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="prose prose-sm max-w-none text-black leading-relaxed">
                                <ReactMarkdown>{note?.content}</ReactMarkdown>
                            </div>

                            <div className="mt-24 pt-10 border-t border-black/10 text-center">
                                <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-black/20 italic">Generated by EduRAG Artificial Intelligence</p>
                            </div>
                        </div>
                    </div>

                    {/* Note Metadata Banner */}
                    <div className="mb-12 p-8 rounded-3xl bg-primary/5 border border-primary/10 flex items-center gap-6">
                        <div className="h-16 w-16 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <FileText className="h-8 w-8" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight mb-2">{note.title}</h2>
                            <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed max-w-2xl">
                                This summary was automatically extracted and organized from your study materials for this subject.
                                Use it for quick review and preparation.
                            </p>
                        </div>
                    </div>

                    {/* Content with Prose styling */}
                    <div className="prose dark:prose-invert max-w-none 
                prose-h1:text-4xl prose-h1:font-black prose-h1:tracking-tight prose-h1:mb-8
                prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-primary prose-h2:tracking-tight
                prose-h3:text-xl prose-h3:font-bold prose-h3:mt-8 prose-h3:mb-4
                prose-p:text-lg prose-p:leading-relaxed prose-p:text-muted-foreground/90 
                prose-ol:space-y-4 prose-ul:space-y-3 prose-li:text-lg prose-li:leading-relaxed
                prose-strong:text-foreground prose-strong:font-bold
                prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-primary/5 prose-blockquote:py-2 prose-blockquote:px-6 prose-blockquote:rounded-r-xl prose-blockquote:text-lg prose-blockquote:italic
                prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:font-mono prose-code:text-sm prose-code:before:content-none prose-code:after:content-none
                prose-pre:bg-zinc-950 prose-pre:p-6 prose-pre:rounded-2xl prose-pre:border prose-pre:border-white/5
                prose-hr:border-border/60 prose-hr:my-12
            ">
                        <ReactMarkdown>{note.content || ""}</ReactMarkdown>
                    </div>
                </div>
            </ScrollArea>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <DialogContent className="max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-2xl font-black">Move to Recycle Bin?</DialogTitle>
                        <DialogDescription>
                            This study note will be moved to the recycle bin. You can restore it later if needed.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" onClick={() => setIsDeleteOpen(false)} className="rounded-xl font-bold">Cancel</Button>
                        <Button onClick={handleDeleteNote} variant="destructive" disabled={isDeleting} className="rounded-xl font-bold px-8">Move to Bin</Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
