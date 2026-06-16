import type { CompositionPlan } from "../lib/pipeline/schemas";

// AUTO-GENERATED - do not edit manually. Run: npm run docu <topic>
export const docuCompositionPlans: Array<{ slug: string; plan: CompositionPlan }> = [
  {
    "slug": "how-the-fed-controls-your-money",
    "plan": {
      "fps": 30,
      "width": 1920,
      "height": 1080,
      "durationInFrames": 4738,
      "audioPath": "audio/docu/how-the-fed-controls-your-money.wav",
      "scenes": [
        {
          "id": "scene-00",
          "role": "custom",
          "focalOwner": "title",
          "fromFrame": 6,
          "durationInFrames": 827,
          "background": {
            "assetRef": "images/docu/how-the-fed-controls-your-money/img-00.jpg"
          },
          "layers": [
            {
              "component": "TitleCard",
              "layerRole": "primary",
              "props": {
                "line1": "The Pre-Approval Trap",
                "line2": "Rates climb, budget shrinks"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "full",
              "z": 10,
              "box": {
                "x": 120,
                "y": 160,
                "w": 1680,
                "h": 720
              }
            },
            {
              "component": "KineticNumber",
              "layerRole": "supporting",
              "props": {
                "value": "100",
                "label": "Monthly payment increase",
                "unit": "$"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "lower-third",
              "z": 6,
              "box": {
                "x": 120,
                "y": 640,
                "w": 1680,
                "h": 240
              }
            },
            {
              "component": "ContextBar",
              "layerRole": "supporting",
              "props": {
                "text": "72 hours until expiration"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "lower-third",
              "z": 7,
              "box": {
                "x": 120,
                "y": 640,
                "w": 1680,
                "h": 240
              }
            }
          ],
          "wordTimings": [
            {
              "word": "you're",
              "startSeconds": 0.2,
              "endSeconds": 0.9
            },
            {
              "word": "staring",
              "startSeconds": 0.9,
              "endSeconds": 0.9
            },
            {
              "word": "at",
              "startSeconds": 0.9,
              "endSeconds": 1.1
            },
            {
              "word": "a",
              "startSeconds": 1.1,
              "endSeconds": 1.2
            },
            {
              "word": "pre-approval",
              "startSeconds": 1.2,
              "endSeconds": 1.6
            },
            {
              "word": "letter",
              "startSeconds": 1.6,
              "endSeconds": 1.8
            },
            {
              "word": "on",
              "startSeconds": 1.8,
              "endSeconds": 2
            },
            {
              "word": "the",
              "startSeconds": 2,
              "endSeconds": 2
            },
            {
              "word": "kitchen",
              "startSeconds": 2,
              "endSeconds": 2.1
            },
            {
              "word": "table",
              "startSeconds": 2.1,
              "endSeconds": 2.5
            },
            {
              "word": "it's",
              "startSeconds": 2.5,
              "endSeconds": 3
            },
            {
              "word": "red",
              "startSeconds": 3,
              "endSeconds": 3.3
            },
            {
              "word": "expiring",
              "startSeconds": 3.3,
              "endSeconds": 4.1
            },
            {
              "word": "stamp",
              "startSeconds": 4.1,
              "endSeconds": 4.7
            },
            {
              "word": "pulsing",
              "startSeconds": 4.7,
              "endSeconds": 5.1
            },
            {
              "word": "in",
              "startSeconds": 5.1,
              "endSeconds": 5.4
            },
            {
              "word": "time",
              "startSeconds": 5.4,
              "endSeconds": 5.6
            },
            {
              "word": "with",
              "startSeconds": 5.6,
              "endSeconds": 5.6
            },
            {
              "word": "the",
              "startSeconds": 5.6,
              "endSeconds": 5.7
            },
            {
              "word": "rate",
              "startSeconds": 5.7,
              "endSeconds": 6
            },
            {
              "word": "ticker",
              "startSeconds": 6,
              "endSeconds": 6.4
            },
            {
              "word": "climbing",
              "startSeconds": 6.4,
              "endSeconds": 6.6
            },
            {
              "word": "from",
              "startSeconds": 6.6,
              "endSeconds": 6.8
            },
            {
              "word": "6.0%",
              "startSeconds": 6.8,
              "endSeconds": 7.6
            },
            {
              "word": "to",
              "startSeconds": 7.6,
              "endSeconds": 8.1
            },
            {
              "word": "6.4%",
              "startSeconds": 8.1,
              "endSeconds": 8.9
            },
            {
              "word": "that's",
              "startSeconds": 9.894250000000001,
              "endSeconds": 10.294250000000002
            },
            {
              "word": "0.4%",
              "startSeconds": 10.294250000000002,
              "endSeconds": 11.09425
            },
            {
              "word": "jump",
              "startSeconds": 11.09425,
              "endSeconds": 11.59425
            },
            {
              "word": "just",
              "startSeconds": 11.59425,
              "endSeconds": 11.894250000000001
            },
            {
              "word": "added",
              "startSeconds": 11.894250000000001,
              "endSeconds": 12.294250000000002
            },
            {
              "word": "$100",
              "startSeconds": 12.294250000000002,
              "endSeconds": 12.894250000000001
            },
            {
              "word": "to",
              "startSeconds": 12.894250000000001,
              "endSeconds": 13.19425
            },
            {
              "word": "your",
              "startSeconds": 13.19425,
              "endSeconds": 13.294250000000002
            },
            {
              "word": "monthly",
              "startSeconds": 13.294250000000002,
              "endSeconds": 13.494250000000001
            },
            {
              "word": "payment",
              "startSeconds": 13.494250000000001,
              "endSeconds": 13.794250000000002
            },
            {
              "word": "and",
              "startSeconds": 13.794250000000002,
              "endSeconds": 14.294250000000002
            },
            {
              "word": "the",
              "startSeconds": 14.294250000000002,
              "endSeconds": 14.494250000000001
            },
            {
              "word": "letter",
              "startSeconds": 14.494250000000001,
              "endSeconds": 14.69425
            },
            {
              "word": "expires",
              "startSeconds": 14.69425,
              "endSeconds": 15.094250000000002
            },
            {
              "word": "in",
              "startSeconds": 15.094250000000002,
              "endSeconds": 15.494250000000001
            },
            {
              "word": "72",
              "startSeconds": 15.494250000000001,
              "endSeconds": 15.894250000000001
            },
            {
              "word": "hours",
              "startSeconds": 15.894250000000001,
              "endSeconds": 15.994250000000001
            },
            {
              "word": "you",
              "startSeconds": 16.6525,
              "endSeconds": 16.9525
            },
            {
              "word": "watch",
              "startSeconds": 16.9525,
              "endSeconds": 17.0525
            },
            {
              "word": "the",
              "startSeconds": 17.0525,
              "endSeconds": 17.1525
            },
            {
              "word": "ticker",
              "startSeconds": 17.1525,
              "endSeconds": 17.5525
            },
            {
              "word": "and",
              "startSeconds": 17.5525,
              "endSeconds": 17.6525
            },
            {
              "word": "realize",
              "startSeconds": 17.6525,
              "endSeconds": 18.1525
            },
            {
              "word": "your",
              "startSeconds": 18.1525,
              "endSeconds": 18.3525
            },
            {
              "word": "budget",
              "startSeconds": 18.3525,
              "endSeconds": 18.5525
            },
            {
              "word": "is",
              "startSeconds": 18.5525,
              "endSeconds": 18.6525
            },
            {
              "word": "shrinking",
              "startSeconds": 18.6525,
              "endSeconds": 19.0525
            },
            {
              "word": "by",
              "startSeconds": 19.0525,
              "endSeconds": 19.2525
            },
            {
              "word": "the",
              "startSeconds": 19.2525,
              "endSeconds": 19.3525
            },
            {
              "word": "minute",
              "startSeconds": 19.3525,
              "endSeconds": 19.6525
            },
            {
              "word": "forcing",
              "startSeconds": 19.6525,
              "endSeconds": 20.3525
            },
            {
              "word": "you",
              "startSeconds": 20.3525,
              "endSeconds": 20.4525
            },
            {
              "word": "to",
              "startSeconds": 20.4525,
              "endSeconds": 20.5525
            },
            {
              "word": "slash",
              "startSeconds": 20.5525,
              "endSeconds": 20.9525
            },
            {
              "word": "30,000",
              "startSeconds": 20.9525,
              "endSeconds": 22.1525
            },
            {
              "word": "from",
              "startSeconds": 22.1525,
              "endSeconds": 22.4525
            },
            {
              "word": "your",
              "startSeconds": 22.4525,
              "endSeconds": 22.552500000000002
            },
            {
              "word": "home",
              "startSeconds": 22.552500000000002,
              "endSeconds": 22.8525
            },
            {
              "word": "search",
              "startSeconds": 22.8525,
              "endSeconds": 23.052500000000002
            },
            {
              "word": "what",
              "startSeconds": 23.53875,
              "endSeconds": 23.93875
            },
            {
              "word": "unseen",
              "startSeconds": 23.93875,
              "endSeconds": 24.43875
            },
            {
              "word": "force",
              "startSeconds": 24.43875,
              "endSeconds": 24.73875
            },
            {
              "word": "is",
              "startSeconds": 24.73875,
              "endSeconds": 24.83875
            },
            {
              "word": "driving",
              "startSeconds": 24.83875,
              "endSeconds": 25.03875
            },
            {
              "word": "rates",
              "startSeconds": 25.03875,
              "endSeconds": 25.53875
            },
            {
              "word": "up",
              "startSeconds": 25.53875,
              "endSeconds": 25.63875
            },
            {
              "word": "and",
              "startSeconds": 25.63875,
              "endSeconds": 26.13875
            },
            {
              "word": "can",
              "startSeconds": 26.13875,
              "endSeconds": 26.23875
            },
            {
              "word": "you",
              "startSeconds": 26.23875,
              "endSeconds": 26.23875
            },
            {
              "word": "stop",
              "startSeconds": 26.23875,
              "endSeconds": 26.43875
            },
            {
              "word": "it",
              "startSeconds": 26.43875,
              "endSeconds": 26.73875
            },
            {
              "word": "before",
              "startSeconds": 26.73875,
              "endSeconds": 26.83875
            },
            {
              "word": "your",
              "startSeconds": 26.83875,
              "endSeconds": 27.33875
            },
            {
              "word": "pre-approval",
              "startSeconds": 27.33875,
              "endSeconds": 27.73875
            }
          ],
          "emphasisWordIndexes": [],
          "evidenceRefs": [],
          "transition": null
        },
        {
          "id": "scene-01",
          "role": "custom",
          "focalOwner": "chart",
          "fromFrame": 832,
          "durationInFrames": 1256,
          "background": {
            "assetRef": "images/docu/how-the-fed-controls-your-money/img-16.jpg"
          },
          "layers": [
            {
              "component": "Chart",
              "layerRole": "primary",
              "props": {
                "kind": "line",
                "data": "scalar-02, scalar-03",
                "label": "Mortgage rate trend"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "main-left",
              "z": 10,
              "box": {
                "x": 120,
                "y": 160,
                "w": 1260,
                "h": 720
              }
            },
            {
              "component": "KineticNumber",
              "layerRole": "supporting",
              "props": {
                "value": "27",
                "label": "Payment increase per 0.1%",
                "unit": "$"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "sidebar-right",
              "z": 6,
              "box": {
                "x": 1380,
                "y": 160,
                "w": 420,
                "h": 720
              }
            },
            {
              "component": "ContextBar",
              "layerRole": "supporting",
              "props": {
                "text": "Fed policy → bond yields → mortgage rates"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "sidebar-right",
              "z": 7,
              "box": {
                "x": 1380,
                "y": 160,
                "w": 420,
                "h": 720
              }
            }
          ],
          "wordTimings": [
            {
              "word": "vanishes",
              "startSeconds": 27.73875,
              "endSeconds": 28.13875
            },
            {
              "word": "you",
              "startSeconds": 28.761,
              "endSeconds": 28.861
            },
            {
              "word": "open",
              "startSeconds": 28.861,
              "endSeconds": 29.061
            },
            {
              "word": "your",
              "startSeconds": 29.061,
              "endSeconds": 29.261
            },
            {
              "word": "laptop",
              "startSeconds": 29.261,
              "endSeconds": 29.660999999999998
            },
            {
              "word": "and",
              "startSeconds": 29.660999999999998,
              "endSeconds": 29.861
            },
            {
              "word": "the",
              "startSeconds": 29.861,
              "endSeconds": 30.061
            },
            {
              "word": "pre-approval",
              "startSeconds": 30.061,
              "endSeconds": 30.660999999999998
            },
            {
              "word": "letter",
              "startSeconds": 30.660999999999998,
              "endSeconds": 30.861
            },
            {
              "word": "feels",
              "startSeconds": 30.861,
              "endSeconds": 31.160999999999998
            },
            {
              "word": "stale",
              "startSeconds": 31.160999999999998,
              "endSeconds": 31.761
            },
            {
              "word": "already",
              "startSeconds": 31.761,
              "endSeconds": 31.861
            },
            {
              "word": "your",
              "startSeconds": 31.861,
              "endSeconds": 32.861
            },
            {
              "word": "lender",
              "startSeconds": 32.861,
              "endSeconds": 32.961
            },
            {
              "word": "now",
              "startSeconds": 32.961,
              "endSeconds": 33.260999999999996
            },
            {
              "word": "quotes",
              "startSeconds": 33.260999999999996,
              "endSeconds": 33.461
            },
            {
              "word": "6.4%",
              "startSeconds": 33.461,
              "endSeconds": 34.561
            },
            {
              "word": "not",
              "startSeconds": 34.561,
              "endSeconds": 35.361
            },
            {
              "word": "the",
              "startSeconds": 35.361,
              "endSeconds": 35.461
            },
            {
              "word": "6%",
              "startSeconds": 35.461,
              "endSeconds": 35.961
            },
            {
              "word": "you",
              "startSeconds": 35.961,
              "endSeconds": 36.361
            },
            {
              "word": "locked",
              "startSeconds": 36.361,
              "endSeconds": 36.561
            },
            {
              "word": "in",
              "startSeconds": 36.561,
              "endSeconds": 36.661
            },
            {
              "word": "just",
              "startSeconds": 36.661,
              "endSeconds": 36.861
            },
            {
              "word": "weeks",
              "startSeconds": 36.861,
              "endSeconds": 37.260999999999996
            },
            {
              "word": "ago",
              "startSeconds": 37.260999999999996,
              "endSeconds": 37.260999999999996
            },
            {
              "word": "that",
              "startSeconds": 37.923249999999996,
              "endSeconds": 38.323249999999994
            },
            {
              "word": "tiny",
              "startSeconds": 38.323249999999994,
              "endSeconds": 38.62324999999999
            },
            {
              "word": "0.1",
              "startSeconds": 38.62324999999999,
              "endSeconds": 39.423249999999996
            },
            {
              "word": "Point",
              "startSeconds": 39.423249999999996,
              "endSeconds": 39.72324999999999
            },
            {
              "word": "jump",
              "startSeconds": 39.72324999999999,
              "endSeconds": 39.923249999999996
            },
            {
              "word": "from",
              "startSeconds": 39.923249999999996,
              "endSeconds": 40.12324999999999
            },
            {
              "word": "6.3%",
              "startSeconds": 40.12324999999999,
              "endSeconds": 41.02325
            },
            {
              "word": "to",
              "startSeconds": 41.02325,
              "endSeconds": 41.52325
            },
            {
              "word": "6.4%",
              "startSeconds": 41.52325,
              "endSeconds": 42.423249999999996
            },
            {
              "word": "adds",
              "startSeconds": 42.423249999999996,
              "endSeconds": 43.323249999999994
            },
            {
              "word": "$27",
              "startSeconds": 43.323249999999994,
              "endSeconds": 43.823249999999994
            },
            {
              "word": "a",
              "startSeconds": 43.823249999999994,
              "endSeconds": 44.12324999999999
            },
            {
              "word": "month",
              "startSeconds": 44.12324999999999,
              "endSeconds": 44.12324999999999
            },
            {
              "word": "on",
              "startSeconds": 44.12324999999999,
              "endSeconds": 44.62324999999999
            },
            {
              "word": "a",
              "startSeconds": 44.62324999999999,
              "endSeconds": 44.823249999999994
            },
            {
              "word": "$100,000",
              "startSeconds": 44.823249999999994,
              "endSeconds": 45.62324999999999
            },
            {
              "word": "loan",
              "startSeconds": 45.62324999999999,
              "endSeconds": 45.923249999999996
            },
            {
              "word": "but",
              "startSeconds": 45.923249999999996,
              "endSeconds": 46.423249999999996
            },
            {
              "word": "since",
              "startSeconds": 46.423249999999996,
              "endSeconds": 46.62325
            },
            {
              "word": "rates",
              "startSeconds": 46.62325,
              "endSeconds": 47.02324999999999
            },
            {
              "word": "began",
              "startSeconds": 47.02324999999999,
              "endSeconds": 47.323249999999994
            },
            {
              "word": "climbing",
              "startSeconds": 47.323249999999994,
              "endSeconds": 47.52324999999999
            },
            {
              "word": "from",
              "startSeconds": 47.52324999999999,
              "endSeconds": 47.823249999999994
            },
            {
              "word": "6%",
              "startSeconds": 47.823249999999994,
              "endSeconds": 48.22324999999999
            },
            {
              "word": "your",
              "startSeconds": 48.22324999999999,
              "endSeconds": 49.02324999999999
            },
            {
              "word": "payment",
              "startSeconds": 49.02324999999999,
              "endSeconds": 49.12325
            },
            {
              "word": "has",
              "startSeconds": 49.12325,
              "endSeconds": 49.323249999999994
            },
            {
              "word": "swelled",
              "startSeconds": 49.323249999999994,
              "endSeconds": 49.72324999999999
            },
            {
              "word": "by",
              "startSeconds": 49.72324999999999,
              "endSeconds": 49.72324999999999
            },
            {
              "word": "nearly",
              "startSeconds": 49.72324999999999,
              "endSeconds": 50.02324999999999
            },
            {
              "word": "$100",
              "startSeconds": 50.02324999999999,
              "endSeconds": 50.62325
            },
            {
              "word": "it",
              "startSeconds": 51.55749999999999,
              "endSeconds": 51.95749999999999
            },
            {
              "word": "starts",
              "startSeconds": 51.95749999999999,
              "endSeconds": 52.05749999999999
            },
            {
              "word": "at",
              "startSeconds": 52.05749999999999,
              "endSeconds": 52.25749999999999
            },
            {
              "word": "the",
              "startSeconds": 52.25749999999999,
              "endSeconds": 52.25749999999999
            },
            {
              "word": "Federal",
              "startSeconds": 52.25749999999999,
              "endSeconds": 52.35749999999999
            },
            {
              "word": "Reserve",
              "startSeconds": 52.35749999999999,
              "endSeconds": 52.65749999999999
            },
            {
              "word": "building",
              "startSeconds": 52.65749999999999,
              "endSeconds": 53.05749999999999
            },
            {
              "word": "where",
              "startSeconds": 53.05749999999999,
              "endSeconds": 53.45749999999999
            },
            {
              "word": "a",
              "startSeconds": 53.45749999999999,
              "endSeconds": 53.85749999999999
            },
            {
              "word": "policy",
              "startSeconds": 53.85749999999999,
              "endSeconds": 54.05749999999999
            },
            {
              "word": "rate",
              "startSeconds": 54.05749999999999,
              "endSeconds": 54.35749999999999
            },
            {
              "word": "decision",
              "startSeconds": 54.35749999999999,
              "endSeconds": 54.65749999999999
            },
            {
              "word": "ripples",
              "startSeconds": 54.65749999999999,
              "endSeconds": 55.15749999999999
            },
            {
              "word": "into",
              "startSeconds": 55.15749999999999,
              "endSeconds": 55.35749999999999
            },
            {
              "word": "treasury",
              "startSeconds": 55.35749999999999,
              "endSeconds": 55.65749999999999
            },
            {
              "word": "bond",
              "startSeconds": 55.65749999999999,
              "endSeconds": 56.15749999999999
            },
            {
              "word": "yields",
              "startSeconds": 56.15749999999999,
              "endSeconds": 56.25749999999999
            },
            {
              "word": "and",
              "startSeconds": 56.25749999999999,
              "endSeconds": 56.55749999999999
            },
            {
              "word": "those",
              "startSeconds": 56.55749999999999,
              "endSeconds": 56.75749999999999
            },
            {
              "word": "yields",
              "startSeconds": 56.75749999999999,
              "endSeconds": 57.15749999999999
            },
            {
              "word": "drag",
              "startSeconds": 57.15749999999999,
              "endSeconds": 57.65749999999999
            },
            {
              "word": "mortgage",
              "startSeconds": 57.65749999999999,
              "endSeconds": 57.95749999999999
            },
            {
              "word": "rates",
              "startSeconds": 57.95749999999999,
              "endSeconds": 58.25749999999999
            },
            {
              "word": "upward",
              "startSeconds": 58.25749999999999,
              "endSeconds": 58.65749999999999
            },
            {
              "word": "like",
              "startSeconds": 58.65749999999999,
              "endSeconds": 58.95749999999999
            },
            {
              "word": "a",
              "startSeconds": 58.95749999999999,
              "endSeconds": 59.25749999999999
            },
            {
              "word": "chain",
              "startSeconds": 59.25749999999999,
              "endSeconds": 59.45749999999999
            },
            {
              "word": "of",
              "startSeconds": 59.45749999999999,
              "endSeconds": 59.55749999999999
            },
            {
              "word": "falling",
              "startSeconds": 59.55749999999999,
              "endSeconds": 59.95749999999999
            },
            {
              "word": "dominoes",
              "startSeconds": 59.95749999999999,
              "endSeconds": 60.45749999999999
            },
            {
              "word": "you",
              "startSeconds": 61.07574999999999,
              "endSeconds": 61.47574999999999
            },
            {
              "word": "watch",
              "startSeconds": 61.47574999999999,
              "endSeconds": 61.57574999999999
            },
            {
              "word": "the",
              "startSeconds": 61.57574999999999,
              "endSeconds": 61.67574999999999
            },
            {
              "word": "ticker",
              "startSeconds": 61.67574999999999,
              "endSeconds": 62.07574999999999
            },
            {
              "word": "and",
              "startSeconds": 62.07574999999999,
              "endSeconds": 62.37574999999999
            },
            {
              "word": "realize",
              "startSeconds": 62.37574999999999,
              "endSeconds": 62.47574999999999
            },
            {
              "word": "your",
              "startSeconds": 62.47574999999999,
              "endSeconds": 62.77574999999999
            },
            {
              "word": "budget",
              "startSeconds": 62.77574999999999,
              "endSeconds": 62.97574999999999
            },
            {
              "word": "is",
              "startSeconds": 62.97574999999999,
              "endSeconds": 63.07574999999999
            },
            {
              "word": "shrinking",
              "startSeconds": 63.07574999999999,
              "endSeconds": 63.37574999999999
            },
            {
              "word": "by",
              "startSeconds": 63.37574999999999,
              "endSeconds": 63.57574999999999
            },
            {
              "word": "the",
              "startSeconds": 63.57574999999999,
              "endSeconds": 63.67574999999999
            },
            {
              "word": "minute",
              "startSeconds": 63.67574999999999,
              "endSeconds": 63.97574999999999
            },
            {
              "word": "forcing",
              "startSeconds": 63.97574999999999,
              "endSeconds": 64.57574999999999
            },
            {
              "word": "you",
              "startSeconds": 64.57574999999999,
              "endSeconds": 64.67575
            },
            {
              "word": "to",
              "startSeconds": 64.67575,
              "endSeconds": 64.87574999999998
            },
            {
              "word": "Slash",
              "startSeconds": 64.87574999999998,
              "endSeconds": 65.07574999999999
            },
            {
              "word": "from",
              "startSeconds": 65.07574999999999,
              "endSeconds": 66.37574999999998
            },
            {
              "word": "your",
              "startSeconds": 66.37574999999998,
              "endSeconds": 66.47574999999999
            },
            {
              "word": "home",
              "startSeconds": 66.47574999999999,
              "endSeconds": 66.87574999999998
            },
            {
              "word": "search",
              "startSeconds": 66.87574999999998,
              "endSeconds": 66.97574999999999
            },
            {
              "word": "but",
              "startSeconds": 66.97574999999999,
              "endSeconds": 67.47574999999999
            },
            {
              "word": "how",
              "startSeconds": 67.47574999999999,
              "endSeconds": 67.57574999999999
            },
            {
              "word": "does",
              "startSeconds": 67.57574999999999,
              "endSeconds": 67.77574999999999
            },
            {
              "word": "a",
              "startSeconds": 67.77574999999999,
              "endSeconds": 68.07574999999999
            },
            {
              "word": "Fed",
              "startSeconds": 68.07574999999999,
              "endSeconds": 68.17575
            },
            {
              "word": "meeting",
              "startSeconds": 68.17575,
              "endSeconds": 68.37574999999998
            },
            {
              "word": "days",
              "startSeconds": 68.37574999999998,
              "endSeconds": 68.67575
            },
            {
              "word": "away",
              "startSeconds": 68.67575,
              "endSeconds": 68.87574999999998
            },
            {
              "word": "make",
              "startSeconds": 68.87574999999998,
              "endSeconds": 69.07574999999999
            },
            {
              "word": "your",
              "startSeconds": 69.07574999999999,
              "endSeconds": 69.27574999999999
            },
            {
              "word": "mortgage",
              "startSeconds": 69.27574999999999,
              "endSeconds": 69.57574999999999
            }
          ],
          "emphasisWordIndexes": [],
          "evidenceRefs": [],
          "transition": null
        },
        {
          "id": "scene-02",
          "role": "custom",
          "focalOwner": "person",
          "fromFrame": 2087,
          "durationInFrames": 723,
          "background": {
            "assetRef": "images/docu/how-the-fed-controls-your-money/img-38.jpg"
          },
          "layers": [
            {
              "component": "BreakingNews",
              "layerRole": "primary",
              "props": {
                "headline": "Fed Governor Hints at Tightening",
                "ticker": "Markets react: bond yields surge, mortgage rates follow"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "right-half",
              "z": 10,
              "box": {
                "x": 960,
                "y": 160,
                "w": 840,
                "h": 720
              }
            },
            {
              "component": "KineticNumber",
              "layerRole": "supporting",
              "props": {
                "value": "100",
                "label": "Monthly payment surge",
                "unit": "$"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "lower-third",
              "z": 6,
              "box": {
                "x": 120,
                "y": 640,
                "w": 1680,
                "h": 240
              }
            },
            {
              "component": "LowerThirdChyron",
              "layerRole": "supporting",
              "props": {
                "name": "Fed Governor",
                "title": "Hawkish Speech"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "lower-third",
              "z": 7,
              "box": {
                "x": 120,
                "y": 640,
                "w": 1680,
                "h": 240
              }
            }
          ],
          "wordTimings": [
            {
              "word": "more",
              "startSeconds": 69.57574999999999,
              "endSeconds": 69.77574999999999
            },
            {
              "word": "expensive",
              "startSeconds": 69.77574999999999,
              "endSeconds": 69.97574999999999
            },
            {
              "word": "today",
              "startSeconds": 69.97574999999999,
              "endSeconds": 70.27574999999999
            },
            {
              "word": "you're",
              "startSeconds": 71.22599999999998,
              "endSeconds": 71.62599999999998
            },
            {
              "word": "on",
              "startSeconds": 71.62599999999998,
              "endSeconds": 71.72599999999998
            },
            {
              "word": "the",
              "startSeconds": 71.72599999999998,
              "endSeconds": 71.82599999999998
            },
            {
              "word": "phone",
              "startSeconds": 71.82599999999998,
              "endSeconds": 71.92599999999999
            },
            {
              "word": "with",
              "startSeconds": 71.92599999999999,
              "endSeconds": 72.12599999999998
            },
            {
              "word": "your",
              "startSeconds": 72.12599999999998,
              "endSeconds": 72.12599999999998
            },
            {
              "word": "lender",
              "startSeconds": 72.12599999999998,
              "endSeconds": 72.42599999999999
            },
            {
              "word": "and",
              "startSeconds": 72.42599999999999,
              "endSeconds": 72.92599999999999
            },
            {
              "word": "they",
              "startSeconds": 72.92599999999999,
              "endSeconds": 73.22599999999998
            },
            {
              "word": "tell",
              "startSeconds": 73.22599999999998,
              "endSeconds": 73.32599999999998
            },
            {
              "word": "you",
              "startSeconds": 73.32599999999998,
              "endSeconds": 73.32599999999998
            },
            {
              "word": "the",
              "startSeconds": 73.32599999999998,
              "endSeconds": 73.42599999999999
            },
            {
              "word": "rate",
              "startSeconds": 73.42599999999999,
              "endSeconds": 73.72599999999998
            },
            {
              "word": "just",
              "startSeconds": 73.72599999999998,
              "endSeconds": 73.82599999999998
            },
            {
              "word": "jumped",
              "startSeconds": 73.82599999999998,
              "endSeconds": 74.12599999999998
            },
            {
              "word": "from",
              "startSeconds": 74.12599999999998,
              "endSeconds": 74.32599999999998
            },
            {
              "word": "6%",
              "startSeconds": 74.32599999999998,
              "endSeconds": 74.82599999999998
            },
            {
              "word": "to",
              "startSeconds": 74.82599999999998,
              "endSeconds": 75.12599999999998
            },
            {
              "word": "6.4%",
              "startSeconds": 75.12599999999998,
              "endSeconds": 75.92599999999999
            },
            {
              "word": "your",
              "startSeconds": 75.92599999999999,
              "endSeconds": 77.02599999999998
            },
            {
              "word": "monthly",
              "startSeconds": 77.02599999999998,
              "endSeconds": 77.22599999999998
            },
            {
              "word": "payment",
              "startSeconds": 77.22599999999998,
              "endSeconds": 77.42599999999999
            },
            {
              "word": "has",
              "startSeconds": 77.42599999999999,
              "endSeconds": 77.62599999999998
            },
            {
              "word": "increased",
              "startSeconds": 77.62599999999998,
              "endSeconds": 78.02599999999998
            },
            {
              "word": "by",
              "startSeconds": 78.02599999999998,
              "endSeconds": 78.02599999999998
            },
            {
              "word": "roughly",
              "startSeconds": 78.02599999999998,
              "endSeconds": 78.32599999999998
            },
            {
              "word": "$100",
              "startSeconds": 78.32599999999998,
              "endSeconds": 79.02599999999998
            },
            {
              "word": "a",
              "startSeconds": 80.03224999999998,
              "endSeconds": 80.43224999999997
            },
            {
              "word": "Fed",
              "startSeconds": 80.43224999999997,
              "endSeconds": 80.63224999999997
            },
            {
              "word": "Governor",
              "startSeconds": 80.63224999999997,
              "endSeconds": 80.83224999999997
            },
            {
              "word": "signals",
              "startSeconds": 80.83224999999997,
              "endSeconds": 81.33224999999997
            },
            {
              "word": "potential",
              "startSeconds": 81.33224999999997,
              "endSeconds": 81.53224999999998
            },
            {
              "word": "tightening",
              "startSeconds": 81.53224999999998,
              "endSeconds": 81.93224999999997
            },
            {
              "word": "and",
              "startSeconds": 81.93224999999997,
              "endSeconds": 82.43224999999997
            },
            {
              "word": "within",
              "startSeconds": 82.43224999999997,
              "endSeconds": 82.53224999999998
            },
            {
              "word": "minutes",
              "startSeconds": 82.53224999999998,
              "endSeconds": 82.83224999999997
            },
            {
              "word": "bond",
              "startSeconds": 82.83224999999997,
              "endSeconds": 83.53224999999998
            },
            {
              "word": "yields",
              "startSeconds": 83.53224999999998,
              "endSeconds": 83.93224999999997
            },
            {
              "word": "rise",
              "startSeconds": 83.93224999999997,
              "endSeconds": 84.23224999999998
            },
            {
              "word": "dragging",
              "startSeconds": 84.23224999999998,
              "endSeconds": 84.93224999999997
            },
            {
              "word": "mortgage",
              "startSeconds": 84.93224999999997,
              "endSeconds": 85.23224999999998
            },
            {
              "word": "rates",
              "startSeconds": 85.23224999999998,
              "endSeconds": 85.53224999999998
            },
            {
              "word": "higher",
              "startSeconds": 85.53224999999998,
              "endSeconds": 85.73224999999998
            },
            {
              "word": "they",
              "startSeconds": 86.33449999999998,
              "endSeconds": 86.73449999999998
            },
            {
              "word": "just",
              "startSeconds": 86.73449999999998,
              "endSeconds": 86.83449999999998
            },
            {
              "word": "erased",
              "startSeconds": 86.83449999999998,
              "endSeconds": 87.33449999999998
            },
            {
              "word": "them",
              "startSeconds": 87.33449999999998,
              "endSeconds": 88.23449999999998
            },
            {
              "word": "dollars",
              "startSeconds": 88.23449999999998,
              "endSeconds": 88.43449999999997
            },
            {
              "word": "from",
              "startSeconds": 88.43449999999997,
              "endSeconds": 88.53449999999998
            },
            {
              "word": "your",
              "startSeconds": 88.53449999999998,
              "endSeconds": 88.63449999999997
            },
            {
              "word": "home",
              "startSeconds": 88.63449999999997,
              "endSeconds": 89.03449999999998
            },
            {
              "word": "search",
              "startSeconds": 89.03449999999998,
              "endSeconds": 89.23449999999998
            },
            {
              "word": "and",
              "startSeconds": 89.23449999999998,
              "endSeconds": 89.43449999999997
            },
            {
              "word": "you",
              "startSeconds": 89.43449999999997,
              "endSeconds": 89.43449999999997
            },
            {
              "word": "wonder",
              "startSeconds": 89.43449999999997,
              "endSeconds": 89.73449999999998
            },
            {
              "word": "can",
              "startSeconds": 89.73449999999998,
              "endSeconds": 90.33449999999998
            },
            {
              "word": "you",
              "startSeconds": 90.33449999999998,
              "endSeconds": 90.33449999999998
            },
            {
              "word": "even",
              "startSeconds": 90.33449999999998,
              "endSeconds": 90.53449999999998
            },
            {
              "word": "afford",
              "startSeconds": 90.53449999999998,
              "endSeconds": 90.93449999999997
            },
            {
              "word": "the",
              "startSeconds": 90.93449999999997,
              "endSeconds": 91.13449999999997
            },
            {
              "word": "neighborhood",
              "startSeconds": 91.13449999999997,
              "endSeconds": 91.33449999999998
            },
            {
              "word": "you",
              "startSeconds": 91.33449999999998,
              "endSeconds": 91.53449999999998
            },
            {
              "word": "bid",
              "startSeconds": 91.53449999999998,
              "endSeconds": 91.83449999999998
            },
            {
              "word": "on",
              "startSeconds": 91.83449999999998,
              "endSeconds": 91.93449999999997
            },
            {
              "word": "last",
              "startSeconds": 91.93449999999997,
              "endSeconds": 92.13449999999997
            },
            {
              "word": "week",
              "startSeconds": 92.13449999999997,
              "endSeconds": 92.23449999999998
            },
            {
              "word": "what",
              "startSeconds": 92.96474999999998,
              "endSeconds": 93.16474999999998
            },
            {
              "word": "happens",
              "startSeconds": 93.16474999999998,
              "endSeconds": 93.46474999999998
            },
            {
              "word": "if",
              "startSeconds": 93.46474999999998,
              "endSeconds": 93.66474999999998
            },
            {
              "word": "the",
              "startSeconds": 93.66474999999998,
              "endSeconds": 93.66474999999998
            }
          ],
          "emphasisWordIndexes": [],
          "evidenceRefs": [],
          "transition": null
        },
        {
          "id": "scene-03",
          "role": "custom",
          "focalOwner": "metric",
          "fromFrame": 2809,
          "durationInFrames": 765,
          "background": {
            "assetRef": "images/docu/how-the-fed-controls-your-money/img-52.jpg"
          },
          "layers": [
            {
              "component": "KineticNumber",
              "layerRole": "primary",
              "props": {
                "value": "30000",
                "label": "Lost buying power",
                "unit": "$"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "center-stat",
              "z": 10,
              "box": {
                "x": 400,
                "y": 280,
                "w": 1120,
                "h": 480
              }
            },
            {
              "component": "PullQuote",
              "layerRole": "supporting",
              "props": {
                "quote": "The pre-approval was a snapshot, not a shield.",
                "attribution": "Homebuyer"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "sidebar-right",
              "z": 6,
              "box": {
                "x": 1380,
                "y": 160,
                "w": 420,
                "h": 720
              }
            },
            {
              "component": "ContextBar",
              "layerRole": "supporting",
              "props": {
                "text": "Rate climb: 6% → 6.4%"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "sidebar-right",
              "z": 7,
              "box": {
                "x": 1380,
                "y": 160,
                "w": 420,
                "h": 720
              }
            }
          ],
          "wordTimings": [
            {
              "word": "FED",
              "startSeconds": 93.66474999999998,
              "endSeconds": 93.96474999999998
            },
            {
              "word": "actually",
              "startSeconds": 93.96474999999998,
              "endSeconds": 94.26474999999998
            },
            {
              "word": "raises",
              "startSeconds": 94.26474999999998,
              "endSeconds": 94.76474999999998
            },
            {
              "word": "rates",
              "startSeconds": 94.76474999999998,
              "endSeconds": 95.06474999999998
            },
            {
              "word": "next",
              "startSeconds": 95.06474999999998,
              "endSeconds": 95.26474999999998
            },
            {
              "word": "month",
              "startSeconds": 95.26474999999998,
              "endSeconds": 95.66474999999998
            },
            {
              "word": "you",
              "startSeconds": 96.07499999999997,
              "endSeconds": 96.27499999999998
            },
            {
              "word": "open",
              "startSeconds": 96.27499999999998,
              "endSeconds": 96.47499999999998
            },
            {
              "word": "your",
              "startSeconds": 96.47499999999998,
              "endSeconds": 96.57499999999997
            },
            {
              "word": "pre-approval",
              "startSeconds": 96.57499999999997,
              "endSeconds": 97.27499999999998
            },
            {
              "word": "letter",
              "startSeconds": 97.27499999999998,
              "endSeconds": 97.57499999999997
            },
            {
              "word": "the",
              "startSeconds": 97.57499999999997,
              "endSeconds": 97.87499999999997
            },
            {
              "word": "1",
              "startSeconds": 97.87499999999997,
              "endSeconds": 97.97499999999998
            },
            {
              "word": "that",
              "startSeconds": 97.97499999999998,
              "endSeconds": 98.07499999999997
            },
            {
              "word": "felt",
              "startSeconds": 98.07499999999997,
              "endSeconds": 98.27499999999998
            },
            {
              "word": "like",
              "startSeconds": 98.27499999999998,
              "endSeconds": 98.37499999999997
            },
            {
              "word": "a",
              "startSeconds": 98.37499999999997,
              "endSeconds": 98.57499999999997
            },
            {
              "word": "key",
              "startSeconds": 98.57499999999997,
              "endSeconds": 98.77499999999998
            },
            {
              "word": "and",
              "startSeconds": 98.77499999999998,
              "endSeconds": 99.17499999999997
            },
            {
              "word": "it's",
              "startSeconds": 99.17499999999997,
              "endSeconds": 99.57499999999997
            },
            {
              "word": "now",
              "startSeconds": 99.57499999999997,
              "endSeconds": 99.57499999999997
            },
            {
              "word": "just",
              "startSeconds": 99.57499999999997,
              "endSeconds": 99.87499999999997
            },
            {
              "word": "expensive",
              "startSeconds": 99.87499999999997,
              "endSeconds": 100.67499999999997
            },
            {
              "word": "paper",
              "startSeconds": 100.67499999999997,
              "endSeconds": 101.07499999999997
            },
            {
              "word": "the",
              "startSeconds": 101.52524999999997,
              "endSeconds": 101.82524999999998
            },
            {
              "word": "rate",
              "startSeconds": 101.82524999999998,
              "endSeconds": 102.22524999999997
            },
            {
              "word": "climbed",
              "startSeconds": 102.22524999999997,
              "endSeconds": 102.62524999999998
            },
            {
              "word": "from",
              "startSeconds": 102.62524999999998,
              "endSeconds": 102.72524999999997
            },
            {
              "word": "6%",
              "startSeconds": 102.72524999999997,
              "endSeconds": 103.32524999999998
            },
            {
              "word": "to",
              "startSeconds": 103.32524999999998,
              "endSeconds": 103.72524999999997
            },
            {
              "word": "6.4%",
              "startSeconds": 103.72524999999997,
              "endSeconds": 104.72524999999997
            },
            {
              "word": "in",
              "startSeconds": 104.72524999999997,
              "endSeconds": 105.22524999999997
            },
            {
              "word": "weeks",
              "startSeconds": 105.22524999999997,
              "endSeconds": 105.62524999999998
            },
            {
              "word": "and",
              "startSeconds": 105.62524999999998,
              "endSeconds": 106.12524999999998
            },
            {
              "word": "that",
              "startSeconds": 106.12524999999998,
              "endSeconds": 106.32524999999998
            },
            {
              "word": "tiny",
              "startSeconds": 106.32524999999998,
              "endSeconds": 106.62524999999998
            },
            {
              "word": "decimal",
              "startSeconds": 106.62524999999998,
              "endSeconds": 107.12524999999998
            },
            {
              "word": "just",
              "startSeconds": 107.12524999999998,
              "endSeconds": 107.62524999999998
            },
            {
              "word": "erased",
              "startSeconds": 107.62524999999998,
              "endSeconds": 108.12524999999998
            },
            {
              "word": "30,000",
              "startSeconds": 108.12524999999998,
              "endSeconds": 109.02524999999997
            },
            {
              "word": "from",
              "startSeconds": 109.02524999999997,
              "endSeconds": 109.32524999999998
            },
            {
              "word": "your",
              "startSeconds": 109.32524999999998,
              "endSeconds": 109.42524999999998
            },
            {
              "word": "buying",
              "startSeconds": 109.42524999999998,
              "endSeconds": 109.72524999999997
            },
            {
              "word": "power",
              "startSeconds": 109.72524999999997,
              "endSeconds": 110.02524999999997
            },
            {
              "word": "your",
              "startSeconds": 110.94349999999997,
              "endSeconds": 111.64349999999997
            },
            {
              "word": "lender",
              "startSeconds": 111.64349999999997,
              "endSeconds": 111.74349999999997
            },
            {
              "word": "didn't",
              "startSeconds": 111.74349999999997,
              "endSeconds": 111.94349999999997
            },
            {
              "word": "warn",
              "startSeconds": 111.94349999999997,
              "endSeconds": 112.24349999999997
            },
            {
              "word": "you",
              "startSeconds": 112.24349999999997,
              "endSeconds": 112.24349999999997
            },
            {
              "word": "the",
              "startSeconds": 112.24349999999997,
              "endSeconds": 113.14349999999997
            },
            {
              "word": "pre-approval",
              "startSeconds": 113.14349999999997,
              "endSeconds": 113.84349999999996
            },
            {
              "word": "was",
              "startSeconds": 113.84349999999996,
              "endSeconds": 114.04349999999997
            },
            {
              "word": "a",
              "startSeconds": 114.04349999999997,
              "endSeconds": 114.14349999999997
            },
            {
              "word": "snapshot",
              "startSeconds": 114.14349999999997,
              "endSeconds": 114.64349999999997
            },
            {
              "word": "not",
              "startSeconds": 114.64349999999997,
              "endSeconds": 115.14349999999997
            },
            {
              "word": "a",
              "startSeconds": 115.14349999999997,
              "endSeconds": 115.44349999999997
            },
            {
              "word": "shield",
              "startSeconds": 115.44349999999997,
              "endSeconds": 115.54349999999997
            },
            {
              "word": "now",
              "startSeconds": 116.22174999999997,
              "endSeconds": 116.52174999999997
            },
            {
              "word": "the",
              "startSeconds": 116.52174999999997,
              "endSeconds": 116.72174999999997
            },
            {
              "word": "house",
              "startSeconds": 116.72174999999997,
              "endSeconds": 116.82174999999997
            },
            {
              "word": "you",
              "startSeconds": 116.82174999999997,
              "endSeconds": 117.12174999999998
            },
            {
              "word": "bid",
              "startSeconds": 117.12174999999998,
              "endSeconds": 117.22174999999997
            },
            {
              "word": "on",
              "startSeconds": 117.22174999999997,
              "endSeconds": 117.42174999999997
            },
            {
              "word": "last",
              "startSeconds": 117.42174999999997,
              "endSeconds": 117.52174999999997
            },
            {
              "word": "week",
              "startSeconds": 117.52174999999997,
              "endSeconds": 117.72174999999997
            },
            {
              "word": "is",
              "startSeconds": 117.72174999999997,
              "endSeconds": 117.92174999999997
            },
            {
              "word": "a",
              "startSeconds": 117.92174999999997,
              "endSeconds": 118.12174999999998
            },
            {
              "word": "fantasy",
              "startSeconds": 118.12174999999998,
              "endSeconds": 118.32174999999997
            },
            {
              "word": "and",
              "startSeconds": 118.32174999999997,
              "endSeconds": 118.72174999999997
            },
            {
              "word": "you're",
              "startSeconds": 118.72174999999997,
              "endSeconds": 119.12174999999998
            }
          ],
          "emphasisWordIndexes": [],
          "evidenceRefs": [],
          "transition": null
        },
        {
          "id": "scene-04",
          "role": "custom",
          "focalOwner": "title",
          "fromFrame": 3573,
          "durationInFrames": 1087,
          "background": {
            "assetRef": "images/docu/how-the-fed-controls-your-money/img-66.jpg"
          },
          "layers": [
            {
              "component": "TitleCard",
              "layerRole": "primary",
              "props": {
                "line1": "The Fed-Proof Plan",
                "line2": "Lock before the speech"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "full",
              "z": 10,
              "box": {
                "x": 120,
                "y": 160,
                "w": 1680,
                "h": 720
              }
            },
            {
              "component": "KineticNumber",
              "layerRole": "supporting",
              "props": {
                "value": "27",
                "label": "Cost of waiting per 0.1%",
                "unit": "$"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "lower-third",
              "z": 6,
              "box": {
                "x": 120,
                "y": 640,
                "w": 1680,
                "h": 240
              }
            },
            {
              "component": "ContextBar",
              "layerRole": "supporting",
              "props": {
                "text": "Next FOMC meeting: lock rate now"
              },
              "resolvedAnchors": [
                {
                  "target": "enter",
                  "delayFrames": 0
                }
              ],
              "slot": "lower-third",
              "z": 7,
              "box": {
                "x": 120,
                "y": 640,
                "w": 1680,
                "h": 240
              }
            }
          ],
          "wordTimings": [
            {
              "word": "packing",
              "startSeconds": 119.12174999999998,
              "endSeconds": 119.22174999999997
            },
            {
              "word": "hope",
              "startSeconds": 119.22174999999997,
              "endSeconds": 119.42174999999997
            },
            {
              "word": "into",
              "startSeconds": 119.42174999999997,
              "endSeconds": 119.62174999999998
            },
            {
              "word": "boxes",
              "startSeconds": 119.62174999999998,
              "endSeconds": 120.12174999999998
            },
            {
              "word": "marked",
              "startSeconds": 120.12174999999998,
              "endSeconds": 120.32174999999997
            },
            {
              "word": "price",
              "startSeconds": 120.32174999999997,
              "endSeconds": 120.82174999999997
            },
            {
              "word": "reduced",
              "startSeconds": 120.82174999999997,
              "endSeconds": 121.32174999999997
            },
            {
              "word": "you",
              "startSeconds": 122.02799999999998,
              "endSeconds": 122.52799999999998
            },
            {
              "word": "stare",
              "startSeconds": 122.52799999999998,
              "endSeconds": 122.62799999999997
            },
            {
              "word": "at",
              "startSeconds": 122.62799999999997,
              "endSeconds": 122.72799999999998
            },
            {
              "word": "the",
              "startSeconds": 122.72799999999998,
              "endSeconds": 122.82799999999997
            },
            {
              "word": "calendar",
              "startSeconds": 122.82799999999997,
              "endSeconds": 123.02799999999998
            },
            {
              "word": "the",
              "startSeconds": 123.02799999999998,
              "endSeconds": 123.62799999999997
            },
            {
              "word": "next",
              "startSeconds": 123.62799999999997,
              "endSeconds": 123.82799999999997
            },
            {
              "word": "fed",
              "startSeconds": 123.82799999999997,
              "endSeconds": 124.22799999999998
            },
            {
              "word": "meeting",
              "startSeconds": 124.22799999999998,
              "endSeconds": 124.42799999999997
            },
            {
              "word": "is",
              "startSeconds": 124.42799999999997,
              "endSeconds": 124.62799999999997
            },
            {
              "word": "circled",
              "startSeconds": 124.62799999999997,
              "endSeconds": 124.92799999999997
            },
            {
              "word": "in",
              "startSeconds": 124.92799999999997,
              "endSeconds": 125.02799999999998
            },
            {
              "word": "red",
              "startSeconds": 125.02799999999998,
              "endSeconds": 125.22799999999998
            },
            {
              "word": "and",
              "startSeconds": 125.22799999999998,
              "endSeconds": 125.82799999999997
            },
            {
              "word": "every",
              "startSeconds": 125.82799999999997,
              "endSeconds": 126.12799999999997
            },
            {
              "word": "tick",
              "startSeconds": 126.12799999999997,
              "endSeconds": 126.42799999999997
            },
            {
              "word": "toward",
              "startSeconds": 126.42799999999997,
              "endSeconds": 126.52799999999998
            },
            {
              "word": "that",
              "startSeconds": 126.52799999999998,
              "endSeconds": 126.62799999999997
            },
            {
              "word": "date",
              "startSeconds": 126.62799999999997,
              "endSeconds": 126.92799999999997
            },
            {
              "word": "is",
              "startSeconds": 126.92799999999997,
              "endSeconds": 127.12799999999997
            },
            {
              "word": "another",
              "startSeconds": 127.12799999999997,
              "endSeconds": 127.32799999999997
            },
            {
              "word": "$100",
              "startSeconds": 127.32799999999997,
              "endSeconds": 128.22799999999998
            },
            {
              "word": "Vanishing",
              "startSeconds": 128.22799999999998,
              "endSeconds": 128.82799999999997
            },
            {
              "word": "from",
              "startSeconds": 128.82799999999997,
              "endSeconds": 129.02799999999996
            },
            {
              "word": "your",
              "startSeconds": 129.02799999999996,
              "endSeconds": 129.128
            },
            {
              "word": "monthly",
              "startSeconds": 129.128,
              "endSeconds": 129.32799999999997
            },
            {
              "word": "budget",
              "startSeconds": 129.32799999999997,
              "endSeconds": 129.52799999999996
            },
            {
              "word": "the",
              "startSeconds": 130.44224999999997,
              "endSeconds": 130.74224999999998
            },
            {
              "word": "rule",
              "startSeconds": 130.74224999999998,
              "endSeconds": 131.04224999999997
            },
            {
              "word": "is",
              "startSeconds": 131.04224999999997,
              "endSeconds": 131.24224999999998
            },
            {
              "word": "simple",
              "startSeconds": 131.24224999999998,
              "endSeconds": 131.34224999999998
            },
            {
              "word": "lock",
              "startSeconds": 131.34224999999998,
              "endSeconds": 132.04224999999997
            },
            {
              "word": "your",
              "startSeconds": 132.04224999999997,
              "endSeconds": 132.14224999999996
            },
            {
              "word": "mortgage",
              "startSeconds": 132.14224999999996,
              "endSeconds": 132.54224999999997
            },
            {
              "word": "rate",
              "startSeconds": 132.54224999999997,
              "endSeconds": 132.74224999999998
            },
            {
              "word": "before",
              "startSeconds": 132.74224999999998,
              "endSeconds": 132.94224999999997
            },
            {
              "word": "the",
              "startSeconds": 132.94224999999997,
              "endSeconds": 133.04224999999997
            },
            {
              "word": "fomc",
              "startSeconds": 133.04224999999997,
              "endSeconds": 133.64224999999996
            },
            {
              "word": "speaks",
              "startSeconds": 133.64224999999996,
              "endSeconds": 134.14224999999996
            },
            {
              "word": "because",
              "startSeconds": 134.14224999999996,
              "endSeconds": 134.64224999999996
            },
            {
              "word": "a",
              "startSeconds": 134.64224999999996,
              "endSeconds": 135.04224999999997
            },
            {
              "word": "single",
              "startSeconds": 135.04224999999997,
              "endSeconds": 135.04224999999997
            },
            {
              "word": "0.1%",
              "startSeconds": 135.04224999999997,
              "endSeconds": 136.24224999999998
            },
            {
              "word": "bump",
              "startSeconds": 136.24224999999998,
              "endSeconds": 136.64224999999996
            },
            {
              "word": "can",
              "startSeconds": 136.64224999999996,
              "endSeconds": 137.14224999999996
            },
            {
              "word": "add",
              "startSeconds": 137.14224999999996,
              "endSeconds": 137.24224999999998
            },
            {
              "word": "27",
              "startSeconds": 137.24224999999998,
              "endSeconds": 137.74224999999998
            },
            {
              "word": "to",
              "startSeconds": 137.74224999999998,
              "endSeconds": 138.24224999999998
            },
            {
              "word": "your",
              "startSeconds": 138.24224999999998,
              "endSeconds": 138.44224999999997
            },
            {
              "word": "payment",
              "startSeconds": 138.44224999999997,
              "endSeconds": 138.64224999999996
            },
            {
              "word": "overnight",
              "startSeconds": 138.64224999999996,
              "endSeconds": 139.24224999999998
            },
            {
              "word": "that",
              "startSeconds": 139.8885,
              "endSeconds": 140.2885
            },
            {
              "word": "buyer",
              "startSeconds": 140.2885,
              "endSeconds": 140.4885
            },
            {
              "word": "in",
              "startSeconds": 140.4885,
              "endSeconds": 140.7885
            },
            {
              "word": "2024",
              "startSeconds": 140.7885,
              "endSeconds": 141.2885
            },
            {
              "word": "learned",
              "startSeconds": 141.2885,
              "endSeconds": 141.7885
            },
            {
              "word": "the",
              "startSeconds": 141.7885,
              "endSeconds": 141.7885
            },
            {
              "word": "hard",
              "startSeconds": 141.7885,
              "endSeconds": 142.08849999999998
            },
            {
              "word": "way",
              "startSeconds": 142.08849999999998,
              "endSeconds": 142.1885
            },
            {
              "word": "rates",
              "startSeconds": 142.1885,
              "endSeconds": 142.9885
            },
            {
              "word": "jumped",
              "startSeconds": 142.9885,
              "endSeconds": 143.2885
            },
            {
              "word": "from",
              "startSeconds": 143.2885,
              "endSeconds": 143.3885
            },
            {
              "word": "6%",
              "startSeconds": 143.3885,
              "endSeconds": 143.7885
            },
            {
              "word": "to",
              "startSeconds": 143.7885,
              "endSeconds": 144.2885
            },
            {
              "word": "6.4%",
              "startSeconds": 144.2885,
              "endSeconds": 145.2885
            },
            {
              "word": "in",
              "startSeconds": 145.2885,
              "endSeconds": 145.6885
            },
            {
              "word": "weeks",
              "startSeconds": 145.6885,
              "endSeconds": 145.8885
            },
            {
              "word": "and",
              "startSeconds": 145.8885,
              "endSeconds": 146.3885
            },
            {
              "word": "their",
              "startSeconds": 146.3885,
              "endSeconds": 146.8885
            },
            {
              "word": "00000",
              "startSeconds": 146.8885,
              "endSeconds": 147.6885
            },
            {
              "word": "pre-approval",
              "startSeconds": 147.6885,
              "endSeconds": 148.4885
            },
            {
              "word": "suddenly",
              "startSeconds": 148.4885,
              "endSeconds": 149.1885
            },
            {
              "word": "meant",
              "startSeconds": 149.1885,
              "endSeconds": 149.3885
            },
            {
              "word": "a",
              "startSeconds": 149.3885,
              "endSeconds": 149.58849999999998
            },
            {
              "word": "smaller",
              "startSeconds": 149.58849999999998,
              "endSeconds": 150.8885
            },
            {
              "word": "house",
              "startSeconds": 150.8885,
              "endSeconds": 151.1885
            },
            {
              "word": "so",
              "startSeconds": 152.43075,
              "endSeconds": 152.63075
            },
            {
              "word": "you",
              "startSeconds": 152.63075,
              "endSeconds": 152.73075
            },
            {
              "word": "click",
              "startSeconds": 152.73075,
              "endSeconds": 152.93075
            },
            {
              "word": "the",
              "startSeconds": 152.93075,
              "endSeconds": 153.03074999999998
            },
            {
              "word": "lock",
              "startSeconds": 153.03074999999998,
              "endSeconds": 153.33075
            },
            {
              "word": "icon",
              "startSeconds": 153.33075,
              "endSeconds": 153.63075
            },
            {
              "word": "on",
              "startSeconds": 153.63075,
              "endSeconds": 153.93075
            },
            {
              "word": "your",
              "startSeconds": 153.93075,
              "endSeconds": 153.93075
            },
            {
              "word": "right",
              "startSeconds": 153.93075,
              "endSeconds": 154.33075
            },
            {
              "word": "now",
              "startSeconds": 154.33075,
              "endSeconds": 154.43075
            },
            {
              "word": "sealing",
              "startSeconds": 154.43075,
              "endSeconds": 155.23075
            },
            {
              "word": "your",
              "startSeconds": 155.23075,
              "endSeconds": 155.33075
            }
          ],
          "emphasisWordIndexes": [],
          "evidenceRefs": [],
          "transition": null
        }
      ],
      "captionsEnabled": false
    }
  }
];
