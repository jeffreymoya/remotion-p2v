# CLI-Based AI Integration

This directory contains the CLI-based AI provider integrations for the Remotion P2V project.

## Overview

Instead of using direct SDK integrations, this implementation uses CLI tools for AI providers:
- **OpenAI Codex CLI** (`codex`)
- **Claude Code CLI** (`claude`)
- **Gemini CLI** (`gemini`)

## Benefits

1. **Cost Savings**: Leverage existing CLI subscriptions
2. **Simpler Auth**: CLI tools handle authentication automatically
3. **Less Maintenance**: No SDK version management
4. **Same Quality**: Same underlying AI models

## Directory Structure

```
cli/
├── services/ai/
│   ├── base.ts               # Base provider with file-based orchestration
│   ├── codex.ts              # OpenAI Codex CLI wrapper
│   ├── claude-code.ts        # Claude Code CLI wrapper
│   ├── gemini-cli.ts         # Gemini CLI wrapper
│   └── index.ts              # Provider factory and exports
├── utils/
│   ├── cli-executor.ts       # CLI command execution utility
│   ├── file-orchestration.ts # File-based prompt/response handling
│   ├── cli-validation.ts     # CLI installation validation
│   └── logger.ts             # Logging utility
├── lib/
│   ├── types.ts              # TypeScript types and interfaces
│   └── config.ts             # Configuration loader
├── test-ai-providers.ts      # Test suite for all providers
└── README.md                 # This file
```

## Installation

### 1. Install CLI Tools

Install at least one of the following CLI tools:

**OpenAI Codex CLI**:
```bash
npm install -g @openai/codex
codex auth login
```

**Claude Code CLI**:
```bash
npm install -g @anthropic-ai/claude-code
# OR native installer:
curl -fsSL https://claude.ai/install.sh | bash
claude auth login
```

**Gemini CLI**:
```bash
npm install -g @google/gemini-cli
gemini auth login
```

### 2. Verify Installation

Run the validation script:
```bash
npx tsx cli/test-ai-providers.ts
```

This will:
- Check which CLI tools are installed
- Test basic completion and structured output
- Validate Zod schema integration

## Configuration

Edit `config/ai.config.json` to configure providers:

```json
{
  "defaultProvider": "gemini-cli",
  "language": "en",
  "providers": {
    "codex": {
      "name": "codex",
      "cliCommand": "codex",
      "defaultModel": "gpt-4-turbo-preview",
      "temperature": 0.7,
      "maxTokens": 8000,
      "enabled": true
    },
    "claude-code": {
      "name": "claude-code",
      "cliCommand": "claude",
      "defaultModel": "claude-3-5-sonnet-20241022",
      "temperature": 0.7,
      "maxTokens": 4000,
      "enabled": true
    },
    "gemini-cli": {
      "name": "gemini-cli",
      "cliCommand": "gemini",
      "defaultModel": "gemini-1.5-flash",
      "temperature": 0.7,
      "maxTokens": 8000,
      "enabled": true
    }
  },
  "fallbackOrder": [
    "gemini-cli",
    "codex",
    "claude-code"
  ]
}
```

## Usage

### Basic Example

```typescript
import { AIProviderFactory } from './services/ai';

// Get default provider (with automatic fallback)
const provider = await AIProviderFactory.getProviderWithFallback();

// Simple text completion
const response = await provider.complete('What is 2 + 2?');
console.log(response);
```

### Structured Output with Zod

```typescript
import { AIProviderFactory } from './services/ai';
import { z } from 'zod';

// Define your schema
const ScriptSchema = z.object({
  title: z.string().min(10).max(100),
  segments: z.array(z.object({
    id: z.string(),
    text: z.string().min(10),
    duration: z.number().positive(),
    visualSuggestions: z.array(z.string()).min(1),
  })).min(3),
});

// Get provider
const provider = await AIProviderFactory.getProviderWithFallback();

// Generate structured output
const script = await provider.structuredComplete(
  'Generate a 30-second video script about artificial intelligence',
  ScriptSchema
);

// Result is automatically validated and fully typed!
console.log(script.title);
console.log(script.segments.length);
```

### Using Specific Provider

```typescript
import { AIProviderFactory } from './services/ai';

// Use specific provider
const codexProvider = await AIProviderFactory.getProvider('codex');
const response = await codexProvider.complete('Your prompt here');
```

### Manual Provider Instantiation

```typescript
import { GeminiCLIProvider } from './services/ai/gemini-cli';

const provider = new GeminiCLIProvider({
  temperature: 0.8,
  maxTokens: 4000,
});

await provider.initialize();
const response = await provider.complete('Your prompt');
```

## How It Works

### File-Based Orchestration

1. **Prompt Construction**: Build prompt with explicit JSON output instructions
2. **CLI Execution**: Execute CLI command (e.g., `gemini "prompt" --output-format json > output.json`)
3. **File Reading**: Read JSON response from output file
4. **Zod Validation**: Parse and validate JSON with Zod schema
5. **Retry on Failure**: If validation fails, retry with error feedback (max 2 retries)
6. **Cleanup**: Delete temporary files on success

### Temporary Files

Temporary files are stored in `/tmp/remotion-p2v-ai/{provider-name}/`:
- Files are automatically cleaned up on success
- Files are kept on failure for debugging
- Each invocation gets a unique timestamped filename

### Error Handling

The implementation handles several error cases:

**CLI Not Installed**:
```
Error: CLI tool 'gemini' is not installed.
Please install it and try again.
```

**JSON Parsing Failure**:
- Automatically retries with clarified prompt
- Max 2 retries with error feedback

**Zod Validation Failure**:
- Retries with detailed validation errors
- Provides clear error messages after max retries

**CLI Execution Timeout**:
- Default timeout: 5 minutes (300 seconds)
- Configurable per request

## Testing

### Run Test Suite

```bash
npx tsx cli/test-ai-providers.ts
```

This will test:
- CLI installation and versions
- Simple text completion
- Structured output with Zod validation
- Provider factory and fallback logic

### Manual Testing

```typescript
// In a TypeScript file
import { GeminiCLIProvider } from './cli/services/ai/gemini-cli';
import { z } from 'zod';

const provider = new GeminiCLIProvider();
await provider.initialize();

const TestSchema = z.object({
  answer: z.number(),
  explanation: z.string(),
});

const result = await provider.structuredComplete(
  'What is 5 + 3? Return JSON with fields: answer (number), explanation (string)',
  TestSchema
);

console.log(result); // { answer: 8, explanation: "..." }
```

## Troubleshooting

### "Command not found" Error

```
Error: Command not found: codex
```

**Solution**: Install the CLI tool:
```bash
npm install -g @openai/codex
```

### "CLI tool is not authenticated" Error

**Solution**: Authenticate the CLI:
```bash
codex auth login  # or claude auth login, or gemini auth login
```

### Validation Always Failing

If Zod validation keeps failing:

1. Check the prompt is clear about JSON structure
2. Inspect failed output files in `/tmp/remotion-p2v-ai/`
3. Verify the schema matches expected output
4. Try a simpler schema first to isolate the issue

### Timeout Errors

If CLI commands timeout:

1. Check internet connection
2. Verify CLI tool is working: `codex --version`
3. Try with a simpler prompt
4. Increase timeout in code if needed

## Performance Notes

- **Subprocess Overhead**: ~100-200ms per CLI call
- **File I/O Overhead**: ~10-50ms for temp files
- **Total Overhead**: ~150-300ms vs direct API (acceptable for local usage)

## Cost Comparison

| Configuration | Cost |
|--------------|------|
| CLI Subscriptions | **$0 per video** (fixed monthly cost) |
| Direct API | ~$0.435 per video (Gemini + ElevenLabs) |

Using CLI tools with existing subscriptions eliminates per-video AI costs!

## Next Steps

1. ✅ Install at least one CLI tool
2. ✅ Run `npx tsx cli/test-ai-providers.ts` to validate setup
3. ✅ Integrate into pipeline stages (discover, script, refine, etc.)
4. ✅ Test full end-to-end video generation workflow

## Documentation

- **Implementation Details**: `docs/implementation/IMPL_API_INTEGRATIONS.md`
- **Refactoring Plan**: `REFACTORING_PLAN.md`
- **Configuration Reference**: `config/ai.config.json`

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review CLI tool documentation (linked in IMPL_API_INTEGRATIONS.md)
3. Inspect temporary files in `/tmp/remotion-p2v-ai/` for debugging
