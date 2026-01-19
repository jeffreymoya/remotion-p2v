# Remotion AI Video Template

> NOTE: A backup of the removed CLI implementation is available in the `backup/cli-removed` branch for reference.

Create short-form AI videos with Remotion, AI for script generation, and Google TTS (word-level timestamps). The project uses the **boards** pipeline for viewport generation (grid-based detective boards with word-level camera triggers).

## Setup
- Install dependencies: `npm install`
- Copy env template: `cp .env.example .env` (or `.env.local`) and fill at least:
  - `GEMINI_API_KEY` (default LLM), or `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`
  - `GOOGLE_TTS_API_KEY`
  - One stock media key (`PEXELS_API_KEY`, `UNSPLASH_ACCESS_KEY`, or `PIXABAY_API_KEY`)
  - `DATABASE_URL` or `STORYFLOW_DATABASE_URL` for SQLite database
- Set up the database: `npm run db:push:storyflow`
- Start the web UI: `npm run web:dev`
- (Optional) Start Remotion Studio for previews: `npm run dev`

## Web UI Workflow
1) Start the app: `npm run web:dev`
2) Use the in-app flow to:
   - Create a new project
   - Generate scripts using the Script Builder API
   - Configure video settings (aspect ratio, style, etc.)
   - Generate TTS audio and gather media assets
   - Build boards and viewport (camera path)
   - Assemble timeline
   - Render final video

## Project Artifact Structure
All generated files live in `public/projects/<project-id>/`:

```
public/projects/<project-id>/
├── scripts/script-v1.json
├── assets/
│   ├── audio/segment-*.mp3           # TTS audio with word timestamps
│   └── images/                       # Stock or board images
├── boards/                           # Board pipeline artifacts
│   ├── board-plan.json
│   ├── board-prompts.json
│   ├── board-regions.json
│   └── board-triggers.json
├── viewport.json                     # Camera path built from boards
├── timeline.json                     # Final Remotion timeline
└── preview.mp4 / final.mp4           # Rendered videos
```

## Pipeline Stages

The video generation pipeline consists of:

1. **Script Generation** - AI-powered script builder with hooks, segments, and turns
2. **Gather Assets** - TTS audio (with word-level timestamps) + stock media
3. **Boards Planning** - Create grid-based "detective boards" with image prompts
4. **Region Detection** - Identify areas of interest in board images
5. **Trigger Generation** - Create word-level camera movements
6. **Viewport Build** - Generate smooth camera path across boards
7. **Timeline Assembly** - Combine all elements into Remotion timeline
8. **Render** - Produce final video via Remotion

## Development Scripts

### Core Commands
- `npm run web:dev` - Start Next.js web UI (port 3000)
- `npm run dev` - Start Remotion Studio for video preview

### Database
- `npm run db:generate:storyflow` - Generate Prisma client
- `npm run db:push:storyflow` - Push schema changes to database

### Testing
- `npm run test` - Run all unit tests
- `npm run test:boards-triggers` - Boards trigger tests
- `npm run test:boards-build` - Boards build tests
- `npm run test:e2e:fast` - Fast E2E tests (preview only)
- `npm run test:all` - All tests including edge cases

### Linting
- `npm run lint` - Run ESLint + TypeScript check

## Key Technologies

- **Next.js** - Web UI framework
- **Remotion** - Programmatic video creation
- **Prisma** - Database ORM (SQLite)
- **Google TTS** - Text-to-speech with word timestamps
- **AI Providers** - Gemini, OpenAI, or Anthropic for script generation
- **Stock Media** - Pexels, Unsplash, Pixabay integration

## Credits
Template by [@webmonch](https://github.com/webmonch). Contributions mirrored from the Remotion monorepo.
