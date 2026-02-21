"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  BookOpen,
  Plus,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { Subject } from "@/types";
import api from "@/lib/api";
import { supabase } from "@/lib/supabase";

interface SidebarProps {
  subjects: Subject[];
  selectedSubject: Subject | null;
  onSelectSubject: (subject: Subject) => void;
  onSubjectCreated: () => void;
}

export function Sidebar({
  subjects,
  selectedSubject,
  onSelectSubject,
  onSubjectCreated,
}: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post("/subjects", { name, description: description || null });
      setName("");
      setDescription("");
      setIsOpen(false);
      onSubjectCreated();
    } catch (err) {
      console.error("Failed to create subject:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex items-center gap-2 p-4">
        <GraduationCap className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold">EduRAG</h1>
      </div>

      <Separator />

      <div className="p-3">
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="w-full" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Subject</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Subject Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Physics 101"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="desc">Description (optional)</Label>
                <Input
                  id="desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={loading || !name.trim()}
                className="w-full"
              >
                {loading ? "Creating..." : "Create Subject"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => onSelectSubject(subject)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors hover:bg-accent ${
                selectedSubject?.id === subject.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground"
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{subject.name}</span>
            </button>
          ))}
          {subjects.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-muted-foreground">
              No subjects yet. Create one to get started.
            </p>
          )}
        </div>
      </ScrollArea>

      <Separator />

      <div className="p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
