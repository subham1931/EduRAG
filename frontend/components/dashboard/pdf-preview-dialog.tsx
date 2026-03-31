"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import type { Document } from "@/types";

interface PdfPreviewDialogProps {
  document: Document | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PdfPreviewDialog({
  document,
  open,
  onOpenChange,
}: PdfPreviewDialogProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !document) {
      setUrl(null);
      setError(null);
      return;
    }

    if (!document.storage_path) {
      setUrl(null);
      setError(
        "Preview is not available for this file. It may have been uploaded before document storage was enabled — re-upload to enable preview."
      );
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setUrl(null);

    api
      .get<{ url: string }>(`/documents/preview/${document.id}`)
      .then(({ data }) => {
        if (!cancelled) setUrl(data.url);
      })
      .catch((err) => {
        if (!cancelled) setError(getApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, document]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,900px)] w-[min(100vw-2rem,960px)] flex-col gap-0 p-0 sm:max-w-[960px]">
        <DialogHeader className="border-b px-6 py-4 text-left">
          <DialogTitle className="truncate pr-8 text-base">
            {document?.filename ?? "PDF preview"}
          </DialogTitle>
        </DialogHeader>

        <div className="relative min-h-[min(75vh,720px)] flex-1 bg-muted/30">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {error && !loading && (
            <div className="flex h-[min(75vh,720px)] items-center justify-center p-6 text-center text-sm text-muted-foreground">
              {error}
            </div>
          )}
          {url && !error && (
            <iframe
              title={document?.filename ?? "PDF"}
              src={url}
              className="h-[min(75vh,720px)] w-full rounded-b-lg border-0 bg-background"
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
