# Centralized Prompt System

All AI prompts have been centralized in `config/prompts/` for easier management, versioning, and customization.

## Architecture

```
config/prompts/
├── discover.prompt.ts    # Topic discovery prompts
├── refine.prompt.ts      # Topic refinement prompts
├── script.prompt.ts      # Script generation prompts
├── gather.prompt.ts      # Asset gathering prompts
└── index.ts              # Central export

cli/lib/
└── prompt-manager.ts     # Template utilities
```

## Features

### ✅ Type-Safe Templates
All prompts are TypeScript functions with typed variables:

```typescript
export interface DiscoverPromptVariables extends PromptVariables {
  trendsList: string;
  limit: number;
  targetAudience: string;
  videoDuration: number;
}

export const filterTopicsPrompt = (vars: DiscoverPromptVariables): string => {
  return `You are a content strategist for ${vars.targetAudience}...`;
};
```

### ✅ Variable Substitution
Templates use native template strings for clean, readable code:

```typescript
const prompt = filterTopicsPrompt({
  trendsList: '1. AI trends\n2. Climate change\n3. Space exploration',
  limit: 10,
  targetAudience: 'ages 20-40',
  videoDuration: 12,
});
```

### ✅ Multiple Variants
Each stage can have multiple prompt variants for different use cases:

```typescript
// Standard refinement
refineTopicPrompt(vars);

// Viral-focused refinement
refineViralTopicPrompt(vars);
```

## Usage Examples

### Discover Stage

```typescript
import { filterTopicsPrompt } from '../../config/prompts';

const prompt = filterTopicsPrompt({
  trendsList: rawTrends.map((t, i) => `${i + 1}. ${t.query}`).join('\n'),
  limit: 10,
  targetAudience: 'ages 20-40',
  videoDuration: 12,
});

const result = await aiProvider.structuredComplete(prompt, FilteredTopicsSchema);
```

### Refine Stage

```typescript
import { refineTopicPrompt } from '../../config/prompts';

const prompt = refineTopicPrompt({
  title: selectedTopic.title,
  description: selectedTopic.description,
  category: selectedTopic.category,
  targetAudience: 'ages 20-40',
  minDuration: 600,
  maxDuration: 900,
});

const result = await aiProvider.structuredComplete(prompt, RefinedTopicSchema);
```

### Script Stage

```typescript
import { generateScriptPrompt } from '../../config/prompts';

const prompt = generateScriptPrompt({
  title: refinedTopic.refinedTitle,
  description: refinedTopic.refinedDescription,
  targetDuration: 720,
  keyAngles: refinedTopic.keyAngles,
  hooks: refinedTopic.hooks,
});

const result = await aiProvider.structuredComplete(prompt, ScriptGenerationSchema);
```

### Gather Stage

```typescript
import { extractVisualTagsPrompt } from '../../config/prompts';

const prompt = extractVisualTagsPrompt({
  segmentText: segment.text,
  minTags: 3,
  maxTags: 5,
  mediaType: 'both',
});

const result = await aiProvider.structuredComplete(prompt, TagExtractionSchema);
```

## Available Prompts

### Discovery (`discover.prompt.ts`)
- `filterTopicsPrompt()` - Filter and enrich trending topics
- `filterNicheTopicsPrompt()` - Specialized niche content discovery

### Refinement (`refine.prompt.ts`)
- `refineTopicPrompt()` - Educational content refinement
- `refineViralTopicPrompt()` - Viral-focused refinement

### Script (`script.prompt.ts`)
- `generateScriptPrompt()` - General video scripts
- `generateTutorialScriptPrompt()` - Step-by-step tutorials
- `generateStoryScriptPrompt()` - Narrative-driven scripts

### Gather (`gather.prompt.ts`)
- `extractVisualTagsPrompt()` - Basic visual keywords
- `extractCinematicTagsPrompt()` - Cinematic footage tags
- `extractBRollSuggestionsPrompt()` - B-roll suggestions
- `generateImageDescriptionsPrompt()` - AI image generation prompts

## Customization

### 1. Modify Existing Prompts
Edit the prompt files in `config/prompts/`:

```typescript
// config/prompts/discover.prompt.ts
export const filterTopicsPrompt = (vars: DiscoverPromptVariables): string => {
  return `You are a content strategist... [your custom instructions]`;
};
```

### 2. Add New Variants
Create alternative prompts in the same file:

```typescript
export const filterTopicsForKidsPrompt = (vars: DiscoverPromptVariables): string => {
  return `You are a children's content creator...`;
};
```

### 3. Add New Stages
Create a new prompt file:

```typescript
// config/prompts/custom-stage.prompt.ts
import { PromptVariables } from '../../cli/lib/prompt-manager';

export interface CustomPromptVariables extends PromptVariables {
  customField: string;
}

export const customPrompt = (vars: CustomPromptVariables): string => {
  return `Your custom prompt here: ${vars.customField}`;
};
```

Then export from `config/prompts/index.ts`:

```typescript
export * from './custom-stage.prompt';
```

## Utilities

### Prompt Builder (Fluent API)

```typescript
import { createPrompt } from '../../config/prompts';

const prompt = createPrompt('You are an AI assistant.')
  .addSection('Task:', 'Generate a summary of this text')
  .addList(['Step 1', 'Step 2', 'Step 3'])
  .addKeyValue({ Topic: 'AI', Length: '500 words' })
  .build();
```

### Formatting Helpers

```typescript
import { formatList, formatKeyValue, section } from '../../config/prompts';

// Numbered list
const list = formatList(['Item 1', 'Item 2', 'Item 3'], true);
// 1. Item 1
// 2. Item 2
// 3. Item 3

// Bullet list
const bullets = formatList(['Item 1', 'Item 2'], false);
// - Item 1
// - Item 2

// Key-value pairs
const kv = formatKeyValue({ Name: 'John', Age: 30 }, ': ');
// Name: John
// Age: 30

// Section with header
const sec = section('Requirements', 'Must be concise\nUse clear language');
// Requirements
// Must be concise
// Use clear language
```

## Benefits

### ✅ Centralized Management
- All prompts in one location
- Easy to review and update
- Version control friendly

### ✅ Type Safety
- TypeScript enforces required variables
- Autocomplete for variable names
- Catch errors at compile time

### ✅ Reusability
- Share prompts across commands
- Create variants without duplication
- Build prompt libraries

### ✅ Testability
- Test prompts independently
- Mock prompt variables easily
- A/B test different versions

### ✅ Maintainability
- Clear separation of concerns
- Easy to find and update
- Self-documenting code

## Migration from Inline Prompts

Before (inline):
```typescript
const scriptPrompt = `Generate a ${targetDuration}-second video script...
Requirements:
- Create 8-12 segments
- Use storytelling
...`;
```

After (centralized):
```typescript
import { generateScriptPrompt } from '../../config/prompts';

const prompt = generateScriptPrompt({
  title: refinedTopic.refinedTitle,
  description: refinedTopic.refinedDescription,
  targetDuration,
  keyAngles: refinedTopic.keyAngles,
});
```

## Future Enhancements

- **Versioning**: Track prompt iterations (v1, v2, etc.)
- **User Overrides**: Allow custom prompts via config files
- **Prompt Analytics**: Track which prompts perform best
- **A/B Testing**: Compare prompt variants automatically
- **Localization**: Multi-language prompt support
- **Prompt Templates from Files**: Load prompts from YAML/JSON
