"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";
import { DashboardContext } from "@/lib/dashboard-context";
import { Navbar } from "@/components/dashboard/navbar";
import { MiniSidebar } from "@/components/dashboard/mini-sidebar";
import { ProjectSidebar } from "@/components/dashboard/project-sidebar";
import { Loader2 } from "lucide-react";
import { Subject } from "@/types";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authLoading, setAuthLoading] = useState(true);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const fetchSubjects = useCallback(async () => {
    try {
      const { data } = await api.get("/subjects");
      setSubjects(data);
    } catch (err) {
      console.error("Failed to load subjects:", err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT") {
        window.location.href = "/login";
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (!session) {
        window.location.href = "/login";
      } else {
        setAuthLoading(false);
        fetchSubjects();
      }
    });

    return () => {
      isMounted = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchSubjects]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{ subjects, fetchSubjects }}>
      <div className="flex h-screen flex-col bg-background text-foreground overflow-hidden">
        {/* Global Navbar */}
        <Navbar onSubjectCreated={fetchSubjects} />

        <div className="flex flex-1 overflow-hidden relative">
          {/* Supabase-style Mini Sidebar (Global & Contextual) */}
          <div className="hidden md:block w-[64px] shrink-0">
            <MiniSidebar />
          </div>

          <main className="flex-1 overflow-auto bg-muted/20 pb-10">
            {children}
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
