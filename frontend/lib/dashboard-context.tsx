"use client";

import { createContext, useContext } from "react";
import { Subject } from "@/types";

interface DashboardContextType {
  subjects: Subject[];
  fetchSubjects: () => Promise<void>;
}

export const DashboardContext = createContext<DashboardContextType>({
  subjects: [],
  fetchSubjects: async () => {},
});

export const useDashboard = () => useContext(DashboardContext);
