import React from "react";
import { HATTAB_B_CURVE, HATTAB_G_CURVE, HATTAB_LUT_ID, HATTAB_R_CURVE } from "./docu-tokens";

/**
 * Injects the HaTTab cinematic split-tone LUT as a hidden SVG filter into the DOM.
 *
 * Usage: render <HaTTabLutDefs /> once near the root of your composition, then apply
 * the grade with  `filter: url(#hattab-cinematic-lut)`  on any media element.
 *
 * Channel curves (7-stop 1D LUT via feComponentTransfer type="table"):
 *   R — shadows pulled down, highlights pushed warm (orange cast in highlights)
 *   G — slight midtone warmth boost to keep skin tones natural
 *   B — shadows boosted (teal cast), highlights pulled (kills blue in warm zones)
 *
 * This is the only CSS-accessible primitive that produces true tonal-range isolation
 * (shadow-to-teal, highlight-to-orange on the same pixel) in headless Chrome.
 */
export const HaTTabLutDefs: React.FC = () => (
  <svg
    width="0"
    height="0"
    style={{ position: "absolute", overflow: "hidden" }}
    aria-hidden="true"
  >
    <defs>
      <filter id={HATTAB_LUT_ID} colorInterpolationFilters="sRGB">
        <feComponentTransfer>
          <feFuncR type="table" tableValues={HATTAB_R_CURVE} />
          <feFuncG type="table" tableValues={HATTAB_G_CURVE} />
          <feFuncB type="table" tableValues={HATTAB_B_CURVE} />
        </feComponentTransfer>
      </filter>
    </defs>
  </svg>
);
