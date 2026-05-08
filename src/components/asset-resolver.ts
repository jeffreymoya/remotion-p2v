import type { AssetRefType } from "../lib/scene-script-schema";

export type AssetResolver = (assetRef: string) => string;

function toStaticAssetPath(value: string): string {
  return value
    .replace(/\\/g, "/")
    .replace(/^\.?\//, "")
    .replace(/^public\//, "");
}

function isBareFileName(value: string): boolean {
  return !value.includes("/");
}

export function createAssetResolver(assets: AssetRefType[]): AssetResolver {
  const assetPathByLabel = new Map<string, string>();

  for (const asset of assets) {
    const staticPath = toStaticAssetPath(asset.cutoutPath ?? asset.path ?? asset.label);
    assetPathByLabel.set(asset.label, staticPath);
  }

  return (assetRef: string) => {
    const normalizedRef = toStaticAssetPath(assetRef);
    const mappedPath = assetPathByLabel.get(assetRef) ?? assetPathByLabel.get(normalizedRef);

    if (mappedPath) {
      return mappedPath;
    }

    return isBareFileName(normalizedRef) ? `images/${normalizedRef}` : normalizedRef;
  };
}
