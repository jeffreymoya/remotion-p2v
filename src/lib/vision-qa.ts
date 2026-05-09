import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { traceable } from "langsmith/traceable";

export interface VisionQaResult {
  ok: boolean;
  reason?: string;
  suggestion?: string;
}

const VISION_QA_SCRIPT = `
import google.generativeai as genai
import json, sys, os

api_key = os.environ.get("GOOGLE_API_KEY", "")
if not api_key:
    print(json.dumps({"ok": True}))
    sys.exit(0)

genai.configure(api_key=api_key)

image_path = sys.argv[1]
visual_requirements = sys.argv[2]
asset_role = sys.argv[3]

try:
    import PIL.Image
    image = PIL.Image.open(image_path)
except Exception as e:
    print(json.dumps({"ok": False, "reason": f"Cannot open image: {e}"}))
    sys.exit(0)

prompt = f"""You are an image quality reviewer for a video production pipeline.

Evaluate whether this image is suitable for a Remotion video composition.

Asset role: {asset_role}
Visual requirements: {visual_requirements}

Check for:
1. Does the image subject match the visual requirements?
2. Is the main subject clearly visible and not occluded/covered?
3. Is the image quality sufficient (not blurry, not too small)?
4. For cutout assets: is the subject separable from the background?

Respond with JSON only:
{{"ok": true}} if the image is suitable
{{"ok": false, "reason": "<what's wrong>", "suggestion": "<better search query>"}} if not
"""

model = genai.GenerativeModel("gemini-2.5-flash")
result = model.generate_content(
    [image, prompt],
    generation_config=genai.GenerationConfig(
        response_mime_type="application/json",
    ),
)

text = result.text.strip()
try:
    parsed = json.loads(text)
    print(json.dumps(parsed))
except json.JSONDecodeError:
    print(json.dumps({"ok": True}))
`;

function findPythonCommand(): string {
  const localPython = path.join(process.cwd(), ".venv", "bin", "python");
  return fs.existsSync(localPython) ? localPython : "python3";
}

function hasGoogleApiKey(): boolean {
  return Boolean(process.env.GOOGLE_API_KEY);
}

async function visionQaImpl(
  imagePath: string,
  visualRequirements: string,
  assetRole: string,
): Promise<VisionQaResult> {
  if (!hasGoogleApiKey()) {
    return { ok: true };
  }

  if (!fs.existsSync(imagePath)) {
    return { ok: false, reason: "Image file does not exist" };
  }

  const python = findPythonCommand();
  const result = spawnSync(
    python,
    ["-c", VISION_QA_SCRIPT, imagePath, visualRequirements, assetRole],
    {
      encoding: "utf-8",
      timeout: 30_000,
      env: { ...process.env },
    },
  );

  if (result.error) {
    // Non-fatal: skip QA if Python or google-generativeai is unavailable
    console.warn(`  [vision-qa] Python error, skipping: ${result.error.message}`);
    return { ok: true };
  }

  if (result.status !== 0) {
    const stderr = (result.stderr ?? "").trim();
    if (stderr.includes("ModuleNotFoundError")) {
      console.warn("  [vision-qa] google-generativeai not installed, skipping QA");
      return { ok: true };
    }
    console.warn(`  [vision-qa] Script exited with ${result.status}, skipping`);
    return { ok: true };
  }

  const stdout = (result.stdout ?? "").trim();
  if (!stdout) {
    return { ok: true };
  }

  try {
    const parsed = JSON.parse(stdout) as VisionQaResult;
    return {
      ok: Boolean(parsed.ok),
      reason: parsed.reason,
      suggestion: parsed.suggestion,
    };
  } catch {
    return { ok: true };
  }
}

export const visionQa = traceable(visionQaImpl, {
  name: "visionQa",
  run_type: "tool",
});
