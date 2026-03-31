"use client";

import type { ComponentProps } from "react";
import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = ComponentProps<typeof Sonner>;

export function Toaster({ ...props }: ToasterProps) {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="bottom-center"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast !border !border-border !bg-card !text-card-foreground !shadow-lg !rounded-lg",
          title: "!text-foreground !font-medium",
          description: "!text-muted-foreground",
          actionButton:
            "!bg-primary !text-primary-foreground hover:!bg-primary/90",
          cancelButton: "!bg-muted !text-muted-foreground",
          closeButton: "!bg-transparent !border-border !text-muted-foreground",
          success:
            "!border-border !bg-card !text-card-foreground [&_[data-icon]]:!text-muted-foreground",
          error:
            "!border-border !bg-card !text-card-foreground [&_[data-icon]]:!text-destructive",
          warning:
            "!border-border !bg-card !text-card-foreground [&_[data-icon]]:!text-muted-foreground",
          info: "!border-border !bg-card !text-card-foreground [&_[data-icon]]:!text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
