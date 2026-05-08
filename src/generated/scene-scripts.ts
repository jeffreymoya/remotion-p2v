import { SceneScriptSchema } from "../lib/scene-script-schema";
import type { SceneScript } from "../lib/scene-script-schema";

const rawSceneScripts = [
  {
    "schemaVersion": 1,
    "title": "QuietVacationingIntro",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30",
    "durationInFrames": 900,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [
      {
        "label": "beach_bg.jpg",
        "path": "images/beach_bg.jpg",
        "role": "background"
      },
      {
        "label": "person_sunglasses.png",
        "path": "images/person_sunglasses.png",
        "role": "animated_object"
      },
      {
        "label": "beach_chair.png",
        "path": "images/beach_chair.png",
        "role": "animated_object"
      },
      {
        "label": "beach_umbrella.png",
        "path": "images/beach_umbrella.png",
        "role": "animated_object"
      },
      {
        "label": "laptop_open.png",
        "path": "images/laptop_open.png",
        "role": "animated_object"
      }
    ],
    "scenes": [
      {
        "type": "ContradictionHook",
        "frameRange": [
          0,
          90
        ],
        "setup": "Quiet Quitting",
        "reveal": "Quiet Vacationing",
        "style": "stark"
      },
      {
        "type": "DiagramScene",
        "frameRange": [
          90,
          210
        ],
        "title": "The Scheduling Trick",
        "nodes": [
          {
            "label": "Green Active Dot",
            "x": 20,
            "y": 30
          },
          {
            "label": "Schedule Send",
            "x": 50,
            "y": 30
          },
          {
            "label": "Timed Emails\n10:00, 14:00, 16:00",
            "x": 80,
            "y": 30
          }
        ],
        "edges": [
          {
            "from": "Green Active Dot",
            "to": "Schedule Send"
          },
          {
            "from": "Schedule Send",
            "to": "Timed Emails"
          }
        ],
        "annotation": "Pre-schedule messages to maintain online presence from anywhere."
      },
      {
        "type": "BRoll",
        "frameRange": [
          210,
          420
        ],
        "backgroundAsset": "beach_bg.jpg",
        "overlayAssets": [
          {
            "label": "person_sunglasses.png",
            "x": 25,
            "y": 60,
            "scale": 0.8,
            "entrance": "fadeIn",
            "entranceFrame": 0
          },
          {
            "label": "beach_chair.png",
            "x": 40,
            "y": 75,
            "scale": 0.9,
            "entrance": "slideUp",
            "entranceFrame": 15
          },
          {
            "label": "beach_umbrella.png",
            "x": 70,
            "y": 30,
            "scale": 1,
            "entrance": "springPop",
            "entranceFrame": 30
          },
          {
            "label": "laptop_open.png",
            "x": 75,
            "y": 80,
            "scale": 1,
            "entrance": "fadeIn",
            "entranceFrame": 45
          }
        ]
      },
      {
        "type": "Callout",
        "frameRange": [
          420,
          540
        ],
        "phrase": "The Quiet Vacation Checklist",
        "style": "card",
        "backgroundAsset": "beach_bg.jpg",
        "lines": [
          {
            "text": "No approved PTO",
            "icon": "✗",
            "color": "#C41E3A"
          },
          {
            "text": "No out‑of‑office message",
            "icon": "✗",
            "color": "#C41E3A"
          },
          {
            "text": "Just you, your sunglasses, and a green active dot on Slack",
            "icon": "✓",
            "color": "#2FA44F"
          }
        ]
      },
      {
        "type": "MicroQuestion",
        "frameRange": [
          540,
          600
        ],
        "question": "Why do they do this?",
        "questions": [
          "Why do they do this?",
          "Is it a bad thing?"
        ],
        "style": "typewriter"
      },
      {
        "type": "PromiseCard",
        "frameRange": [
          600,
          900
        ],
        "promise": "By the end, you'll understand:",
        "bullets": [
          "🔍 Psychological drivers behind quiet vacationing",
          "⚠️ Hidden costs that outweigh a free beach day"
        ]
      }
    ]
  }
] as const;

export const sceneScripts: SceneScript[] = rawSceneScripts.map((script) =>
  SceneScriptSchema.parse(script),
);
