# Script Builder UI Components

This directory contains the UI components for the engagement-focused Script Builder workflow (Wave 3 implementation).

## Component Hierarchy

```
ScriptBuilderWorkflow (Main Orchestrator)
├── Phase 1: Topic Input
│   └── DurationPicker
├── Phase 2: Blueprint Review
│   └── BlueprintReview
│       └── BlueprintBeatCard (multiple)
│           └── EmotionBadge
├── Phase 3: Execution Progress
│   └── ExecutionProgress
│       └── BeatStatusIndicator (multiple)
└── Phase 4: Final Preview
    └── ScriptPreview (from ../script/)
```

## Components

### Core Workflow
- **ScriptBuilderWorkflow** - Main 4-phase workflow container
- **BlueprintReview** - Blueprint review and approval interface
- **BlueprintBeatCard** - Individual beat display with approve/reject actions
- **ExecutionProgress** - Real-time script execution progress tracker

### Shared UI
- **EmotionBadge** - Colored badge for target emotions
- **BeatStatusIndicator** - Status icon (✓, ◐, ○)
- **DurationPicker** - Target duration selector with presets

## Usage

### Import Components
```typescript
import { ScriptBuilderWorkflow } from "@/components/script-builder/script-builder-workflow";
import { BlueprintReview } from "@/components/script-builder/blueprint-review";
import { EmotionBadge } from "@/components/script-builder/emotion-badge";
```

### Basic Usage
```tsx
<ScriptBuilderWorkflow
  projectId="proj-123"
  initialTopic="The Future of AI"
  initialScript={null}
/>
```

## Design System

### Colors
- **Brand**: Primary actions (brand-600)
- **Success**: Approved states (green-600)
- **Error**: Rejected states (rose-600)
- **Slate**: UI chrome and backgrounds

### Emotion Colors
- Curiosity: Blue
- Anger: Red
- Dread: Purple
- Hope: Green
- Surprise: Yellow
- Validation: Teal
- Urgency: Orange
- Reflection: Indigo

## API Integration

Components make calls to:
- `POST /api/script-builder/blueprint` - Generate blueprint
- `PUT /api/script-builder/blueprint/:id/review` - Submit reviews
- `POST /api/script-builder/blueprint/:id/regenerate` - Regenerate
- `POST /api/script-builder/execute` - Start execution
- `GET /api/script-builder/execute/:draftId/status` - Poll status
- `POST /api/script-builder/execute/:draftId/resume` - Resume execution

## Status

✅ All UI components implemented
✅ TypeScript types defined
✅ Design patterns followed
✅ API integration wired
⏳ Backend implementation (Wave 4)

## Next Steps

Wave 4 will implement the backend APIs that these components call.
