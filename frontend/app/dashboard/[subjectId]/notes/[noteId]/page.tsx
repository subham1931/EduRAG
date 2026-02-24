"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
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
} from "lucide-react";
import api from "@/lib/api";

export default function NoteDetailsPage() {
    const { subjectId, noteId } = useParams() as { subjectId: string; noteId: string };
    const router = useRouter();

    const [note, setNote] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

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

    const handleCopy = () => {
        if (!note?.content) return;
        navigator.clipboard.writeText(note.content);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
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
                    >
                        <Download className="h-3.5 w-3.5" />
                    </Button>

                    <Button
                        size="sm"
                        className="rounded-xl h-9 font-bold px-4"
                    >
                        <Share2 className="mr-1.5 h-3.5 w-3.5" />
                        Share
                    </Button>
                </div>
            </div>

            <ScrollArea className="flex-1">
                <div className="max-w-4xl mx-auto p-8 lg:p-12 pb-32">
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
        </div>
    );
}
