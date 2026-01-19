# CLAUDE.md

## Commands

```bash
npm run web:dev              # Start Next.js web UI (primary workflow)
npm run dev                  # Start Remotion Studio for video preview
npm run lint                 # ESLint + TypeScript check
npm run test                 # Run all unit tests
npm run db:generate:storyflow && npm run db:push:storyflow  # Database setup
```

## Architecture

**Next.js web app** (`app/`) with SQLite/Prisma (`prisma/storyflow.schema.prisma`). No CLI - all operations via web UI.

### Pipeline Stages
1. **Script** → AI script generation via Script Builder
2. **Gather** → TTS audio (Google TTS) + stock media (Pexels/Unsplash/Pixabay)
3. **Boards** → Grid layouts, image prompts, region detection, camera triggers
4. **Build** → Generate `viewport.json` + `timeline.json`
5. **Render** → Final video via Remotion

### Key Directories
| Directory | Purpose |
|-----------|---------|
| `app/` | Next.js UI + API routes |
| `src/components/` | Remotion components (AIVideo, Background, Subtitle, Word) |
| `src/lib/storyflow/` | Core business logic (projects, scripts, TTS, assets, rendering) |
| `src/lib/boards/` | Boards pipeline (plan, prompts, regions, triggers, viewport) |
| `config/prompts/` | AI prompt templates |
| `public/projects/<id>/` | Project artifacts (scripts, assets, timeline, viewport) |

### Types
- `src/lib/types.ts` - Timeline schemas (BackgroundElement, TextElement, AudioElement, ViewportAnimation)
- `src/lib/boards-types.ts` - Boards types (BoardPlan, BoardRegion, ViewportTrigger)
- `src/lib/storyflow/types.ts` - Project types (Project, Script, Asset, Viewport, Board)

## Gemini CLI (Critical)

This project uses **Gemini CLI with subscription** (not API keys).

```bash
gemini --yolo --model <model> --output-format json "<prompt>"
```

| Flag | Purpose |
|------|---------|
| `--yolo` | Auto-approve actions (required for non-interactive) |
| `--model` | Model selection (default: `gemini-2.5-pro`) |
| `--output-format` | `text`, `json`, or `stream-json` |

**Do NOT use `--temperature` or other API-style params** - not supported by CLI.

Files: `src/lib/storyflow/ai.ts`, `script-builder.ts`, `viewport.ts`, `app/api/ai/refine/route.ts`

## Project Structure

```
public/projects/<project-id>/
├── scripts/script-v1.json     # Script
├── assets/audio/segment-*.mp3 # TTS with word timestamps
├── assets/images/             # Media
├── boards/                    # Board pipeline artifacts
├── viewport.json              # Camera path
├── timeline.json              # Remotion timeline
└── preview.mp4 / final.mp4
```

## Database

Schema: `prisma/storyflow.schema.prisma`

Models: `Project` (status: DRAFT → SCRIPT_READY → ASSETS_READY → BOARDS_READY → RENDER_READY → COMPLETED), `Blueprint`, `ScriptDraft`, `Board`, `Asset`, `Render`

## Environment Variables

**Required:**
- `GOOGLE_TTS_API_KEY` - Text-to-speech
- Stock media: `PEXELS_API_KEY` or `UNSPLASH_ACCESS_KEY` or `PIXABAY_API_KEY`
- `DATABASE_URL` / `STORYFLOW_DATABASE_URL` - SQLite path

**AI:** Uses Gemini CLI with subscription. Ensure `gemini` is installed and authenticated.

**Optional:** `GEMINI_MODEL`, `ENABLE_SCRIPT_BUILDER=true`
