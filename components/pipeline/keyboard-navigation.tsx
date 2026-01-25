"use client";

import { usePipelineNavigation } from "@/src/hooks/use-keyboard-shortcuts";

type KeyboardNavigationProps = {
  projectId: string;
};

export function KeyboardNavigation({ projectId }: KeyboardNavigationProps) {
  usePipelineNavigation(projectId);
  return null;
}
