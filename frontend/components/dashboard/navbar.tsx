"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Box,
  Building2,
  ChevronsUpDown,
  GraduationCap,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Sun,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useParams, usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDashboard } from "@/lib/dashboard-context";
import api from "@/lib/api";
import type { Organization } from "@/types";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams();
  const subjectId = (params.subjectId as string) || searchParams.get("subjectId");
  const organizationIdFromUrl = params.organizationId as string | undefined;
  const tab = searchParams.get("tab") || "overview";
  const { subjects, quizTitle } = useDashboard();

  const [organizations, setOrganizations] = useState<Organization[]>([]);

  const currentSubject = subjects.find((s) => s.id === subjectId);

  const effectiveOrganizationId =
    organizationIdFromUrl ?? currentSubject?.organization_id ?? null;

  const subjectsInOrg = useMemo(() => {
    if (!effectiveOrganizationId) return [];
    return subjects.filter((s) => s.organization_id === effectiveOrganizationId);
  }, [effectiveOrganizationId, subjects]);

  const currentOrganization = useMemo(() => {
    if (!effectiveOrganizationId) return null;
    return organizations.find((o) => o.id === effectiveOrganizationId) ?? null;
  }, [organizations, effectiveOrganizationId]);

  useEffect(() => {
    let cancelled = false;
    api
      .get<Organization[]>("/organizations")
      .then(({ data }) => {
        if (!cancelled) setOrganizations(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setOrganizations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!effectiveOrganizationId) return;
    let cancelled = false;
    api
      .get<Organization>(`/organizations/${effectiveOrganizationId}`)
      .then(({ data }) => {
        if (cancelled) return;
        setOrganizations((prev) =>
          prev.some((o) => o.id === data.id) ? prev : [...prev, data]
        );
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [effectiveOrganizationId]);

  const [userEmail, setUserEmail] = useState("");
  const [mounted, setMounted] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const mobileSidebarRef = useRef<HTMLElement | null>(null);
  const menuButtonRef = useRef<HTMLButtonElement | null>(null);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user?.email) {
        setUserEmail(session.user.email);
      }
    });
  }, []);

  useEffect(() => {
    if (!mobileSidebarOpen) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (mobileSidebarRef.current?.contains(target)) return;
      if (menuButtonRef.current?.contains(target)) return;
      setMobileSidebarOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
    };
  }, [mobileSidebarOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const initials = userEmail ? userEmail.charAt(0).toUpperCase() : "U";
  const globalItems = [
    { label: "Organizations", href: "/dashboard/organization" },
    { label: "Global Chat", href: "/dashboard?global=chat" },
    { label: "Usage Statistics", href: "/dashboard?global=usage" },
    { label: "Organization settings", href: "/dashboard?global=settings" },
  ];
  const subjectItems = subjectId
    ? [
        { label: "Subject Overview", href: `/dashboard/${subjectId}?tab=overview` },
        { label: "AI Chat", href: `/dashboard/${subjectId}?tab=chat` },
        { label: "Questions", href: `/dashboard/${subjectId}?tab=quizzes` },
        { label: "Study Notes", href: `/dashboard/${subjectId}?tab=notes` },
        { label: "Documents", href: `/dashboard/${subjectId}?tab=docs` },
        { label: "Students", href: `/dashboard/${subjectId}?tab=students` },
        { label: "Subject Settings", href: `/dashboard/${subjectId}?tab=settings` },
        { label: "Recycle Bin", href: `/dashboard/trash?subjectId=${subjectId}` },
      ]
    : [];
  const mobileNavItems = subjectId ? subjectItems : globalItems;
  const isItemActive = (item: { label: string; href: string }) => {
    const targetTab = item.href.includes("tab=") ? item.href.split("tab=")[1] : "";
    const isSubjectRoot = subjectId ? pathname === `/dashboard/${subjectId}` : false;
    if (subjectId) {
      return (
        (isSubjectRoot && tab === targetTab) ||
        (item.label === "Questions" && pathname.includes("/quizzes/")) ||
        (item.label === "Study Notes" && pathname.includes("/notes/")) ||
        (item.label === "Recycle Bin" && pathname === "/dashboard/trash")
      );
    }
    if (item.href.startsWith("/dashboard/organization")) {
      return (
        pathname === "/dashboard/organization" ||
        pathname.startsWith("/dashboard/organization/")
      );
    }
    const globalMode = searchParams.get("global");
    if (pathname !== "/dashboard") return false;
    try {
      const itemGlobal = new URL(item.href, "http://localhost").searchParams.get(
        "global"
      );
      if (itemGlobal === null) return globalMode === null;
      return globalMode === itemGlobal;
    } catch {
      return false;
    }
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 shrink-0 md:hidden"
            onClick={() => setMobileSidebarOpen((prev) => !prev)}
            ref={menuButtonRef}
          >
            <Menu className="h-4 w-4" />
            <span className="sr-only">
              {mobileSidebarOpen ? "Close navigation sidebar" : "Open navigation sidebar"}
            </span>
          </Button>

          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link
              href="/dashboard/organization"
              className="flex shrink-0 items-center gap-2 rounded-md transition-opacity hover:opacity-80"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <GraduationCap className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold">EduRAG</span>
            </Link>

            {effectiveOrganizationId && (
              <>
                <span className="shrink-0 text-muted-foreground">/</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex max-w-[min(40vw,200px)] shrink items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm font-medium transition-colors hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[260px]"
                    >
                      <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {currentOrganization?.name ?? "Organization"}
                      </span>
                      <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[min(100vw-2rem,280px)]">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      Organization
                    </DropdownMenuLabel>
                    {organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => router.push(`/dashboard/organization/${org.id}`)}
                        className={org.id === effectiveOrganizationId ? "bg-muted" : ""}
                      >
                        <Building2 className="mr-2 h-4 w-4" />
                        <span className="truncate">{org.name}</span>
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push("/dashboard/organization")}>
                      All organizations
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {subjectId && (
              <>
                <span className="shrink-0 text-muted-foreground">/</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex max-w-[min(40vw,200px)] shrink items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm font-medium transition-colors hover:bg-muted/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-[260px]"
                    >
                      <Box className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate">
                        {currentSubject?.name ?? "Subject"}
                      </span>
                      <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-70" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[min(100vw-2rem,280px)]">
                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                      Subject
                    </DropdownMenuLabel>
                    {subjectsInOrg.map((s) => (
                      <DropdownMenuItem
                        key={s.id}
                        onClick={() => router.push(`/dashboard/${s.id}`)}
                        className={s.id === subjectId ? "bg-muted" : ""}
                      >
                        <Box className="mr-2 h-4 w-4" />
                        <span className="truncate">{s.name}</span>
                      </DropdownMenuItem>
                    ))}
                    {effectiveOrganizationId && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/organization/${effectiveOrganizationId}`)
                          }
                        >
                          All subjects in organization
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}

            {params.quizId && quizTitle && (
              <>
                <span className="shrink-0 text-muted-foreground">/</span>
                <span className="truncate text-sm font-medium text-foreground max-w-[min(30vw,180px)] sm:max-w-[220px]">
                  {quizTitle}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                {mounted ? (
                  theme === "dark" ? (
                    <Moon className="h-4 w-4" />
                  ) : theme === "light" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Monitor className="h-4 w-4" />
                  )
                ) : (
                  <Sun className="h-4 w-4" />
                )}
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Monitor className="mr-2 h-4 w-4" />
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary transition-colors hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background">
                {initials}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">My Account</p>
                  <p className="text-xs font-normal text-muted-foreground truncate">
                    {userEmail}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleLogout}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 top-14 z-[70] md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        >
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          <aside
            ref={mobileSidebarRef}
            className="absolute left-0 top-0 z-10 h-[calc(100vh-3.5rem)] w-[280px] border-r bg-card p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-full flex-col">
              <div className="mb-3 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Navigation
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {mobileNavItems.map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => {
                      setMobileSidebarOpen(false);
                      router.push(item.href);
                    }}
                    className={`flex h-10 w-full items-center rounded-lg px-3 text-left text-sm font-medium transition-colors ${
                      isItemActive(item)
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </nav>
  );
}
