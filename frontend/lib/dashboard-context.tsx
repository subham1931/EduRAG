"use client";

import { createContext, useContext } from "react";
import { Subject } from "@/types";

interface DashboardContextType {
  subjects: Subject[];
  fetchSubjects: () => Promise<void>;
  quizTitle: string | null;
  setQuizTitle: (title: string | null) => void;
}

export const DashboardContext = createContext<DashboardContextType>({
  subjects: [],
  fetchSubjects: async () => { },
  quizTitle: null,
  setQuizTitle: () => { },
});

export const useDashboard = () => useContext(DashboardContext);
