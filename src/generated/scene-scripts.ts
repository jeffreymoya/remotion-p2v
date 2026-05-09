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
    "title": "Introducing Quiet Vacationing",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-001",
    "durationInFrames": 300,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [
      {
        "label": "office_bg.jpg",
        "role": "background",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/quiet-quitting-to-quiet-vacationing/office_bg.jpg"
      },
      {
        "label": "beach_bg.jpg",
        "role": "background",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/quiet-quitting-to-quiet-vacationing/beach_bg.jpg"
      }
    ],
    "scenes": [
      {
        "type": "ContradictionHook",
        "frameRange": [
          0,
          120
        ],
        "setup": "Working remotely means active and online",
        "reveal": "Remote workers are secretly at the beach",
        "style": "stark"
      },
      {
        "type": "ComparisonSplit",
        "frameRange": [
          105,
          210
        ],
        "leftLabel": "What the boss sees:",
        "rightLabel": "What actually happens:",
        "rows": [
          {
            "label": "Location",
            "left": "Office desk",
            "right": "Beach hammock"
          },
          {
            "label": "Activity",
            "left": "Typing reports",
            "right": "Sipping cocktails"
          },
          {
            "label": "Tool",
            "left": "Active status green",
            "right": "Mouse Jiggler running"
          }
        ],
        "verdict": "Quiet Vacationing is the new remote work reality",
        "transition": {
          "kind": "slide",
          "direction": "from-right"
        }
      },
      {
        "type": "MicroQuestion",
        "frameRange": [
          195,
          255
        ],
        "question": "Could you tell the difference?",
        "style": "typewriter",
        "transition": {
          "kind": "flip",
          "direction": "from-bottom"
        }
      },
      {
        "type": "Callout",
        "frameRange": [
          240,
          300
        ],
        "phrase": "Quiet Vacationing",
        "style": "fullscreen",
        "transition": {
          "kind": "wipe",
          "direction": "from-top-left"
        }
      }
    ]
  },
  {
    "schemaVersion": 1,
    "title": "Quiet Vacationing Fantasy",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-002",
    "durationInFrames": 300,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [
      {
        "label": "beachWorkerScene.png",
        "role": "background",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/margarita-and-slack/beachWorkerScene.png"
      }
    ],
    "scenes": [
      {
        "type": "HiddenMechanismHook",
        "frameRange": [
          0,
          90
        ],
        "headline": "She's on a beach with a margarita, but her Slack shows active.",
        "teaser": "The secret rise of quiet vacationing."
      },
      {
        "type": "BRoll",
        "frameRange": [
          75,
          165
        ],
        "backgroundAsset": "beachWorkerScene.png",
        "caption": "Work from anywhere, literally.",
        "transition": {
          "kind": "slide",
          "direction": "from-bottom"
        }
      },
      {
        "type": "DiagramScene",
        "frameRange": [
          150,
          225
        ],
        "title": "Scheduled Emails",
        "nodes": [
          {
            "label": "Q4 Report \u2014 2:30 PM",
            "x": 30,
            "y": 30
          },
          {
            "label": "Weekly Standup \u2014 3:00 PM",
            "x": 70,
            "y": 30
          },
          {
            "label": "Client Update \u2014 3:30 PM",
            "x": 50,
            "y": 70
          }
        ],
        "annotation": "Pre-written emails simulate presence while away.",
        "transition": {
          "kind": "wipe",
          "direction": "from-left"
        }
      },
      {
        "type": "Callout",
        "frameRange": [
          210,
          255
        ],
        "phrase": "Green Slack Dot",
        "style": "card",
        "lines": [
          {
            "text": "Permanent active status",
            "icon": "\ud83d\udfe2"
          }
        ],
        "transition": {
          "kind": "flip",
          "direction": "from-right"
        }
      },
      {
        "type": "MicroQuestion",
        "frameRange": [
          240,
          285
        ],
        "question": "Clever hack or fireable offense?",
        "style": "fade",
        "transition": {
          "kind": "slide",
          "direction": "from-right"
        }
      },
      {
        "type": "MiniPayoff",
        "frameRange": [
          270,
          300
        ],
        "rule": "Quiet vacationing reflects a broken trust, not laziness.",
        "bullets": [
          "23% boost after guilt-free rest",
          "Flexibility cuts burnout by half",
          "Time theft? More like survival"
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
    "title": "The Secret Rise of Quiet Vacationing \u2013 What You'll Learn",
    "slug": "the-secret-rise-of-quiet-vacationing-0-00-0-30-scene-003",
    "durationInFrames": 300,
    "fps": 30,
    "width": 1920,
    "height": 1080,
    "crossFadeFrames": 15,
    "assets": [
      {
        "label": "brain.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/psychology-risks-crackdown/brain.png"
      },
      {
        "label": "stockchart.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/psychology-risks-crackdown/stockchart.png"
      },
      {
        "label": "building.png",
        "role": "animated_object",
        "path": "images/the-secret-rise-of-quiet-vacationing-0-00-0-30/psychology-risks-crackdown/building.png"
      }
    ],
    "scenes": [
      {
        "type": "HiddenMechanismHook",
        "frameRange": [
          0,
          120
        ],
        "headline": "The Secret Rise of Quiet Vacationing",
        "teaser": "Three hidden truths that are transforming remote work."
      },
      {
        "type": "PromiseCard",
        "frameRange": [
          105,
          240
        ],
        "promise": "What You\u2019ll Learn",
        "bullets": [
          "Psychology",
          "Risks",
          "Company Crackdown"
        ],
        "transition": {
          "kind": "slide",
          "direction": "from-top"
        }
      },
      {
        "type": "MicroQuestion",
        "frameRange": [
          120,
          150
        ],
        "question": "But what's the risk?",
        "style": "typewriter",
        "transition": {
          "kind": "flip",
          "direction": "from-left"
        }
      },
      {
        "type": "MiniPayoff",
        "frameRange": [
          225,
          300
        ],
        "rule": "These three forces are reshaping remote work.",
        "bullets": [
          "The psychology of hidden breaks",
          "Real risks to career and culture",
          "How companies are cracking down"
        ],
        "transition": {
          "kind": "wipe",
          "direction": "from-top-right"
        }
      }
    ]
  }
] as const;

export const sceneScripts: SceneScript[] = rawSceneScripts.map((script) =>
  SceneScriptSchema.parse(script),
);
