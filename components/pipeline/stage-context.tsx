"use client";

import { createContext, useContext } from "react";
import { PipelineStageId } from "@/src/lib/storyflow/stage-validation";

type StageContextValue = {
  projectId: string;
  currentStage: PipelineStageId;
};

const StageContext = createContext<StageContextValue | null>(null);

export function StageProvider({
  value,
  children,
}: {
  value: StageContextValue;
  children: React.ReactNode;
}) {
  return <StageContext.Provider value={value}>{children}</StageContext.Provider>;
}

export function useStageContext() {
  const ctx = useContext(StageContext);
  if (!ctx) {
    throw new Error("useStageContext must be used within StageProvider");
  }
  return ctx;
}
