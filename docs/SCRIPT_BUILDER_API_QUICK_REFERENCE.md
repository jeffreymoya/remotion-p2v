# Script Builder API Quick Reference

Quick reference guide for Script Builder API endpoints.

---

## Workflow Overview

```
1. Generate Blueprint → 2. Approve → 3. Execute → 4. Check Status → 5. Segment
```

---

## Endpoints

### 1. Generate Blueprint

**POST** `/api/script-builder/blueprint`

Generate engagement blueprint with beats.

**Request:**
```json
{
  "projectId": "proj-123",
  "topic": "The Psychology of Toxic Fan Culture",
  "targetDurationMs": 720000
}
```

**Response:**
```json
{
  "blueprint": {
    "id": "bp-abc123",
    "status": "PENDING_REVIEW",
    "beats": [...],
    "version": 1
  },
  "message": "Blueprint generated with 6 beats"
}
```

**Beat Structure:**
```json
{
  "index": 1,
  "title": "The Provocative Hook",
  "coreArgument": "What is conveyed",
  "targetEmotion": "curiosity",
  "microHook": "Question that opens this beat",
  "estimatedDurationMs": 90000,
  "mediaSuggestions": ["Visual 1", "Visual 2"]
}
```

---

### 2. Approve Blueprint

**PUT** `/api/script-builder/blueprint/[id]/approve`

Mark blueprint as approved and ready for execution.

**Request:** Empty body

**Response:**
```json
{
  "blueprint": {...},
  "message": "Blueprint approved successfully"
}
```

---

### 3. Regenerate Blueprint

**POST** `/api/script-builder/blueprint/[id]/regenerate`

Regenerate blueprint with feedback.

**Request:**
```json
{
  "rejectionNotes": "Beat 2 is too generic. Beat 4 should use dread instead of hope."
}
```

**Response:**
```json
{
  "blueprint": {...},
  "message": "Blueprint regenerated (v2)"
}
```

---

### 4. Execute Script

**POST** `/api/script-builder/execute`

Execute multi-prompt script generation for all beats.

**Request:**
```json
{
  "blueprintId": "bp-abc123"
}
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

**Notes:**
- Executes sequentially beat by beat
- Saves checkpoint after each beat
- Can take 2-5 minutes for 6 beats
- Use status endpoint to monitor progress

---

### 5. Check Execution Status

**GET** `/api/script-builder/execute/[draftId]/status`

Get real-time execution progress.

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

**Status Values:**
- `DRAFTING` - In progress
- `COMPLETED` - All beats done
- `FAILED` - Error occurred

---

### 6. Create Segments

**POST** `/api/script-builder/segment`

Create TTS-optimized segments from completed draft.

**Request:**
```json
{
  "draftId": "draft-xyz"
}
```

**Response:**
```json
{
  "script": {
    "id": "script-123",
    "title": "Topic — Script Builder",
    "segments": [
      {
        "index": 1,
        "text": "Segment text...",
        "wordCount": 142,
        "estimatedDuration": 60
      }
    ]
  },
  "message": "Script segmented into 8 segments"
}
```

**Notes:**
- Draft must have status COMPLETED
- Creates 8-12 segments (100-150 words each)
- Updates project status to SCRIPT_READY

---

### 7. History (read-only)

**GET** `/api/script-builder/blueprint/[id]/history`

Return all stored snapshots for a blueprint (latest first).

**GET** `/api/script-builder/draft/[draftId]/history`

Return all stored snapshots for a script draft (latest first).

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

**Common Status Codes:**
- `400` - Validation error or invalid state
- `404` - Resource not found
- `500` - Server error (Gemini failure, etc.)

---

## Beat Calculation

**Formula:** `beatCount = max(4, ceil(targetDurationMs / 120000))`

| Duration | Beats |
|----------|-------|
| 5 min | 4 |
| 8 min | 4 |
| 10 min | 5 |
| 12 min | 6 |
| 15 min | 8 |
| 20 min | 10 |

---

## Target Emotions

Valid values for `targetEmotion`:
- `curiosity` - Opening hooks, mysteries
- `anger` - Injustice, controversy
- `dread` - Building tension
- `hope` - Resolution, possibility
- `surprise` - Pattern interrupts
- `validation` - Agreement, recognition
- `urgency` - Call to action
- `reflection` - Contemplation, ambiguity

---

## Word Count Standards

- **WPM:** 140 words per minute
- **Segment Target:** 100-150 words
- **Calculation:** `wordCount = (durationMs / 60000) * 140`

**Example:** 90-second beat → ~210 words

---

## Curl Examples

```bash
# Generate blueprint
curl -X POST http://localhost:3000/api/script-builder/blueprint \
  -H "Content-Type: application/json" \
  -d '{"projectId":"proj-123","topic":"Topic","targetDurationMs":720000}'

# Approve
curl -X PUT http://localhost:3000/api/script-builder/blueprint/bp-123/approve

# Execute
curl -X POST http://localhost:3000/api/script-builder/execute \
  -H "Content-Type: application/json" \
  -d '{"blueprintId":"bp-123"}'

# Check status
curl http://localhost:3000/api/script-builder/execute/draft-123/status

# Segment
curl -X POST http://localhost:3000/api/script-builder/segment \
  -H "Content-Type: application/json" \
  -d '{"draftId":"draft-123"}'

# Regenerate
curl -X POST http://localhost:3000/api/script-builder/blueprint/bp-123/regenerate \
  -H "Content-Type: application/json" \
  -d '{"rejectionNotes":"Make it more engaging"}'
```

---

## Testing

Run the comprehensive test:
```bash
./test-script-builder-api.sh
```

Or manually test each endpoint using the curl examples above.

---

## Troubleshooting

**Blueprint generation fails:**
- Check Gemini CLI: `which gemini`
- Verify API key is configured
- Check logs for details

**Execution gets stuck:**
- Use status endpoint to check progress
- Check database for latest checkpoint
- Execution can take 2-5 minutes

**Segmentation fails:**
- Verify draft status is COMPLETED
- Ensure polishedText field exists
- Check beats array is not empty

---

*Quick Reference for Script Builder Wave 2*
*Last Updated: 2026-01-12*
