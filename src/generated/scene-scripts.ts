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
  }
] as const;

export const sceneScripts: SceneScript[] = rawSceneScripts.map((script) =>
  SceneScriptSchema.parse(script),
);
