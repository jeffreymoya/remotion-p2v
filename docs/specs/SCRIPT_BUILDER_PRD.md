# Script Builder PRD

## Product Requirements Document
**Version:** 1.0
**Status:** Draft
**Created:** 2026-01-12
**Author:** Claude Code

---

## Executive Summary

This document specifies the redesign of the script generation system from a single-prompt approach to a multi-phase "Script Builder" workflow. The new system separates the creative process into distinct phases: Engagement Blueprint creation, multi-prompt script execution, guided polish, and semantic segmentation.

### Goals
1. **Improve Script Quality**: Use multi-prompt techniques to generate scripts with better retention characteristics
2. **Enable User Control**: Allow users to review and guide the script creation process
3. **Optimize for TTS**: Produce segments optimized for text-to-speech processing
4. **Maintain Full History**: Persist all intermediate artifacts for iteration and learning

### Non-Goals
- CLI implementation (Web UI only for this iteration)
- Real-time collaboration features
- A/B testing of generated scripts

---

## Table of Contents

1. [Background & Motivation](#1-background--motivation)
2. [User Workflow Overview](#2-user-workflow-overview)
3. [Detailed Phase Specifications](#3-detailed-phase-specifications)
4. [Data Models](#4-data-models)
5. [API Contracts](#5-api-contracts)
6. [UI/UX Specifications](#6-uiux-specifications)
7. [AI Prompt Templates](#7-ai-prompt-templates)
8. [Configuration & Settings](#8-configuration--settings)
9. [Error Handling & Recovery](#9-error-handling--recovery)
10. [E2E Test Scenarios](#10-e2e-test-scenarios)
11. [Migration Plan](#11-migration-plan)
12. [Open Questions](#12-open-questions)

---

## 1. Background & Motivation

### Current State
The existing script generation uses a single LLM prompt that attempts to generate 8-12 segments in one call. This approach:
- Prioritizes **completion** over **quality**
- Produces generic, formulaic scripts
- Lacks emotional journey mapping
- Misses retention optimization techniques (hooks, bucket brigades, open loops)

### Research Foundation
Based on `docs/script-prompting-technique.md`, multi-prompt workflows significantly improve script quality by:
- Breaking generation into focused tasks
- Applying specific style modifiers per section
- Mapping emotional arcs before writing
- Allowing human review at key checkpoints

### Target Outcome
A 12-minute video script that:
- Achieves >40% average view duration
- Uses proven retention techniques (staccato rhythm, bucket brigades, pattern interrupts)
- Flows naturally between sections
- Is optimized for TTS processing (100-150 word segments)

---

## 2. User Workflow Overview

### High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCRIPT BUILDER WORKFLOW                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐  │
│  │  TOPIC  │───▶│  BLUEPRINT  │───▶│   SCRIPT    │───▶│  SEGMENTATION   │  │
│  │  INPUT  │    │  GENERATION │    │  EXECUTION  │    │                 │  │
│  └─────────┘    └──────┬──────┘    └──────┬──────┘    └────────┬────────┘  │
│                        │                  │                     │           │
│                        ▼                  ▼                     ▼           │
│                 ┌──────────────┐   ┌──────────────┐    ┌───────────────┐   │
│                 │   BLUEPRINT  │   │    GLUE      │    │    FINAL      │   │
│                 │    REVIEW    │   │    PHASE     │    │   SEGMENTS    │   │
│                 │ (User Edits) │   │(Inline Edit) │    │               │   │
│                 └──────────────┘   └──────────────┘    └───────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Step-by-Step User Journey

| Step | Phase | User Action | System Action |
|------|-------|-------------|---------------|
| 1 | Setup | Enters topic, adjusts target duration | Validates input, calculates beat count |
| 2 | Blueprint | Clicks "Generate Blueprint" | LLM creates engagement outline |
| 3 | Review | Reviews beats, approves/rejects with notes | Stores feedback |
| 4 | Iterate | If rejected, clicks "Regenerate" | LLM regenerates with feedback |
| 5 | Execute | Clicks "Write Script" | Multi-prompt execution begins |
| 6 | Monitor | Watches progress (beat by beat) | Checkpoints saved after each beat |
| 7 | Polish | Reviews script with highlights | System identifies seams/robot words |
| 8 | Edit | Makes inline edits | Changes saved to draft |
| 9 | Segment | Clicks "Create Segments" | LLM performs semantic segmentation |
| 10 | Complete | Reviews final segments | Ready for TTS generation |

---

## 3. Detailed Phase Specifications

### Phase 1: Engagement Blueprint Generation

#### Purpose
Create a structural outline mapping the emotional journey before writing any script content.

#### Beat Calculation Formula
```
beatCount = max(4, ceil(targetDurationSeconds / 120))
```

| Target Duration | Beat Count |
|-----------------|------------|
| 5 min (300s) | 4 beats |
| 8 min (480s) | 4 beats |
| 10 min (600s) | 5 beats |
| 12 min (720s) | 6 beats |
| 15 min (900s) | 8 beats |
| 20 min (1200s) | 10 beats |

#### Beat Structure
Each beat contains:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (uuid) |
| `index` | number | Yes | Position in sequence (1-based) |
| `title` | string | Yes | Short title for the beat (e.g., "The Hook") |
| `coreArgument` | string | Yes | What information is conveyed |
| `targetEmotion` | enum | Yes | Primary emotion to evoke |
| `microHook` | string | Yes | Question/mystery that opens this section |
| `estimatedDurationMs` | number | Yes | Target duration in milliseconds |
| `mediaSuggestions` | string[] | No | Visual/b-roll ideas for this beat |

#### Target Emotions (Enum)
```typescript
type TargetEmotion =
  | 'curiosity'    // Opening hooks, mysteries
  | 'anger'        // Injustice, controversy
  | 'dread'        // Building tension
  | 'hope'         // Resolution, possibility
  | 'surprise'     // Pattern interrupts, revelations
  | 'validation'   // Agreement, recognition
  | 'urgency'      // Call to action
  | 'reflection'   // Contemplation, ambiguity
```

#### Blueprint Output Example
```json
{
  "id": "bp-abc123",
  "projectId": "proj-xyz",
  "targetDurationMs": 720000,
  "beats": [
    {
      "id": "beat-1",
      "index": 1,
      "title": "The Provocative Hook",
      "coreArgument": "Toxic fandom has become a normalized part of sports culture",
      "targetEmotion": "curiosity",
      "microHook": "When does passionate support cross the line into something darker?",
      "estimatedDurationMs": 90000,
      "mediaSuggestions": [
        "Montage of extreme fan reactions",
        "Social media screenshot collage"
      ]
    },
    {
      "id": "beat-2",
      "index": 2,
      "title": "Personal Entry Point",
      "coreArgument": "Everyone has witnessed toxic fan behavior, even if we don't call it that",
      "targetEmotion": "validation",
      "microHook": "You've seen this before, haven't you?",
      "estimatedDurationMs": 120000,
      "mediaSuggestions": [
        "Relatable fan scenarios",
        "Stadium crowd footage"
      ]
    }
    // ... more beats
  ],
  "status": "pending_review",
  "createdAt": "2026-01-12T10:00:00Z"
}
```

---

### Phase 2: Blueprint Review

#### User Interface Requirements
- Display all beats in a vertical list/timeline view
- Each beat shows: title, core argument, emotion, micro-hook
- Visual indicator for beat duration relative to total
- Action buttons per beat: **Approve** (checkmark), **Reject** (X)
- Notes field appears when "Reject" is clicked
- Global actions: "Approve All", "Regenerate Blueprint"

#### Review States

| State | Description | Next Action |
|-------|-------------|-------------|
| `pending_review` | Initial state after generation | User reviews |
| `approved` | All beats approved | Proceed to execution |
| `rejected` | One or more beats rejected | Regenerate required |
| `partially_approved` | Some approved, some pending | Continue review |

#### Rejection Flow
When user rejects any beat(s):
1. User provides notes for each rejected beat
2. User clicks "Regenerate Blueprint"
3. System compiles all feedback into regeneration prompt
4. **Entire blueprint is regenerated** (not individual beats)
5. Previous blueprint version is archived
6. New blueprint enters `pending_review` state

---

### Phase 3: Multi-Prompt Script Execution

#### Prompt Strategy: Hybrid Approach

The system uses a **hybrid prompt structure** optimized for LLM quality:

```
┌────────────────────────────────────────────────────────────────┐
│                    PROMPT STRUCTURE                            │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────────────┐                                         │
│  │   HOOK PROMPT    │  ← Always first, staccato style         │
│  │   (Beat 1)       │                                         │
│  └────────┬─────────┘                                         │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────────┐                                         │
│  │  MIDDLE PROMPTS  │  ← One per remaining beat (except last) │
│  │  (Beats 2..N-1)  │     Style: AI-selected based on emotion │
│  └────────┬─────────┘                                         │
│           │                                                    │
│           ▼                                                    │
│  ┌──────────────────┐                                         │
│  │   TURN PROMPT    │  ← Always last, lyrical/reflective      │
│  │   (Beat N)       │                                         │
│  └──────────────────┘                                         │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

#### Style Modifiers (AI-Selected)

The LLM selects appropriate style modifiers based on the beat's `targetEmotion`:

| Emotion | Primary Modifiers | Secondary Modifiers |
|---------|-------------------|---------------------|
| `curiosity` | Pattern interrupt, direct address | Open loops |
| `anger` | Staccato rhythm, concrete examples | Rhetorical questions |
| `dread` | Slow pacing, sensory language | Foreshadowing |
| `hope` | Flowing sentences, future tense | Analogies |
| `surprise` | Short punch lines, contrast | Unexpected pivots |
| `validation` | Second person ("you"), recognition | Shared experience |
| `urgency` | Imperative mood, time pressure | Statistics |
| `reflection` | Ambiguous questions, lyricism | Metaphor |

#### Execution Flow

```typescript
interface ExecutionState {
  blueprintId: string;
  currentBeatIndex: number;
  completedBeats: BeatDraft[];
  status: 'in_progress' | 'paused' | 'completed' | 'failed';
  lastCheckpoint: Date;
}
```

1. **Initialize**: Load approved blueprint
2. **For each beat**:
   a. Select prompt template (Hook/Middle/Turn)
   b. Inject beat context (emotion, core argument, micro-hook)
   c. Include previous beats' content for continuity
   d. Execute LLM call
   e. Validate output (word count, coherence)
   f. **Save checkpoint** to database
   g. Update progress UI
3. **Complete**: Assemble full draft, transition to Glue phase

#### Per-Beat Regeneration

After initial execution, users can regenerate individual beats:
- Select beat to regenerate
- Optionally provide guidance notes
- System regenerates **only that beat**
- Continuity prompt includes surrounding beats for context
- Does NOT cascade to subsequent beats (user's choice)

---

### Phase 4: Glue Phase (Guided Polish)

#### Purpose
Identify and fix common LLM artifacts that hurt retention:
- **Seams**: Awkward transitions between beats
- **Robot Words**: Generic phrases (Furthermore, Moreover, In conclusion)
- **Repetition**: Phrases repeated across beats
- **Pacing Issues**: Sections that don't match target emotion

#### Detection Rules

```typescript
interface GlueIssue {
  id: string;
  type: 'seam' | 'robot_word' | 'repetition' | 'pacing';
  location: {
    beatIndex: number;
    charStart: number;
    charEnd: number;
  };
  severity: 'warning' | 'error';
  suggestion?: string;
}
```

**Robot Words List** (flagged automatically):
```
Furthermore, Moreover, Additionally, In conclusion, In summary,
It is important to note, It should be noted, As mentioned earlier,
First and foremost, Last but not least, At the end of the day,
Moving forward, Going forward, With that being said
```

**Seam Detection**:
- First sentence of beat N shouldn't repeat phrasing from last sentence of beat N-1
- Transitional phrases should feel natural, not formulaic
- Flagged for manual review at beat boundaries

#### UI: Inline Editor with Highlights

```
┌─────────────────────────────────────────────────────────────────┐
│  GLUE PHASE - Polish Your Script                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Issues Found: 3 warnings, 1 error                    [Fix All] │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Beat 1: The Provocative Hook                              │ │
│  │                                                           │ │
│  │ Have you ever watched a fan base turn on itself?          │ │
│  │ [HIGHLIGHTED: Furthermore,] the psychology behind...      │ │
│  │        ↳ ⚠️ Robot word - consider removing                │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ Beat 2: Personal Entry Point                              │ │
│  │                                                           │ │
│  │ [HIGHLIGHTED: You've seen this before.]                   │ │
│  │        ↳ 🔗 Seam - similar to Beat 1 ending               │ │
│  │                                                           │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│                              [Save & Continue] [Skip Glue]      │
└─────────────────────────────────────────────────────────────────┘
```

#### User Actions
- Click highlighted text to edit inline
- "Fix All" applies AI suggestions automatically (with undo)
- "Skip Glue" proceeds without fixing (warns user)
- Changes auto-save to draft

---

### Phase 5: Semantic Segmentation

#### Purpose
Convert the polished script into TTS-optimized segments (100-150 words each).

#### Segmentation Strategy

The LLM performs **semantic segmentation** considering:
1. **Natural breakpoints**: Sentence boundaries, paragraph breaks
2. **Beat boundaries**: Prefer keeping beat content together when possible
3. **Word count target**: 100-150 words per segment
4. **Pacing**: Ensure segments don't split mid-thought

#### Segmentation Prompt Context
```
Input:
- Full polished script text
- Beat boundaries (for reference)
- Target segment size: 100-150 words
- Total target segments: ~8-12 for 12-minute video

Output:
- Array of segments with:
  - index: number
  - text: string
  - wordCount: number
  - estimatedDurationMs: number (calculated at 140 WPM)
  - sourceBeatIds: string[] (which beats this segment draws from)
```

#### Segment Output Example
```json
{
  "segments": [
    {
      "index": 1,
      "text": "Have you ever watched a fan base turn on itself? It starts small...",
      "wordCount": 142,
      "estimatedDurationMs": 60857,
      "sourceBeatIds": ["beat-1"]
    },
    {
      "index": 2,
      "text": "You've seen this before, haven't you? Maybe at a stadium...",
      "wordCount": 128,
      "estimatedDurationMs": 54857,
      "sourceBeatIds": ["beat-1", "beat-2"]
    }
  ]
}
```

---

## 4. Data Models

### Conceptual Entity Relationship

```
┌─────────────┐       ┌─────────────────┐       ┌──────────────┐
│   Project   │──────▶│    Blueprint    │──────▶│     Beat     │
│             │  1:N  │                 │  1:N  │              │
└─────────────┘       └────────┬────────┘       └──────────────┘
                               │
                               │ 1:N
                               ▼
                      ┌─────────────────┐       ┌──────────────┐
                      │   ScriptDraft   │──────▶│  BeatDraft   │
                      │                 │  1:N  │              │
                      └────────┬────────┘       └──────────────┘
                               │
                               │ 1:1
                               ▼
                      ┌─────────────────┐       ┌──────────────┐
                      │     Script      │──────▶│   Segment    │
                      │   (existing)    │  1:N  │  (existing)  │
                      └─────────────────┘       └──────────────┘
```

### New Entities

#### Blueprint
```typescript
interface Blueprint {
  id: string;
  projectId: string;
  version: number;
  targetDurationMs: number;
  status: 'generating' | 'pending_review' | 'approved' | 'rejected';
  beats: Beat[];
  rejectionNotes?: string; // Compiled feedback for regeneration
  createdAt: Date;
  updatedAt: Date;
}
```

#### Beat
```typescript
interface Beat {
  id: string;
  blueprintId: string;
  index: number;
  title: string;
  coreArgument: string;
  targetEmotion: TargetEmotion;
  microHook: string;
  estimatedDurationMs: number;
  mediaSuggestions: string[];
  reviewStatus: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
}
```

#### ScriptDraft
```typescript
interface ScriptDraft {
  id: string;
  blueprintId: string;
  version: number;
  status: 'in_progress' | 'paused' | 'completed' | 'polished';
  currentBeatIndex: number;
  beatDrafts: BeatDraft[];
  glueIssues: GlueIssue[];
  polishedText?: string; // After glue phase
  createdAt: Date;
  updatedAt: Date;
}
```

#### BeatDraft
```typescript
interface BeatDraft {
  id: string;
  scriptDraftId: string;
  beatId: string;
  beatIndex: number;
  text: string;
  wordCount: number;
  styleModifiersUsed: string[];
  checkpoint: Date;
}
```

---

## 5. API Contracts

### Blueprint APIs

#### POST /api/script-builder/blueprint
Generate a new engagement blueprint.

**Request:**
```json
{
  "projectId": "proj-xyz",
  "topic": "When Fandom Goes Too Far: The Psychology of Toxic Fan Culture",
  "targetDurationMs": 720000
}
```

**Response:**
```json
{
  "blueprint": { /* Blueprint object */ },
  "message": "Blueprint generated with 6 beats"
}
```

#### PUT /api/script-builder/blueprint/:id/review
Submit beat reviews.

**Request:**
```json
{
  "reviews": [
    { "beatId": "beat-1", "status": "approved" },
    { "beatId": "beat-2", "status": "rejected", "notes": "Too generic, needs more edge" }
  ]
}
```

**Response:**
```json
{
  "blueprint": { /* Updated Blueprint object */ },
  "requiresRegeneration": true
}
```

#### POST /api/script-builder/blueprint/:id/regenerate
Regenerate blueprint with feedback.

**Request:**
```json
{
  "blueprintId": "bp-abc123"
}
```

**Response:**
```json
{
  "blueprint": { /* New Blueprint object (version incremented) */ }
}
```

---

### Script Execution APIs

#### POST /api/script-builder/execute
Start multi-prompt script execution.

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
  "status": "in_progress",
  "totalBeats": 6
}
```

#### GET /api/script-builder/execute/:draftId/status
Check execution progress.

**Response:**
```json
{
  "status": "in_progress",
  "currentBeatIndex": 3,
  "completedBeats": 2,
  "totalBeats": 6,
  "lastCheckpoint": "2026-01-12T10:05:00Z"
}
```

#### POST /api/script-builder/execute/:draftId/resume
Resume from checkpoint after failure.

**Response:**
```json
{
  "status": "in_progress",
  "resumedFromBeat": 3
}
```

#### POST /api/script-builder/beat/:beatDraftId/regenerate
Regenerate a single beat.

**Request:**
```json
{
  "guidance": "Make it more provocative, less explanatory"
}
```

**Response:**
```json
{
  "beatDraft": { /* Updated BeatDraft */ }
}
```

---

### Glue Phase APIs

#### GET /api/script-builder/draft/:draftId/glue-analysis
Get detected issues.

**Response:**
```json
{
  "issues": [
    {
      "id": "issue-1",
      "type": "robot_word",
      "location": { "beatIndex": 1, "charStart": 45, "charEnd": 56 },
      "severity": "warning",
      "text": "Furthermore,",
      "suggestion": "Remove or replace with natural transition"
    }
  ],
  "issueCount": { "warnings": 3, "errors": 1 }
}
```

#### PUT /api/script-builder/draft/:draftId/polish
Save polished text.

**Request:**
```json
{
  "polishedText": "Full edited script text...",
  "resolvedIssues": ["issue-1", "issue-2"]
}
```

---

### Segmentation API

#### POST /api/script-builder/draft/:draftId/segment
Create final segments.

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
    "id": "script-final",
    "segments": [ /* Segment array */ ]
  }
}
```

---

## 6. UI/UX Specifications

### Navigation Structure

```
Project Page
└── Script Builder (Step 2)
    ├── Topic Input
    ├── Blueprint Phase
    │   ├── Generation State
    │   ├── Review State
    │   └── Approved State
    ├── Execution Phase
    │   ├── Progress View
    │   └── Beat Review View
    ├── Glue Phase
    │   └── Inline Editor
    └── Segmentation Phase
        └── Final Preview
```

### Key UI Components

#### 1. Blueprint Beat Card
```
┌─────────────────────────────────────────────────────────────┐
│ Beat 2 of 6                                    [✓] [✗]      │
├─────────────────────────────────────────────────────────────┤
│ PERSONAL ENTRY POINT                          ~2:00 min    │
│                                                             │
│ Emotion: validation                                         │
│                                                             │
│ "You've seen this before, haven't you?"                     │
│                                                             │
│ Everyone has witnessed toxic fan behavior, even if we       │
│ don't call it that.                                         │
│                                                             │
│ Media Ideas:                                                │
│ • Relatable fan scenarios                                   │
│ • Stadium crowd footage                                     │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Execution Progress Bar
```
┌─────────────────────────────────────────────────────────────┐
│ Writing Script...                              Beat 3 of 6  │
├─────────────────────────────────────────────────────────────┤
│ [████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]  50%  │
│                                                             │
│ ✓ Beat 1: The Provocative Hook                              │
│ ✓ Beat 2: Personal Entry Point                              │
│ ◐ Beat 3: The Psychology (writing...)                       │
│ ○ Beat 4: Social Media's Role                               │
│ ○ Beat 5: The Turning Point                                 │
│ ○ Beat 6: The Reflection                                    │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Duration Override Input
```
┌─────────────────────────────────────────────────────────────┐
│ Target Duration                                             │
│ ┌─────────────────────────────────────┐                    │
│ │ 12 minutes              │ ▼ │                             │
│ └─────────────────────────────────────┘                    │
│ Default from project settings: 12 min (720s)               │
│ This will generate approximately 6 beats.                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. AI Prompt Templates

### Blueprint Generation Prompt

```
You are an expert YouTube content strategist and video scriptwriter. Your task is to create an **Engagement Blueprint** - a structural outline that maps the emotional journey of a video before any script content is written.

**Topic:** ${topic}
**Target Duration:** ${targetDurationMs / 1000 / 60} minutes
**Required Beats:** ${beatCount}

For each beat, define:
1. **Title**: A short, descriptive name (e.g., "The Provocative Hook")
2. **Core Argument**: What key information or idea is conveyed in this section?
3. **Target Emotion**: What should the viewer feel? Choose from: curiosity, anger, dread, hope, surprise, validation, urgency, reflection
4. **Micro-Hook**: What question, mystery, or tension opens this section to keep them watching?
5. **Estimated Duration**: How long this beat should last (in milliseconds)
6. **Media Suggestions**: 2-3 visual/b-roll ideas that would complement this beat

**Structure Guidelines:**
- Beat 1 should be a strong **HOOK** (curiosity or surprise)
- Final beat should be a **REFLECTION** with ambiguity or call-to-action
- Middle beats should build tension and deliver value
- Emotions should vary - avoid consecutive beats with the same emotion
- Total duration across all beats should equal ${targetDurationMs}ms

CRITICAL: Return ONLY this JSON structure (no markdown):
{
  "beats": [
    {
      "index": 1,
      "title": "Beat title",
      "coreArgument": "What is conveyed",
      "targetEmotion": "curiosity",
      "microHook": "The question that opens this beat",
      "estimatedDurationMs": 90000,
      "mediaSuggestions": ["suggestion 1", "suggestion 2"]
    }
  ]
}
```

### Hook Prompt (Beat 1)

```
**Context:** You are writing the OPENING HOOK of a video script.
**Blueprint Beat:**
- Title: ${beat.title}
- Core Argument: ${beat.coreArgument}
- Target Emotion: ${beat.targetEmotion}
- Micro-Hook: ${beat.microHook}
- Duration: ${beat.estimatedDurationMs / 1000} seconds (~${Math.round(beat.estimatedDurationMs / 1000 / 60 * 140)} words)

**Style Modifiers (STRICTLY FOLLOW):**
- **Staccato Rhythm:** Use short, punchy sentences. "It wasn't a mistake. It was a choice."
- **Direct Address:** Use "you" at least 5 times. Speak to the viewer's hidden thoughts.
- **Pattern Interrupt:** Start with a bold claim, then immediately pivot to a story or question.
- **No Fluff:** Do NOT use "In this video, we will discuss..." - just START.
- **Open Loop:** Plant a question that won't be answered until later.

Write approximately ${Math.round(beat.estimatedDurationMs / 1000 / 60 * 140)} words.
Return ONLY the script text, no JSON wrapping.
```

### Middle Beat Prompt

```
**Context:** You are writing beat ${beat.index} of ${totalBeats} for a video script.
**Blueprint Beat:**
- Title: ${beat.title}
- Core Argument: ${beat.coreArgument}
- Target Emotion: ${beat.targetEmotion}
- Micro-Hook: ${beat.microHook}
- Duration: ${beat.estimatedDurationMs / 1000} seconds (~${Math.round(beat.estimatedDurationMs / 1000 / 60 * 140)} words)

**Previous Content (for continuity):**
${previousBeatText}

**Style Modifiers (AI-SELECTED based on emotion: ${beat.targetEmotion}):**
${getStyleModifiersForEmotion(beat.targetEmotion)}

**Additional Requirements:**
- **Bucket Brigades:** Use transitional phrases: "But here's the catch," "Now, you might be thinking..."
- **Concrete Analogies:** Don't just explain abstractions - give physical, visual comparisons.
- **Varying Pace:** Mix long flowing sentences with sudden short punches.
- **Continue the Thread:** Reference or callback to the hook's open loop if relevant.

Write approximately ${Math.round(beat.estimatedDurationMs / 1000 / 60 * 140)} words.
Return ONLY the script text, no JSON wrapping.
```

### Turn/Reflection Prompt (Final Beat)

```
**Context:** You are writing the FINAL BEAT of a video script - the reflection and conclusion.
**Blueprint Beat:**
- Title: ${beat.title}
- Core Argument: ${beat.coreArgument}
- Target Emotion: ${beat.targetEmotion}
- Micro-Hook: ${beat.microHook}
- Duration: ${beat.estimatedDurationMs / 1000} seconds (~${Math.round(beat.estimatedDurationMs / 1000 / 60 * 140)} words)

**Full Script So Far:**
${allPreviousBeatText}

**Style Modifiers (STRICTLY FOLLOW):**
- **Slower Pacing:** Use intentional repetition. "They didn't want money. They wanted power. Pure, unchecked power."
- **The Ambiguous Mirror:** Turn the camera back on the viewer. Ask a question with no easy answer.
- **Lyricism:** The final paragraph should feel almost poetic. NO generic summaries like "In conclusion."
- **Close the Loop:** Callback to the opening hook - resolve or reframe it.
- **Final Line:** End with a sentence that LINGERS. A quiet punch.

Write approximately ${Math.round(beat.estimatedDurationMs / 1000 / 60 * 140)} words.
Return ONLY the script text, no JSON wrapping.
```

### Segmentation Prompt

```
You are a script editor optimizing text for text-to-speech (TTS) processing.

**Full Script:**
${polishedText}

**Beat Boundaries (for reference):**
${beatBoundaries.map(b => `Beat ${b.index}: chars ${b.start}-${b.end}`).join('\n')}

**Task:** Divide this script into segments optimized for TTS.

**Requirements:**
- Each segment should be 100-150 words
- Split at natural breakpoints (sentence boundaries, paragraph breaks)
- Never split mid-sentence or mid-thought
- Prefer keeping beat content together when segment size allows
- Aim for 8-12 total segments

**Output Format:**
{
  "segments": [
    {
      "index": 1,
      "text": "Segment text...",
      "wordCount": 142,
      "sourceBeatIds": ["beat-1"]
    }
  ]
}

Return ONLY the JSON, no markdown.
```

---

## 8. Configuration & Settings

### Per-Phase Model Configuration

Users can configure different AI models for each phase in project settings:

```typescript
interface ScriptBuilderSettings {
  models: {
    blueprint: {
      provider: 'gemini-cli' | 'claude';
      model: string; // e.g., 'gemini-2.5-flash' for speed
      temperature: number;
    };
    execution: {
      provider: 'gemini-cli' | 'claude';
      model: string; // e.g., 'gemini-2.5-pro' for quality
      temperature: number;
    };
    segmentation: {
      provider: 'gemini-cli' | 'claude';
      model: string; // e.g., 'gemini-2.5-flash' for speed
      temperature: number;
    };
  };
  defaults: {
    targetDurationMs: number;
    segmentWordCountMin: number;
    segmentWordCountMax: number;
  };
}
```

### Recommended Model Configuration

| Phase | Recommended Model | Reasoning |
|-------|-------------------|-----------|
| Blueprint | `gemini-2.5-flash` | Structural task, speed matters |
| Execution | `gemini-2.5-pro` | Creative writing, quality critical |
| Segmentation | `gemini-2.5-flash` | Mechanical task, speed matters |

### Default Settings

```json
{
  "models": {
    "blueprint": { "model": "gemini-2.5-flash", "temperature": 0.7 },
    "execution": { "model": "gemini-2.5-pro", "temperature": 0.8 },
    "segmentation": { "model": "gemini-2.5-flash", "temperature": 0.3 }
  },
  "defaults": {
    "targetDurationMs": 720000,
    "segmentWordCountMin": 100,
    "segmentWordCountMax": 150
  }
}
```

---

## 9. Error Handling & Recovery

### Checkpoint & Resume Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                  CHECKPOINT FLOW                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Beat 1 ──▶ [Checkpoint] ──▶ Beat 2 ──▶ [Checkpoint] ──▶   │
│                                                             │
│     ╳ FAILURE at Beat 3                                     │
│     │                                                       │
│     ▼                                                       │
│  ┌─────────────────────┐                                   │
│  │ State Saved:        │                                   │
│  │ - Beat 1 text ✓     │                                   │
│  │ - Beat 2 text ✓     │                                   │
│  │ - Beat 3 = null     │                                   │
│  │ - currentIndex = 3  │                                   │
│  └─────────────────────┘                                   │
│     │                                                       │
│     ▼                                                       │
│  [RESUME] ──▶ Continues from Beat 3                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Error Types & Handling

| Error Type | Detection | Recovery Action |
|------------|-----------|-----------------|
| LLM Timeout | 5 minute timeout | Auto-retry (max 2), then pause for user |
| Invalid JSON | Parse failure | Retry with stricter prompt |
| Word Count Violation | <80% or >120% of target | Flag for user review, don't block |
| Rate Limit | 429 response | Exponential backoff, auto-resume |
| Network Error | Connection failure | Checkpoint saved, manual resume |
| Content Filter | Safety block | Flag beat, allow manual writing |

### User-Facing Error States

```typescript
interface ErrorState {
  phase: 'blueprint' | 'execution' | 'glue' | 'segmentation';
  beatIndex?: number;
  errorType: string;
  message: string;
  canRetry: boolean;
  canResume: boolean;
  canSkip: boolean;
}
```

---

## 10. E2E Test Scenarios

### Scenario 1: Happy Path - Full Workflow

**Preconditions:**
- Project exists with topic set
- User is authenticated

**Steps:**
1. Navigate to Script Builder for project
2. Set target duration to 12 minutes
3. Click "Generate Blueprint"
4. Wait for blueprint generation (~30s)
5. Review all 6 beats, approve all
6. Click "Write Script"
7. Wait for execution to complete (~2-3 min)
8. Review script in Glue phase
9. Fix 2 highlighted issues manually
10. Click "Save & Continue"
11. Click "Create Segments"
12. Verify final segments (8-12 segments, 100-150 words each)

**Expected Outcome:**
- Script with segments saved to database
- Project status updated to "SCRIPT_READY"
- All intermediate artifacts (blueprint, drafts) persisted

---

### Scenario 2: Blueprint Rejection & Regeneration

**Preconditions:**
- Blueprint generated with 6 beats

**Steps:**
1. Review beats
2. Reject beat 2 with note: "Too generic, needs more edge"
3. Reject beat 4 with note: "Emotion should be 'dread' not 'hope'"
4. Approve remaining beats
5. Click "Regenerate Blueprint"
6. Wait for regeneration
7. Verify new blueprint addresses feedback
8. Approve all beats

**Expected Outcome:**
- New blueprint version created (v2)
- Original blueprint archived
- New beats reflect feedback

---

### Scenario 3: Execution Failure & Resume

**Preconditions:**
- Blueprint approved

**Steps:**
1. Click "Write Script"
2. Simulate failure at beat 3 (network timeout)
3. Verify UI shows error state with "Resume" option
4. Verify beats 1-2 are saved
5. Click "Resume"
6. Verify execution continues from beat 3
7. Complete execution

**Expected Outcome:**
- No data loss
- Execution completes from checkpoint
- All beats present in final draft

---

### Scenario 4: Per-Beat Regeneration

**Preconditions:**
- Script execution completed (6 beats)

**Steps:**
1. In execution review, click "Regenerate" on beat 3
2. Enter guidance: "Make it more provocative"
3. Wait for regeneration
4. Verify beat 3 updated
5. Verify beats 1, 2, 4, 5, 6 unchanged

**Expected Outcome:**
- Only beat 3 regenerated
- Surrounding beat content preserved
- Script draft version incremented

---

### Scenario 5: Glue Phase - Skip

**Preconditions:**
- Script draft completed

**Steps:**
1. Enter Glue phase
2. View highlighted issues (3 warnings, 1 error)
3. Click "Skip Glue"
4. Confirm warning dialog
5. Proceed to segmentation

**Expected Outcome:**
- Issues logged but not resolved
- Segmentation proceeds with unpolished text
- Warning logged for analytics

---

### Scenario 6: Custom Duration

**Preconditions:**
- Project settings default to 720s

**Steps:**
1. Navigate to Script Builder
2. Change duration to 8 minutes (480s)
3. Generate blueprint
4. Verify 4 beats generated (not 6)
5. Complete full workflow

**Expected Outcome:**
- Beat count calculated correctly (4 beats)
- Total duration respects override
- Project settings unchanged

---

## 11. Migration Plan

### Phase 1: Feature Flag

1. Add feature flag: `SCRIPT_BUILDER_ENABLED`
2. Default: `false` (existing flow active)
3. Beta testers can enable via settings

### Phase 2: Parallel Operation

1. Both flows available
2. "Script Builder" is new default
3. "Quick Script (Legacy)" accessible via dropdown

### Phase 3: Full Migration

1. Remove legacy single-prompt generation
2. Remove feature flag
3. Migrate existing scripts to new schema (add null blueprint reference)

### Data Migration

Existing `Script` records:
- Add nullable `blueprintId` foreign key
- Legacy scripts have `blueprintId = null`
- No data loss

---

## 12. Implementation Phases

### Overview

The Script Builder will be implemented in three phases, allowing for incremental delivery and user feedback integration.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        IMPLEMENTATION ROADMAP                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  MVP (Phase 1)           v1.1 (Phase 2)           v1.2 (Phase 3)           │
│  ─────────────           ──────────────           ──────────────           │
│  Core workflow           Polish & UX              Advanced features        │
│                                                                             │
│  • Blueprint gen         • Glue phase             • Per-phase models       │
│  • Basic review          • Inline editor          • Blueprint templates    │
│  • Multi-prompt exec     • Robot word detect      • Analytics dashboard    │
│  • Segmentation          • Per-beat regen         • Export/import          │
│  • Basic persistence     • Full history           • Batch generation       │
│                          • Duration override                                │
│                                                                             │
│  Timeline: ~2 weeks      Timeline: ~1 week        Timeline: ~1 week        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Phase 1: MVP - Core Workflow

**Goal:** Deliver end-to-end Script Builder with essential functionality.

#### Scope

| Feature | Included | Notes |
|---------|----------|-------|
| Blueprint generation | Yes | Dynamic beat calculation |
| Blueprint review UI | Yes | Approve/reject only (no notes yet) |
| Blueprint regeneration | Yes | Full regeneration on any rejection |
| Multi-prompt execution | Yes | Hook + Middle + Turn structure |
| Execution progress UI | Yes | Basic progress bar |
| Checkpointing | Yes | Resume from failure |
| Segmentation | Yes | Semantic LLM-based |
| Basic persistence | Yes | Blueprint + final script only |
| Replace legacy flow | Yes | Feature flag for rollback |

#### Excluded from MVP
- Rejection notes (just reject, no guidance)
- Per-beat regeneration
- Glue phase (skip directly to segmentation)
- Duration override (use project defaults)
- Full artifact history
- Per-phase model configuration

#### API Endpoints (MVP)

```
POST   /api/script-builder/blueprint          # Generate blueprint
PUT    /api/script-builder/blueprint/:id/approve  # Approve all beats
POST   /api/script-builder/blueprint/:id/regenerate  # Regenerate
POST   /api/script-builder/execute            # Start execution
GET    /api/script-builder/execute/:id/status # Check progress
POST   /api/script-builder/execute/:id/resume # Resume from checkpoint
POST   /api/script-builder/segment            # Create segments
```

#### Database Changes (MVP)

New tables (conceptual):
- `Blueprint` - stores blueprint with beats as JSON
- `ScriptDraft` - stores execution state and beat texts as JSON

#### Success Criteria
- [x] User can generate blueprint with 4-10 beats ✅
- [x] User can review and approve/reject blueprint ✅
- [x] Rejected blueprint triggers full regeneration ✅
- [x] Multi-prompt execution completes for all beats ✅
- [x] Execution can resume after failure ✅
- [x] Segmentation produces 8-12 TTS-ready segments ✅
- [x] Legacy script generation disabled (behind flag) ✅

**Phase 1 MVP Status: ✅ COMPLETE (2026-01-12)**

---

### Phase 2: v1.1 - Polish & UX

**Goal:** Add review features and improve user control.

#### Scope

| Feature | Description |
|---------|-------------|
| Rejection notes | User provides guidance when rejecting beats |
| Per-beat regeneration | Regenerate individual beats post-execution |
| Glue phase | Inline editor with issue highlighting |
| Robot word detection | Auto-detect and flag robot words |
| Seam detection | Identify awkward beat transitions |
| Duration override | User can override project default |
| Full artifact history | Store all versions of blueprint and drafts |
| Media suggestions | Include in blueprint beats |

#### New API Endpoints

```
PUT    /api/script-builder/blueprint/:id/review  # Submit per-beat reviews with notes
POST   /api/script-builder/beat/:id/regenerate   # Regenerate single beat
GET    /api/script-builder/draft/:id/glue-analysis  # Get detected issues
PUT    /api/script-builder/draft/:id/polish      # Save polished text
```

#### UI Additions
- Beat card with notes field on rejection
- "Regenerate" button per beat in execution review
- Glue phase view with highlighted issues
- Inline text editor
- Duration input with default display

#### Success Criteria
- [✅] User can provide notes when rejecting beats
- [✅] User can regenerate individual beats after execution
- [✅] Glue phase shows robot words and seams *(2026-01-15)*
- [✅] User can edit script inline *(2026-01-15)*
- [✅] User can override duration at script step
- [✅] All blueprint and draft versions are preserved *(2026-01-16)*

---

### Phase 3: v1.2 - Advanced Features

**Goal:** Add power-user features and analytics.

#### Scope

| Feature | Description |
|---------|-------------|
| Per-phase model config | Select different models for blueprint/execution/segmentation |
| Blueprint templates | Save and reuse blueprint structures |
| Style modifier presets | Custom emotion-to-modifier mappings |
| Analytics dashboard | Track generation times, retry rates, quality scores |
| Export/import | Export blueprint/script as JSON, import from template |
| Batch regeneration | Regenerate multiple beats at once |
| A/B variants | Generate multiple script variants for comparison |

#### New API Endpoints

```
GET    /api/script-builder/settings           # Get phase-specific settings
PUT    /api/script-builder/settings           # Update settings
POST   /api/script-builder/templates          # Save blueprint as template
GET    /api/script-builder/templates          # List templates
POST   /api/script-builder/export/:draftId    # Export to JSON
POST   /api/script-builder/import             # Import from JSON
GET    /api/script-builder/analytics          # Get usage analytics
```

#### UI Additions
- Settings panel for model selection per phase
- Template library browser
- Export/import buttons
- Analytics charts (generation time, retry rate, etc.)

#### Success Criteria
- [ ] User can configure different models per phase
- [ ] User can save blueprints as reusable templates
- [ ] User can export script as JSON
- [ ] User can import blueprint from JSON template
- [ ] Analytics show generation metrics

---

### Phase Dependencies

```
Phase 1 (MVP)
    │
    ├── Blueprint generation ────────────────────────┐
    ├── Basic review (approve/reject) ───────────────┤
    ├── Multi-prompt execution ──────────────────────┤
    ├── Checkpointing ───────────────────────────────┤
    └── Segmentation ────────────────────────────────┘
            │
            ▼
Phase 2 (v1.1)
    │
    ├── Rejection notes ◄─── requires: basic review
    ├── Per-beat regen ◄──── requires: execution
    ├── Glue phase ◄──────── requires: segmentation
    ├── Duration override ◄─ standalone
    └── Full history ◄────── requires: basic persistence
            │
            ▼
Phase 3 (v1.2)
    │
    ├── Per-phase models ◄── requires: execution
    ├── Templates ◄───────── requires: blueprint + full history
    ├── Export/import ◄───── requires: full history
    └── Analytics ◄───────── requires: all phases for data
```

---

### Rollout Strategy

#### Phase 1 Rollout
1. Deploy behind feature flag `SCRIPT_BUILDER_MVP`
2. Enable for internal testing (1 week)
3. Enable for beta users (opt-in)
4. Monitor error rates and completion rates
5. If stable, make default with legacy fallback

#### Phase 2 Rollout
1. Deploy incrementally (feature-by-feature)
2. Glue phase optional initially (can skip)
3. Full rollout after 1 week of monitoring

#### Phase 3 Rollout
1. Templates/export as experimental features
2. Analytics dashboard for admin users first
3. Full rollout based on adoption metrics

---

## 13. Open Questions

| # | Question | Status | Decision |
|---|----------|--------|----------|
| 1 | Should blueprint generation use streaming for real-time beat display? | Open | TBD |
| 2 | Should we implement collaborative editing for the Glue phase? | Deferred | Future iteration |
| 3 | What analytics should we capture for script quality? | Open | TBD |
| 4 | Should there be a "template" system for common video formats? | Deferred | Future iteration |
| 5 | How do we handle multi-language scripts? | Deferred | Future iteration |

---

## Appendix A: Style Modifier Reference

### By Emotion Mapping

```typescript
const STYLE_MODIFIERS: Record<TargetEmotion, string[]> = {
  curiosity: [
    'Pattern interrupt - start with unexpected angle',
    'Open loops - plant unanswered questions',
    'Direct address - use "you" frequently',
  ],
  anger: [
    'Staccato rhythm - short punchy sentences',
    'Concrete examples - specific cases of injustice',
    'Rhetorical questions - "How is this acceptable?"',
  ],
  dread: [
    'Slow pacing - let tension build',
    'Sensory language - make them feel it',
    'Foreshadowing - hint at what\'s coming',
  ],
  hope: [
    'Flowing sentences - smooth and uplifting',
    'Future tense - paint possibility',
    'Concrete analogies - make hope tangible',
  ],
  surprise: [
    'Short punch lines - deliver the twist concisely',
    'Contrast - set up expectation then subvert',
    'Pivot phrases - "But here\'s what nobody expected..."',
  ],
  validation: [
    'Second person - "You\'ve felt this"',
    'Shared experience - collective "we"',
    'Recognition - name the unspoken feeling',
  ],
  urgency: [
    'Imperative mood - "You need to understand"',
    'Time pressure language - "Right now..."',
    'Statistics and facts - ground the urgency',
  ],
  reflection: [
    'Ambiguous questions - no easy answers',
    'Lyricism - almost poetic phrasing',
    'Metaphor and imagery - paint a picture',
  ],
};
```

---

## Appendix B: Robot Words Reference

Words/phrases to flag in Glue phase:

```
- Furthermore
- Moreover
- Additionally
- In conclusion
- In summary
- To summarize
- It is important to note
- It should be noted
- As mentioned earlier
- As previously stated
- First and foremost
- Last but not least
- At the end of the day
- Moving forward
- Going forward
- With that being said
- That being said
- In today's world
- In this day and age
- Needless to say
- Without a doubt
- It goes without saying
```

---

*End of Document*
