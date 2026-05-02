# Remotion AI Video Template

> NOTE: The legacy CLI has been removed. Use the Web UI for all workflows. A backup of the removed CLI implementation is available in the `backup/cli-removed` branch for reference.

Create short-form AI videos with Remotion, AI for script generation, and Google TTS (word-level timestamps). The project uses the **boards** pipeline for viewport generation (grid-based detective boards with word-level camera triggers).

## Setup
- Install dependencies: `npm install`
- Copy env template: `cp .env.example .env` (or `.env.local`) and fill at least:
  - `GOOGLE_TTS_API_KEY`
- Stock media API keys are no longer required (online providers deprecated)
  - `DATABASE_URL` or `STORYFLOW_DATABASE_URL` for SQLite database
- Install and authenticate the Gemini CLI (required for AI steps like script generation and boards prompts/regions). Verify with `gemini --version`.
- Set up the database: `npm run db:push:storyflow`
- Start the web UI: `npm run web:dev`
- (Optional) Start Remotion Studio for previews: `npm run dev`

## End-to-End Web UI Workflow (No CLI)
1) Start the app: `npm run web:dev` and open `http://localhost:3000`
2) Create a project (`/projects/new`)
   - Enter a project name
   - Choose an aspect ratio (9:16 or 16:9)
3) Generate the script (`/projects/[id]/script`)
   - Use the beat-based Script Builder workflow
   - Review the blueprint, execute beats, polish, segment, and generate TTS audio
4) Manage assets (`/projects/[id]/media`)
   - Upload custom images, video clips, music, or audio
   - Choose music and map images to script segments
5) Build the storyboard (`/projects/[id]/storyboard`)
   - Plan board groupings, generate prompts, upload board images, detect regions, generate triggers, and build viewport JSON
6) Build the timeline (`/projects/[id]/build`)
   - Assemble viewport paths and triggers before final render
7) Render the final video (`/projects/[id]/render`)
   - Preview the current timeline
   - Choose a quality preset and render
   - Outputs save to `public/projects/<project-id>/renders/<render-id>.mp4`

### Web UI Workflow Flowchart (ASCII)
```text
[Start Web UI]
      |
[Create Project]
      |
[Script Generation]
      |
[Media (Music + Uploads)]
      |
[Storyboard]
      |
[Build] -----> [Render Video]
      |
      +--> iterate back to Script Generation / Media / Storyboard
```

## Project Artifact Structure
Most generated files live in `public/projects/<project-id>/` (project metadata like scripts and settings are stored in SQLite):

```
public/projects/<project-id>/
├── assets/
│   ├── audio/segment-*.mp3           # TTS audio with word timestamps
│   ├── images/                       # Uploaded or board images
│   ├── music/                        # Optional background music
│   └── videos/                       # Optional video clips
├── boards/                           # Board pipeline artifacts
│   ├── board-plan.json
│   ├── board-prompts.json
│   ├── board-regions.json
│   └── board-triggers.json
├── viewport.json                     # Camera path built from boards
├── timeline.json                     # Final Remotion timeline
└── renders/<render-id>.mp4           # Rendered videos
```

## Pipeline Stages

The video generation pipeline consists of:

1. **Script Builder** - Beat-based blueprint, review, execution, polish, and segmentation
2. **TTS** - Segment audio with word-level timestamps
3. **Assets** - Manual uploads and optional background music
4. **Boards Planning** - Create grid-based boards and image prompts
5. **Region Detection** - Identify areas of interest in board images
6. **Trigger Generation** - Create word-level camera movements
7. **Viewport Build** - Generate camera path across boards
8. **Timeline Assembly** - Combine all elements into Remotion timeline
9. **Render** - Produce final video via Remotion

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
- **AI Providers** - Gemini CLI (default) with optional provider configuration
- **Media Assets** - Manual uploads plus optional Pixabay music

## Credits
Template by [@webmonch](https://github.com/webmonch). Contributions mirrored from the Remotion monorepo.
