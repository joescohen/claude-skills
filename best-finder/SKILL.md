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

State lives in `./best-finder-state/` (the conversation's working directory). In claude.ai this persists *within* a conversation/project but does NOT carry across separate chats — re-upload or paste your `USER-PROFILE.md` to resume. (In Claude Code this skill instead uses `~/.claude/best-finder/`.):
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

## The pipeline

```
STEP 0  Load state (profile + active trip)            ← always
PHASE 1 Scope + Stakes (option-menus)
PHASE 2 Destination Strategy   → references/strategy.md
PHASE 3 Discovery (convergence engine)  → references/methodology.md + agents/
PHASE 4 Data-Sufficiency Gate (confidence tiers)
PHASE 5 Painted-picture output + critique-refine loop  → references/output-style.md
(capture needs continuously across all phases)
```

### PHASE 1 — Scope + Stakes (always option-menus)
Use `AskUserQuestion` with 2–4 concrete labelled options + a recommended default + a
"you decide / other" escape. Establish (skipping anything already in state):
- **Category** (restaurant · stay · experience) or **trip-planning** mode.
- **Where + when** (location → loads the geography source map; dates → seasonality + booking urgency).
- **Per-trip "mode"** (blowout / strategic-splurge / value-aware / local-hidden-gem / specific-need).
- **⭐ Stakes gate:** "How much does nailing this matter?" Low → short-circuit to the de-biased
  top pick + one sanity check (don't over-engineer). Medium → standard run. High → full run +
  adversarial verification. (Satisficer vs maximizer: low/medium = satisfice, present 3–5; high = maximize.)
- **Cold-start tip (prototype-anchoring):** if the user is unsure, offer a *prototype* to react to
  ("a trip like X") rather than a blank preference form — people construct preferences by reacting.

### PHASE 2 — Destination Strategy (`references/strategy.md`)
Before hunting venues, build the strategy: (A) "how to do X" consensus, (B) preference↔offering
fit, (C) trip-level allocation across legs (capitalize where each excels; avoid redundancy/
variety-penalty; Peak-End sequencing), (D) surface missing criteria the user didn't list.
Present it; let the user adjust via menus. THEN discover venues for the refined, allocated interests.

### PHASE 3 — Discovery (`references/methodology.md`, `agents/`)
Dispatch one reader per **independent source type** in parallel (expert-curation, community,
calibrated-crowd, + local-language / YouTube where relevant). Each returns candidates + raw
signals + a self-reported richness. Use the **$0 data stack** in `references/data-sources.md`
(native WebSearch/WebFetch → Jina → Claude-in-Chrome for the rating histogram → Reddit `.json`,
YouTube). Reuse local hotel MCPs (trivago/DirectBooker) for stays.

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
- `scripts/score.py` — deterministic scoring (Bayesian shrinkage, within-platform percentile, convergence).
