# best-finder — inline pick-card photo gallery + lightbox

**Date:** 2026-06-03
**Status:** approved (design)
**Scope:** Add a per-pick photo gallery to the best-finder HTML deliverable, and test it by re-generating the Tuscany castle run.

## Problem

The best-finder HTML pick cards use a two-column grid (`.hsplit`): an experiential
story on the left and a "Calibrated signal" scorebox top-right. Because the story
column is taller, the right column has dead white space below the scorebox. The
skill's current Photos spec (output-style.md §11) is a bottom-of-page afterthought
with no working implementation (the produced HTML has zero `<img>` tags), and it
warns against hot-linking unverifiable images ("broken images cheapen it").

## Goal

Fill the right-rail white space with a compact, source-attributed photo gallery
per pick that expands into a shared, click-through lightbox — self-contained,
unbreakable, native to the page's editorial style.

## Design

### Placement
- Gallery renders in the right column of `.hsplit`, **below `.scorebox`**.
- On mobile (≤700px) the grid collapses to one column; the gallery stacks
  full-width below the scorebox. No layout break.

### Thumbnails (in-card gallery)
- Compact grid: one larger "hero" thumbnail on top, then a row of 2–3 smaller
  thumbnails (3–4 photos total per property).
- A "⤢ N photos" affordance signals expandability.
- Styling reuses existing tokens (`--line` borders, card shadow, rounded corners).

### Lightbox (expand + click through)
- **One shared** full-screen overlay reused by all galleries (single DOM node,
  single JS instance) — not one lightbox per card.
- Open at the clicked photo. Controls:
  - On-screen prev/next arrows
  - Keyboard ← / → to navigate, Esc to close
  - Click backdrop to close
  - Caption bar: **property name · "2 / 4" counter · source attribution**
    (e.g. "Official site" / "Booking" / "TripAdvisor")
- Vanilla JS at end of `<body>`, ~40 lines, **zero dependencies**.

### Photos — sourced & embedded
- Sourced via a Claude-in-Chrome screenshot pass per property (official gallery /
  Booking / TripAdvisor): best 3–4 (hero exterior, a room, pool/view, the food
  where it's a selling point).
- Each image **downscaled to ~1000px JPEG (~q75)** and **base64-embedded** as a
  data URI. One image serves both thumb and lightbox via CSS scaling.
- Self-contained, unbreakable; total weight target ~1.5–2 MB.
- Each photo carries a `source` label for the caption (provenance, consistent
  with the skill's ethos). **No hot-linking.**

### Data shape (in-HTML)
A JS object keyed by property id → array of `{src: <dataURI>, source: <label>, alt: <text>}`.
Thumbnails and the lightbox both read from it. Avoids duplicating base64 strings.

## Skill change (durable)
- Rewrite output-style.md §11: from a bottom-of-page "Photos" section to an
  **inline per-pick right-rail gallery + shared lightbox**, specifying:
  screenshot-sourced, base64-embedded (never hot-linked), 3–4 photos,
  source-attributed captions.
- Add the reusable CSS + JS lightbox snippet to a reference file
  (`references/gallery-lightbox.md`) so future runs reproduce it cheaply.

## Test deliverable
- Re-generate `best-options-research/runs/italy-2026/tuscany-castles-rerun.html`
  with galleries on all 3 pick cards (La Leccia, Vicchiomaggio, Gabbiano).
- Open it to verify the lightbox opens, navigates, and closes.
- Send to the user.

## Dependency / risk
- Requires the Claude-in-Chrome extension connected. If unavailable, pause and
  ask the user to connect it before the screenshot pass.
- Base64 weight: mitigated by downscale/compress before embed.

## Out of scope
- Galleries on set-aside castles or the scorecard table.
- Any change to the research/scoring pipeline.
