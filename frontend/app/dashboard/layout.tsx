"use client";

import React, { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import api from "@/lib/api";
import { DashboardContext } from "@/lib/dashboard-context";
import { Navbar } from "@/components/dashboard/navbar";
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
      <div className="flex h-screen flex-col bg-background">
        <Navbar onSubjectCreated={fetchSubjects} />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </DashboardContext.Provider>
  );
}
