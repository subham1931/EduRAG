"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Trash2, Save, Loader2, AlertCircle } from "lucide-react";
import { Subject } from "@/types";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface SubjectSettingsDialogProps {
    subject: Subject;
    onUpdate: () => void;
}

export function SubjectSettingsDialog({
    subject,
    onUpdate,
}: SubjectSettingsDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState(subject.name);
    const [description, setDescription] = useState(subject.description || "");
    const [loading, setLoading] = useState(false);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const router = useRouter();

    const handleUpdate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await api.put(`/subjects/${subject.id}`, {
                name,
                description: description || null,
            });
            toast.success("Subject updated successfully");
            setIsOpen(false);
            onUpdate();
        } catch (err) {
            console.error("Failed to update subject:", err);
            toast.error("Failed to update subject");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        setDeleteLoading(true);
        try {
            await api.delete(`/subjects/${subject.id}`);
            toast.success("Subject deleted successfully");
            setIsOpen(false);
            router.push("/dashboard");
            onUpdate(); // To refresh the sidebar/list
        } catch (err) {
            console.error("Failed to delete subject:", err);
            toast.error("Failed to delete subject");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                    <Settings className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Subject Settings</DialogTitle>
                    <DialogDescription>
                        Update subject details or delete it permanently.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="edit-name">Subject Name</Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Physics 101"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="edit-desc">Description (optional)</Label>
                        <Input
                            id="edit-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description"
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <Button onClick={handleUpdate} disabled={loading || !name.trim()}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                            </>
                        ) : (
                            <>
                                <Save className="mr-2 h-4 w-4" />
                                Save Changes
                            </>
                        )}
                    </Button>

                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="w-full">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Subject
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the
                                    subject <strong>{subject.name}</strong>, all uploaded
                                    documents, generated quizzes, notes, and chat history.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                    onClick={handleDelete}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    disabled={deleteLoading}
                                >
                                    {deleteLoading ? "Deleting..." : "Delete Permanently"}
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </DialogContent>
        </Dialog>
    );
}
