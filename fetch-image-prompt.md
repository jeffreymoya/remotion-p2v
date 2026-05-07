Given this video segment from a script about **"Quiet Vacationing"** (0:00-0:30), find and save stock-style images for each visual asset.

Use Codex's built-in web image search tool when searching for candidates. Do not use ad hoc scraping, or browser-only manual search.

Workflow:

1. Search with Codex's built-in web image search for each required asset.
2. Prefer reputable stock, public-domain, open-license, or clearly reusable source pages.
3. Open candidate result/source pages when needed to verify image quality, dimensions, licensing, and whether the subject is safely framed.
4. Download the selected image files into `public/images/` using the exact filenames listed below.
5. Preserve each file's intended extension. Use `.jpg` for photographic full-screen backgrounds and `.png` for overlays or assets that benefit from transparency.
6. Verify every required file exists in `public/images/` after saving.

Goal: find images that are **usable in a 1920x1080 video composition without important parts being cut off, hidden, cropped, covered, or too close to the frame edges**.

For every selected image, prioritize:

- full subject/object visible
- no cropped edges or cut-off body/object parts
- unobstructed subject
- enough negative space for layering graphics
- clean composition suitable for masking/compositing
- sharp focus and high resolution
- landscape 16:9 for backgrounds
- isolated/transparent PNG-style assets for overlays when possible
- centered or slightly off-center subjects with safe margins
- no watermarks, captions, logos, or AI-looking artifacts

Avoid:

- partially cropped laptops, phones, mice, monitors, towels, or palm fronds
- objects partly outside the frame
- hands blocking the screen unless the hand itself is the required asset
- busy backgrounds that make masking difficult
- extreme close-ups with no crop margin
- visible brand logos unless explicitly required
- copyrighted screenshots when a generic mockup is safer

Output only a JSON array. Each item must include:

- `"label"`: exact asset path used in code
- `"query"`: specific built-in web image search query used to find the image
- `"downloaded_to"`: exact local saved path inside `public/images/`
- `"source_url"`: direct image URL or source page URL used for the download
- `"source_context"`: source page URL when different from `source_url`, if available
- `"rationale"`: what the image conveys and why it fits the no-cutoff / unobstructed / safe-margin requirement

Segment details:

- Scene 1 (1-10s): Laptop sitting on a beach towel, Slack/work-chat screen visible, ocean in background
- Scene 2 (10-20s): Smartphone being typed on under a palm tree, calendar app on screen
- Scene 3 (21-30s): Desktop close-up, mechanical mouse jiggler moving a mouse, green active status dot on blurred monitor

Assets needed:

1. `public/images/beach.jpg`
   Needs: tropical beach, ocean horizon, warm lighting, full-screen 1920x1080 background, wide shot, clean foreground, no people blocking scene, no cropped horizon.

2. `public/images/towel.png`
   Needs: beach towel on sand, full towel visible, top-down or slight angle, isolated/transparent preferred, no cut-off corners, no objects covering towel.

3. `public/images/laptop.png`
   Needs: modern laptop, full laptop visible, angled view showing screen, isolated/transparent preferred, no cropped keyboard/screen edges, screen usable for compositing.

4. `public/images/slack-screen.png`
   Needs: work chat app / Slack-style workspace mockup, clear UI, green active dot visible, no blur, no watermarks, usable for compositing onto laptop screen. Prefer a generic work-chat mockup over a copyrighted Slack screenshot when possible.

5. `public/images/palm-tree.png`
   Needs: palm tree with trunk and fronds visible, isolated/transparent preferred, no cropped fronds if used as foreground overlay.

6. `public/images/phone-calendar.png`
   Needs: smartphone held in hand, calendar or scheduling UI visible, phone fully visible, fingers not covering important screen area, no cropped hand/phone edges.

7. `public/images/hand-typing-A.png`
   Needs: hand/fingers over smartphone keyboard, typing pose A, isolated/transparent or clean background, fingers fully visible, no cropped fingertips.

8. `public/images/hand-typing-B.png`
   Needs: same hand/fingers in alternate typing pose B for animation, similar angle and lighting to A, fingers fully visible, no cropped fingertips.

9. `public/images/desk.jpg`
   Needs: wooden or office desk surface, top-down or slight angle, suitable as 1920x1080 background, clean surface, enough empty space, no objects covering key areas.

10. `public/images/monitor.png`
    Needs: computer monitor, full monitor visible, front-facing or slight angle, isolated/transparent preferred, no cropped stand/screen edges, screen usable for overlay/compositing.

11. `public/images/mouse.png`
    Needs: computer mouse, top-down view, full mouse visible, isolated/transparent preferred, no hand covering it, no cropped edges.
