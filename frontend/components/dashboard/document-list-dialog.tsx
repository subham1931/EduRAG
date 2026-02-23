"use client";

import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Trash2, Loader2, Files, Calendar } from "lucide-react";
import { Document as Doc, Subject } from "@/types";
import api from "@/lib/api";
import { toast } from "sonner";

interface DocumentListDialogProps {
    subject: Subject;
    documents: Doc[];
    onRefresh: () => void;
}

export function DocumentListDialog({
    subject,
    documents,
    onRefresh,
}: DocumentListDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

    const handleDelete = async (docId: string, filename: string) => {
        setDeleteLoading(docId);
        try {
            await api.delete(`/documents/${docId}`);
            toast.success(`Deleted ${filename}`);
            onRefresh();
        } catch (err) {
            console.error("Failed to delete document:", err);
            toast.error("Failed to delete document");
        } finally {
            setDeleteLoading(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Files className="h-4 w-4" />
                    <span className="hidden sm:inline">Manage Docs</span>
                    <span className="sm:hidden">Docs</span>
                    {documents.length > 0 && (
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {documents.length}
                        </span>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] flex flex-col max-h-[85vh]">
                <DialogHeader>
                    <DialogTitle>Documents for {subject.name}</DialogTitle>
                    <DialogDescription>
                        View and manage the PDF files indexed for this subject.
                    </DialogDescription>
                </DialogHeader>

                {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                            <FileText className="h-6 w-6 text-muted-foreground/40" />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground">
                            No documents uploaded yet.
                        </p>
                    </div>
                ) : (
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-3 py-2">
                            {documents.map((doc) => (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between gap-4 rounded-xl border bg-card p-4 transition-all hover:border-primary/20"
                                >
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/5">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium leading-none">
                                                {doc.filename}
                                            </p>
                                            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Files className="h-3 w-3" />
                                                    {doc.page_count} pages
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {new Date(doc.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                        onClick={() => handleDelete(doc.id, doc.filename)}
                                        disabled={deleteLoading === doc.id}
                                    >
                                        {deleteLoading === doc.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </DialogContent>
        </Dialog>
    );
}
