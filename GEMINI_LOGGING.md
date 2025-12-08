# Gemini API Logging

This project now includes comprehensive logging for all Gemini API calls.

## Overview

Every prompt sent to the Gemini API is automatically logged with:
- **Timestamp**: ISO 8601 format
- **Pipeline stage**: Which part of the pipeline made the call
- **Prompt**: The full prompt sent to Gemini
- **Response**: The full response from Gemini
- **Model configuration**: Model name, temperature, max tokens
- **Duration**: How long the request took (in milliseconds)
- **Error information**: If the request failed
- **Metadata**: Additional context (retries, validation, etc.)

## Log Location

Logs are stored in: `logs/gemini/`

Each day's logs are in a separate file: `YYYY-MM-DD.jsonl`

Example: `logs/gemini/2025-12-08.jsonl`

## Log Format

Logs are stored in JSONL format (JSON Lines) - one JSON object per line.

Example log entry:
```json
{
  "timestamp": "2025-12-08T01:19:24.386Z",
  "pipelineStage": "viewport-analysis",
  "prompt": "Analyze viewport regions...",
  "response": "{\"regions\": [...]}",
  "model": "gemini-2.5-flash-lite",
  "temperature": 0.7,
  "maxTokens": 8000,
  "duration": 8641,
  "metadata": {
    "isRetry": false,
    "structuredOutput": true,
    "validated": true,
    "status": "completed"
  }
}
```

## Pipeline Stages

The following pipeline stages are logged:

- `viewport-analysis` - Viewport/keyframe detection from images
- `image-selection` - Selecting the best image from candidates
- `search-query-generation` - Generating search queries for image scraping
- `tag-extraction` - Extracting tags from content
- `emphasis-detection` - Detecting emphasis in text
- `unknown` - Stage not specified (should be rare)

## Viewing Logs

### Using jq (recommended)

View all logs for today:
```bash
cat logs/gemini/$(date +%Y-%m-%d).jsonl | jq
```

Filter by pipeline stage:
```bash
cat logs/gemini/2025-12-08.jsonl | jq 'select(.pipelineStage == "viewport-analysis")'
```

View only errors:
```bash
cat logs/gemini/2025-12-08.jsonl | jq 'select(.error != null)'
```

Count requests by stage:
```bash
cat logs/gemini/2025-12-08.jsonl | jq -r '.pipelineStage' | sort | uniq -c
```

Calculate average duration:
```bash
cat logs/gemini/2025-12-08.jsonl | jq -s 'map(select(.duration != null)) | add / length'
```

### Programmatic Access

```typescript
import { GeminiLogger } from './cli/services/ai/gemini-logger';

const logger = GeminiLogger.getInstance();

// Get all logs for today
const todayLogs = await logger.getLogsForDate(new Date());

// Get logs for a specific stage
const viewportLogs = await logger.getLogsByPipelineStage('viewport-analysis');
```

## Implementation Details

### GeminiLogger Class

Location: `cli/services/ai/gemini-logger.ts`

Key methods:
- `log()` - Log a complete entry
- `logResponse()` - Log a successful response
- `logError()` - Log an error
- `getLogsForDate()` - Retrieve logs for a specific date
- `getLogsByPipelineStage()` - Filter logs by pipeline stage

### Integration Points

The logger is integrated into:

1. **GeminiCLIProvider** (`cli/services/ai/gemini-cli.ts`)
   - Logs all `complete()` calls
   - Logs all `structuredComplete()` calls
   - Includes retry tracking and validation errors

2. **Viewport Analysis** (`cli/commands/viewport.ts`)
   - Sets pipeline stage to `viewport-analysis`

3. **Web Scraper** (`cli/services/media/web-scraper.ts`)
   - Sets pipeline stage to `image-selection`
   - Sets pipeline stage to `search-query-generation`

## Privacy & Security

- Logs contain the full prompts and responses
- Image paths in multimodal prompts are sanitized: `@/path/image.png` → `[with image: /path/image.png]`
- Logs are gitignored by default (`.gitignore` excludes `logs/gemini/`)
- Consider data sensitivity when sharing logs

## Testing

Unit tests are located at: `cli/services/ai/__tests__/gemini-logger.test.ts`

Run tests:
```bash
npx tsx --test cli/services/ai/__tests__/gemini-logger.test.ts
```

## Example Queries

**Find all failed requests:**
```bash
cat logs/gemini/*.jsonl | jq 'select(.error != null) | {stage: .pipelineStage, error: .error, duration: .duration}'
```

**Get response times by stage:**
```bash
cat logs/gemini/2025-12-08.jsonl | jq -r 'select(.duration != null) | "\(.pipelineStage):\(.duration)"' | sort
```

**Count successful vs failed requests:**
```bash
cat logs/gemini/2025-12-08.jsonl | jq -r '.metadata.status' | sort | uniq -c
```

**View all viewport analysis prompts:**
```bash
cat logs/gemini/2025-12-08.jsonl | jq 'select(.pipelineStage == "viewport-analysis") | .prompt'
```

## Future Enhancements

Potential improvements:
- Log rotation/archival for older logs
- Aggregated analytics and metrics
- Dashboard for visualizing API usage
- Cost tracking based on token usage
- Alert system for high error rates
