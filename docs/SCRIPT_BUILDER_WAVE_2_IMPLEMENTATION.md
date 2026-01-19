# Script Builder Wave 2 Implementation

**Date:** 2026-01-12
**Status:** Completed
**Phase:** MVP (Phase 1) - Backend APIs and Prompt Templates

---

## Overview

This document describes the implementation of Wave 2 of the Script Builder PRD, which includes:
1. **Prompt Templates** for all script generation phases
2. **Service Layer** with business logic for blueprint and beat generation
3. **API Routes** for the complete script builder workflow
4. **Database Schema** updates with Blueprint and ScriptDraft models

---

## Files Created

### 1. Prompt Templates (`config/prompts/`)

| File | Purpose |
|------|---------|
| `script-builder-blueprint.prompt.ts` | Blueprint generation with beat calculation |
| `script-builder-hook.prompt.ts` | Opening hook prompt (Beat 1) with staccato style |
| `script-builder-middle.prompt.ts` | Middle beats with emotion-based modifiers |
| `script-builder-turn.prompt.ts` | Final beat/reflection with lyrical style |
| `script-builder-segment.prompt.ts` | TTS segmentation prompt |

**Updated:** `config/prompts/index.ts` to export all new prompt modules

### 2. Service Layer (`src/lib/storyflow/`)

| File | Purpose |
|------|---------|
| `script-builder.ts` | Core business logic for blueprint generation, beat execution, and segmentation |

**Key Functions:**
- `generateBlueprint(topic, targetDurationMs)` - Generate engagement blueprint
- `regenerateBlueprint(topic, targetDurationMs, rejectionNotes)` - Regenerate with feedback
- `executeBeat(beat, previousContent, isFirst, isLast, totalBeats)` - Execute single beat
- `segmentScript(polishedText, beats)` - Segment for TTS
- `calculateBeatCount(targetDurationMs)` - Beat calculation formula

### 3. API Routes (`app/api/script-builder/`)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/script-builder/blueprint` | POST | Generate new blueprint |
| `/api/script-builder/blueprint/[id]/approve` | PUT | Approve blueprint |
| `/api/script-builder/blueprint/[id]/regenerate` | POST | Regenerate with feedback |
| `/api/script-builder/execute` | POST | Execute multi-prompt script generation |
| `/api/script-builder/execute/[draftId]/status` | GET | Get execution progress |
| `/api/script-builder/segment` | POST | Create TTS-optimized segments |

### 4. Database Schema

**Updated:** `prisma/storyflow.schema.prisma`

**New Models:**
- `Blueprint` - Stores engagement blueprints with beats
- `ScriptDraft` - Tracks execution state with checkpointing

**New Enums:**
- `BlueprintStatus` - GENERATING, PENDING_REVIEW, APPROVED, REJECTED
- `ScriptDraftStatus` - DRAFTING, GLUING, POLISHING, COMPLETED, FAILED

**Updated Models:**
- `Project` - Added `blueprints` relation
- `Script` - Added optional `blueprintId` foreign key

---

## API Usage Examples

### 1. Generate Blueprint

```bash
curl -X POST http://localhost:3000/api/script-builder/blueprint \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "proj-123",
    "topic": "The Psychology of Toxic Fan Culture",
    "targetDurationMs": 720000
  }'
```

**Response:**
```json
{
  "blueprint": {
    "id": "bp-abc123",
    "projectId": "proj-123",
    "targetDurationMs": 720000,
    "status": "PENDING_REVIEW",
    "beats": [
      {
        "index": 1,
        "title": "The Provocative Hook",
        "coreArgument": "Toxic fandom has become normalized",
        "targetEmotion": "curiosity",
        "microHook": "When does passion cross the line?",
        "estimatedDurationMs": 90000,
        "mediaSuggestions": ["Fan reactions", "Social media"]
      }
    ],
    "version": 1,
    "createdAt": "2026-01-12T10:00:00Z"
  },
  "message": "Blueprint generated with 6 beats"
}
```

### 2. Approve Blueprint

```bash
curl -X PUT http://localhost:3000/api/script-builder/blueprint/bp-abc123/approve \
  -H "Content-Type: application/json"
```

### 3. Execute Script Generation

```bash
curl -X POST http://localhost:3000/api/script-builder/execute \
  -H "Content-Type: application/json" \
  -d '{
    "blueprintId": "bp-abc123"
  }'
```

**Response:**
```json
{
  "scriptDraftId": "draft-xyz",
  "status": "COMPLETED",
  "totalBeats": 6,
  "message": "Script execution completed successfully"
}
```

### 4. Check Execution Status

```bash
curl -X GET http://localhost:3000/api/script-builder/execute/draft-xyz/status
```

**Response:**
```json
{
  "status": "DRAFTING",
  "currentBeatIndex": 3,
  "completedBeats": 2,
  "totalBeats": 6,
  "lastCheckpoint": "2026-01-12T10:05:00Z",
  "progress": 33.33
}
```

### 5. Create Segments

```bash
curl -X POST http://localhost:3000/api/script-builder/segment \
  -H "Content-Type: application/json" \
  -d '{
    "draftId": "draft-xyz"
  }'
```

**Response:**
```json
{
  "script": {
    "id": "script-123",
    "projectId": "proj-123",
    "blueprintId": "bp-abc123",
    "title": "The Psychology of Toxic Fan Culture — Script Builder",
    "segments": [
      {
        "index": 1,
        "text": "Have you ever watched...",
        "wordCount": 142,
        "estimatedDuration": 60
      }
    ]
  },
  "message": "Script segmented into 8 segments"
}
```

### 6. Regenerate Blueprint

```bash
curl -X POST http://localhost:3000/api/script-builder/blueprint/bp-abc123/regenerate \
  -H "Content-Type: application/json" \
  -d '{
    "rejectionNotes": "Beat 2 is too generic, needs more edge. Beat 4 should use dread emotion instead of hope."
  }'
```

---

## Key Features Implemented

### 1. Beat Calculation Formula
```typescript
beatCount = max(4, ceil(targetDurationMs / 120000))
```

**Examples:**
- 5 min (300s) → 4 beats
- 8 min (480s) → 4 beats
- 12 min (720s) → 6 beats
- 20 min (1200s) → 10 beats

### 2. Prompt Strategy

The system uses a **hybrid prompt structure**:
- **Hook Prompt** (Beat 1): Staccato rhythm, direct address, pattern interrupt
- **Middle Prompts** (Beats 2-N-1): Emotion-based modifiers (AI-selected)
- **Turn Prompt** (Beat N): Lyrical, reflective, closes loops

### 3. Emotion-Based Style Modifiers

| Emotion | Primary Modifiers |
|---------|-------------------|
| curiosity | Pattern interrupt, open loops, direct address |
| anger | Staccato rhythm, concrete examples, rhetorical questions |
| dread | Slow pacing, sensory language, foreshadowing |
| hope | Flowing sentences, future tense, concrete analogies |
| surprise | Short punch lines, contrast, unexpected pivots |
| validation | Second person, shared experience, recognition |
| urgency | Imperative mood, time pressure, statistics |
| reflection | Ambiguous questions, lyricism, metaphor |

### 4. Checkpointing & Recovery

- **After each beat**: System saves checkpoint to database
- **On failure**: Execution can resume from last checkpoint
- **State tracking**: `currentBeatIndex` tracks progress
- **Beat drafts**: All completed beats stored in JSON array

### 5. Word Count Calculation

- Target: **140 words per minute**
- Formula: `wordCount = (durationMs / 60000) * 140`
- Example: 90 second beat → ~210 words

---

## Testing

### Automated Test Script

Run the comprehensive test:
```bash
./test-script-builder-api.sh
```

This will:
1. Create a test project
2. Generate a blueprint
3. Approve the blueprint
4. Execute script generation
5. Check execution status
6. Create segments

### Manual Testing

1. Start the Next.js dev server:
   ```bash
   npm run dev
   ```

2. Use the curl commands above to test each endpoint individually

3. Monitor Gemini API calls in logs:
   ```bash
   tail -f logs/gemini-api.log
   ```

---

## Error Handling

### Network Errors
- **Timeout**: 5-minute timeout for Gemini calls
- **Retry**: Not implemented in MVP (planned for v1.1)
- **Checkpoint**: State saved before each beat

### Validation Errors
- Blueprint beats validated with Zod schema
- Invalid emotions rejected
- Missing required fields return 400 error

### Business Logic Errors
- Blueprint must be APPROVED before execution
- Script draft must be COMPLETED before segmentation
- Missing beats return 400 error

---

## Database Migrations

After schema changes, run:
```bash
npx prisma generate --schema=prisma/storyflow.schema.prisma
```

To apply migrations:
```bash
npx prisma migrate dev --schema=prisma/storyflow.schema.prisma
```

---

## Success Criteria

✅ All prompt templates created and exported
✅ Service layer methods handle Gemini calls
✅ All API routes created and tested
✅ Checkpoint logic works for resume capability
✅ Beat calculation formula implemented
✅ Error handling for network failures
✅ Word count targets calculated correctly
✅ Blueprint regeneration with feedback
✅ Segmentation creates TTS-optimized output

---

## Next Steps (Phase 2 - v1.1)

The following features are planned for the next iteration:

1. **Per-Beat Regeneration** - Regenerate individual beats after execution
2. **Glue Phase** - Inline editor with robot word detection and seam highlighting
3. **Rejection Notes** - User provides guidance when rejecting beats
4. **Duration Override** - User can override project default duration
5. **Full Artifact History** - Store all versions of blueprints and drafts
6. **Resume from Checkpoint** - API endpoint to resume failed executions

---

## Known Limitations (MVP)

- No per-beat regeneration (full regeneration only)
- No glue phase (robot word detection)
- No rejection notes UI (rejectionNotes field exists but not used in MVP)
- No retry logic for failed Gemini calls
- No streaming progress updates (polling only)
- No A/B variants

---

## Configuration

### Environment Variables

Required:
```bash
STORYFLOW_DATABASE_URL="file:./prisma/storyflow.db"
GEMINI_MODEL="gemini-2.5-pro"
GEMINI_TEMPERATURE="0.7"
GEMINI_MAX_TOKENS="8000"
```

### Model Selection

Default models (from PRD recommendations):
- **Blueprint**: `gemini-2.5-flash` (speed)
- **Execution**: `gemini-2.5-pro` (quality)
- **Segmentation**: `gemini-2.5-flash` (speed)

---

## Troubleshooting

### Blueprint Generation Fails
- Check Gemini CLI is installed: `which gemini`
- Verify API key: `gemini --version`
- Check logs: `logs/gemini-api.log`

### Execution Gets Stuck
- Check status endpoint: `/api/script-builder/execute/[draftId]/status`
- Review checkpoint in database
- Check for timeout errors in console

### Segmentation Returns Empty
- Verify draft status is COMPLETED
- Check polishedText field exists
- Ensure beats array is not empty

---

## References

- **PRD**: `docs/specs/SCRIPT_BUILDER_PRD.md`
- **Prompt Research**: `docs/script-prompting-technique.md`
- **Gemini CLI**: `cli/services/ai/gemini-cli.ts`
- **Existing Script API**: `app/api/ai/script/route.ts`

---

*Implementation completed: 2026-01-12*
