"use client";

import React, { useState } from "react";
import { toast } from "sonner";
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
import {
  FileText,
  Loader2,
  Copy,
  CheckCircle2,
  Save,
  Check,
} from "lucide-react";
import { Subject } from "@/types";
import api from "@/lib/api";

interface NotesDialogProps {
  subject: Subject;
  onGenerated?: () => void;
}

export function NotesDialog({ subject, onGenerated }: NotesDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setNotes("");
    setSaved(false);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post("/save-notes", {
        subject_id: subject.id,
        title: topic || "General",
        content: notes,
      });
      setSaved(true);
      onGenerated?.();
      setIsOpen(false);
      toast.success("Notes saved successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to save notes.");
    } finally {
      setSaving(false);
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
          setSaved(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          Generate Notes
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[90vh]">
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

            <ScrollArea className="flex-1">
              <div className="prose dark:prose-invert max-w-none pr-4 prose-h1:text-xl prose-h1:font-bold prose-h1:mb-4 prose-h2:text-lg prose-h2:font-semibold prose-h2:mt-6 prose-h2:mb-3 prose-h2:text-primary prose-h3:text-base prose-h3:font-medium prose-h3:mt-4 prose-h3:mb-2 prose-ol:my-2 prose-ol:space-y-2 prose-ul:my-1 prose-ul:space-y-1 prose-li:my-0 prose-li:leading-relaxed prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:text-sm prose-code:font-mono prose-hr:my-6 prose-hr:border-border prose-p:my-1 prose-p:leading-relaxed">
                <ReactMarkdown>{notes}</ReactMarkdown>
              </div>
            </ScrollArea>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setNotes("");
                  setSaved(false);
                }}
                className="flex-1"
              >
                Generate Again
              </Button>

              <Button
                variant={saved ? "secondary" : "default"}
                onClick={handleSave}
                disabled={saving || saved}
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : saved ? (
                  <Check className="mr-2 h-4 w-4" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                {saved ? "Saved" : "Save Notes"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
