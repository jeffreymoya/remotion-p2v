import { BoardElement } from '../../src/lib/boards-types';

export function contentAnalysisPrompt(text: string): string {
  return `Analyze this script segment for visual representation:

TEXT:
${text}

Extract:
1. Main topics (3-5 keywords)
2. Key entities (people, places, events, objects)
3. Emotional tone (dramatic, narrative, energetic, contemplative)

RETURN JSON:
{
  "topics": ["topic1", "topic2"],
  "entities": ["person name", "place", "event"],
  "tone": "dramatic"
}`;
}

export function elementDescriptionPrompt(
  elements: BoardElement[],
  content: {
    topics: string[];
    keyEntities: string[];
    emotionalTone: string;
  }
): string {
  const elementList = elements
    .map(
      e => `${e.id} (${e.type} at row ${e.gridPosition.row}, col ${e.gridPosition.col})`
    )
    .join('\n');

  return `Generate descriptions for detective board elements.

CONTEXT:
Topic: ${content.topics.join(', ')}
Key entities: ${content.keyEntities.join(', ')}
Tone: ${content.emotionalTone}

ELEMENTS TO DESCRIBE:
${elementList}

For each element, provide:
- description: What specifically should be shown (20-40 words)
- label: Short handwritten label text (or null)
- connections: Array of element IDs this connects to (for visual strings)

RETURN JSON ARRAY:
[
  {
    "id": "elem-1",
    "description": "Polaroid photo showing...",
    "label": "2010",
    "connections": ["elem-3"]
  }
]`;
}
