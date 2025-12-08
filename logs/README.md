# Logs Directory

This directory contains logs for various pipeline operations.

## Gemini API Logs

Location: `logs/gemini/`

All Gemini API calls are automatically logged in JSONL format (one JSON object per line), organized by date.

### File Format

Each day's logs are stored in a separate file: `YYYY-MM-DD.jsonl`

Example: `2025-12-08.jsonl`

### Log Entry Structure

Each log entry contains:

```typescript
{
  timestamp: string;           // ISO 8601 timestamp
  pipelineStage: string;       // Pipeline stage (e.g., "viewport-analysis", "image-selection")
  prompt: string;              // The prompt sent to Gemini
  response: string;            // The response from Gemini
  model: string;               // Model used (e.g., "gemini-2.5-flash-lite")
  temperature: number;         // Temperature setting
  maxTokens: number;           // Max tokens setting
  duration?: number;           // Request duration in milliseconds
  error?: string;              // Error message if request failed
  metadata?: {                 // Additional metadata
    logId?: string;           // Unique log ID
    status?: string;          // Status (e.g., "completed", "error")
    isRetry?: boolean;        // Whether this was a retry
    retryCount?: number;      // Retry attempt number
    structuredOutput?: boolean; // Whether structured output was used
    validated?: boolean;      // Whether response was validated
    // ... other metadata fields
  }
}
```

### Pipeline Stages

Common pipeline stages you'll see in the logs:

- `viewport-analysis` - Viewport/keyframe detection from images
- `image-selection` - Selecting the best image from candidates
- `search-query-generation` - Generating search queries for image scraping
- `tag-extraction` - Extracting tags from content
- `emphasis-detection` - Detecting emphasis in text
- `unknown` - Stage not specified

### Reading Logs

Since logs are in JSONL format, you can:

1. **View all logs for today:**
   ```bash
   cat logs/gemini/$(date +%Y-%m-%d).jsonl | jq
   ```

2. **Filter by pipeline stage:**
   ```bash
   cat logs/gemini/2025-12-08.jsonl | jq 'select(.pipelineStage == "viewport-analysis")'
   ```

3. **View only errors:**
   ```bash
   cat logs/gemini/2025-12-08.jsonl | jq 'select(.error != null)'
   ```

4. **Count requests by stage:**
   ```bash
   cat logs/gemini/2025-12-08.jsonl | jq -r '.pipelineStage' | sort | uniq -c
   ```

5. **View prompts and responses:**
   ```bash
   cat logs/gemini/2025-12-08.jsonl | jq '{stage: .pipelineStage, prompt: .prompt, response: .response}'
   ```

6. **Calculate average duration:**
   ```bash
   cat logs/gemini/2025-12-08.jsonl | jq -s 'map(select(.duration != null)) | add / length'
   ```

### Programmatic Access

You can also access logs programmatically using the `GeminiLogger` class:

```typescript
import { GeminiLogger } from './cli/services/ai/gemini-logger';

const logger = GeminiLogger.getInstance();

// Get all logs for today
const todayLogs = await logger.getLogsForDate(new Date());

// Get logs for a specific stage
const viewportLogs = await logger.getLogsByPipelineStage('viewport-analysis');

// Get logs for a specific date and stage
const specificLogs = await logger.getLogsByPipelineStage(
  'image-selection',
  new Date('2025-12-08')
);
```

### Privacy & Security

- Logs contain the full prompts and responses from Gemini
- Image paths in multimodal prompts are sanitized for readability
- Consider the sensitivity of data in your prompts when sharing logs
- Logs are gitignored by default to prevent accidental commits
