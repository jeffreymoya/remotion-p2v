import assert from "node:assert/strict";
import { refineImages, isNetworkFailure } from "../src/lib/refine-image";
import type { ImageFetchItem } from "../src/lib/build-image-fetch-prompt";
import type { AcquireResult } from "../src/lib/acquire-images";
import { DEFAULT_STYLE } from "../src/lib/config";

function item(label: string): ImageFetchItem {
  return {
    label,
    asset_role: "animated_object",
    needs_background_removal: false,
    visual_requirements: `${label} visual requirements`,
    rationale: `${label} rationale`,
    t2i_prompt: `${label} original prompt`,
  };
}

assert.equal(isNetworkFailure("fetch failed"), true);
assert.equal(isNetworkFailure("Request timed out"), true);
assert.equal(isNetworkFailure("Runware API rejected the prompt"), false);

async function main(): Promise<void> {
  let networkAttempts = 0;
  let serviceAttempts = 0;
  let deepSeekCalls = 0;
  const { items, results } = await refineImages(
    [item("network.png"), item("service.png")],
    "public/images/test",
    "test Remotion prompt",
    DEFAULT_STYLE,
    {
      runDeepSeek: async () => {
        deepSeekCalls++;
        return "refined service prompt with more concrete output details";
      },
      acquireImages: async (itemsToAcquire): Promise<AcquireResult[]> =>
        itemsToAcquire.map((candidate) => {
          if (candidate.label === "network.png") {
            networkAttempts++;
            if (networkAttempts <= 2) {
              return {
                label: candidate.label,
                ok: false,
                error: "fetch failed",
              };
            }
            return {
              label: candidate.label,
              ok: true,
              path: `public/images/test/${candidate.label}`,
            };
          }

          serviceAttempts++;
          if (serviceAttempts === 1) {
            return {
              label: candidate.label,
              ok: false,
              error: "Runware API rejected the prompt",
            };
          }
          return {
            label: candidate.label,
            ok: true,
            path: `public/images/test/${candidate.label}`,
          };
        }),
    },
  );

  assert.equal(networkAttempts, 3);
  assert.equal(serviceAttempts, 2);
  assert.equal(deepSeekCalls, 1);
  assert.equal(results.filter((result) => result.ok).length, 2);
  assert.equal(
    items.find((candidate) => candidate.label === "service.png")?.t2i_prompt,
    "refined service prompt with more concrete output details",
  );

  {
    let terminalNetworkAttempts = 0;
    let terminalDeepSeekCalls = 0;
    const { results: terminalResults } = await refineImages(
      [item("terminal-network.png")],
      "public/images/test",
      "test Remotion prompt",
      DEFAULT_STYLE,
      {
        runDeepSeek: async () => {
          terminalDeepSeekCalls++;
          return "should not be used";
        },
        acquireImages: async (itemsToAcquire): Promise<AcquireResult[]> => {
          terminalNetworkAttempts++;
          return itemsToAcquire.map((candidate) => ({
            label: candidate.label,
            ok: false,
            error: "ETIMEDOUT",
          }));
        },
      },
    );

    assert.equal(terminalNetworkAttempts, 3);
    assert.equal(terminalDeepSeekCalls, 0);
    assert.deepEqual(terminalResults, [
      {
        label: "terminal-network.png",
        ok: false,
        error: "ETIMEDOUT",
      },
    ]);
  }

  console.log("Refine image retry smoke passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
