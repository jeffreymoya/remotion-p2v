> NOTE: CLI is deprecated and will be removed. Use the web UI. Any CLI references below are historical.

# Stage 5: Preview Stage

## Overview

Launch a browser-based preview server to visualize detected regions overlaid on board images. Supports drag/resize for manual adjustment.

**Files to create**:
- `cli/lib/preview-server.ts`

---

## Input

- `boards/board-regions.json` (from Stage 4)
- `assets/images/board-{n}.png`

---

## Output

- Browser UI at `http://localhost:3456`
- Updated `boards/board-regions.json` (if user saves adjustments)

---

## Features

1. **Display**: Image with region overlays (colored boxes)
2. **Labels**: Region ID and label shown on hover
3. **Sidebar**: List of all regions with coordinates
4. **Drag**: Click and drag to reposition regions
5. **Resize**: Corner/edge handles to resize regions
6. **Save**: Persist adjustments back to JSON file

---

## Architecture

```
┌────────────────────────────────────────────────┐
│                 Express Server                  │
├────────────────────────────────────────────────┤
│  GET /                    → Main HTML page      │
│  GET /api/boards          → List all boards     │
│  GET /api/regions/:boardId → Regions for board  │
│  PUT /api/regions/:boardId → Save adjusted      │
│  GET /assets/*            → Static images       │
└────────────────────────────────────────────────┘
```

### Path Resolution

> **Important**: The `imagePath` in `board-regions.json` is stored as a relative path (e.g., `"assets/images/board-1.png"`).
>
> - The preview HTML prepends `/` for browser fetch: `'/' + data.imagePath` → `/assets/images/board-1.png`
> - Express static middleware: `app.use('/assets', express.static(assetsPath))` where `assetsPath` = `{projectPath}/assets`
> - Full resolution: `/assets/images/board-1.png` → `{projectPath}/assets/images/board-1.png`
>
> This works correctly because the static middleware strips `/assets` prefix and serves from the project's assets directory.

---

## Implementation

### Server Setup

```typescript
// cli/lib/preview-server.ts

import express from 'express';
import path from 'path';
import fs from 'fs/promises';

interface PreviewServerConfig {
  projectId: string;
  port: number;
  projectPath: string;
}

export async function startPreviewServer(config: PreviewServerConfig): Promise<void> {
  const app = express();
  app.use(express.json());

  const boardsPath = path.join(config.projectPath, 'boards', 'board-regions.json');
  const assetsPath = path.join(config.projectPath, 'assets');

  // Serve static assets
  app.use('/assets', express.static(assetsPath));

  // API: Get all boards
  app.get('/api/boards', async (req, res) => {
    const data = JSON.parse(await fs.readFile(boardsPath, 'utf-8'));
    res.json(data.boards.map((b: any) => ({
      boardId: b.boardId,
      imagePath: b.imagePath,
      regionCount: b.regions.length,
    })));
  });

  // API: Get regions for a board
  app.get('/api/regions/:boardId', async (req, res) => {
    const data = JSON.parse(await fs.readFile(boardsPath, 'utf-8'));
    const board = data.boards.find((b: any) => b.boardId === req.params.boardId);
    if (!board) {
      return res.status(404).json({ error: 'Board not found' });
    }
    res.json(board);
  });

  // API: Save adjusted regions
  app.put('/api/regions/:boardId', async (req, res) => {
    const data = JSON.parse(await fs.readFile(boardsPath, 'utf-8'));
    const boardIndex = data.boards.findIndex((b: any) => b.boardId === req.params.boardId);

    if (boardIndex === -1) {
      return res.status(404).json({ error: 'Board not found' });
    }

    // Update regions
    data.boards[boardIndex].regions = req.body.regions;
    data.boards[boardIndex].lastModified = new Date().toISOString();

    // Save to file
    await fs.writeFile(boardsPath, JSON.stringify(data, null, 2));

    res.json({ success: true });
  });

  // Main page
  app.get('/', (req, res) => {
    res.send(generatePreviewHTML(config.projectId));
  });

  return new Promise((resolve) => {
    app.listen(config.port, () => {
      console.log(`\n[PREVIEW] Server running at http://localhost:${config.port}`);
      console.log(`[PREVIEW] Project: ${config.projectId}`);
      console.log(`[PREVIEW] Press Ctrl+C to stop\n`);
      resolve();
    });
  });
}
```

### HTML/JS UI

```typescript
function generatePreviewHTML(projectId: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <title>Board Regions Preview - ${projectId}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #1a1a2e;
      color: #eee;
      height: 100vh;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .header {
      padding: 12px 20px;
      background: #16213e;
      display: flex;
      align-items: center;
      gap: 16px;
      border-bottom: 1px solid #0f3460;
    }

    .header h1 { font-size: 18px; font-weight: 500; }

    .header select, .header button {
      padding: 8px 12px;
      border-radius: 4px;
      border: 1px solid #0f3460;
      background: #1a1a2e;
      color: #eee;
      cursor: pointer;
    }

    .header button:hover { background: #0f3460; }
    .header button.primary { background: #e94560; border-color: #e94560; }
    .header button.primary:hover { background: #c73e54; }

    /* Main layout */
    .main {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    /* Canvas area */
    .canvas-container {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      overflow: auto;
    }

    .image-wrapper {
      position: relative;
      display: inline-block;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
    }

    .image-wrapper img {
      display: block;
      max-width: 100%;
      max-height: calc(100vh - 150px);
    }

    /* Region overlays */
    .region {
      position: absolute;
      border: 2px solid #00ff88;
      background: rgba(0, 255, 136, 0.1);
      cursor: move;
      transition: background 0.2s;
    }

    .region:hover, .region.active {
      background: rgba(0, 255, 136, 0.25);
      border-color: #ffff00;
    }

    .region-label {
      position: absolute;
      top: -22px;
      left: 0;
      background: #00ff88;
      color: #000;
      font-size: 11px;
      font-weight: bold;
      padding: 2px 6px;
      border-radius: 2px;
      white-space: nowrap;
    }

    .region.active .region-label { background: #ffff00; }

    /* Resize handles */
    .resize-handle {
      position: absolute;
      width: 10px;
      height: 10px;
      background: #fff;
      border: 1px solid #00ff88;
    }

    .resize-handle.nw { top: -5px; left: -5px; cursor: nw-resize; }
    .resize-handle.ne { top: -5px; right: -5px; cursor: ne-resize; }
    .resize-handle.sw { bottom: -5px; left: -5px; cursor: sw-resize; }
    .resize-handle.se { bottom: -5px; right: -5px; cursor: se-resize; }

    /* Sidebar */
    .sidebar {
      width: 300px;
      background: #16213e;
      border-left: 1px solid #0f3460;
      overflow-y: auto;
      padding: 16px;
    }

    .sidebar h3 {
      font-size: 14px;
      margin-bottom: 12px;
      color: #888;
    }

    .region-card {
      background: #1a1a2e;
      border: 1px solid #0f3460;
      border-radius: 4px;
      padding: 10px;
      margin-bottom: 8px;
      cursor: pointer;
    }

    .region-card:hover { border-color: #00ff88; }
    .region-card.active { border-color: #ffff00; background: #0f3460; }

    .region-card-title {
      font-weight: bold;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .region-card-coords {
      font-size: 11px;
      color: #888;
      font-family: monospace;
    }

    /* Status bar */
    .status-bar {
      padding: 8px 20px;
      background: #16213e;
      border-top: 1px solid #0f3460;
      font-size: 12px;
      color: #888;
    }

    .status-bar .modified { color: #e94560; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Board Regions Preview</h1>
    <select id="boardSelect"></select>
    <button id="toggleLabels">Toggle Labels</button>
    <button id="resetBtn">Reset Changes</button>
    <button id="saveBtn" class="primary">Save Changes</button>
  </div>

  <div class="main">
    <div class="canvas-container">
      <div class="image-wrapper" id="imageWrapper">
        <img id="boardImage" src="">
      </div>
    </div>

    <div class="sidebar">
      <h3>REGIONS</h3>
      <div id="regionList"></div>
    </div>
  </div>

  <div class="status-bar">
    <span id="statusText">Loading...</span>
  </div>

  <script>
    let boards = [];
    let currentBoard = null;
    let regions = [];
    let originalRegions = [];
    let activeRegion = null;
    let isDragging = false;
    let isResizing = false;
    let resizeHandle = null;
    let dragStart = { x: 0, y: 0 };
    let showLabels = true;
    let hasChanges = false;

    // Initialize
    async function init() {
      boards = await fetch('/api/boards').then(r => r.json());

      const select = document.getElementById('boardSelect');
      boards.forEach(b => {
        const opt = document.createElement('option');
        opt.value = b.boardId;
        opt.textContent = b.boardId + ' (' + b.regionCount + ' regions)';
        select.appendChild(opt);
      });

      select.onchange = () => loadBoard(select.value);

      if (boards.length > 0) {
        loadBoard(boards[0].boardId);
      }
    }

    async function loadBoard(boardId) {
      const data = await fetch('/api/regions/' + boardId).then(r => r.json());
      currentBoard = data;
      regions = JSON.parse(JSON.stringify(data.regions));
      originalRegions = JSON.parse(JSON.stringify(data.regions));
      hasChanges = false;

      document.getElementById('boardImage').src = '/' + data.imagePath;
      document.getElementById('boardImage').onload = renderRegions;

      updateStatus();
    }

    function renderRegions() {
      const wrapper = document.getElementById('imageWrapper');
      const list = document.getElementById('regionList');

      // Clear existing
      wrapper.querySelectorAll('.region').forEach(el => el.remove());
      list.innerHTML = '';

      regions.forEach((r, idx) => {
        // Overlay
        const div = document.createElement('div');
        div.className = 'region';
        div.dataset.index = idx;
        div.style.left = (r.bounds.x * 100) + '%';
        div.style.top = (r.bounds.y * 100) + '%';
        div.style.width = (r.bounds.width * 100) + '%';
        div.style.height = (r.bounds.height * 100) + '%';

        const label = document.createElement('div');
        label.className = 'region-label';
        label.textContent = r.id;
        label.style.display = showLabels ? 'block' : 'none';
        div.appendChild(label);

        // Resize handles
        ['nw', 'ne', 'sw', 'se'].forEach(pos => {
          const handle = document.createElement('div');
          handle.className = 'resize-handle ' + pos;
          handle.dataset.handle = pos;
          div.appendChild(handle);
        });

        // Events
        div.onmousedown = (e) => startDrag(e, idx);
        div.onclick = (e) => { e.stopPropagation(); selectRegion(idx); };

        wrapper.appendChild(div);

        // Sidebar card
        const card = document.createElement('div');
        card.className = 'region-card';
        card.dataset.index = idx;
        card.innerHTML =
          '<div class="region-card-title">' + r.id + '</div>' +
          '<div class="region-card-coords">x:' + r.bounds.x.toFixed(3) +
          ' y:' + r.bounds.y.toFixed(3) + '<br>w:' + r.bounds.width.toFixed(3) +
          ' h:' + r.bounds.height.toFixed(3) + '</div>';
        card.onclick = () => selectRegion(idx);
        list.appendChild(card);
      });
    }

    function selectRegion(idx) {
      activeRegion = idx;

      document.querySelectorAll('.region').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });
      document.querySelectorAll('.region-card').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });
    }

    function startDrag(e, idx) {
      if (e.target.classList.contains('resize-handle')) {
        isResizing = true;
        resizeHandle = e.target.dataset.handle;
      } else {
        isDragging = true;
      }

      activeRegion = idx;
      selectRegion(idx);

      const img = document.getElementById('boardImage');
      dragStart = {
        x: e.clientX,
        y: e.clientY,
        bounds: { ...regions[idx].bounds },
        imgWidth: img.offsetWidth,
        imgHeight: img.offsetHeight,
      };

      e.preventDefault();
    }

    document.onmousemove = (e) => {
      if (!isDragging && !isResizing) return;
      if (activeRegion === null) return;

      const dx = (e.clientX - dragStart.x) / dragStart.imgWidth;
      const dy = (e.clientY - dragStart.y) / dragStart.imgHeight;
      const r = regions[activeRegion];
      const b = dragStart.bounds;

      if (isDragging) {
        r.bounds.x = Math.max(0, Math.min(1 - b.width, b.x + dx));
        r.bounds.y = Math.max(0, Math.min(1 - b.height, b.y + dy));
      } else if (isResizing) {
        if (resizeHandle.includes('e')) {
          r.bounds.width = Math.max(0.05, Math.min(1 - b.x, b.width + dx));
        }
        if (resizeHandle.includes('w')) {
          const newX = Math.max(0, b.x + dx);
          r.bounds.width = b.width + (b.x - newX);
          r.bounds.x = newX;
        }
        if (resizeHandle.includes('s')) {
          r.bounds.height = Math.max(0.05, Math.min(1 - b.y, b.height + dy));
        }
        if (resizeHandle.includes('n')) {
          const newY = Math.max(0, b.y + dy);
          r.bounds.height = b.height + (b.y - newY);
          r.bounds.y = newY;
        }
      }

      hasChanges = true;
      renderRegions();
      selectRegion(activeRegion);
      updateStatus();
    };

    document.onmouseup = () => {
      isDragging = false;
      isResizing = false;
    };

    // Buttons
    document.getElementById('toggleLabels').onclick = () => {
      showLabels = !showLabels;
      document.querySelectorAll('.region-label').forEach(el => {
        el.style.display = showLabels ? 'block' : 'none';
      });
    };

    document.getElementById('resetBtn').onclick = () => {
      regions = JSON.parse(JSON.stringify(originalRegions));
      hasChanges = false;
      renderRegions();
      updateStatus();
    };

    document.getElementById('saveBtn').onclick = async () => {
      await fetch('/api/regions/' + currentBoard.boardId, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regions }),
      });

      originalRegions = JSON.parse(JSON.stringify(regions));
      hasChanges = false;
      updateStatus();
      alert('Saved!');
    };

    function updateStatus() {
      const status = document.getElementById('statusText');
      if (hasChanges) {
        status.innerHTML = '<span class="modified">Unsaved changes</span> - ' +
          regions.length + ' regions';
      } else {
        status.textContent = currentBoard?.boardId + ' - ' + regions.length + ' regions';
      }
    }

    init();
  </script>
</body>
</html>`;
}
```

---

## CLI Integration

```typescript
case 'preview': {
  const regionsPath = path.join(paths.boards, 'board-regions.json');

  if (!await fileExists(regionsPath)) {
    console.error('[PREVIEW] board-regions.json not found. Run regions stage first.');
    process.exit(1);
  }

  await startPreviewServer({
    projectId: options.projectId,
    port: options.port || 3456,
    projectPath: paths.project,
  });

  // Keep process running
  await new Promise(() => {});
  break;
}
```

---

## User Workflow

1. Run `npm run boards -- --project <id> preview`
2. Open `http://localhost:3456` in browser
3. Select board from dropdown
4. Review region positions
5. Drag regions to adjust position
6. Use corner handles to resize
7. Click "Save Changes" to persist
8. Press Ctrl+C to stop server
9. Proceed to upscale stage

---

## Verification

```bash
# Start preview server
npm run boards -- --project project-1764548027472 preview

# In browser:
# - Verify image loads
# - Verify regions overlay correctly
# - Test drag functionality
# - Test resize handles
# - Save changes and verify file updated

# Check saved changes
cat public/projects/project-1764548027472/boards/board-regions.json | jq '.boards[0].regions[0].bounds'
```

---

## Next Step

After preview verification:
1. Run upscale command: `npm run upscale -- --project <id>`
2. Proceed to [06-triggers-stage.md](./06-triggers-stage.md)
