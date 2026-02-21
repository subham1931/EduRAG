"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
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
import { FileText, Loader2, Copy, CheckCircle2 } from "lucide-react";
import { Subject } from "@/types";
import api from "@/lib/api";

interface NotesDialogProps {
  subject: Subject;
}

export function NotesDialog({ subject }: NotesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setNotes("");

    try {
      const { data } = await api.post("/generate-notes", {
        subject_id: subject.id,
        topic: topic || undefined,
      });
      setNotes(data.notes);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Failed to generate notes. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(notes);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setNotes("");
          setError("");
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Generate Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Notes — {subject.name}</DialogTitle>
          <DialogDescription>
            Generate structured study notes from your uploaded materials.
          </DialogDescription>
        </DialogHeader>

        {!notes ? (
          <div className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Topic (optional)</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Thermodynamics, Cell Biology..."
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
                  Generating notes...
                </>
              ) : (
                "Generate Notes"
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 h-3 w-3" />
                    Copy
                  </>
                )}
              </Button>
            </div>

            <ScrollArea className="h-[60vh]">
              <div className="prose prose-sm dark:prose-invert max-w-none pr-4">
                <ReactMarkdown>{notes}</ReactMarkdown>
              </div>
            </ScrollArea>

            <Button
              variant="outline"
              onClick={() => setNotes("")}
              className="w-full"
            >
              Generate Again
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
