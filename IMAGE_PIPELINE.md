# Image-to-Prompt Pipeline

Complete flow from manually uploaded images to text-to-image prompts.

## Overview

```
USER UPLOADS IMAGES
    ↓
IMAGES → ASSETS (stored in database)
    ↓
MAP ASSETS TO SCRIPT SEGMENTS (manual mapping)
    ↓
GENERATE AI PROMPTS FOR BOARDS (from script content)
    ↓
TEXT-TO-IMAGE MODEL (generates board image)
    ↓
FINAL VIDEO (with board images + mapped assets)
```

---

## Stage 1: Image Upload & Storage

**Endpoint:** `POST /api/assets/upload/route.ts`

**Flow:**
```
formData {
  file: File
  projectId: string
  type: "IMAGE" | "VIDEO" | "AUDIO" | "MUSIC"
  boardId?: string (optional)
}
    ↓
VALIDATION (file type, size)
    ↓
SAVE FILE to disk
    ↓
EXTRACT METADATA (dimensions, duration, etc.)
    ↓
CREATE ASSET record in database
    ↓
IF boardId provided: Link asset to board (Board.assetId = Asset.id)
    ↓
Response: { asset: Asset }
```

**Database Model (Asset):**
```typescript
id: string              // UUID
projectId: string      // Parent project
type: AssetType        // "IMAGE" | "VIDEO" | "AUDIO" | "MUSIC"
filename: string       // Original filename
path: string           // /assets/project-xxx/image-xxx.jpg
metadata: JSON         // width, height, duration, etc.
upscaled: boolean      // Whether upscaled to 8K
createdAt: DateTime
```

---

## Stage 2: Asset-to-Segment Mapping

**Component:** `SimpleAssetMapper` → Media Manager

**Flow:**
```
Script has segments indexed [0, 1, 2, 3, ...]
Images available in Asset library
    ↓
USER SELECTS in UI:
  Segment 0 → Image A
  Segment 1 → Image B
  Segment 2 → Image A (reuse)
    ↓
MAPPING CREATED:
  {
    0: "asset-uuid-1",
    1: "asset-uuid-2",
    2: "asset-uuid-1"
  }
    ↓
API: POST /api/projects/{id}/mappings
    ↓
SAVED to Project.assetMappings (JSON field in database)
```

**Usage Later:**
- When rendering video: look up `assetMappings[segmentIndex]` → get Asset ID
- Retrieve asset from database → place in video composition

---

## Stage 3: Board Prompt Generation

**Endpoint:** `POST /api/projects/[id]/boards/prompts`

**Input:**
```json
{
  "boards": [
    {
      "boardId": "board-1",
      "segmentIndices": [0, 1, 2],
      "topicSummary": "Crime investigation"
    }
  ],
  "segments": [
    {
      "id": "seg-1",
      "order": 1,
      "text": "Detective investigates the crime scene...",
      "estimatedDurationMs": 5000
    }
  ],
  "styleGuide": "Detective board style..." // optional
}
```

### Step 3.1: Content Analysis (AI)

**Function:** `analyzeContent()`

**Prompt Template:**
```
Analyze this script segment for visual representation:

TEXT:
[combined text from all board segments]

Extract:
1. Main topics (3-5 keywords)
2. Key entities (people, places, events, objects)
3. Emotional tone (dramatic, narrative, energetic, contemplative)

RETURN JSON: { "topics": [...], "entities": [...], "tone": "..." }
```

**Output:**
```json
{
  "topics": ["crime", "investigation", "mystery"],
  "entities": ["detective", "evidence", "crime scene"],
  "emotionalTone": "dramatic"
}
```

**AI Model:** `settings.ai.proModel` (usually Claude Pro or equivalent)

### Step 3.2: Element Generation

**Function:** `generateElements()`

Creates board layout skeleton based on topics:

```typescript
// Topic-to-element-type mapping
TOPIC_ELEMENT_MAPPING = {
  crime: ['photo', 'document', 'map', 'note', 'clipping'],
  mystery: ['photo', 'note', 'map', 'diagram'],
  sports: ['photo', 'clipping', 'diagram', 'note'],
  default: ['photo', 'note', 'clipping', 'document']
}

// Example: 2×3 grid layout
Elements generated:
  elem-1 (top-left):    photo
  elem-2 (top-center):  document
  elem-3 (top-right):   map
  elem-4 (bottom-left): clipping
  elem-5 (bottom-center): note
  elem-6 (bottom-right): diagram
```

**Output:**
```json
[
  {
    "id": "elem-1",
    "type": "photo",
    "gridPosition": { "row": 0, "col": 0 },
    "description": "",
    "connectionTo": []
  },
  // ... 5 more elements
]
```

### Step 3.3: Element Description (AI)

**Function:** `fillElementDescriptions()`

**Prompt Template:**
```
Generate descriptions for detective board elements.

CONTEXT:
Topic: crime, investigation, mystery
Key entities: detective, evidence, crime scene
Tone: dramatic

ELEMENTS TO DESCRIBE:
elem-1 (photo at row 0, col 0)
elem-2 (document at row 0, col 1)
... [all 6 elements]

For each element, provide:
- description: What specifically should be shown (20-40 words)
- label: Short handwritten label text (or null)
- connections: Array of element IDs this connects to

RETURN JSON (array only, no object wrapper):
[
  {
    "id": "elem-1",
    "description": "Polaroid photo showing...",
    "label": "2010",
    "connections": ["elem-3"]
  },
  // ... more elements
]
```

**Output:**
```json
[
  {
    "id": "elem-1",
    "description": "Polaroid photo of the crime scene with yellow caution tape",
    "label": "Scene Photos",
    "connections": ["elem-3", "elem-5"]
  },
  {
    "id": "elem-2",
    "description": "Police incident report dated March 15, 2010",
    "label": "Official Report",
    "connections": ["elem-1"]
  },
  // ... 4 more elements
]
```

### Step 3.4: Build Final Prompt

**Function:** `buildFullPrompt(elements, gridLayout, styleGuide)`

**Output Prompt Text:**
```
Create a detailed investigation board image with a cork board background.

STYLE:
- Warm brown cork board texture
- Elements pinned with colorful thumbtacks
- Red and white strings connecting related items
- Slightly aged, worn paper textures
- Dramatic lighting from top-left

GRID LAYOUT: 2 rows x 3 columns

ELEMENTS (place each in its specified position):
- TOP-LEFT: photo - Polaroid photo of the crime scene with yellow caution tape (labeled "Scene Photos")
- TOP-CENTER: document - Police incident report dated March 15, 2010 (labeled "Official Report")
- TOP-RIGHT: map - Hand-drawn map showing location of evidence
- BOTTOM-LEFT: clipping - Newspaper headline from the day of incident
- BOTTOM-CENTER: note - Handwritten notes on evidence timeline
- BOTTOM-RIGHT: diagram - Timeline diagram of events (labeled "Timeline")

CONNECTIONS:
- Connect elem-1 to elem-3, elem-5 with red string
- Connect elem-2 to elem-1 with red string
- Connect elem-6 to elem-1 with red string

IMPORTANT:
- Each element must be clearly visible and distinct
- Leave small gaps between elements
- Elements should fit within their grid cell
- Style should feel visually cohesive and intentional
```

**This final prompt is sent to text-to-image model (DALL-E, Midjourney, etc.)**

---

## Stage 4: Response & Storage

**API Response:**
```json
{
  "success": true,
  "data": {
    "version": "1.0",
    "prompts": [
      {
        "boardId": "board-1",
        "gridLayout": { "rows": 2, "cols": 3 },
        "styleGuide": "...",
        "elements": [...],
        "segmentContexts": [...],
        "fullPromptText": "Create a detailed investigation board..."
      }
    ],
    "generatedAt": "2025-05-01T12:34:56Z"
  },
  "saved": "/public/assets/projects/proj-123/boards/board-prompts.json"
}
```

**Stored:** `project/boards/board-prompts.json`

---

## Data Flow Summary

```
┌─────────────────────────────────────────────────────────────┐
│ USER UPLOADS IMAGES (Manual)                                │
├─────────────────────────────────────────────────────────────┤
│ File → Asset { id, path, metadata, ... }                    │
│ Stored in: src/generated/storyflow.Image / Asset models     │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│ USER MAPS ASSETS TO SEGMENTS (Manual)                       │
├─────────────────────────────────────────────────────────────┤
│ SimpleAssetMapper UI: Segment 0 → Asset A, Segment 1 → B    │
│ POST /api/projects/{id}/mappings { 0: "asset-id", ... }     │
│ Stored in: Project.assetMappings (JSON)                     │
└────────────────┬────────────────────────────────────────────┘
                 │
                 │ (Separate pipeline)
                 │
┌────────────────┴────────────────────────────────────────────┐
│ AI GENERATES BOARD PROMPTS (Automatic)                      │
├─────────────────────────────────────────────────────────────┤
│ 1. Script segments → AI content analysis                    │
│    Output: topics, entities, tone                           │
│                                                              │
│ 2. Topics → Element types (photo, document, map, etc.)      │
│    Output: Grid skeleton                                    │
│                                                              │
│ 3. Elements → AI description generation                     │
│    Output: Element descriptions, labels, connections       │
│                                                              │
│ 4. Full prompt text assembly                                │
│    Output: Text-to-image prompt                             │
│                                                              │
│ Stored in: project/boards/board-prompts.json                │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│ TEXT-TO-IMAGE MODEL (External)                              │
├─────────────────────────────────────────────────────────────┤
│ Input: fullPromptText from board prompts                    │
│ Output: Image of detective board (or similar style)         │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────┴────────────────────────────────────────────┐
│ FINAL VIDEO RENDERING                                       │
├─────────────────────────────────────────────────────────────┤
│ For each segment:                                            │
│   1. Look up assetMappings[segmentIndex] → Asset ID         │
│   2. Get asset from database                                │
│   3. Place in video composition                             │
│   4. Layer with board image, text, transitions, etc.        │
└─────────────────────────────────────────────────────────────┘
```

---

## Key Takeaways

| Aspect | Manual vs Automatic |
|--------|---------------------|
| **Asset Upload** | Manual (user uploads images) |
| **Asset-to-Segment Mapping** | Manual (user selects in UI) |
| **Board Prompt Generation** | Automatic (AI creates prompts) |
| **Board Image Creation** | Automatic (text-to-image model) |
| **Final Composition** | Automatic (video renderer assembles) |

**Two separate pipelines:**
1. **User content** → Images uploaded + mapped to segments
2. **AI content** → Script → prompts → board images generated

Both are combined in the final video render.
