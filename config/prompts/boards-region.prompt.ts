export interface RegionPromptContext {
  gridLayout: { rows: number; cols: number };
  expectedElements: Array<{
    id: string;
    type: string;
    gridPosition: { row: number; col: number };
    description: string;
  }>;
  imageAspectRatio: number;
  canvasAspectRatio: number; // Target video canvas (1.78 for 1920x1080)
}

export function boardsRegionPrompt(context: RegionPromptContext): string {
  const { rows, cols } = context.gridLayout;
  const cellWidth = (1 / cols).toFixed(3);
  const cellHeight = (1 / rows).toFixed(3);

  const elementHints = context.expectedElements
    .map(el => {
      const expectedX = (el.gridPosition.col / cols).toFixed(3);
      const expectedY = (el.gridPosition.row / rows).toFixed(3);
      const expectedW = cellWidth;
      const expectedH = cellHeight;

      return `  - ${el.id}: ${el.type}
      Expected position: x=${expectedX}, y=${expectedY}
      Expected size: ~${expectedW} x ${expectedH}
      Description: "${el.description}"`;
    })
    .join('\n\n');

  return `You are analyzing a detective board image for precise region detection.

IMAGE: [Attached]

GRID SPECIFICATION:
This image was generated with a ${rows}x${cols} grid layout.
- Cell width: ${cellWidth} (normalized 0-1)
- Cell height: ${cellHeight} (normalized 0-1)
- Total cells: ${rows * cols}

EXPECTED ELEMENTS:
${elementHints}

IMAGE PROPERTIES:
- Image aspect ratio: ${context.imageAspectRatio.toFixed(2)}:1
- Target canvas: ${context.canvasAspectRatio.toFixed(2)}:1

DETECTION TASK:
For each expected element, find its ACTUAL bounding box in the image.
The element may be slightly offset from the expected grid position.

RULES:
1. Bounds must TIGHTLY fit the visual element (not the grid cell)
2. Maximum width: ${cellWidth} (one column)
3. Maximum height: ${cellHeight} (one row)
4. All coordinates normalized 0-1
5. x + width <= 1.0, y + height <= 1.0
6. Each region should show ONE element when zoomed

RETURN FORMAT:
{
  "regions": [
    {
      "id": "region-1",
      "elementId": "elem-1",
      "gridPosition": { "row": 0, "col": 0 },
      "bounds": { "x": 0.02, "y": 0.03, "width": 0.30, "height": 0.45 },
      "label": "descriptive label",
      "salience": 0.9
    }
  ],
  "detectionNotes": "Any observations about layout differences"
}`;
}
