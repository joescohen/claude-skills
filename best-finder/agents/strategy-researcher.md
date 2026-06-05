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
- Output path (PINNED, absolute — see SKILL.md → Output locations):
  `~/Engineering/projects/best-options-research/runs/<trip-id>/raw/strategy-<region>.md`.

## Task — synthesize expert + community wisdom into a regional strategy brief
1. **What the region is uniquely best at** — ranked world-class-here vs just-okay-here, so
   interests can be allocated to where they actually pay off. Ground every claim in a source.
   Distill this into the leg's **experiential monopoly**: the ONE thing only this region gives, its
   **feeling/verb** (the emotion + action — e.g. look · taste · feel · awe), and **what it is NOT
   for** (so the conductor can compute the "don't-duplicate" across legs). Also **propose the leg's
   place-archetype** (rural-wine · rural-other · city · coast/island · alpine · desert · urban-beach ·
   other) — the conductor needs it for Phase 1.5 value-instantiation (`references/preference-model.md`).
2. **Canonical way to structure a visit** — where to base, day-trip patterns, realistic pace,
   key logistics (drive times, when things close, seasonality traps). Include **how many days the
   region rewards** before diminishing returns, and the **realistic minimum** to capture its
   monopoly — the conductor needs this for the day-budget (strategy function E).
3. **"If you only do 3 things"** — the consensus high-value experiences.
4. **Common mistakes / regrets** — what experienced visitors warn against (over-packing the
   itinerary, the overrated must-see, the wrong base town).
5. **Candidate unstated criteria (Kano/VFT)** — dimensions the user did not list but likely
   cares about given the offering (e.g., "wine" → tasting vs scenery vs harvest vs romance),
   surfaced as proposals, not assumptions.

## Return (dense digest — the conductor turns it into the strategy menus)
- Ranked "uniquely-best-at" list with source URLs per claim.
- **Leg-identity line:** the single experiential monopoly + feeling/verb + what the region is NOT for + the proposed **place-archetype**.
- Visit-structure synthesis (base options, day-trip map, pace, logistics) with sources.
- **Day-reward:** how many days the region rewards + the minimum to capture its monopoly (for function E).
- "If you only do 3 things" + the overrated/avoid list.
- Proposed unstated criteria to put to the user.
- Self-graded source quality + gaps.
- Do NOT write persistent state — return the digest; the conductor presents and captures.
