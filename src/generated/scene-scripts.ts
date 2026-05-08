import { SceneScriptSchema } from "../lib/scene-script-schema";
import type { SceneScript } from "../lib/scene-script-schema";

const rawSceneScripts = [
  {
    "schemaVersion": 1,
    "title": "Intro: Quiet Vacationing",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-001",
    "durationInFrames": 240,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [
      {
        "label": "weary_office_worker.jpg",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/intro-quiet-vacationing/weary_office_worker.jpg"
      },
      {
        "label": "beach_vacationer.jpg",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/intro-quiet-vacationing/beach_vacationer.jpg"
      },
      {
        "label": "dark_charcoal_bg.png",
        "role": "background",
        "path": "images/dark_charcoal_bg.png"
      }
    ],
    "scenes": [
      {
        "type": "BRoll",
        "frameRange": [
          0,
          45
        ],
        "backgroundAsset": "weary_office_worker.jpg",
        "caption": "Quiet Quitting"
      },
      {
        "type": "BRoll",
        "frameRange": [
          30,
          240
        ],
        "backgroundAsset": "dark_charcoal_bg.png",
        "overlayAssets": [
          {
            "label": "weary_office_worker.jpg",
            "x": 0,
            "y": 60,
            "scale": 0.5,
            "entrance": "fadeIn",
            "entranceFrame": 0
          },
          {
            "label": "beach_vacationer.jpg",
            "x": 960,
            "y": 60,
            "scale": 0.5,
            "entrance": "fadeIn",
            "entranceFrame": 15
          }
        ],
        "caption": "Quiet Vacationing"
      }
    ]
  },
  {
    "schemaVersion": 1,
    "title": "Imagine the Scenario",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-002",
    "durationInFrames": 300,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 60,
    "assets": [
      {
        "label": "laptop-screen-ui.jpg",
        "role": "screen_mockup",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/imagine-the-scenario/laptop-screen-ui.jpg"
      },
      {
        "label": "beach.jpg",
        "role": "background",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/imagine-the-scenario/beach.jpg"
      },
      {
        "label": "green-dot.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/imagine-the-scenario/green-dot.png"
      },
      {
        "label": "thought-bubble.png",
        "role": "static_overlay",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/imagine-the-scenario/thought-bubble.png"
      }
    ],
    "scenes": [
      {
        "type": "BRoll",
        "frameRange": [
          0,
          180
        ],
        "backgroundAsset": "laptop-screen-ui.jpg",
        "overlayAssets": [
          {
            "label": "green-dot.png",
            "x": 85,
            "y": 90,
            "scale": 1,
            "entrance": "fadeIn",
            "entranceFrame": 60
          }
        ]
      },
      {
        "type": "BRoll",
        "frameRange": [
          120,
          300
        ],
        "backgroundAsset": "beach.jpg",
        "overlayAssets": []
      },
      {
        "type": "MicroQuestion",
        "frameRange": [
          135,
          180
        ],
        "question": "Wait\u2026 Is this even allowed?",
        "style": "fade"
      },
      {
        "type": "Callout",
        "frameRange": [
          210,
          300
        ],
        "phrase": "No PTO. No OOO.",
        "style": "overlay"
      },
      {
        "type": "Callout",
        "frameRange": [
          240,
          300
        ],
        "phrase": "Just you and a",
        "style": "overlay",
        "lines": [
          {
            "text": "green active dot",
            "icon": "green-dot.png",
            "color": "#2FA44F"
          }
        ]
      }
    ]
  },
  {
    "schemaVersion": 1,
    "title": "Scene 3 \u2014 The Big Questions",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-003",
    "durationInFrames": 360,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [
      {
        "label": "navy-bg.png",
        "role": "background",
        "path": "images/navy-bg.png"
      },
      {
        "label": "speaker-silhouette.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/questions-and-teaser/speaker-silhouette.png"
      }
    ],
    "scenes": [
      {
        "type": "BRoll",
        "frameRange": [
          0,
          360
        ],
        "backgroundAsset": "navy-bg.png",
        "overlayAssets": [
          {
            "label": "speaker-silhouette.png",
            "x": 15,
            "y": 60,
            "scale": 1,
            "entrance": "fadeIn",
            "entranceFrame": 0
          }
        ]
      },
      {
        "type": "DiagramScene",
        "frameRange": [
          30,
          360
        ],
        "nodes": [
          {
            "label": "?",
            "x": 17,
            "y": 45
          }
        ]
      },
      {
        "type": "MicroQuestion",
        "frameRange": [
          30,
          195
        ],
        "question": "But why are so many skilled remote workers doing this?",
        "style": "typewriter"
      },
      {
        "type": "Callout",
        "frameRange": [
          90,
          195
        ],
        "phrase": "",
        "style": "overlay",
        "lines": [
          {
            "text": "And more importantly, is it actually a bad thing?",
            "color": "#FF4D4D"
          }
        ]
      },
      {
        "type": "Callout",
        "frameRange": [
          210,
          360
        ],
        "phrase": "",
        "style": "card",
        "lines": [
          {
            "text": "By the end of this segment,"
          },
          {
            "text": "you'll understand the"
          },
          {
            "text": "surprising psychology",
            "color": "#FFD700"
          },
          {
            "text": "behind quiet vacationing \u2014 and whether it could be a"
          },
          {
            "text": "secret productivity hack.",
            "color": "#FFD700"
          }
        ]
      }
    ]
  }
] as const;

export const sceneScripts: SceneScript[] = rawSceneScripts.map((script) =>
  SceneScriptSchema.parse(script),
);
