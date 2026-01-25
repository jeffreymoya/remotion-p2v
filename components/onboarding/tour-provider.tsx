"use client";

import { createContext, ReactNode, useContext } from "react";

type TourContextValue = {
  step: number;
  total: number;
  next: () => void;
  skip: () => void;
};

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ value, children }: { value: TourContextValue; children: ReactNode }) {
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return ctx;
}
