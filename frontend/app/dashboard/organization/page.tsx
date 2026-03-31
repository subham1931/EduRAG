"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api-error";
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
import { Organization } from "@/types";
import {
  Building2,
  Search,
  Plus,
  LayoutGrid,
  List,
  ArrowRight,
} from "lucide-react";

export default function OrganizationPage() {
  const router = useRouter();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const fetchOrganizations = async () => {
    try {
      const { data } = await api.get<Organization[]>("/organizations");
      setOrganizations(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      console.error("Failed to load organizations:", err);
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return organizations;
    return organizations.filter((o) =>
      `${o.name} ${o.description || ""}`.toLowerCase().includes(q)
    );
  }, [organizations, searchQuery]);

  const handleCreate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Enter an organization name.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post<Organization>("/organizations", {
        name: trimmed,
        description: description.trim() || null,
      });
      setName("");
      setDescription("");
      setIsOpen(false);
      toast.success("Organization created");
      await fetchOrganizations();
      if (data?.id) {
        router.push(`/dashboard/organization/${data.id}`);
      }
    } catch (err: unknown) {
      console.error("Failed to create organization:", err);
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Create an organization first, then add subjects inside it.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog
            open={isOpen}
            onOpenChange={(open) => {
              setIsOpen(open);
              if (!open) {
                setName("");
                setDescription("");
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="h-9">
                <Plus className="mr-2 h-4 w-4" />
                New organization
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create organization</DialogTitle>
                <DialogDescription>
                  Organizations group your subjects (e.g. school, department, or team).
                  After you create one, you&apos;ll open it to add subjects.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Name</Label>
                  <Input
                    id="org-name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Riverside High School"
                    className="h-11"
                    autoComplete="organization"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="org-desc">Description (optional)</Label>
                  <Input
                    id="org-desc"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief description"
                    className="h-11"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading || !name.trim()}
                  className="h-11 w-full rounded-lg text-base"
                >
                  {loading ? "Creating…" : "Create organization"}
                </Button>
              </form>
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
            placeholder="Search organizations"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-full rounded-md border bg-card/50 pl-10 pr-4 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {loadingList ? (
        <div className="flex justify-center py-20 text-sm text-muted-foreground">Loading…</div>
      ) : organizations.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border bg-card px-6 py-20 text-center shadow-sm">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">No organizations yet</h2>
          <p className="mt-1 max-w-sm text-sm text-muted-foreground">
            Create your first organization, then add subjects inside it.
          </p>
          <Button className="mt-6" onClick={() => setIsOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create organization
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border bg-card py-16 text-center text-sm text-muted-foreground">
          No matches for your search.
        </div>
      ) : viewMode === "list" ? (
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="grid grid-cols-12 border-b bg-muted/30 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <div className="col-span-8">Organization</div>
            <div className="col-span-4 text-right">Created</div>
          </div>
          <div className="divide-y">
            {filtered.map((org) => {
              const date = new Date(org.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });
              return (
                <div
                  key={org.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push(`/dashboard/organization/${org.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/dashboard/organization/${org.id}`);
                    }
                  }}
                  className="group grid cursor-pointer grid-cols-12 items-center px-6 py-4 transition-colors hover:bg-muted/40"
                >
                  <div className="col-span-8 flex items-center gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold transition-colors group-hover:text-primary">
                        {org.name}
                      </h3>
                      <p className="max-w-[420px] truncate text-xs text-muted-foreground">
                        {org.description || "No description"}
                      </p>
                    </div>
                  </div>
                  <div className="col-span-4 flex items-center justify-end gap-2">
                    <span className="text-xs text-muted-foreground">{date}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((org) => {
            const date = new Date(org.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            });
            return (
              <div
                key={org.id}
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/dashboard/organization/${org.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    router.push(`/dashboard/organization/${org.id}`);
                  }
                }}
                className="cursor-pointer rounded-xl border bg-card p-5 shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/20"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold">{org.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {org.description || "No description"}
                </p>
                <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">{date}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
