"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, FileText, Loader2, CheckCircle2 } from "lucide-react";
import { Subject } from "@/types";
import api from "@/lib/api";

interface UploadDialogProps {
  subject: Subject;
  onUploadComplete: () => void;
}

export function UploadDialog({ subject, onUploadComplete }: UploadDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected && selected.type === "application/pdf") {
      setFile(selected);
      setError("");
    } else {
      setError("Please select a PDF file");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subject_id", subject.id);

      await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 300000,
      });

      setSuccess(true);
      onUploadComplete();
      setTimeout(() => {
        setIsOpen(false);
        setFile(null);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(
        err.response?.data?.detail || "Upload failed. Please try again."
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setFile(null);
          setError("");
          setSuccess(false);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Upload PDF
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload PDF to {subject.name}</DialogTitle>
          <DialogDescription>
            Upload a PDF document to use as knowledge source.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div
            className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 transition-colors hover:border-primary/50"
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="hidden"
            />
            {file ? (
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-5 w-5 text-primary" />
                <span className="font-medium">{file.name}</span>
                <span className="text-muted-foreground">
                  ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </span>
              </div>
            ) : (
              <>
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Click to select a PDF file
                </p>
              </>
            )}
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {success && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              Upload complete! Processing document...
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={!file || uploading || success}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing... (this may take a minute)
              </>
            ) : (
              "Upload & Process"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
