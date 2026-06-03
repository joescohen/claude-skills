# Destination-strategy researcher (Phase 2A — "how to do X" consensus)

Dispatched by the conductor during Phase 2 (Destination Strategy), before venue discovery,
to research how to "do" a region so the strategy is grounded in consensus rather than
assumed. Keeps its raw reading out of the conductor's context — it returns a structured
digest only. Use `compound-engineering:ce-web-researcher`. Dispatch on MEDIUM/HIGH-stakes
multi-interest or multi-leg trips; skip for a single low-stakes venue lookup.

## Input the conductor injects
- Region(s) + dates/seasonality, the party + mode + budget (from the needs file), and the
  user's stated interests so far.
- The geography-correct source list (references/data-sources.md).
- Output path: `runs/<trip>/raw/strategy-<region>.md`.

## Task — synthesize expert + community wisdom into a regional strategy brief
1. **What the region is uniquely best at** — ranked world-class-here vs just-okay-here, so
   interests can be allocated to where they actually pay off. Ground every claim in a source.
2. **Canonical way to structure a visit** — where to base, day-trip patterns, realistic pace,
   key logistics (drive times, when things close, seasonality traps).
3. **"If you only do 3 things"** — the consensus high-value experiences.
4. **Common mistakes / regrets** — what experienced visitors warn against (over-packing the
   itinerary, the overrated must-see, the wrong base town).
5. **Candidate unstated criteria (Kano/VFT)** — dimensions the user did not list but likely
   cares about given the offering (e.g., "wine" → tasting vs scenery vs harvest vs romance),
   surfaced as proposals, not assumptions.

## Return (dense digest — the conductor turns it into the strategy menus)
- Ranked "uniquely-best-at" list with source URLs per claim.
- Visit-structure synthesis (base options, day-trip map, pace, logistics) with sources.
- "If you only do 3 things" + the overrated/avoid list.
- Proposed unstated criteria to put to the user.
- Self-graded source quality + gaps.
- Do NOT write persistent state — return the digest; the conductor presents and captures.
