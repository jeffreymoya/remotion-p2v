# Repository Guidelines

## Project Structure & Module Organization
- Next.js UI in `app/` (dashboard, API routes, globals).
- Remotion compositions in `remotion/` (`compositions/`, `components/`, `hooks/`, `lib/`).
- Shared runtime in `src/` (`lib/`, `components/`; domain logic in `src/lib/storyflow/` and `src/lib/boards/`; generated in `src/generated/`).
- Prompts in `config/prompts/`; tests in `tests/` and `src/lib/__tests__/`; automation in `scripts/`.
- Prisma schemas in `prisma/`; pipeline artifacts in `public/projects/<project-id>/`.

## Build, Test, and Development Commands
- `npm run web:dev` — start the Next.js UI (primary workflow).
- `npm run dev` — open Remotion Studio for previews.
- `npm run web:build` / `npm run web:start` — build and serve the production UI.
- `npm run build` — bundle Remotion compositions.
- `npm run lint` — ESLint + TypeScript check.
- `npm run test` — unit/integration suite; `npm run test:all` adds edge-case e2e; `npm run test:e2e:fast` quick pipeline check.
- `npm run db:push:storyflow` then `npm run db:generate:storyflow` after schema edits.

## Coding Style & Naming Conventions
- TypeScript `strict`; ES modules.
- ESLint via `@remotion/eslint-config-flat`; format with Prettier (`npx prettier -w ...`).
- React components in PascalCase; hooks start with `use*`; API route folders lowercase.
- Tailwind utilities colocated with components; avoid editing generated code (`src/generated/**`, Prisma client).

## Testing Guidelines
- Unit specs `*.test.ts` via `tsx`, near code or in `tests/`.
- E2E in `tests/e2e/**`; fast suite sets `TEST_PREVIEW_ONLY=true`.
- Regenerate fixtures with `npm run test:fixtures`; binaries stay git-ignored under `tests/fixtures/`.
- Run `npm run test` (or `test:all` for pipeline changes) before PRs and note results.

## Commit & Pull Request Guidelines
- Commit messages: concise imperative/sentence case (no prefixes).
- Keep diffs focused; exclude generated media (`public/projects/**/*.mp4`, `out/`, `build/`, `cache/`, `logs/gemini/`).
- PRs include scope/intent, commands run, and screenshots or short clips for UI/rendering changes; link issues; call out breaking changes and new env vars.

## Security & Configuration Tips
- Primary AI path uses the **Gemini CLI subscription**. Install/auth `gemini`; use `gemini --yolo --model gemini-2.5-pro --output-format json "<prompt>"` (no API-style flags like `--temperature`).
- Copy `.env.example` to `.env`; set `GOOGLE_TTS_API_KEY` and `DATABASE_URL` or `STORYFLOW_DATABASE_URL`. Stock media keys are deprecated. Optional: provider keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) if switching away from the CLI.
- Never commit secrets; trim local logs if they capture sensitive input.
- Prefer `prisma` migrations over ad hoc SQL and document new env vars in `.env.example`.
