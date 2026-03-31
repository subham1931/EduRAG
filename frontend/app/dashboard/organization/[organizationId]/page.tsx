"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useDashboard } from "@/lib/dashboard-context";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
import { toast } from "sonner";
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
import { Organization, Subject } from "@/types";
import {
  BookOpen,
  GraduationCap,
  FileText,
  Search,
  Plus,
  LayoutGrid,
  List,
  CheckCircle2,
} from "lucide-react";

export default function OrganizationSubjectsPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;
  const { fetchSubjects } = useDashboard();

  const [organization, setOrganization] = useState<Organization | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [{ data: org }, { data: subjList }] = await Promise.all([
        api.get<Organization>(`/organizations/${organizationId}`),
        api.get<Subject[]>("/subjects", { params: { organization_id: organizationId } }),
      ]);
      setOrganization(org);
      setSubjects(subjList);
    } catch (err) {
      console.error("Failed to load organization:", err);
      toast.error(getApiErrorMessage(err));
      setOrganization(null);
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

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
    setCreating(true);
    try {
      await api.post("/subjects", {
        organization_id: organizationId,
        name,
        description: description || null,
      });
      setName("");
      setDescription("");
      setIsOpen(false);
      await load();
      await fetchSubjects();
    } catch (err) {
      console.error("Failed to create subject:", err);
      toast.error(getApiErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (subjects.length === 0) {
      setDocumentCounts({});
      return;
    }
    const fetchDocumentCounts = async () => {
      const results = await Promise.allSettled(
        subjects.map(async (subject) => {
          const { data } = await api.get(`/documents/${subject.id}`);
          return { subjectId: subject.id, count: Array.isArray(data) ? data.length : 0 };
        })
      );
      const counts: Record<string, number> = {};
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          counts[result.value.subjectId] = result.value.count;
        }
      });
      setDocumentCounts(counts);
    };
    fetchDocumentCounts();
  }, [subjects]);

  if (loading) {
    return (
      <div className="flex h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-muted-foreground">Organization not found.</p>
        <Button asChild className="mt-4" variant="outline">
          <Link href="/dashboard/organization">Back to organizations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{organization.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {organization.description || "Subjects in this organization."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="mr-2 h-4 w-4" />
                New subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create subject</DialogTitle>
                <DialogDescription>
                  Add a subject under {organization.name}.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="sub-name">Subject name</Label>
                  <Input
                    id="sub-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Physics 101"
                    className="h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sub-desc">Description (optional)</Label>
                  <Input
                    id="sub-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                    className="h-11"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={creating || !name.trim()}
                  className="h-11 w-full rounded-lg text-base"
                >
                  {creating ? "Creating…" : "Create subject"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
      </div>

      <div className="mb-6 flex items-center justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search subjects"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border bg-card/50 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">No subjects yet</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Create your first subject to start building your AI knowledge base.
          </p>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/40">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-semibold">No matching subjects</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            Try a different keyword for your search.
          </p>
        </div>
      ) : viewMode === "list" ? (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="grid grid-cols-12 border-b bg-muted/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-6">Subject</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-center">Documents</div>
            <div className="col-span-2 text-right">Created</div>
          </div>
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
                  className="group grid cursor-pointer grid-cols-12 items-center px-6 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="col-span-6 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                        {subject.name}
                      </h3>
                      <p className="max-w-[300px] truncate text-xs text-muted-foreground">
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
                      {documentCounts[subject.id] ?? 0}
                    </div>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className="text-xs text-muted-foreground">{date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
                className="cursor-pointer rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 rounded-full border bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-emerald-500 dark:bg-emerald-500/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </div>
                </div>
                <h3 className="text-base font-semibold">{subject.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {subject.description || "No description provided"}
                </p>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <div className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    <FileText className="h-3 w-3" />
                    {documentCounts[subject.id] ?? 0}
                  </div>
                  <span className="text-xs text-muted-foreground">{date}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
