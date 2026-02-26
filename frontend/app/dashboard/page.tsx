"use client";

import React, { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-context";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Subject } from "@/types";
import {
  BookOpen,
  GraduationCap,
  ArrowRight,
  Calendar,
  Sparkles,
  FileText,
  MessageSquare,
  Search,
  Filter,
  Plus,
  MoreVertical,
  Layers,
  CheckCircle2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const { subjects, fetchSubjects } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSubjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return subjects;

    return subjects.filter((subject) => {
      const searchable = `${subject.name} ${subject.description || ""}`.toLowerCase();
      return searchable.includes(query);
    });
  }, [subjects, searchQuery]);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try {
      await api.post("/subjects", { name, description: description || null });
      setName("");
      setDescription("");
      setIsOpen(false);
      await fetchSubjects();
    } catch (err) {
      console.error("Failed to create subject:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your teaching subjects and AI knowledge bases.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="mr-2 h-4 w-4" />
                New Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Subject</DialogTitle>
                <DialogDescription>
                  Add a new subject to organize your teaching materials.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Physics 101"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">Description (optional)</Label>
                  <Input
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                    className="h-11"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={loading || !name.trim()}
                  className="h-11 w-full rounded-lg text-base"
                >
                  {loading ? "Creating..." : "Create Subject"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          <div className="group flex items-center h-9 w-9 justify-center rounded-md border bg-card hover:bg-muted transition-colors cursor-pointer">
            <Layers className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </div>
          <div className="group flex items-center h-9 w-9 justify-center rounded-md border bg-card hover:bg-muted transition-colors cursor-pointer">
            <Filter className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          </div>
        </div>
      </div>

      {/* Toolbar Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search for a project"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border bg-card/50 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Projects List / Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-12 border-b bg-muted/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-6">Project</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-2 text-center">Documents</div>
          <div className="col-span-2 text-right">Created</div>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <GraduationCap className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">No projects found</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Create your first subject to start building your AI teacher assistant.
            </p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold">No matching projects</h2>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">
              Try a different keyword for your search.
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredSubjects.map((subject) => {
              const date = new Date(subject.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={subject.id}
                  onClick={() => router.push(`/dashboard/${subject.id}`)}
                  className="grid grid-cols-12 items-center px-6 py-4 transition-colors hover:bg-muted/40 cursor-pointer group"
                >
                  <div className="col-span-6 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {subject.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {subject.description || "No description provided"}
                      </p>
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <div className="inline-flex items-center gap-1.5 rounded-full border bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-500 dark:bg-emerald-500/20">
                      <CheckCircle2 className="h-3 w-3" />
                      Active
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-center">
                    <div className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      N/A
                    </div>
                  </div>

                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-muted-foreground">{date}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
