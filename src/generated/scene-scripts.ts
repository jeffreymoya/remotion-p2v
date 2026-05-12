import { SceneScriptSchema } from "../lib/scene-script-schema";
import type { SceneScript } from "../lib/scene-script-schema";

const rawSceneScripts = [
  {
    "schemaVersion": 1,
    "title": "Exemplar: Quiet Vacationing \u2014 The Hook",
    "slug": "exemplar-professional",
    "durationInFrames": 900,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [],
    "scenes": [
      {
        "type": "ContradictionHook",
        "frameRange": [
          0,
          120
        ],
        "setup": "Quiet Quitting",
        "reveal": "Quiet Vacationing",
        "style": "stark"
      },
      {
        "type": "ContextCard",
        "frameRange": [
          105,
          225
        ],
        "body": "87% of remote workers admit they've worked while officially on vacation \u2014 but the reverse is now exploding.",
        "transition": {
          "kind": "slide",
          "direction": "from-right"
        }
      },
      {
        "type": "ComparisonSplit",
        "frameRange": [
          210,
          450
        ],
        "leftLabel": "Quiet Quitting",
        "rightLabel": "Quiet Vacationing",
        "rows": [
          {
            "label": "vs",
            "left": "Minimal effort at desk",
            "right": "Fully away, appearing present"
          },
          {
            "label": "vs",
            "left": "Disengaged but visible",
            "right": "Absent but green on Slack"
          },
          {
            "label": "vs",
            "left": "Emotional withdrawal",
            "right": "Physical withdrawal"
          }
        ],
        "verdict": "Same burnout \u2014 different zip code",
        "transition": {
          "kind": "wipe",
          "direction": "from-left"
        }
      },
      {
        "type": "StatCounter",
        "frameRange": [
          435,
          600
        ],
        "value": "37%",
        "label": "of remote workers took a trip without filing PTO last year",
        "sublabel": "Harris Poll, 2024",
        "color": "#22d3ee",
        "transition": {
          "kind": "slide",
          "direction": "from-bottom"
        }
      },
      {
        "type": "ContrastReveal",
        "frameRange": [
          585,
          735
        ],
        "setup": "Companies call it time theft",
        "reveal": "Employees call it survival",
        "transition": {
          "kind": "flip",
          "direction": "from-right"
        }
      },
      {
        "type": "MicroQuestion",
        "frameRange": [
          720,
          825
        ],
        "question": "But is sneaking a vacation actually bad for productivity?",
        "style": "typewriter",
        "transition": {
          "kind": "slide",
          "direction": "from-right"
        }
      },
      {
        "type": "MiniPayoff",
        "frameRange": [
          810,
          900
        ],
        "rule": "Rest, sneaked in, is still rest.",
        "bullets": [
          "Recovery improves focus by 23%",
          "Autonomy reduces turnover by 34%",
          "Burned-out workers cost 1.5x their salary"
        ],
        "transition": {
          "kind": "wipe",
          "direction": "from-top-right"
        }
      }
    ]
  },
  {
    "schemaVersion": 1,
    "title": "The Secret Rise of Quiet Vacationing (0:00-0:30) Scene 001",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-001",
    "durationInFrames": 296,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 30,
    "assets": [
      {
        "label": "office-desk.jpg",
        "role": "background",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/remote-work-paradox/office-desk.jpg"
      },
      {
        "label": "beach-scene.jpg",
        "role": "background",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/remote-work-paradox/beach-scene.jpg"
      },
      {
        "label": "office-worker.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/remote-work-paradox/office-worker.png"
      },
      {
        "label": "beach-laptop-person.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/remote-work-paradox/beach-laptop-person.png"
      },
      {
        "label": "active-indicator.png",
        "role": "static_overlay",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/remote-work-paradox/active-indicator.png"
      }
    ],
    "scenes": [
      {
        "type": "ContradictionHook",
        "frameRange": [
          0,
          120
        ],
        "setup": "Remote Work = Higher Productivity",
        "reveal": "The Secret Rise of Quiet Vacationing",
        "style": "stark"
      },
      {
        "type": "BRoll",
        "frameRange": [
          105,
          165
        ],
        "backgroundAsset": "office-desk.jpg",
        "overlayAssets": [
          {
            "label": "office-worker.png",
            "x": 35,
            "y": 70,
            "scale": 0.8,
            "entrance": "springPop",
            "entranceFrame": 0,
            "motion": "static"
          }
        ],
        "caption": "Productive at desk\u2026 or so it seems",
        "transition": {
          "kind": "slide",
          "direction": "from-left"
        }
      },
      {
        "type": "BRoll",
        "frameRange": [
          150,
          220
        ],
        "backgroundAsset": "beach-scene.jpg",
        "overlayAssets": [
          {
            "label": "beach-laptop-person.png",
            "x": 55,
            "y": 65,
            "scale": 1,
            "entrance": "slideUp",
            "entranceFrame": 0,
            "motion": "static"
          },
          {
            "label": "active-indicator.png",
            "x": 70,
            "y": 25,
            "scale": 1,
            "entrance": "springPop",
            "entranceFrame": 15,
            "motion": "pulse"
          }
        ],
        "caption": "The green dot tells a different story",
        "transition": {
          "kind": "wipe",
          "direction": "from-left"
        }
      },
      {
        "type": "MiniPayoff",
        "frameRange": [
          205,
          296
        ],
        "rule": "The green dot doesn't mean at the desk.",
        "bullets": [
          "87% of remote workers vacation secretly",
          "Productivity illusion meets personal freedom",
          "Quiet Vacationing is the new normal"
        ],
        "transition": {
          "kind": "flip",
          "direction": "from-bottom"
        }
      }
    ],
    "audioFile": "audio/the-secret-rise-of-quiet-vacationing-0-00-0-30/scene-001.wav"
  },
  {
    "schemaVersion": 1,
    "title": "The Illusion of Quiet Vacationing",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-002",
    "durationInFrames": 315,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [
      {
        "label": "house.jpg",
        "role": "background",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/the-illusion/house.jpg"
      },
      {
        "label": "person-sneaking-beachbag.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/the-illusion/person-sneaking-beachbag.png"
      },
      {
        "label": "calendar-emails.png",
        "role": "screen_mockup",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/the-illusion/calendar-emails.png"
      },
      {
        "label": "slack-active-dot.png",
        "role": "screen_mockup",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/the-illusion/slack-active-dot.png"
      }
    ],
    "scenes": [
      {
        "type": "ContradictionHook",
        "frameRange": [
          0,
          60
        ],
        "setup": "Quiet Quitting",
        "reveal": "Quiet Vacationing",
        "style": "stark"
      },
      {
        "type": "PromiseCard",
        "frameRange": [
          45,
          120
        ],
        "promise": "How to appear working while secretly on vacation",
        "bullets": [
          "Schedule emails in advance",
          "Sneak out without PTO",
          "Maintain a green active dot on Slack"
        ],
        "transition": {
          "kind": "slide",
          "direction": "from-right"
        }
      },
      {
        "type": "BRoll",
        "frameRange": [
          105,
          165
        ],
        "backgroundAsset": "calendar-emails.png",
        "caption": "Schedule emails in advance",
        "transition": {
          "kind": "wipe",
          "direction": "from-left"
        }
      },
      {
        "type": "BRoll",
        "frameRange": [
          150,
          210
        ],
        "backgroundAsset": "house.jpg",
        "overlayAssets": [
          {
            "label": "person-sneaking-beachbag.png",
            "x": 50,
            "y": 50,
            "scale": 0.8,
            "entrance": "slideUp",
            "entranceFrame": 0,
            "motion": "static"
          }
        ],
        "caption": "Sneaking out without PTO",
        "transition": {
          "kind": "flip",
          "direction": "from-bottom"
        }
      },
      {
        "type": "Callout",
        "frameRange": [
          195,
          255
        ],
        "phrase": "Only a green active dot",
        "style": "overlay",
        "backgroundAsset": "slack-active-dot.png",
        "transition": {
          "kind": "slide",
          "direction": "from-top"
        }
      },
      {
        "type": "MiniPayoff",
        "frameRange": [
          240,
          315
        ],
        "rule": "Rest, sneaked in, is still rest.",
        "bullets": [
          "Recovery improves focus by 23%",
          "Autonomy reduces turnover by 34%",
          "Burned-out workers cost 1.5x their salary"
        ],
        "transition": {
          "kind": "wipe",
          "direction": "from-top-right"
        }
      }
    ],
    "audioFile": "audio/the-secret-rise-of-quiet-vacationing-0-00-0-30/scene-002.wav"
  },
  {
    "schemaVersion": 1,
    "title": "The Secret Rise of Quiet Vacationing - Scene 003",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-003",
    "durationInFrames": 110,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [
      {
        "label": "question_mark.png",
        "role": "static_overlay",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/burning-questions/question_mark.png"
      },
      {
        "label": "trend_graph.png",
        "role": "static_overlay",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/burning-questions/trend_graph.png"
      },
      {
        "label": "stopwatch.png",
        "role": "static_overlay",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/burning-questions/stopwatch.png"
      }
    ],
    "scenes": [
      {
        "type": "HiddenMechanismHook",
        "frameRange": [
          0,
          96
        ],
        "headline": "But why is this spreading so fast",
        "teaser": "and is it actually a problem?"
      },
      {
        "type": "ContextCard",
        "frameRange": [
          81,
          110
        ],
        "body": "Quiet Vacationing has surged 37% in one year, raising urgent questions about its long-term impact.",
        "transition": {
          "kind": "slide",
          "direction": "from-right"
        }
      },
      {
        "type": "DiagramScene",
        "frameRange": [
          96,
          110
        ],
        "title": "The Burning Question",
        "nodes": [
          {
            "label": "\u2753",
            "x": 50,
            "y": 30
          },
          {
            "label": "\ud83d\udcc8 Rise",
            "x": 20,
            "y": 70
          },
          {
            "label": "\u23f1 Urgency",
            "x": 80,
            "y": 70
          }
        ],
        "annotation": "Spreading fast \u2013 but is it harmful?",
        "transition": {
          "kind": "wipe",
          "direction": "from-top-left"
        }
      },
      {
        "type": "Foreshadow",
        "frameRange": [
          105,
          110
        ],
        "tease": "The answer might change how you see remote work forever.",
        "transition": {
          "kind": "flip",
          "direction": "from-left"
        }
      }
    ],
    "audioFile": "audio/the-secret-rise-of-quiet-vacationing-0-00-0-30/scene-003.wav"
  },
  {
    "schemaVersion": 1,
    "title": "The Secret Rise of Quiet Vacationing \u2014 Scene 004",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-004",
    "durationInFrames": 243,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [
      {
        "label": "lightbulb.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/what-you-will-discover/lightbulb.png"
      },
      {
        "label": "warning.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/what-you-will-discover/warning.png"
      },
      {
        "label": "magnifying_glass.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/what-you-will-discover/magnifying_glass.png"
      },
      {
        "label": "checklist.png",
        "role": "background",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/what-you-will-discover/checklist.png"
      }
    ],
    "scenes": [
      {
        "type": "HiddenMechanismHook",
        "frameRange": [
          0,
          90
        ],
        "headline": "How Quiet Vacationing Really Works",
        "teaser": "By the end, you'll know the motivations, consequences, and how to spot it."
      },
      {
        "type": "BRoll",
        "frameRange": [
          75,
          177
        ],
        "backgroundAsset": "checklist.png",
        "overlayAssets": [
          {
            "label": "lightbulb.png",
            "x": 30,
            "y": 50,
            "scale": 0.5,
            "entrance": "springPop",
            "entranceFrame": 0,
            "motion": "static"
          },
          {
            "label": "warning.png",
            "x": 50,
            "y": 50,
            "scale": 0.5,
            "entrance": "springPop",
            "entranceFrame": 42,
            "motion": "static"
          },
          {
            "label": "magnifying_glass.png",
            "x": 70,
            "y": 50,
            "scale": 0.5,
            "entrance": "springPop",
            "entranceFrame": 102,
            "motion": "static"
          }
        ],
        "caption": "What You'll Discover: A 3-part framework",
        "transition": {
          "kind": "slide",
          "direction": "from-left"
        }
      },
      {
        "type": "ContextCard",
        "frameRange": [
          162,
          200
        ],
        "body": "These three pillars \u2014 motivation, consequence, detection \u2014 give you a complete lens on Quiet Vacationing.",
        "transition": {
          "kind": "flip",
          "direction": "from-right"
        }
      },
      {
        "type": "Foreshadow",
        "frameRange": [
          185,
          243
        ],
        "tease": "Next: How to spot the warning signs before it's too late.",
        "transition": {
          "kind": "wipe",
          "direction": "from-top-left"
        }
      }
    ],
    "audioFile": "audio/the-secret-rise-of-quiet-vacationing-0-00-0-30/scene-004.wav"
  }
] as const;

export const sceneScripts: SceneScript[] = rawSceneScripts.map((script) =>
  SceneScriptSchema.parse(script),
);
