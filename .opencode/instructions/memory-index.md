# Project Memory Index

Rules ported from Claude Code per-project memory that are not covered by CLAUDE.md.

---

## Sidecar Docs Location

Never write plan files, design docs, changelogs, or architecture docs inside this repo directory. All sidecar artifacts belong in the global sidecar repo at `~/dev/_sidecar/remotion-p2v/`.

Category structure:
- Plans → `~/dev/_sidecar/remotion-p2v/ai/`
- Architecture reviews → `~/dev/_sidecar/remotion-p2v/docs/arch-reviews/`
- ADRs → `~/dev/_sidecar/remotion-p2v/adr/`
- Changelogs → `~/dev/_sidecar/remotion-p2v/changelog/`

The sidecar repo is version-controlled and backed up separately via daily cron at `~/dev/_sidecar/_global/daily-commit.sh`.

---

## Kinetic Text Typography Reference

Before making any changes to kinetic text components (headlines, article cards, number overlays, caption layers), always read:

```
~/dev/_sidecar/remotion-p2v/docs/kinetic-text-typography.md
```

This doc contains canonical design decisions for font sizing, line-height geometry, highlight alignment, shadow direction, and overlay inversion rules. Working without it risks re-introducing alignment bugs (e.g., canvas/CSS metric mismatch) or contradicting settled design choices.

---

## Kinetic Text Overlay Inversion Rule

When placing kinetic text (headlines, article cards, number cards) over B-roll:
- **Dark/near-black text** → use a **bright white overlay** behind the card
- **Light/white text** → use a **dark overlay** behind the card

Contrast is determined by the relationship between text and its immediate background. If text is dark but the overlay is also dark, the text is unreadable. The overlay direction and text color must always be inverted relative to each other.

How to apply:
- In `ArticleCard`, expose a `textMode: "light" | "dark"` prop. Default is `"light"` (white text, dark overlay).
- Set `bgOverlayStrength` independently from `textMode` (controls opacity, not direction).
- For dark mode, add +6 px `backdropFilter: blur()` on the overlay to suppress bright image hot-spots.
- Wire `textMode` into `ArticleCardLayout` via `TEXT_PALETTE` record providing all per-mode color tokens.
- Dark mode shadow direction inverts: light text uses `0 2px 6px rgba(0,0,0,0.55)`, dark text uses `0 2px 8px rgba(255,255,255,0.45)`.
