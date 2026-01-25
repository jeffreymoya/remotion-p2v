"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export type KeyboardShortcut = {
  key: string;
  metaKey?: boolean;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  handler: () => void;
};

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[]) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      for (const shortcut of shortcuts) {
        const metaMatch = shortcut.metaKey === undefined || shortcut.metaKey === event.metaKey;
        const ctrlMatch = shortcut.ctrlKey === undefined || shortcut.ctrlKey === event.ctrlKey;
        const shiftMatch = shortcut.shiftKey === undefined || shortcut.shiftKey === event.shiftKey;
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();

        if (metaMatch && ctrlMatch && shiftMatch && keyMatch) {
          event.preventDefault();
          shortcut.handler();
          break;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

export function usePipelineNavigation(projectId: string) {
  const router = useRouter();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: "1",
      metaKey: true,
      handler: () => router.push(`/projects/${projectId}/script`),
    },
    {
      key: "1",
      ctrlKey: true,
      handler: () => router.push(`/projects/${projectId}/script`),
    },
    {
      key: "2",
      metaKey: true,
      handler: () => router.push(`/projects/${projectId}/media`),
    },
    {
      key: "2",
      ctrlKey: true,
      handler: () => router.push(`/projects/${projectId}/media`),
    },
    {
      key: "3",
      metaKey: true,
      handler: () => router.push(`/projects/${projectId}/storyboard`),
    },
    {
      key: "3",
      ctrlKey: true,
      handler: () => router.push(`/projects/${projectId}/storyboard`),
    },
    {
      key: "4",
      metaKey: true,
      handler: () => router.push(`/projects/${projectId}/build`),
    },
    {
      key: "4",
      ctrlKey: true,
      handler: () => router.push(`/projects/${projectId}/build`),
    },
    {
      key: "5",
      metaKey: true,
      handler: () => router.push(`/projects/${projectId}/render`),
    },
    {
      key: "5",
      ctrlKey: true,
      handler: () => router.push(`/projects/${projectId}/render`),
    },
  ];

  useKeyboardShortcuts(shortcuts);
}
