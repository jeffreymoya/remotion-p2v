# Hooks

## Directory Layout

```
src/hooks/
├── queries/              # TanStack Query hooks (server data)
│   ├── use-projects.ts
│   ├── use-boards.ts
│   └── ...
├── use-auto-save.ts      # Debounced auto-save with localStorage fallback
├── use-background-task.ts # Background activity monitor integration
├── use-stage-validation.ts # Memoized pipeline stage gate state
├── use-first-run.ts      # First-run detection
└── use-keyboard-shortcuts.ts
```

## Server Data vs. UI Hooks

- **`queries/`** — TanStack Query hooks for fetching/mutating server data. See `queries/CLAUDE.md` for patterns.
- **Root hooks** — Utility hooks for UI concerns (auto-save, keyboard, background tasks). These use `useState`/`useEffect` directly because they manage client-side state, not server data.

## Rules

- New hooks for server data (API calls) go in `queries/` using TanStack Query.
- New hooks for client-only state (UI, localStorage, keyboard) go in the root `hooks/` directory.
- Never mix server data fetching with UI hooks — keep them separate.
- Existing utility hooks to reuse before building new ones:
  - `useAutoSave` — debounced save with status tracking
  - `useBackgroundTask` — wraps async operations with timeout + toast notifications
  - `useStageValidation` — checks if a pipeline stage is locked/unlocked
