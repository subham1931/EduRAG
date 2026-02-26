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
    ChevronLeft,
    FileText,
    Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    TooltipProvider,
} from "@/components/ui/tooltip";
import { useDashboard } from "@/lib/dashboard-context";

export function MiniSidebar() {
    const pathname = usePathname();
    const params = useParams();
    const searchParams = useSearchParams();
    const subjectId = (params.subjectId as string) || searchParams.get("subjectId");
    const tab = searchParams.get("tab") || "overview";
    const { subjects } = useDashboard();

    const globalItems = [
        { icon: Home, label: "Projects", href: "/dashboard" },
        { icon: MessageSquare, label: "Global Chat", href: "/dashboard?global=chat" },
        { icon: LayoutDashboard, label: "Usage Statistics", href: "/dashboard?global=usage" },
        { icon: Settings, label: "Organization", href: "/dashboard?global=settings" },
    ];

    const projectItems = [
        { icon: LayoutDashboard, label: "Subject Overview", href: `/dashboard/${subjectId}?tab=overview` },
        { icon: MessageSquare, label: "AI Chat", href: `/dashboard/${subjectId}?tab=chat` },
        { icon: HelpCircle, label: "Questions", href: `/dashboard/${subjectId}?tab=quizzes` },
        { icon: FileText, label: "Study Notes", href: `/dashboard/${subjectId}?tab=notes` },
        { icon: Files, label: "Documents", href: `/dashboard/${subjectId}?tab=docs` },
        { icon: Users, label: "Students", href: `/dashboard/${subjectId}?tab=students` },
        { icon: Settings, label: "Subject Settings", href: `/dashboard/${subjectId}?tab=settings` },
    ];

    const navItems = subjectId ? projectItems : globalItems;

    return (
        <aside
            className={cn(
                "fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] w-[240px] flex-col items-center border-r bg-card py-4 dark:bg-background/95 shadow-xl"
            )}
        >
            <TooltipProvider delayDuration={0}>
                <div className="flex w-full flex-1 flex-col gap-2 px-3">

                    {navItems.map((item) => {
                        const targetTab = item.href.split("tab=")[1] || "overview";
                        const isSubjectRoot = pathname === `/dashboard/${subjectId}`;

                        const isActive = subjectId
                            ? (isSubjectRoot && tab === targetTab) ||
                            (item.label === "Questions" && pathname.includes("/quizzes/")) ||
                            (item.label === "Study Notes" && pathname.includes("/notes/"))
                            : pathname === item.href;

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={cn(
                                    "group flex h-10 w-full items-center rounded-lg px-2 transition-all",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-sm"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "scale-110" : "group-hover:scale-110 transition-transform")} />
                                <span className="ml-4 truncate text-sm font-medium whitespace-nowrap">
                                    {item.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </TooltipProvider>

            <div className="mt-auto flex w-full flex-col gap-2 px-3 border-t pt-4 pb-2">
                {subjectId && (
                    <Link
                        href={`/dashboard/trash?subjectId=${subjectId}`}
                        className={cn(
                            "group flex h-10 w-full items-center rounded-lg px-2 transition-all",
                            pathname === "/dashboard/trash"
                                ? "bg-destructive/10 text-destructive shadow-sm"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Trash2 className={cn("h-5 w-5 shrink-0", pathname === "/dashboard/trash" ? "scale-110" : "group-hover:scale-110 transition-transform")} />
                        <span className="ml-4 truncate text-sm font-medium whitespace-nowrap">
                            Recycle Bin
                        </span>
                    </Link>
                )}
                <button className="group flex h-10 w-full items-center rounded-lg px-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-all">
                    <HelpCircle className="h-5 w-5 shrink-0" />
                    <span className="ml-4 truncate text-sm font-medium whitespace-nowrap">
                        Documentation
                    </span>
                </button>
            </div>
        </aside>
    );
}
