"use client";

import React, { useState, useEffect } from "react";
import { Trash2, RotateCcw, Trash, Loader2, LayoutGrid, List, Search } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
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
import { MoreVertical } from "lucide-react";

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
    const [isDeletingAll, setIsDeletingAll] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: "quiz" | "note" } | null>(null);
    const [isDeleteAllOpen, setIsDeleteAllOpen] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
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

    const handleDeleteAll = async () => {
        if (allItems.length === 0) return;
        setIsDeletingAll(true);
        try {
            await Promise.all(
                allItems.map((item) => {
                    const endpoint =
                        item.type === "quiz"
                            ? `/quiz/${item.id}?permanent=true`
                            : `/note/${item.id}?permanent=true`;
                    return api.delete(endpoint);
                })
            );
            toast.success("All items deleted permanently.");
            setIsDeleteAllOpen(false);
            fetchTrash();
        } catch (err) {
            toast.error("Failed to delete all items.");
        } finally {
            setIsDeletingAll(false);
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
    const filteredItems = allItems.filter((item) => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return true;
        return (
            item.title.toLowerCase().includes(q) ||
            item.subject_name.toLowerCase().includes(q) ||
            item.type.toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex-1 p-8 space-y-6 overflow-auto animate-in fade-in duration-500">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Recycle Bin</h2>
                        <p className="text-sm text-muted-foreground mt-1">
                            Manage deleted assessments and notes.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setIsDeleteAllOpen(true)}
                        disabled={loading || allItems.length === 0 || isDeletingAll}
                        className="h-9 self-start"
                    >
                        {isDeletingAll ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                        Delete All
                    </Button>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search deleted items..."
                            className="h-10 pl-9"
                        />
                    </div>
                    <div className="flex items-center rounded-md border bg-card p-1">
                        <button
                            type="button"
                            onClick={() => setViewMode("list")}
                            aria-label="List view"
                            className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${
                                viewMode === "list"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode("grid")}
                            aria-label="Grid view"
                            className={`flex h-7 w-7 items-center justify-center rounded-sm transition-colors ${
                                viewMode === "grid"
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:bg-muted"
                                }`}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className={viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4 grid-cols-1"}>
                    {loading ? (
                        <div className="col-span-full flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : allItems.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center">
                                <Trash2 className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Your recycle bin is empty</h2>
                                <p className="text-sm text-muted-foreground">Items you delete will appear here for 30 days.</p>
                            </div>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                            <div className="h-20 w-20 rounded-3xl bg-muted/30 flex items-center justify-center">
                                <Search className="h-10 w-10 text-muted-foreground/30" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">No matching deleted items</h2>
                                <p className="text-sm text-muted-foreground">Try a different search keyword.</p>
                            </div>
                        </div>
                    ) : (
                            filteredItems.map((item) => (
                                <div
                                    key={`${item.type}-${item.id}`}
                                    className={cn(
                                        "group flex h-full flex-col rounded-2xl border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                                        item.type === "quiz" ? "hover:border-primary/40" : "hover:border-orange-500/40"
                                    )}
                                >
                                    <div className="mb-4 flex items-center justify-between">
                                        <span className={cn(
                                            "rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                                            item.type === "quiz"
                                                ? "bg-muted/30 text-muted-foreground"
                                                : "bg-orange-500/5 text-orange-500 border-orange-200 dark:border-orange-900/40"
                                        )}>
                                            {item.type === "quiz" ? "Quiz" : "Note"}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-semibold text-muted-foreground/70">
                                                {new Date(item.deleted_at).toLocaleDateString()}
                                            </span>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onSelect={(e) => {
                                                            e.preventDefault();
                                                            handleRestore(item.id, item.type);
                                                        }}
                                                        disabled={isRestoring}
                                                    >
                                                        <RotateCcw className="mr-2 h-4 w-4" />
                                                        Restore
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onSelect={(e) => {
                                                            e.preventDefault();
                                                            setItemToDelete({ id: item.id, type: item.type });
                                                        }}
                                                        disabled={isDeleting}
                                                        className="text-destructive focus:text-destructive"
                                                    >
                                                        <Trash className="mr-2 h-4 w-4" />
                                                        Delete Permanently
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>

                                    <div className="mb-6 flex-1">
                                        <h3 className="mb-2 line-clamp-2 text-base font-semibold leading-snug">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <span className={cn(
                                                "inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide",
                                                item.type === "quiz"
                                                    ? "bg-primary/5 text-primary"
                                                    : "bg-orange-500/10 text-orange-600 border-orange-200 dark:border-orange-900/40"
                                            )}>
                                                Deleted
                                            </span>
                                            <span className="h-1 w-1 rounded-full bg-border" />
                                            <span className="line-clamp-1 text-[10px] font-medium text-muted-foreground">
                                                {item.subject_name}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-auto border-t border-border/60 pt-3" />
                                </div>
                            ))
                    )}
                </div>

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

            {/* Delete All Confirmation Dialog */}
            <Dialog open={isDeleteAllOpen} onOpenChange={setIsDeleteAllOpen}>
                <DialogContent className="max-w-md rounded-[2rem] p-8 border-none shadow-2xl">
                    <DialogHeader>
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive mb-4">
                            <Trash2 className="h-6 w-6" />
                        </div>
                        <DialogTitle className="text-2xl font-black text-destructive">Delete all items?</DialogTitle>
                        <DialogDescription className="text-base font-medium">
                            This will permanently remove all {allItems.length} items in the recycle bin. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3 mt-6">
                        <Button variant="ghost" onClick={() => setIsDeleteAllOpen(false)} className="rounded-xl font-black">
                            Cancel
                        </Button>
                        <Button onClick={handleDeleteAll} variant="destructive" disabled={isDeletingAll} className="rounded-xl font-black px-8 h-12">
                            {isDeletingAll ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Delete All
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
