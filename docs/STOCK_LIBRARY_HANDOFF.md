# Stock Media Library Handoff (2025-11-30)

## Objectives
- Cache downloaded stock images **and videos** locally (tens of thousands scale) for reuse across projects.
- Prefer **local hits during gather**; only query online providers when local library cannot satisfy needs.
- Store searchable tags; deduplicate by SHA-256; retain provider/source URL for provenance. No license tracking required.
- Use **Postgres + Prisma** for metadata; storage on local filesystem (mounted drive, default `/media/videos`), 400px thumbnails for fast browsing.
- Enforce ~300 GB library budget with eviction; add a future knob to optimize stored originals (lossless recompress/conversion) without altering semantics.

## Operational Contracts & Policies
- **Availability/fail-fast**: if Postgres or `LIBRARY_ROOT` is unreachable, abort gather before remote downloads; clean temp files and emit a retryable error (no partial manifests).
- **Quota enforcement**: compute projected size before ingest; if > budget, block ingest and trigger async GC; GC uses global LRU by `lastUsedAt` across images + videos, skipping items referenced by in-progress manifests.
- **Path relocations**: store paths relative to `LIBRARY_ROOT` plus a recorded `libraryRootVersion`; provide a `media:rebase --from --to` utility when mounts change.
- **Filesystem safety**: require writable perms for the gather user, verify checksum after copy, and reject assets where mime/extension disagree.

## High-Level Architecture
- **Storage layout**
  - Library root (default): `/media/videos` (override via env). Keep `cache/library` only for local dev without the mount.
  - Originals: `<LIBRARY_ROOT>/{images|videos}/original/<sha-prefix>/<sha>.<ext>`
  - Thumbnails: `<LIBRARY_ROOT>/{images|videos}/thumbs/<sha>.jpg` (images 400px width; videos 400px poster frame)
  - Symlink or copy optional for project manifests (manifest paths stay per-project).
- **Database (Postgres via Prisma)**
  - Central metadata + tags; SHA-256 unique constraints; usage timestamps for ranking.
- **Services**
  - `LocalMediaRepo` (TS): ingest, search, fetch metadata, update usage, export to project.
  - Uses `sharp` for image probing + thumbs; `ffprobe-static` + `fluent-ffmpeg` (or pure `ffprobe` spawn) for video metadata + poster frame.
- **Thumbnails/posters**: capture poster at 1s (or mid-point if shorter), scale to 400px width preserving aspect; pad (not crop) to avoid distortion; retry once on extraction failure then mark thumb missing but keep asset usable.
- **Gather stage integration**
  1) After tag extraction, query local repo (videos first, then images). If sufficient matches (`minMatches`), use them and skip online search for that media type.
  2) When online search runs, every downloaded asset is ingested into the library (hash dedupe) and marked as used.
  3) Manifest entries note `source: 'local-library' | provider` and include `libraryId` for traceability.
  4) Fail fast if Postgres or the library root is unavailable (surface error; do not silently bypass local reuse).

## Prisma Data Model (draft)
```prisma
model Image {
  id           String   @id @default(uuid())
  sha256       String   @unique
  filename     String
  ext          String
  bytes        Int
  width        Int
  height       Int
  provider     String   // 'local-library' | 'pexels' | 'unsplash' | 'pixabay'
  sourceUrl    String?
  path         String   // absolute path to original
  thumbPath    String?
  createdAt    DateTime @default(now())
  lastUsedAt   DateTime @default(now())
  tags         ImageTag[]

  @@index([provider])
  @@index([lastUsedAt])
  @@index([width, height])
}

model Video {
  id           String   @id @default(uuid())
  sha256       String   @unique
  filename     String
  ext          String
  bytes        Int
  width        Int
  height       Int
  durationMs   Int
  fps          Int?
  videoCodec   String?
  audioCodec   String?
  bitrate      Int?
  hasAudio     Boolean  @default(false)
  provider     String
  sourceUrl    String?
  path         String
  thumbPath    String?  // poster frame
  createdAt    DateTime @default(now())
  lastUsedAt   DateTime @default(now())
  tags         VideoTag[]

  @@index([provider])
  @@index([lastUsedAt])
  @@index([width, height])
  @@index([durationMs])
}

model ImageTag {
  imageId String
  tag     String
  image   Image @relation(fields: [imageId], references: [id], onDelete: Cascade)
  @@id([imageId, tag])
  @@index([tag])
}

model VideoTag {
  videoId String
  tag     String
  video   Video @relation(fields: [videoId], references: [id], onDelete: Cascade)
  @@id([videoId, tag])
  @@index([tag])
}
```

## Config & Env
- `DATABASE_URL` (required) – Postgres connection string; gather fails if unreachable.
- `LIBRARY_ROOT` (optional, default `/media/videos`, fallback `cache/library`). Ensure mounted drive has ~300 GB free.
- Extend `config/stock-assets.json`:
```jsonc
{
  "localLibrary": {
    "enabled": true,
    "minMatches": { "videos": 1, "images": 3 },
    "limit": { "videos": 3, "images": 5 },
    "preferRecencyBoost": 0.1
  }
}
```

## Gather Stage Changes (where to hook)
- **Pre-search** (after tags):
  - `localRepo.searchVideos(tags, opts)`; if ≥ `minMatches.videos`, add to manifest and set `segmentHasVideo = true`.
  - If no videos or insufficient quality, continue with existing online video search; afterwards still run local image search if images needed.
  - `localRepo.searchImages(tags, opts)` before online image search. Skip remote image search if local results meet `minMatches.images`.
- **Post-download ingest**:
  - For each downloaded image/video, call `localRepo.ingestDownloaded(asset, tags, provider, sourceUrl)`.
  - Update `lastUsedAt` whenever an item is selected.
- **Manifest entries**:
  - Add `libraryId?: string` and `provider` (existing) + `sourceUrl?`.
  - Mark source as `local-library` when reused.

## Implementation Waves & Status
- [ ] Wave 1 — Prisma bootstrap: add schema file, `npx prisma init`, migrate `init_library`, add npm scripts.
- [ ] Wave 2 — Local repo core: implement `LocalMediaRepo` (ingest/search/markUsed), hashing, metadata probes, thumbnails/poster frames.
- [ ] Wave 3 — Gather wiring: pre-search local lookup (videos then images), post-download ingest, manifest fields, config defaults.
- [ ] Wave 4 — Tests & tooling: unit/integration, seed script, `media:stats`, e2e path for local-hit skip + failure-path coverage.
- [ ] Wave 5 — Performance polish: indexes verified, recency scoring tune, optional background thumb queue + quota enforcement and GC.
- [ ] Wave 6 — Future: semantic search spike (vector store / pgvector) and image optimization toggle.

## LocalMediaRepo API (proposed)
- `ingestImage(filePath, tags: string[], provider: string, sourceUrl?: string): Promise<ImageRecord>`
- `ingestVideo(filePath, tags: string[], provider: string, sourceUrl?: string): Promise<VideoRecord>`
- `searchImages(tags: string[], opts): Promise<ScoredImage[]>`
- `searchVideos(tags: string[], opts): Promise<ScoredVideo[]>`
- `markUsed(ids: string[], type: 'image' | 'video')`
- `ingestDownloaded(asset, tags, provider, sourceUrl?)` remains as gather-facing convenience; internally dispatches to image/video ingest.
- Internal scoring contract:
  - Inputs (`opts`): `minWidth`, `minHeight`, `minDurationMs?`, `desiredAspectRatio?`, `maxResults`, `preferRecencyBoost` (0..1).
  - Require ≥1 overlapping normalized tag; zero-overlap results are excluded.
  - Score = (tagAndWeight + tagOrWeight*0.5) + recencyBoost * sigmoid(daysSinceLastUse) + aspectFitBonus.
  - Tie-breakers: higher resolution, then more recent `lastUsedAt`, then lower `id` (stable).
- Optional (future Wave 6): semantic search fallback using embeddings + vector index when tag overlap yields low scores.

## Dependencies to Add
- Runtime: `prisma`, `@prisma/client`, `sharp`, `ffprobe-static`, `fluent-ffmpeg` (or direct `child_process` call to ffprobe), `crypto` (built-in).
- Dev: `tsx` already present; add `npm scripts`: `db:migrate`, `db:generate`, `db:studio` (optional).

## Migration & Setup Steps
1) `npm install prisma @prisma/client sharp ffprobe-static fluent-ffmpeg`.
2) `npx prisma init` → place schema at `prisma/schema.prisma` (using model above).
3) Update `.gitignore` to include `/cache/library/` and `/media/videos/` if mounted locally.
4) `npx prisma migrate dev --name init_library`.
5) `npm run db:check` (add small script) to verify connectivity; gather should fail fast if this fails.
6) Ensure `/media/videos` exists and has ~300 GB free or adjust `LIBRARY_ROOT`.

## Testing Plan
- Unit: hashing + dedupe, ingest idempotency (same file twice), tag normalization (lowercase + punctuation split), search scoring ordering, quota accounting helper.
- Integration: ingest → search → select → manifest write; video poster extraction works; thumbnails generated; fail-fast when DB or root is missing.
- E2E: in `tests/e2e/stage-gather.test.ts`, seed library with a few assets, run gather, assert remote search is skipped when local min matches are met, manifest points to `local-library`, and pipeline fails if Postgres or library root is unavailable.
- Add regression tests for quota block + GC kick, path rebase helper, and ingest transaction race (duplicate sha) to prevent orphaned tags.

## Performance / Scale Notes
- Tens of thousands assets: ensure DB indexes on `tag`, `lastUsedAt`, `sha256`; use `LIMIT` + `ORDER BY score`.
- Enforce ~300 GB quota; GC policy: global LRU by `lastUsedAt`, keep-by-provider caps, delete thumbs only after originals, never delete assets referenced in current manifests. Add a `media:gc` command.
- Store hashes and metadata once; avoid copying originals into each project—use copy-on-write or symlink when exporting to project assets.
- Consider background thumbnail generation with a small queue if ingestion becomes slow.
- Placeholder: optional lossless/lower-bitrate re-encode for originals to save space (behind a flag).

## Open Decisions / Follow-ups
- Small browsing UI later? (currently CLI-only).
- Semantic search: evaluate embeddings + pgvector as a fallback when tag overlap is low (Wave 6 spike).

## Next Concrete Steps
- Add Prisma schema + migrate.
- Implement `LocalMediaRepo` (ingest/search/markUsed) under `cli/services/media/local-repo.ts`.
- Wire into `cli/commands/gather.ts` pre-search and post-download paths for videos then images.
- Extend manifest types and config typing.
- Add tests and sample seed script (`npm run media:seed-local`) for CI.

## Resume Prompt for New Sessions
Copy/paste this to continue work:
```
You are continuing the stock media library implementation. Open docs/STOCK_LIBRARY_HANDOFF.md and pick up at the first unchecked wave in "Implementation Waves & Status". Keep storage local (cache/library), use Postgres via Prisma, prioritize videos for reuse in gather, and ensure gather searches local before online. Keep thumbnails at 400px. Proceed with the next tasks, updating the handoff doc status as you complete waves.
```
