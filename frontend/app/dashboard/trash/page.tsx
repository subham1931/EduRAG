"use client";

import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, Trash, Loader2, ChevronLeft, FileText, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface DeletedItem {
    id: string;
    title: string;
    type: "quiz" | "note";
    subject_name: string;
    deleted_at: string;
    subjects?: { name: string };
}

export default function TrashPage() {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "quiz" | "note" } | null>(null);
    const router = useRouter();
    const searchParams = useSearchParams();
    const subjectId = searchParams.get("subjectId");

    const fetchTrash = async () => {
        setLoading(true);
        try {
            const params = subjectId ? { subject_id: subjectId } : {};
            const [qRes, nRes] = await Promise.all([
                api.get("/deleted/quizzes", { params }),
                api.get("/deleted/notes", { params })
            ]);
            setQuizzes(qRes.data);
            setNotes(nRes.data);
        } catch (err) {
            toast.error("Failed to load recycle bin");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTrash();
    }, [subjectId]);

    const handleRestore = async (id: string, type: "quiz" | "note") => {
        setIsRestoring(true);
        try {
            const endpoint = type === "quiz" ? `/quiz/${id}/restore` : `/note/${id}/restore`;
            await api.post(endpoint);
            toast.success("Item restored!");
            fetchTrash();
        } catch (err) {
            toast.error("Failed to restore item");
        } finally {
            setIsRestoring(false);
        }
    };

    const handlePermanentDelete = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            const endpoint = itemToDelete.type === "quiz" ? `/quiz/${itemToDelete.id}?permanent=true` : `/note/${itemToDelete.id}?permanent=true`;
            await api.delete(endpoint);
            toast.success("Item deleted permanently");
            setItemToDelete(null);
            fetchTrash();
        } catch (err) {
            toast.error("Failed to delete item");
        } finally {
            setIsDeleting(false);
        }
    };

    const allItems: DeletedItem[] = [
        ...quizzes.map(q => ({
            id: q.id,
            title: q.title,
            type: "quiz" as const,
            subject_name: q.subjects?.name || "Unknown",
            deleted_at: q.created_at
        })),
        ...notes.map(n => ({
            id: n.id,
            title: n.title,
            type: "note" as const,
            subject_name: n.subjects?.name || "Unknown",
            deleted_at: n.created_at
        }))
    ];

    return (
        <div className="flex-1 flex flex-col h-full bg-background overflow-hidden animate-in fade-in duration-500">
            <div className="flex h-16 shrink-0 items-center justify-between border-b bg-card/50 px-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-black">Recycle Bin</h1>
                        <p className="text-xs text-muted-foreground font-medium">Manage deleted assessments and notes</p>
                    </div>
                </div>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : allItems.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center">
                                <Trash2 className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Your recycle bin is empty</h2>
                                <p className="text-sm text-muted-foreground">Items you delete will appear here for 30 days.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {allItems.map((item) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className={cn(
                                        "p-5 rounded-[2rem] border bg-card/50 hover:bg-card transition-all duration-500 flex flex-col group relative overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30",
                                        item.type === "quiz" ? "hover:shadow-primary/5" : "hover:shadow-orange-500/5 hover:border-orange-500/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <div className={cn(
                                            "p-2.5 rounded-xl shadow-sm transition-all duration-500",
                                            item.type === "quiz" ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground" : "bg-orange-500/10 text-orange-500 group-hover:bg-orange-500 group-hover:text-white"
                                        )}>
                                            {item.type === "quiz" ? <HelpCircle className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">
                                            {new Date(item.deleted_at).toLocaleDateString()}
                                        </span>
                                    </div>

                                    <div className="relative z-10 flex-1 mb-6">
                                        <h3 className="text-lg font-black mb-1.5 tracking-tight group-hover:text-primary transition-colors duration-300 line-clamp-2">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest",
                                                item.type === "quiz" ? "bg-primary/5 text-primary" : "bg-orange-500/5 text-orange-500"
                                            )}>
                                                {item.type}
                                            </span>
                                            <span className="h-1 w-1 rounded-full bg-border" />
                                            <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider line-clamp-1">
                                                {item.subject_name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border/50 relative z-10">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRestore(item.id, item.type)}
                                            disabled={isRestoring}
                                            className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-wider h-10 hover:bg-primary/5 hover:text-primary transition-all"
                                        >
                                            <RotateCcw className="mr-2 h-3.5 w-3.5" />
                                            Restore
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setItemToDelete({ id: item.id, type: item.type })}
                                            disabled={isDeleting}
                                            className="h-10 w-10 p-0 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
                                            title="Delete Permanently"
                                        >
                                            <Trash className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    {/* Visual accent */}
                                    <div className={cn(
                                        "absolute -bottom-4 -right-4 h-24 w-24 opacity-0 group-hover:opacity-[0.03] transition-all duration-700 rotate-12 group-hover:rotate-0 pointer-events-none",
                                        item.type === "quiz" ? "text-primary" : "text-orange-500"
                                    )}>
                                        {item.type === "quiz" ? <HelpCircle className="h-full w-full" /> : <FileText className="h-full w-full" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Permanent Delete Confirmation Dialog */}
            <Dialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
                <DialogContent className="max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-destructive">Delete Permanently?</DialogTitle>
                        <DialogDescription className="text-base font-medium">
                            This action cannot be undone. This item will be removed from our servers forever.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" onClick={() => setItemToDelete(null)} className="rounded-xl font-black">Keep Item</Button>
                        <Button onClick={handlePermanentDelete} variant="destructive" disabled={isDeleting} className="rounded-xl font-black px-8 h-12">
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete Forever
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
