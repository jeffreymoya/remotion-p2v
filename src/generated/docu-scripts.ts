import type { DocuScript } from "../components/docu/DocumentaryComposition";

const IMG_ROOT = "images/docu/how-the-fed-controls-your-money";

const WORD_TIMINGS = [
    {
      "word": "every",
      "startSeconds": 0.2,
      "endSeconds": 0.7
    },
    {
      "word": "dollar",
      "startSeconds": 0.7,
      "endSeconds": 1
    },
    {
      "word": "you've",
      "startSeconds": 1,
      "endSeconds": 1.3
    },
    {
      "word": "ever",
      "startSeconds": 1.3,
      "endSeconds": 1.4
    },
    {
      "word": "spent",
      "startSeconds": 1.4,
      "endSeconds": 1.9
    },
    {
      "word": "has",
      "startSeconds": 1.9,
      "endSeconds": 2.2
    },
    {
      "word": "been",
      "startSeconds": 2.2,
      "endSeconds": 2.3
    },
    {
      "word": "shaped",
      "startSeconds": 2.3,
      "endSeconds": 2.7
    },
    {
      "word": "by",
      "startSeconds": 2.7,
      "endSeconds": 2.9
    },
    {
      "word": "12",
      "startSeconds": 2.9,
      "endSeconds": 3.3
    },
    {
      "word": "people",
      "startSeconds": 3.3,
      "endSeconds": 3.6
    },
    {
      "word": "they",
      "startSeconds": 4.861,
      "endSeconds": 5.161
    },
    {
      "word": "meet",
      "startSeconds": 5.161,
      "endSeconds": 5.361
    },
    {
      "word": "8",
      "startSeconds": 5.361,
      "endSeconds": 5.661
    },
    {
      "word": "times",
      "startSeconds": 5.661,
      "endSeconds": 5.861
    },
    {
      "word": "a",
      "startSeconds": 5.861,
      "endSeconds": 5.961
    },
    {
      "word": "year",
      "startSeconds": 5.961,
      "endSeconds": 5.961
    },
    {
      "word": "and",
      "startSeconds": 6.822,
      "endSeconds": 7.222
    },
    {
      "word": "in",
      "startSeconds": 7.222,
      "endSeconds": 7.722
    },
    {
      "word": "2",
      "startSeconds": 7.722,
      "endSeconds": 7.822
    },
    {
      "word": "hours",
      "startSeconds": 7.822,
      "endSeconds": 7.922
    },
    {
      "word": "they",
      "startSeconds": 7.922,
      "endSeconds": 8.322
    },
    {
      "word": "can",
      "startSeconds": 8.322,
      "endSeconds": 8.522
    },
    {
      "word": "raise",
      "startSeconds": 8.522,
      "endSeconds": 8.722
    },
    {
      "word": "your",
      "startSeconds": 8.722,
      "endSeconds": 8.822
    },
    {
      "word": "mortgage",
      "startSeconds": 8.822,
      "endSeconds": 9.222
    },
    {
      "word": "by",
      "startSeconds": 9.222,
      "endSeconds": 9.322
    },
    {
      "word": "$500",
      "startSeconds": 9.322,
      "endSeconds": 9.922
    },
    {
      "word": "a",
      "startSeconds": 9.922,
      "endSeconds": 10.222
    },
    {
      "word": "month",
      "startSeconds": 10.222,
      "endSeconds": 10.222
    },
    {
      "word": "this",
      "startSeconds": 11.343,
      "endSeconds": 11.543
    },
    {
      "word": "is",
      "startSeconds": 11.543,
      "endSeconds": 11.643
    },
    {
      "word": "the",
      "startSeconds": 11.643,
      "endSeconds": 11.743
    },
    {
      "word": "Federal",
      "startSeconds": 11.743,
      "endSeconds": 12.143
    },
    {
      "word": "Reserve",
      "startSeconds": 12.143,
      "endSeconds": 12.443
    },
    {
      "word": "the",
      "startSeconds": 13.104,
      "endSeconds": 13.404
    },
    {
      "word": "feds",
      "startSeconds": 13.404,
      "endSeconds": 13.904
    },
    {
      "word": "main",
      "startSeconds": 13.904,
      "endSeconds": 14.004
    },
    {
      "word": "lever",
      "startSeconds": 14.004,
      "endSeconds": 14.304
    },
    {
      "word": "is",
      "startSeconds": 14.304,
      "endSeconds": 14.404
    },
    {
      "word": "the",
      "startSeconds": 14.404,
      "endSeconds": 14.704
    },
    {
      "word": "federal",
      "startSeconds": 14.704,
      "endSeconds": 14.804
    },
    {
      "word": "funds",
      "startSeconds": 14.804,
      "endSeconds": 15.204
    },
    {
      "word": "rate",
      "startSeconds": 15.204,
      "endSeconds": 15.404
    },
    {
      "word": "it's",
      "startSeconds": 15.885,
      "endSeconds": 16.385
    },
    {
      "word": "the",
      "startSeconds": 16.385,
      "endSeconds": 16.585
    },
    {
      "word": "price",
      "startSeconds": 16.585,
      "endSeconds": 16.685
    },
    {
      "word": "Banks",
      "startSeconds": 16.685,
      "endSeconds": 17.185
    },
    {
      "word": "pay",
      "startSeconds": 17.185,
      "endSeconds": 17.385
    },
    {
      "word": "to",
      "startSeconds": 17.385,
      "endSeconds": 17.685
    },
    {
      "word": "borrow",
      "startSeconds": 17.685,
      "endSeconds": 18.085
    },
    {
      "word": "money",
      "startSeconds": 18.085,
      "endSeconds": 18.285
    },
    {
      "word": "overnight",
      "startSeconds": 18.285,
      "endSeconds": 18.785
    },
    {
      "word": "when",
      "startSeconds": 19.706,
      "endSeconds": 20.006
    },
    {
      "word": "that",
      "startSeconds": 20.006,
      "endSeconds": 20.306
    },
    {
      "word": "rate",
      "startSeconds": 20.306,
      "endSeconds": 20.506
    },
    {
      "word": "goes",
      "startSeconds": 20.506,
      "endSeconds": 20.606
    },
    {
      "word": "up",
      "startSeconds": 20.606,
      "endSeconds": 20.806
    },
    {
      "word": "every",
      "startSeconds": 20.806,
      "endSeconds": 21.706
    },
    {
      "word": "loan",
      "startSeconds": 21.706,
      "endSeconds": 22.006
    },
    {
      "word": "in",
      "startSeconds": 22.006,
      "endSeconds": 22.306
    },
    {
      "word": "America",
      "startSeconds": 22.306,
      "endSeconds": 22.406
    },
    {
      "word": "gets",
      "startSeconds": 22.406,
      "endSeconds": 22.606
    },
    {
      "word": "more",
      "startSeconds": 22.606,
      "endSeconds": 22.706
    },
    {
      "word": "expensive",
      "startSeconds": 22.706,
      "endSeconds": 22.906
    },
    {
      "word": "in",
      "startSeconds": 23.866,
      "endSeconds": 24.366
    },
    {
      "word": "2022",
      "startSeconds": 24.366,
      "endSeconds": 24.866
    },
    {
      "word": "inflation",
      "startSeconds": 24.866,
      "endSeconds": 25.466
    },
    {
      "word": "hit",
      "startSeconds": 25.466,
      "endSeconds": 25.866
    },
    {
      "word": "9.1%",
      "startSeconds": 25.866,
      "endSeconds": 26.766
    },
    {
      "word": "the",
      "startSeconds": 26.766,
      "endSeconds": 27.666
    },
    {
      "word": "highest",
      "startSeconds": 27.666,
      "endSeconds": 27.866
    },
    {
      "word": "in",
      "startSeconds": 27.866,
      "endSeconds": 28.466
    },
    {
      "word": "40",
      "startSeconds": 28.466,
      "endSeconds": 28.666
    },
    {
      "word": "years",
      "startSeconds": 28.666,
      "endSeconds": 28.766
    },
    {
      "word": "the",
      "startSeconds": 29.827,
      "endSeconds": 30.127
    },
    {
      "word": "fed's",
      "startSeconds": 30.127,
      "endSeconds": 30.627
    },
    {
      "word": "response",
      "startSeconds": 30.627,
      "endSeconds": 30.827
    },
    {
      "word": "was",
      "startSeconds": 30.827,
      "endSeconds": 30.927
    },
    {
      "word": "aggressive",
      "startSeconds": 30.927,
      "endSeconds": 31.227
    },
    {
      "word": "7",
      "startSeconds": 32.188,
      "endSeconds": 32.588
    },
    {
      "word": "rate",
      "startSeconds": 32.588,
      "endSeconds": 32.988
    },
    {
      "word": "hikes",
      "startSeconds": 32.988,
      "endSeconds": 33.288
    },
    {
      "word": "and",
      "startSeconds": 33.288,
      "endSeconds": 33.388
    },
    {
      "word": "12",
      "startSeconds": 33.388,
      "endSeconds": 33.588
    },
    {
      "word": "months",
      "startSeconds": 33.588,
      "endSeconds": 33.688
    },
    {
      "word": "mortgage",
      "startSeconds": 34.409,
      "endSeconds": 34.809
    },
    {
      "word": "rates",
      "startSeconds": 34.809,
      "endSeconds": 35.109
    },
    {
      "word": "went",
      "startSeconds": 35.109,
      "endSeconds": 35.309
    },
    {
      "word": "from",
      "startSeconds": 35.309,
      "endSeconds": 35.309
    },
    {
      "word": "3%",
      "startSeconds": 35.309,
      "endSeconds": 35.909
    },
    {
      "word": "to",
      "startSeconds": 35.909,
      "endSeconds": 36.209
    },
    {
      "word": "over",
      "startSeconds": 36.209,
      "endSeconds": 36.409
    },
    {
      "word": "7%",
      "startSeconds": 36.409,
      "endSeconds": 37.009
    },
    {
      "word": "monthly",
      "startSeconds": 37.81,
      "endSeconds": 38.61
    },
    {
      "word": "payments",
      "startSeconds": 38.61,
      "endSeconds": 38.91
    },
    {
      "word": "on",
      "startSeconds": 38.91,
      "endSeconds": 39.11
    },
    {
      "word": "a",
      "startSeconds": 39.11,
      "endSeconds": 39.41
    },
    {
      "word": "median",
      "startSeconds": 39.41,
      "endSeconds": 39.61
    },
    {
      "word": "home",
      "startSeconds": 39.61,
      "endSeconds": 39.81
    },
    {
      "word": "jumped",
      "startSeconds": 39.81,
      "endSeconds": 40.11
    },
    {
      "word": "by",
      "startSeconds": 40.11,
      "endSeconds": 40.21
    },
    {
      "word": "$800",
      "startSeconds": 40.21,
      "endSeconds": 40.91
    },
    {
      "word": "millions",
      "startSeconds": 42.051,
      "endSeconds": 42.451
    },
    {
      "word": "of",
      "startSeconds": 42.451,
      "endSeconds": 42.751
    },
    {
      "word": "buyers",
      "startSeconds": 42.751,
      "endSeconds": 43.051
    },
    {
      "word": "were",
      "startSeconds": 43.051,
      "endSeconds": 43.351
    },
    {
      "word": "priced",
      "startSeconds": 43.351,
      "endSeconds": 43.651
    },
    {
      "word": "out",
      "startSeconds": 43.651,
      "endSeconds": 43.851
    },
    {
      "word": "overnight",
      "startSeconds": 43.851,
      "endSeconds": 44.051
    },
    {
      "word": "that",
      "startSeconds": 44.812,
      "endSeconds": 45.212
    },
    {
      "word": "was",
      "startSeconds": 45.212,
      "endSeconds": 45.312
    },
    {
      "word": "the",
      "startSeconds": 45.312,
      "endSeconds": 46.212
    },
    {
      "word": "transmission",
      "startSeconds": 46.212,
      "endSeconds": 46.512
    },
    {
      "word": "mechanism",
      "startSeconds": 46.512,
      "endSeconds": 46.812
    },
    {
      "word": "working",
      "startSeconds": 46.812,
      "endSeconds": 47.612
    },
    {
      "word": "exactly",
      "startSeconds": 47.612,
      "endSeconds": 47.912
    },
    {
      "word": "as",
      "startSeconds": 47.912,
      "endSeconds": 48.212
    },
    {
      "word": "intended",
      "startSeconds": 48.212,
      "endSeconds": 48.612
    },
    {
      "word": "hi",
      "startSeconds": 49.653,
      "endSeconds": 50.253
    },
    {
      "word": "rates",
      "startSeconds": 50.253,
      "endSeconds": 50.453
    },
    {
      "word": "slow",
      "startSeconds": 50.453,
      "endSeconds": 50.853
    },
    {
      "word": "spending",
      "startSeconds": 50.853,
      "endSeconds": 51.253
    },
    {
      "word": "cool",
      "startSeconds": 51.253,
      "endSeconds": 52.153
    },
    {
      "word": "prices",
      "startSeconds": 52.153,
      "endSeconds": 52.353
    },
    {
      "word": "and",
      "startSeconds": 52.353,
      "endSeconds": 52.853
    },
    {
      "word": "reduced",
      "startSeconds": 52.853,
      "endSeconds": 53.453
    },
    {
      "word": "growth",
      "startSeconds": 53.453,
      "endSeconds": 53.553
    },
    {
      "word": "but",
      "startSeconds": 54.854,
      "endSeconds": 55.154
    },
    {
      "word": "they",
      "startSeconds": 55.154,
      "endSeconds": 55.254
    },
    {
      "word": "also",
      "startSeconds": 55.254,
      "endSeconds": 55.454
    },
    {
      "word": "freeze",
      "startSeconds": 55.454,
      "endSeconds": 55.854
    },
    {
      "word": "the",
      "startSeconds": 55.854,
      "endSeconds": 55.954
    },
    {
      "word": "housing",
      "startSeconds": 55.954,
      "endSeconds": 56.154
    },
    {
      "word": "market",
      "startSeconds": 56.154,
      "endSeconds": 56.454
    },
    {
      "word": "and",
      "startSeconds": 56.454,
      "endSeconds": 56.754
    },
    {
      "word": "Crush",
      "startSeconds": 56.754,
      "endSeconds": 57.054
    },
    {
      "word": "startup",
      "startSeconds": 57.054,
      "endSeconds": 57.554
    },
    {
      "word": "funding",
      "startSeconds": 57.554,
      "endSeconds": 57.854
    },
    {
      "word": "today",
      "startSeconds": 58.575,
      "endSeconds": 59.075
    },
    {
      "word": "the",
      "startSeconds": 59.075,
      "endSeconds": 59.275
    },
    {
      "word": "FED",
      "startSeconds": 59.275,
      "endSeconds": 59.575
    },
    {
      "word": "holds",
      "startSeconds": 59.575,
      "endSeconds": 59.875
    },
    {
      "word": "7.4",
      "startSeconds": 59.875,
      "endSeconds": 60.475
    },
    {
      "word": "trillion",
      "startSeconds": 60.575,
      "endSeconds": 61.075
    },
    {
      "word": "in",
      "startSeconds": 61.075,
      "endSeconds": 61.675
    },
    {
      "word": "assets",
      "startSeconds": 61.675,
      "endSeconds": 61.875
    },
    {
      "word": "more",
      "startSeconds": 62.716,
      "endSeconds": 63.216
    },
    {
      "word": "than",
      "startSeconds": 63.216,
      "endSeconds": 63.216
    },
    {
      "word": "the",
      "startSeconds": 63.216,
      "endSeconds": 63.416
    },
    {
      "word": "GDP",
      "startSeconds": 63.416,
      "endSeconds": 63.616
    },
    {
      "word": "of",
      "startSeconds": 63.616,
      "endSeconds": 64.116
    },
    {
      "word": "every",
      "startSeconds": 64.116,
      "endSeconds": 64.216
    },
    {
      "word": "country",
      "startSeconds": 64.216,
      "endSeconds": 64.316
    },
    {
      "word": "except",
      "startSeconds": 64.316,
      "endSeconds": 64.816
    },
    {
      "word": "the",
      "startSeconds": 64.816,
      "endSeconds": 65.016
    },
    {
      "word": "US",
      "startSeconds": 65.016,
      "endSeconds": 65.116
    },
    {
      "word": "and",
      "startSeconds": 65.116,
      "endSeconds": 65.416
    },
    {
      "word": "China",
      "startSeconds": 65.416,
      "endSeconds": 65.516
    },
    {
      "word": "understanding",
      "startSeconds": 66.216,
      "endSeconds": 67.016
    },
    {
      "word": "the",
      "startSeconds": 67.016,
      "endSeconds": 67.116
    },
    {
      "word": "FED",
      "startSeconds": 67.116,
      "endSeconds": 67.416
    },
    {
      "word": "is",
      "startSeconds": 67.416,
      "endSeconds": 67.616
    },
    {
      "word": "an",
      "startSeconds": 67.616,
      "endSeconds": 68.016
    },
    {
      "word": "academic",
      "startSeconds": 68.016,
      "endSeconds": 68.216
    },
    {
      "word": "it's",
      "startSeconds": 69.097,
      "endSeconds": 69.397
    },
    {
      "word": "the",
      "startSeconds": 69.397,
      "endSeconds": 69.597
    },
    {
      "word": "operating",
      "startSeconds": 69.597,
      "endSeconds": 69.797
    },
    {
      "word": "manual",
      "startSeconds": 69.797,
      "endSeconds": 70.197
    },
    {
      "word": "for",
      "startSeconds": 70.197,
      "endSeconds": 70.297
    },
    {
      "word": "your",
      "startSeconds": 70.297,
      "endSeconds": 70.497
    },
    {
      "word": "financial",
      "startSeconds": 70.497,
      "endSeconds": 70.897
    },
    {
      "word": "life",
      "startSeconds": 70.897,
      "endSeconds": 71.197
    }
  ];

const DURATION_FRAMES = 2144;

function sent(
  idx: number,
  text: string,
  startFrame: number,
  endFrame: number,
  clipIndex: number,
  tokenWordIndexes: number[],
  emphasisWordIndexes?: number[],
) {
  return {
    sentenceIndex: idx,
    text,
    startSeconds: startFrame / 30,
    endSeconds: endFrame / 30,
    startFrame,
    endFrame,
    clipIndex,
    tokenWordIndexes,
    emphasisWordIndexes,
  };
}

function shot(
  index: number,
  startFrame: number,
  endFrame: number,
  palette: "cool-tech" | "warm-real",
) {
  return {
    imagePath: `${IMG_ROOT}/img-${String(index).padStart(2, "0")}.jpg`,
    mediaType: "image" as const,
    loop: false,
    startFrame,
    endFrame,
    palette,
  };
}

export const docuScripts: DocuScript[] = [
  {
    slug: "how-the-fed-controls-your-money",
    topic: "How the Federal Reserve Controls Your Money",
    audioPath: "audio/docu/how-the-fed-controls-your-money.wav",
    backgroundMusicPath:
      "background-music/scott-buckley-permafrost(chosic.com).mp3",
    durationInFrames: DURATION_FRAMES,
    fps: 30,
    width: 1920,
    height: 1080,
    wordTimings: WORD_TIMINGS,
    sentences: [
      sent(0, "Every dollar you've ever spent has been shaped by twelve people.", 0, 125, 0, [0,1,2,3,4,5,6,7,8,9,10], [0, 1]),
      sent(1, "They meet eight times a year.", 133, 193, 0, [11,12,13,14,15,16], [1, 3]),
      sent(2, "And in two hours, they can raise your mortgage by $500 a month.", 201, 326, 0, [17,18,19,20,21,22,23,24,25,26,27,28,29], [8, 10]),
      sent(3, "This is the Federal Reserve.", 334, 382, 0, [30,31,32,33,34], [3, 4]),
      sent(4, "The Fed's main lever is the federal funds rate.", 390, 465, 0, [35,36,37,38,39,40,41,42,43], [3, 8]),
      sent(5, "It's the price banks pay to borrow money overnight.", 473, 574, 0, [44,45,46,47,48,49,50,51,52], [3, 4, 6]),
      sent(6, "When that rate goes up, every loan in America gets more expensive.", 582, 701, 0, [53,54,55,56,57,58,59,60,61,62,63,64], [2, 4, 11]),
      sent(7, "In 2022, inflation hit 9.1 percent — the highest in 40 years.", 709, 883, 0, [65,66,67,68,69,70,71,72,73,74], [1, 2]),
      sent(8, "The Fed's response was aggressive.", 891, 951, 0, [75,76,77,78,79], [1, 2, 4]),
      sent(9, "Seven rate hikes in twelve months.", 959, 1024, 0, [80,81,82,83,84,85], [1, 2]),
      sent(10, "Mortgage rates went from 3 percent to over 7 percent.", 1032, 1123, 0, [86,87,88,89,90,91,92,93], [0, 1, 2]),
      sent(11, "Monthly payments on a median home jumped by $800.", 1131, 1247, 0, [94,95,96,97,98,99,100,101,102], [6]),
      sent(12, "Millions of buyers were priced out overnight.", 1255, 1333, 0, [103,104,105,106,107,108,109], [0, 4, 5]),
      sent(13, "That was the transmission mechanism working exactly as intended.", 1341, 1475, 0, [110,111,112,113,114,115,116,117,118], [3, 4]),
      sent(14, "High rates slow spending, cool prices, and reduce growth.", 1483, 1622, 0, [119,120,121,122,123,124,125,126,127], [1, 4]),
      sent(15, "But they also freeze the housing market and crush startup funding.", 1630, 1743, 0, [128,129,130,131,132,133,134,135,136,137,138], [3, 5, 6, 9]),
      sent(16, "Today, the Fed holds $7.4 trillion in assets.", 1751, 1867, 0, [139,140,141,142,143,144,145,146], [2, 3]),
      sent(17, "More than the GDP of every country except the US and China.", 1875, 1972, 0, [147,148,149,150,151,152,153,154,155,156,157,158], [0, 3, 11]),
      sent(18, "Understanding the Fed isn't academic.", 1980, 2061, 0, [159,160,161,162,163,164], [0, 2]),
      sent(19, "It's the operating manual for your financial life.", 2069, 2144, 0, [165,166,167,168,169,170,171,172], [2, 3, 6]),
    ],
    clips: [
      {
        clipIndex: 0,
        startFrame: 0,
        endFrame: DURATION_FRAMES,
        shots: [
          shot(0, 0, 63, "warm-real"),
          shot(1, 63, 133, "warm-real"),
          shot(2, 133, 201, "cool-tech"),
          shot(3, 201, 264, "warm-real"),
          shot(4, 264, 334, "warm-real"),
          shot(5, 334, 390, "cool-tech"),
          shot(6, 390, 473, "cool-tech"),
          shot(7, 473, 582, "cool-tech"),
          shot(8, 582, 642, "warm-real"),
          shot(9, 642, 709, "warm-real"),
          shot(10, 709, 796, "cool-tech"),
          shot(11, 796, 891, "cool-tech"),
          shot(12, 891, 959, "cool-tech"),
          shot(13, 959, 1032, "cool-tech"),
          shot(14, 1032, 1131, "warm-real"),
          shot(15, 1131, 1189, "warm-real"),
          shot(16, 1189, 1255, "warm-real"),
          shot(17, 1255, 1341, "warm-real"),
          shot(18, 1341, 1408, "cool-tech"),
          shot(19, 1408, 1483, "cool-tech"),
          shot(20, 1483, 1553, "cool-tech"),
          shot(21, 1553, 1630, "cool-tech"),
          shot(22, 1630, 1687, "warm-real"),
          shot(23, 1687, 1751, "warm-real"),
          shot(24, 1751, 1809, "cool-tech"),
          shot(25, 1809, 1875, "cool-tech"),
          shot(26, 1875, 1980, "cool-tech"),
          shot(27, 1980, 2069, "warm-real"),
          shot(28, 2069, 2144, "warm-real"),
        ],
      },
    ],
    overlays: [
      { type: "kinetic-number", text: "FEDERAL FUNDS RATE", value: 5.25, unit: "%", palette: "cool-tech", startFrame: 441, endFrame: 532 },
      { type: "headline-card", text: "INFLATION: 9.1%", source: "CPI, June 2022 — 40-year high", palette: "cool-tech", startFrame: 745, endFrame: 851 },
      { type: "kinetic-number", text: "MONTHLY PAYMENT INCREASE", value: 800, unit: "$", palette: "warm-real", startFrame: 1206, endFrame: 1297 },
      { type: "headline-card", text: "FED BALANCE SHEET: $7.4 TRILLION", source: "Federal Reserve H.4.1, May 2024", palette: "cool-tech", startFrame: 1796, endFrame: 1917 },
    ],
    articleCards: [],
  },
];
