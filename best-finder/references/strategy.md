# Destination-Strategy layer + the named-framework map

A venue choice is **downstream** of a regional strategy the user usually doesn't have. Build the
strategy FIRST, then discover venues for the refined, leg-allocated interests.

On multi-leg / MEDIUM+ trips this layer runs as the staged **Trip Architecture** protocol
(PAINT→ELICIT→LOCK) — present the per-leg possibility space, draw out the user's own arc, then lock a
canonical arc the rest of the trip anchors to. Recipe: `references/trip-architecture.md`. It scales
down to inline function-A on single-leg / low-stakes lookups. It is fed by **Phase 1.5 Value
Instantiation** (`references/preference-model.md`), which renders the user's durable L1 values into this
trip's criteria per place-archetype before the strategy is built.

## The four functions

**A. "How to do X" consensus.** For a region, synthesize expert + community wisdom: what it's
*uniquely best at* (ranked: world-class-here vs just-okay-here), the canonical way to structure a
visit (base, day-trip patterns, pace, logistics), the "if you only do 3 things," and common
mistakes/regrets. (This is a best-finder query at the *experience-category* level.)

**B. Preference ↔ Offering fit.** Score how strongly the region delivers each of the user's stated
interests (S/A/B/C), grounded in the synthesis — not assumed.

**C. Trip-level allocation (portfolio).** Across ALL legs, assign each interest to the leg that does
it best so the user **capitalizes** where a region excels and no leg is wasted on what another does
better. Apply a **variety penalty** (don't repeat an activity *type* across legs — hedonic
adaptation) and **Peak-End sequencing** (engineer one peak per leg; place the high-variance leg
before a reliably-great *final* leg; end strong — remembered quality ≈ peak + ending, not duration).

**D. Missing-criteria surfacing.** Proactively propose dimensions the user did NOT list but should,
given offerings + consensus + context. Techniques:
- **Value-Focused Thinking (Keeney) — WITI / wish-list:** ask "why is that important?" to climb to
  ends; over-generate objectives. ("You said wine — is it the tasting, the scenery, the harvest, the
  romance?")
- **Kano delighters:** present candidate surprise attributes and gauge reaction (things users never
  ask for but love — e.g., sunset aperitivo in the vines, a vintage Fiat 500 morning).
- **Constructive elicitation:** when a preference can't be explained by existing criteria, add a new
  criterion dimension.
- **Inference guard (means→end, load-bearing only):** the SAME "why is that important?" climb, fired
  defensively against the skill's OWN inferred filters — before benching an otherwise-strong option on
  an attribute the user never stated, surface the proxy-vs-value choice as a menu and rebuild from the
  value. It is the load-bearing case of **ladder-up-on-capture** (the durable value goes to L1); its
  sibling is the **don't-transplant guard** (don't copy a prior leg's shape onto a new archetype). Full
  procedures: `references/trip-architecture.md` + `references/preference-model.md`.

**E. Day-budget (portfolio over time).** Given the total trip days, propose a per-leg night split:
weight each leg by (its monopoly strength × the user's interest fit from B), respect realistic
minimums (a leg generally needs ≥2 nights to pay off; flag arrival/transit days), and sequence with
Peak-End (end on a reliably-great leg). Output "what fits" per leg. Re-flow when the user changes the
total or drags a day between legs; if the legs can't fit the days, surface the conflict ("4 legs in 6
days → no leg gets its monopoly; cut a leg or add days?") rather than under-allocating silently.
Formal model: the Tourist Trip Design Problem / Team Orienteering line in the framework map.

## Governing principle
**Stated preferences are INPUTS, not the full weight set.** Expand them with what the place is known
for + what others recommend, and *reallocate* across the trip. The difference between "rank options"
and "help me plan a great trip."

## The named-framework map (this skill assembles these)
- **Conversational / critique-based recommender (Pu & Chen)** — the show→react→refine loop;
  **compound critiquing** = YOU generate the multi-attribute critique menus, not the user.
- **Preference Construction (Slovic; Payne et al.)** — people build preferences by reacting to options
  → show-first, not questionnaire-first.
- **Value-Focused Thinking (Keeney) / Kano / Constructive Preference Elicitation** — surface
  unstated criteria (function D).
- **MCDA / MAUT (AHP, TOPSIS, weighted-sum)** — the fit + ranking math.
- **Tourist Trip Design Problem / Team Orienteering w/ time-windows + category constraints** — the
  formal model behind trip-level allocation (function C). Maximize value across legs under
  time budgets with "each leg covers what it's best at."
- **Peak-End rule (Kahneman) + variety-seeking / hedonic adaptation** — sequencing (function C).
- **Satisficing vs maximizing (Simon, Schwartz) + choice architecture (Thaler/Sunstein)** — the
  stakes gate + output framing (few good-enoughs + a default vs the full ranked field).
- **Recognition-Primed Decision (Klein)** — cold-start by offering a *prototype* to react to.
- **Regret-efficient elicitation (Boutilier) + Information Foraging (Pirolli)** — ask the one question
  that most cuts uncertainty; stop eliciting when marginal preference-signal drops, then recommend.

## Interaction
Present the strategy via option-menus. On multi-leg/MEDIUM+ trips this is the **Leg-Identity board**
(monopoly · feeling/verb · don't-duplicate · days · candidate experiences · view · Peak-End role — the
canonical product of functions A+C+E; see `references/trip-architecture.md`): let the user
accept/override the fit, the day-split, and the allocation, and adopt any surfaced missing-criteria
(incl. inference-guard resolutions) as new interests. THEN lock the arc and run discovery for the
refined interest set.
