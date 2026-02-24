"use client";

import React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import {
    LayoutDashboard,
    Files,
    HelpCircle,
    FileText,
    Settings,
    MessageSquare,
    ChevronLeft,
    Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/dashboard-context";

export function ProjectSidebar() {
    const params = useParams();
    const searchParams = useSearchParams();
    const subjectId = params.subjectId as string;
    const tab = searchParams.get("tab") || "overview";
    const { subjects } = useDashboard();

    const subject = subjects.find(s => s.id === subjectId);

    if (!subjectId) return null;

    const navItems = [
        {
            label: "Subject Overview",
            href: `/dashboard/${subjectId}?tab=overview`,
            icon: LayoutDashboard
        },
        {
            label: "AI Chat",
            href: `/dashboard/${subjectId}?tab=chat`,
            icon: MessageSquare
        },
        {
            label: "Questions",
            href: `/dashboard/${subjectId}?tab=quizzes`,
            icon: HelpCircle
        },
        {
            label: "Study Notes",
            href: `/dashboard/${subjectId}?tab=notes`,
            icon: FileText
        },
        {
            label: "Subject Settings",
            href: `/dashboard/${subjectId}?tab=settings`,
            icon: Settings
        },
        {
            label: "Documents",
            href: `/dashboard/${subjectId}?tab=docs`,
            icon: Files
        },
        {
            label: "Students",
            href: `/dashboard/${subjectId}?tab=students`,
            icon: Users
        },
    ];

    return (
        <aside className="w-[240px] flex flex-col border-r bg-card/40 backdrop-blur-sm h-full overflow-hidden animate-in fade-in slide-in-from-left-4 duration-500">
            <div className="p-6 border-b">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                        <LayoutDashboard className="h-3 w-3 text-primary" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">Project Context</span>
                </div>
                <h2 className="text-sm font-bold tracking-tight truncate pr-4 text-foreground/90">{subject?.name || "Loading..."}</h2>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = tab === (item.href.split("tab=")[1] || "overview");

                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                                isActive
                                    ? "bg-primary/5 text-primary"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                            {item.label}
                            {isActive && (
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-primary" />
                            )}
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t bg-muted/5 mt-auto">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-all"
                >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    All Projects
                </Link>
            </div>
        </aside>
    );
}
