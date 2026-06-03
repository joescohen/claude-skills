---
name: best-finder
description: >
  Use when the user wants to find genuinely BEST options — restaurants, places to stay
  (hotels/Airbnb/villas), or experiences/activities — or to plan/optimize a trip, while
  defeating rating inflation on mainstream platforms (Yelp, Google, TripAdvisor, Booking).
  It guides with option-menus at every step, builds a destination strategy (how to "do" a
  place + what to capitalize on where across a multi-stop trip), paints experiential
  pictures of options weighed against what the user wants, and CONTINUOUSLY captures the
  user's needs to a persistent file. Trigger phrases: "find the best X", "where should we
  stay / eat", "how do we do [place]", "plan my trip to [place]", "is this place actually
  good / overrated", "best [restaurant/hotel/wine tour/activity] in [place]", "low-key /
  legit / hidden-gem spots", "what am I missing".
---

# best-finder

A guided tool that finds genuinely best travel options and helps plan trips — built on the
principle that **agreement across structurally independent sources** (expert/editorial +
niche-community + a de-biased crowd score) beats any single inflated rating. It is a
**conversational, critique-based recommender** (show options → user reacts → refine), with a
**destination-strategy** layer on top and a **continuous user-needs capture** underneath.

Grounded in named, proven methods — see `references/strategy.md` for the framework map
(Value-Focused Thinking, Kano, MCDA, Tourist Trip Design Problem / Team Orienteering,
Peak-End rule, satisficing, information foraging). This skill assembles them.

## Persistent state (READ FIRST, APPEND ALWAYS)

State lives at `~/.claude/best-finder/` and SURVIVES across sessions:
- `USER-PROFILE.md` — durable, cross-trip: who the user is, taste tendencies, decision style,
  recurring constraints, interaction preferences.
- `trips/<trip-id>.md` — the living needs doc for an active trip: context, interests,
  per-category needs + current picks, open decisions, and a dated **Change Log**.

**Continuous-needs-capture protocol (NON-NEGOTIABLE):**
1. **On every run, STEP 0:** read `USER-PROFILE.md` and the active trip file. Never ask for
   what's already recorded. If no profile exists, create one from a short intake.
2. **Throughout the session:** whenever the user states a preference, constraint, like/dislike,
   reaction to an option, or makes a decision — **append it immediately** to the active trip
   file (and promote cross-trip patterns to `USER-PROFILE.md`), with a dated Change Log entry
   and the source ("user said…"). Do this WITHOUT being asked.
3. **At session end:** summarize what was captured/changed.
4. Treat stated preferences as **inputs, not the full weight set** — expand them with what the
   place offers and what experts recommend (see strategy layer), and reallocate across the trip.

## Output locations (PINNED — two buckets, never scatter)
Every file this skill writes goes to exactly one of two fixed locations. Use ABSOLUTE paths — NEVER a
cwd-relative `runs/...` (relative paths scatter output by whatever directory the run happened to start in,
which is the bug this rule exists to prevent). `<trip-id>` matches the state trip file (e.g. `italy-2026`,
`charleston-2026`).
- **State (read at STEP 0, written continuously):** `~/.claude/best-finder/` — `USER-PROFILE.md` +
  `trips/<trip-id>.md` ONLY. No HTML, no raw research here.
- **Deliverables + raw research (the pinned deliverable base):**
  `~/Engineering/projects/best-options-research/runs/<trip-id>/`
  - HTML full-picture page → `…/<trip-id>/<query>.html`
  - every raw reader / strategy / verifier file → `…/<trip-id>/raw/<type>-<query>.md`
  This base is the single source of truth for the path; the agent prompts and output-style.md reference it.

## The pipeline

```
STEP 0    Load state (profile + active trip)            ← always
PHASE 1   Scope + Stakes (option-menus)
PHASE 2   Destination Strategy   → references/strategy.md + agents/strategy-researcher.md
PHASE 3   Discovery (convergence engine)  → references/methodology.md + agents/
PHASE 3.5 Verification gate (verify reader claims vs ground truth)  → references/methodology.md
PHASE 4   Data-Sufficiency Gate (confidence tiers)
PHASE 5   Painted-picture output + critique-refine loop  → references/output-style.md
(capture needs continuously across all phases; conductor is the sole state-writer)
```

### PHASE 1 — Scope + Stakes (always option-menus)
Use `AskUserQuestion` with 2–4 concrete labelled options + a recommended default + a
"you decide / other" escape. Establish (skipping anything already in state):
- **Category** (restaurant · stay · experience) or **trip-planning** mode.
- **Where + when** (location → loads the geography source map; dates → seasonality + booking urgency).
- **Per-trip "mode"** (blowout / strategic-splurge / value-aware / local-hidden-gem / specific-need).
- **⭐ Stakes gate:** "How much does nailing this matter?" Stakes scales DEPTH (fan-out per
  source type) and adversarial verification — NEVER which independent source TYPES are
  consulted (that is a fixed floor; see Phase 3). Low → shallow fan-out, de-biased top pick +
  one sanity check (don't over-engineer). Medium → standard depth. High → maximal fan-out +
  adversarial verifier. (Satisficer vs maximizer: low/medium = satisfice, present 3–5; high = maximize.)
  **Escalation rule:** if the choice is costly/hard-to-redo, or the user signals they want a
  definitive / deeply-informed answer, set HIGH — when in doubt, escalate; under-scaling depth
  is the more expensive error.
- **Cold-start tip (prototype-anchoring):** if the user is unsure, offer a *prototype* to react to
  ("a trip like X") rather than a blank preference form — people construct preferences by reacting.

### PHASE 2 — Destination Strategy (`references/strategy.md`)
Before hunting venues, build the strategy: (A) "how to do X" consensus, (B) preference↔offering
fit, (C) trip-level allocation across legs (capitalize where each excels; avoid redundancy/
variety-penalty; Peak-End sequencing), (D) surface missing criteria the user didn't list.
On MEDIUM/HIGH-stakes multi-interest or multi-leg trips, dispatch `agents/strategy-researcher.md`
(one per region) to ground function (A) in real consensus before you present; on low-stakes
single lookups, do (A) inline. Present it; let the user adjust via menus. THEN discover venues
for the refined, allocated interests.

### PHASE 3 — Discovery (`references/methodology.md`, `agents/`)
**Coverage floor (every run, regardless of stakes):** dispatch one reader for EACH independent
source type — expert/editorial, community (incl. Reddit via Apify), calibrated-crowd (incl. the
Chrome rating-distribution histogram + the geography-correct crowd aggregator), and local-language
for any non-English destination. Breadth is not escalation-gated; the small Apify cost is an
accepted default. Skip a type only on explicit user opt-out, and then surface the skip in the
sourcing-gaps panel — never defer a type silently.

**Required-source terminal states (no third option).** A required source type may end a run in exactly
two states: (a) **data retrieved**, or (b) **recovery attempted and the specific block described** (what
you ran, the exact tool/error that stopped it). A **technical failure is NOT an opt-out skip** — a 403, a
dead endpoint, or an empty seed search obligates you to run the documented recovery (for Reddit: the Apify
comment actor, self-seeded via subreddit-restricted search URLs — see `references/data-sources.md`) BEFORE
producing output. Shipping a "here's the fix I didn't run" note (e.g. "Reddit blocked — fix: the Apify
actor ~$0.30") **as a deliverable is disallowed**: if you can name the recovery, you must execute it, not
describe it. The conductor (not a dispatched reader) owns Reddit retrieval, because the `apify` MCP tools
are connected to the conductor session — a delegated reader without MCP access cannot satisfy this floor.

**Stakes scales DEPTH and adversarial verification, not breadth** (size the fan-out off the Phase 1
stakes gate):

| Stakes | Fan-out depth (per type) | Adversarial verification (verifier.md) |
|---|---|---|
| Low    | shallow — 1 pass per type, top candidates only | gate only |
| Medium | standard — multiple candidates/threads/platforms per type | gate only |
| High   | maximal — exhaustive threads/platforms + `agents/strategy-researcher.md` per region | gate + `agents/verifier.md` per finalist |

The Phase 3.5 verification gate runs on EVERY run at every stakes level (relaying ≠ verifying).

Dispatch one reader per **independent source type** (see `agents/source-readers.md`). Each
returns candidates + raw signals + a self-reported richness, and writes a raw file. Use the
**$0 data stack** in `references/data-sources.md` (native WebSearch/WebFetch → Jina →
Claude-in-Chrome for the rating histogram → Apify for Reddit + rating distributions →
YouTube). Reuse local hotel MCPs (trivago/DirectBooker) for stays.

**Runtime:** in Claude Code, dispatch readers/verifier in parallel via the Agent tool; in
claude.ai (no subagents), run the same reader/verifier prompts inline and sequentially. The
verification gate and stakes-scaling are identical in both.

### PHASE 3.5 — Verification gate (`references/methodology.md`)
Between reader-return and scoring, the conductor verifies reader claims against ground truth
— **on every run, not just high-stakes** (relaying ≠ verifying):
- every load-bearing URL resolves (no 404 / redirect-to-home);
- each candidate's scores trace to a real, cited listing;
- `[VERIFIED]` is allowed only when ≥2 **genuinely independent** source TYPES are present
  (two mirrors of one crowd don't count);
- citation sanity-check — a mismatched/again-wrong URL demotes the claim to unverified.
Failed claims are **demoted, not silently dropped** — surface them in the sourcing-gaps panel.
Only verified inputs flow into the Phase 4 data-sufficiency scoring.

### PHASE 4 — Data-Sufficiency Gate (`references/methodology.md`)
Score independence × depth × recency × convergence × distribution-obtained → HIGH / MEDIUM / LOW
confidence. **LOW → do not fake a "best"**; say what's thin and offer to dig (Chrome/Reddit).

### PHASE 5 — Output + refine (`references/output-style.md`)
Paint the **experiential picture** of each option (vibe + day-to-day reality incl. food/logistics
+ fit weighed against the user's wants), with **provenance tags** and an honest **confidence tier**.
Then run the **critique loop**: the user reacts ("more like this but cheaper / more local"), and
you refine (compound critiquing — YOU generate the multi-attribute critique options as menus).
Capture every reaction to state.

## Hard rules
- Option-menus at every decision point. Never a blank "what do you want?"
- Independent-source convergence over any single score. Read distribution where obtainable.
- **Verify before synthesize.** Validate reader claims (URLs resolve, scores trace, ≥2 truly
  independent types) at the Phase 3.5 gate before painting or tagging `[VERIFIED]`.
- **Single-writer state.** Only the conductor writes `USER-PROFILE.md` / trip files; subagents
  return data, never write state.
- Geography-correct sources (e.g., Italy → Gambero Rosso / Osterie d'Italia / Italian-language;
  NOT Yelp). The "local-language = locals" heuristic INVERTS in some markets (China→Dianping,
  Korea→Naver) — see `references/data-sources.md`.
- Honest confidence; surface contested picks, don't hide them.
- ToS-safe: logged-out, ephemeral, rate-limited; no stored review DB (only the user's own needs/profile).
- Capture needs continuously to persistent state.

## References (load as needed)
- `references/methodology.md` — convergence engine, anti-inflation scoring, data-sufficiency gate.
- `references/strategy.md` — destination-strategy layer + the named-framework map.
- `references/data-sources.md` — the $0 data stack, source maps, ToS posture.
- `references/output-style.md` — painted-picture format + provenance + critique loop.
- `agents/source-readers.md` — the parallel reader agent prompts.
- `agents/strategy-researcher.md` — Phase-2A "how to do X" regional-consensus researcher.
- `agents/verifier.md` — blind adversarial verifier (high-stakes finalist stress-test).
- `scripts/score.py` — deterministic scoring (Bayesian shrinkage, within-platform percentile, convergence).
