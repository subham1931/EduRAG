"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useParams, useSearchParams } from "next/navigation";
import {
    Home,
    Settings,
    HelpCircle,
    LayoutDashboard,
    MessageSquare,
    Files,
    Users,
    Trash2,
    Info,
    NotebookText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

function globalQueryFromHref(href: string): string | null {
    try {
        return new URL(href, "http://localhost").searchParams.get("global");
    } catch {
        return null;
    }
}

/** Lucide icons: hover scale/rotate + stroke pop (motion-safe; reduced-motion users get color-only). */
const navIconClass =
    "h-[18px] w-[18px] origin-center [stroke-width:1.5px] transition-all duration-300 ease-[cubic-bezier(0.34,1.3,0.64,1)] group-hover:scale-110 group-hover:-rotate-6 group-hover:[stroke-width:2.25px] group-active:scale-95 motion-reduce:transition-colors motion-reduce:duration-200 motion-reduce:group-hover:scale-100 motion-reduce:group-hover:rotate-0";

function NavIconButton({
    active,
    children,
    className,
}: {
    active: boolean;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <span
            className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center overflow-visible rounded-full transition-colors",
                active
                    ? "bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900"
                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-300",
                className
            )}
        >
            {children}
        </span>
    );
}

export function MiniSidebar() {
    const pathname = usePathname();
    const params = useParams();
    const searchParams = useSearchParams();
    const subjectId = (params.subjectId as string) || searchParams.get("subjectId");
    const tab = searchParams.get("tab") || "overview";

    const globalItems = [
        { icon: Home, label: "Organizations", href: "/dashboard/organization" },
        { icon: Info, label: "Global Chat", href: "/dashboard?global=chat" },
        { icon: LayoutDashboard, label: "Usage Statistics", href: "/dashboard?global=usage" },
        { icon: Settings, label: "Organization settings", href: "/dashboard?global=settings" },
    ];

    const projectItems = [
        { icon: LayoutDashboard, label: "Subject Overview", href: `/dashboard/${subjectId}?tab=overview` },
        { icon: MessageSquare, label: "AI Chat", href: `/dashboard/${subjectId}?tab=chat` },
        { icon: HelpCircle, label: "Questions", href: `/dashboard/${subjectId}?tab=quizzes` },
        { icon: NotebookText, label: "Study Notes", href: `/dashboard/${subjectId}?tab=notes` },
        { icon: Files, label: "Documents", href: `/dashboard/${subjectId}?tab=docs` },
        { icon: Users, label: "Students", href: `/dashboard/${subjectId}?tab=students` },
        { icon: Settings, label: "Subject Settings", href: `/dashboard/${subjectId}?tab=settings` },
    ];

    const navItems = subjectId ? projectItems : globalItems;
    const globalMode = searchParams.get("global");

    return (
        <nav
            aria-label="Dashboard navigation"
            className={cn(
                "fixed left-5 top-1/2 z-40 hidden h-auto w-auto -translate-y-1/2 md:flex md:flex-col",
                "items-center gap-2",
                "rounded-full border border-zinc-200/90 bg-white px-2 py-3",
                "shadow-[0_8px_32px_rgba(15,23,42,0.12)]",
                "dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_8px_32px_rgba(0,0,0,0.45)]"
            )}
        >
            <TooltipProvider delayDuration={0}>
                <div className="flex flex-col items-center gap-2">
                    {navItems.map((item) => {
                        const targetTab = item.href.split("tab=")[1] || "overview";
                        const isSubjectRoot = pathname === `/dashboard/${subjectId}`;

                        const isActive = subjectId
                            ? (isSubjectRoot && tab === targetTab) ||
                              (item.label === "Questions" && pathname.includes("/quizzes/")) ||
                              (item.label === "Study Notes" && pathname.includes("/notes/"))
                            : (() => {
                                  if (item.href.startsWith("/dashboard/organization")) {
                                      return (
                                          pathname === "/dashboard/organization" ||
                                          pathname.startsWith("/dashboard/organization/")
                                      );
                                  }
                                  if (pathname !== "/dashboard") return false;
                                  const itemGlobal = globalQueryFromHref(item.href);
                                  if (itemGlobal === null) return globalMode === null;
                                  return globalMode === itemGlobal;
                              })();

                        return (
                            <Tooltip key={item.label}>
                                <TooltipTrigger asChild>
                                    <Link
                                        href={item.href}
                                        className="group rounded-full outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                                    >
                                        <NavIconButton active={isActive}>
                                            <item.icon
                                                className={cn(
                                                    navIconClass,
                                                    isActive &&
                                                        "scale-105 [stroke-width:2.25px] motion-reduce:scale-100"
                                                )}
                                                aria-hidden
                                            />
                                        </NavIconButton>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent side="right">{item.label}</TooltipContent>
                            </Tooltip>
                        );
                    })}
                </div>

                {subjectId && (
                    <div className="flex w-full flex-col items-center gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    href={`/dashboard/trash?subjectId=${subjectId}`}
                                    className="group rounded-full outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
                                >
                                    <NavIconButton active={pathname === "/dashboard/trash"}>
                                        <Trash2
                                            className={cn(
                                                navIconClass,
                                                pathname === "/dashboard/trash" &&
                                                    "scale-105 [stroke-width:2.25px] motion-reduce:scale-100"
                                            )}
                                            aria-hidden
                                        />
                                    </NavIconButton>
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right">Recycle Bin</TooltipContent>
                        </Tooltip>
                    </div>
                )}
            </TooltipProvider>
        </nav>
    );
}
