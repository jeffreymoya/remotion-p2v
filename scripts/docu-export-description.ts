#!/usr/bin/env tsx
// scripts/docu-export-description.ts — description source exporter (YPP Backlog 4).
//
// Reads the per-video publish manifest (`prompts/docu/<slug>-publish-manifest.json`,
// produced by the publish-manifest phase / Deliverable C), formats a clean
// "Sources & attribution" block via the pure exporter, prints it, and writes it
// to `prompts/docu/<slug>-description-sources.txt` for pasting into the YouTube
// description.
//
// The manifest is the single source of provenance truth — it has already
// resolved used research anchors, excluded cached stock, and recorded gated
// clips. This script only does IO + formatting.
//
// Usage:
//   npx tsx scripts/docu-export-description.ts <slug>

import fs from "node:fs";

import { buildDescriptionSources } from "../src/lib/docu/description-export";
import { readCachedJson } from "../src/lib/docu/pipeline";
import { publishManifestPath, type PublishManifest } from "../src/lib/docu/publish-manifest";

const PROMPTS_DIR = "prompts/docu";

function outputPath(slug: string): string {
  return `${PROMPTS_DIR}/${slug}-description-sources.txt`;
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Usage: npx tsx scripts/docu-export-description.ts <slug>");
    process.exit(1);
  }

  const manifest = readCachedJson<PublishManifest>(publishManifestPath(slug));
  if (!manifest) {
    console.error(
      `[docu] no publish manifest at ${publishManifestPath(slug)} — ` +
        `run the docu pipeline (publish-manifest phase) for "${slug}" first.`,
    );
    process.exit(1);
  }

  const { groups, text } = buildDescriptionSources({
    sources: manifest.sources ?? [],
    thirdPartyFootage: manifest.thirdPartyFootage ?? [],
    stockAssets: manifest.stockAssets ?? null,
    music: manifest.music ?? null,
    voice: manifest.voice ?? null,
  });

  const out = outputPath(slug);
  fs.writeFileSync(out, `${text}\n`);

  console.log(
    `[docu] description-sources: ${groups.research.length} research link(s)` +
      `${groups.researchOverflow > 0 ? ` (+${groups.researchOverflow} summarized)` : ""}, ` +
      `${groups.footage.length} clip(s), ` +
      `${groups.stock ? groups.stock.count : 0} stock image(s).`,
  );
  console.log(`[docu] written: ${out}`);
}

main();
