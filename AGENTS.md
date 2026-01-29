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

## Skills
A skill is a set of local instructions to follow that is stored in a `SKILL.md` file. Below is the list of skills that can be used. Each entry includes a name, description, and file path so you can open the source for full instructions when using a specific skill.

### Available skills
- skill-creator: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Codex's capabilities with specialized knowledge, workflows, or tool integrations. (file: /home/jeffreymoya/.codex/skills/.system/skill-creator/SKILL.md)
- skill-installer: Install Codex skills into $CODEX_HOME/skills from a curated list or a GitHub repo path. Use when a user asks to list installable skills, install a curated skill, or install a skill from another repo (including private repos). (file: /home/jeffreymoya/.codex/skills/.system/skill-installer/SKILL.md)

### How to use skills
- Discovery: The list above is the skills available in this session (name + description + file path). Skill bodies live on disk at the listed paths.
- Trigger rules: If the user names a skill (with `$SkillName` or plain text) OR the task clearly matches a skill's description shown above, you must use that skill for that turn. Multiple mentions mean use them all. Do not carry skills across turns unless re-mentioned.
- Missing/blocked: If a named skill isn't in the list or the path can't be read, say so briefly and continue with the best fallback.
- How to use a skill (progressive disclosure):
  1) After deciding to use a skill, open its `SKILL.md`. Read only enough to follow the workflow.
  2) If `SKILL.md` points to extra folders such as `references/`, load only the specific files needed for the request; don't bulk-load everything.
  3) If `scripts/` exist, prefer running or patching them instead of retyping large code blocks.
  4) If `assets/` or templates exist, reuse them instead of recreating from scratch.
- Coordination and sequencing:
  - If multiple skills apply, choose the minimal set that covers the request and state the order you'll use them.
  - Announce which skill(s) you're using and why (one short line). If you skip an obvious skill, say why.
  - Keep context small: summarize long sections instead of pasting them; only load extra files when needed.
  - Avoid deep reference-chasing: prefer opening only files directly linked from `SKILL.md` unless you're blocked.
  - When variants exist (frameworks, providers, domains), pick only the relevant reference file(s) and note that choice.
- Safety and fallback: If a skill can't be applied cleanly (missing files, unclear instructions), state the issue, pick the next-best approach, and continue.
