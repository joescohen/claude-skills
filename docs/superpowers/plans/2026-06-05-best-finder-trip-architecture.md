# best-finder Trip Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade best-finder's Phase 2 into a guaranteed staged **Trip Architecture** protocol (PAINT→ELICIT→LOCK) that always produces a per-leg "monopoly" identity board, budgets days per leg, draws out the user's own arc via a load-bearing inference guard, and locks a canonical arc the rest of the trip anchors to — rendered as both a state section and an on-demand visual board.

**Architecture:** All edits target the canonical source at `claude-skills/best-finder/`. This is a skill-content (Markdown prose) change — **there is no unit-test suite.** "Tests" here are concrete verification commands with expected output (`grep -c` on the exact phrases each edit introduces, file-existence checks, cross-reference resolution) plus a final **manual behavioral-acceptance checklist** for the spec's §9 criteria that a grep cannot prove. Work proceeds dependency-first: create the new `references/trip-architecture.md` recipe (Task 1), extend the supporting references + agent (Tasks 2–3), wire it into `SKILL.md` (Task 4), cross-link `output-style.md` (Task 5), then verify (Task 6). `scripts/` is untouched.

**Tech Stack:** Markdown skill files, `git`, shell, `grep`.

**Spec:** `docs/superpowers/specs/2026-06-05-best-finder-trip-architecture-design.md`

**Working branch (RESOLVE BEFORE EXECUTING — see Task 0):** the current branch `feat/best-finder-pinned-paths-required-reddit` has **unrelated uncommitted WIP** (modified `best-finder/SKILL.md`, references, and untracked `gallery-*` files). Trip Architecture also edits `SKILL.md`, so that WIP **must** be committed or stashed first, then this work lands on a fresh `feat/best-finder-trip-architecture` branch. The spec + this plan are currently **untracked**, so they survive a branch switch.

**Key paths:**
- Canonical source: `/home/joescohen/Engineering/projects/claude-skills/best-finder/`
- Files modified: `best-finder/SKILL.md`, `best-finder/references/strategy.md`, `best-finder/references/output-style.md`, `best-finder/agents/strategy-researcher.md`
- File created: `best-finder/references/trip-architecture.md`
- Untouched: `best-finder/scripts/`, `best-finder/references/methodology.md`, `best-finder/references/data-sources.md`, `best-finder/references/gallery-lightbox.md`, `best-finder/agents/source-readers.md`, `best-finder/agents/verifier.md`

---

## Task 0: Branch + land spec & plan (OUTWARD — confirm WIP handling first)

> ⚠️ The current branch holds unrelated gallery/pinned-path WIP that also touches `SKILL.md`. **Pause and confirm with the user how to handle it before Step 1.** Do not discard it.

**Files:** none in-repo (git branch + commit of the already-written spec & plan).

- [ ] **Step 1: Confirm pre-state and WIP disposition with the user**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
git branch --show-current
git status --short
```
Expected: branch `feat/best-finder-pinned-paths-required-reddit`; status shows modified `best-finder/SKILL.md`, `best-finder/references/*.md`, `best-finder/agents/source-readers.md`, untracked `best-finder/references/gallery-lightbox.md`, `best-finder/scripts/gallery_*.py`, plus the untracked spec + this plan under `docs/superpowers/`.
**Get the user's choice — recommend (a):**
(a) **Commit the gallery WIP first** (then branch Trip Architecture off it). RECOMMENDED — this plan's
    `Old:` blocks for `SKILL.md` (Task 4) and `output-style.md` (Task 5) were authored against the
    current working tree, which INCLUDES that WIP; committing preserves the baseline so the edits match.
(b) `git stash -u` it. Valid, but `SKILL.md` + `output-style.md` revert to committed state, so a
    Task 4/5 `Old:` block may not match byte-for-byte — if an Edit fails, re-read the section and apply
    the same New content at the right anchor (match on intent). `strategy.md` + `strategy-researcher.md`
    (Tasks 2–3) are NOT in the WIP, so those are stable either way.
Either way the gallery WIP must leave the working tree before editing `SKILL.md` / `output-style.md`.

- [ ] **Step 2: Create the Trip Architecture branch (after WIP is committed/stashed)**

Run:
```bash
git checkout -b feat/best-finder-trip-architecture
git status --short
```
Expected: now on `feat/best-finder-trip-architecture`; the only changes present are the untracked spec + plan (the gallery WIP is gone from the tree). If any `best-finder/` file still shows as modified, STOP — the WIP was not cleared.

- [ ] **Step 3: Commit the spec and the plan**

Run:
```bash
git add docs/superpowers/specs/2026-06-05-best-finder-trip-architecture-design.md \
        docs/superpowers/plans/2026-06-05-best-finder-trip-architecture.md
git commit -m "docs(best-finder): Trip Architecture design spec + implementation plan

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 1: Create the Trip Architecture recipe (`references/trip-architecture.md`)

The new self-contained reference: the 3-beat protocol, the inference guard, the Leg-Identity board, the canonical state schema, and the visual arc-board template. Everything else references this file, so it lands first.

**Files:**
- Create: `best-finder/references/trip-architecture.md`

- [ ] **Step 1: Create the file**

Create `best-finder/references/trip-architecture.md` with exactly (note: the `{{...}}` in the HTML are intentional runtime template slots, not plan placeholders):

````markdown
# Trip Architecture — the staged educate→elicit→lock layer (Phase 2)

A multi-leg trip's venue choices are downstream of a question the user usually can't answer cold:
**"what is each leg FOR?"** Trip Architecture makes that explicit and repeatable. It runs as Phase 2
on **multi-leg AND MEDIUM/HIGH-stakes** trips (the same gate that dispatches
`agents/strategy-researcher.md`), and **scales down to nothing** on single-leg / low-stakes lookups —
do function A inline, skip the board and the beats. It orchestrates the existing strategy functions
(A/B/C/D in `strategy.md`) into three beats and adds the day-budget (function E) and a persistent arc.

The **inference guard** (below) is the one part that is always live, because it costs nothing until it
fires.

## Beat 1 — PAINT (show the possibility space; don't ask)
After the strategy-researcher returns (one per region), present the WHOLE arc at once — every leg side
by side — as the **Leg-Identity board**. This is the user's "environment to play in," shown so they
**construct preferences by reacting** (not a blank questionnaire). Fill every column for each leg:

| Column | What it holds |
|---|---|
| **Leg (dates)** | the place + its nights window |
| **Monopoly** | the ONE thing only this leg gives — what no other leg can (one phrase) |
| **Feeling / verb** | its experiential mode — the emotion + the action (look · taste · feel · awe) |
| **Don't-duplicate** | the job NOT to repeat on another leg (the variety-penalty, made explicit) |
| **Days** | recommended nights (function E), shown as a split of the total |
| **Candidate experiences** | 3–4 reactable seeds that EXPRESS the monopoly (not full discovery) |
| **View / key criterion** | the durable hard-criteria, surfaced not buried (e.g. "beautiful view") |
| **Peak-End role** | opener · high-variance-early · reliably-great finale (function C sequencing) |

Render it as the **visual arc-board** (below) on multi-leg/MEDIUM+; an inline Markdown table is fine on
the smallest runs. Candidate experiences are *seeds to react to*, deliberately shallow — real
discovery is Phase 3, AFTER the arc locks.

## Beat 2 — ELICIT (draw out the user's own story)
Invite the user to react and tell their version of the arc. Two mechanisms, both as menus you generate
(never "so what do you want?"):

1. **Arc-level critique menus** (the compound-critiquing loop from `output-style.md`, applied to the
   whole arc): "trade a day from Rome to the countryside?", "which leg should be the romance peak?",
   "is this leg's candidate set the right *kind* of thing, or too touristy?"
2. **The inference guard** (the heart of "draw out my story") — see the dedicated section.

Loop Beat 2 until the user settles. Capture every reaction to the trip file as you go (continuous
capture; the conductor is the sole writer).

## Beat 3 — LOCK (write the arc, re-render)
When the arc settles:
- Write/replace the canonical `## Trip Architecture` section in `trips/<id>.md` (schema below).
- Re-render the visual arc-board deliverable.
- From here on, **every per-leg query re-anchors to this section** (read at STEP 0): open each per-leg
  answer with "this leg's job is X — here's how this pick leverages (or fights) it," and apply any
  guard-resolved criteria as standing filters for that leg.

---

## The inference guard (means→end; LOAD-BEARING ONLY)
The recurring failure this prevents: the skill infers a constraint the user never stated (often
generalized from ONE loved example), then silently benches strong options on it — forcing the user to
discover and correct it a round later. Instead: when about to filter on an *unstated* attribute,
**climb from the means (the proxy) to the end (the real value)** and surface it as a reactable menu
BEFORE filtering. (This operationalizes Value-Focused Thinking — means-objectives vs fundamental-
objectives — already in `strategy.md` function D.)

**Fires only when BOTH hold (load-bearing only — do NOT over-probe):**
1. the attribute is the conductor's *inference*, not user-stated and not already in `USER-PROFILE.md` /
   the trip file (check state first — never re-ask what's recorded); AND
2. acting on it would *exclude an otherwise-strong option* (one that would survive on
   convergence/fit). If the inference excludes nothing strong, just proceed.

**Procedure when it fires:**
1. **Name the inference.** "You loved Marinello; I was about to treat *'tiny family farm'* as a
   requirement — but you never said that."
2. **Climb means→end.** Offer the proxy vs the fundamental value(s) it might stand for, as a menu:
   *"I read 'tiny' two ways: [A] the smallness itself, or [B] a community that runs activities + a
   view. Which is the real thing?"*
3. **Show the peek.** Name the strong options reading [B] would unlock (the ones [A] benched), so the
   choice is concrete.
4. **Capture.** Record the resolved criterion to the `## Trip Architecture` "Drawn-out criteria" list
   (and promote to `USER-PROFILE.md` if it is cross-trip taste, not just this trip).

**The class (same move every time — a stated proxy hiding a deeper value):**
- "view *from the room*" → the end is *a view-with-wine moment* (the stay needn't provide it).
- "great *train system*" → the end is *low-hassle access* (the trains may solve the wrong problem).
- "*no car*" → is the end *no driving*, or *no hassle*? (surface the fork, don't bury it).

It runs in Phase 2 AND later discovery (Phase 3/5) — a filter discipline, not a phase.

---

## Canonical `## Trip Architecture` state schema
Written by the conductor into `trips/<id>.md` at LOCK (single-writer; dated, alongside the Change Log):

```markdown
## Trip Architecture
_Locked <date> · total <N> days_

| Leg (dates) | Monopoly (only here) | Feeling/Verb | Don't-duplicate | Days | Candidate experiences | View/key-criterion | Peak-End role |
|---|---|---|---|---|---|---|---|
| … | … | … | … | … | … | … | … |

**Day-split:** <leg A N nights · leg B N nights · …>  (arrival/transit days noted)

**Drawn-out criteria (means→end resolutions):**
- <e.g. "rural-leg archetype = community-that-runs-activities + a view — NOT smallness" (guard, <date>)>

**My story (user's words):** <short narrative the user fed back>
```

Downstream per-leg discovery reads this at STEP 0 and re-anchors to the relevant row + the drawn-out
criteria.

---

## The visual arc-board (HTML deliverable)
A self-contained, browser-openable page showing the arc left→right — one panel per leg — so the user
takes in "what each leg is for" at a glance and remixes it. **Distinct from the per-pick gallery page**
(`output-style.md` → the full-picture HTML): the arc-board answers **"what is each leg for,"** the
pick-card page answers **"which specific option."** Render at PAINT and re-render at LOCK. Save to the
PINNED deliverable base — `~/Engineering/projects/best-options-research/runs/<trip-id>/<trip-id>-arc.html`
(absolute; see SKILL.md → Output locations) — and send via `SendUserFile`. Omit it (inline Markdown
instead) on single-leg / low-stakes runs.

Skeleton (region-appropriate palette; inline CSS, no external deps):

```html
<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{{Trip}} — Trip Architecture</title>
<style>
:root{--ink:#23201b;--paper:#faf7f1;--line:#e4ddcf;--accent:#7a5c3e;--peak:#b6452f}
*{box-sizing:border-box}body{margin:0;font:16px/1.5 Georgia,serif;color:var(--ink);background:var(--paper)}
.wrap{max-width:1200px;margin:0 auto;padding:24px}
.top{display:flex;flex-wrap:wrap;gap:8px;align-items:baseline;border-bottom:2px solid var(--line);padding-bottom:12px;margin-bottom:18px}
.top h1{font-size:22px;margin:0}.top .split{color:var(--accent);font-size:14px}
.arc{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}
.leg{border:1px solid var(--line);border-radius:10px;padding:14px;background:#fff;position:relative}
.leg .dates{font-size:12px;color:#8a8170;text-transform:uppercase;letter-spacing:.04em}
.leg h2{font-size:18px;margin:4px 0 2px}
.leg .verb{display:inline-block;font-size:12px;color:#fff;background:var(--accent);border-radius:999px;padding:2px 9px;margin:4px 0}
.leg .mono{font-style:italic;color:var(--accent);margin:6px 0}
.leg .days{font-weight:bold}
.leg ul{margin:8px 0 0;padding-left:18px;font-size:14px}
.leg .view{font-size:13px;color:#5a6b3a;margin-top:8px}
.leg.peak{border-color:var(--peak);box-shadow:0 0 0 1px var(--peak) inset}
.leg .peakbadge{position:absolute;top:10px;right:10px;font-size:11px;color:var(--peak)}
.dd{font-size:12px;color:#8a8170;margin-top:8px;border-top:1px dashed var(--line);padding-top:6px}
</style></head><body><div class="wrap">
<div class="top"><h1>{{Trip}} — what each leg is for</h1><span class="split">{{N}} days · {{split}}</span></div>
<div class="arc">
  <!-- one .leg per leg; add class="peak" + a .peakbadge on the finale -->
  <div class="leg">
    <div class="dates">{{leg dates}}</div>
    <h2>{{Leg name}}</h2>
    <span class="verb">{{feeling/verb}}</span>
    <div class="mono">Only here: {{monopoly}}</div>
    <div class="days">{{N}} nights</div>
    <ul><li>{{candidate 1}}</li><li>{{candidate 2}}</li><li>{{candidate 3}}</li></ul>
    <div class="view">◭ {{view / key criterion}}</div>
    <div class="dd">Don't duplicate: {{the job not to repeat elsewhere}}</div>
  </div>
</div></div></body></html>
```

Keep it light (a few KB). On mobile the grid collapses to one column.

---

## Edge cases
- **The protocol is offered, not forced.** If the user just wants one pick ("just find me a hotel"),
  drop to inline discovery — the 3 beats are for trip-shaping, not every lookup.
- **Two legs claim the same monopoly** (e.g. two wine regions): function C assigns it to the leg that
  does it best and gives the other a distinct job, or you flag the redundancy (variety penalty); the
  don't-duplicate column makes the clash visible.
- **A pre-committed leg** (already booked): its nights are fixed — function E flows the remaining days
  around it; mark it locked on the board.
- **claude.ai (no subagents):** run the strategy-researcher prompt inline/sequentially; the beats,
  guard, and board are runtime-agnostic.
- **Single-writer:** subagents return the leg-identity framing + pace data; only the conductor writes
  the `## Trip Architecture` section.
````

- [ ] **Step 2: Verify the file exists and carries every load-bearing element**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
test -f best-finder/references/trip-architecture.md && head -1 best-finder/references/trip-architecture.md
grep -c "## Beat 1 — PAINT" best-finder/references/trip-architecture.md
grep -c "## Beat 2 — ELICIT" best-finder/references/trip-architecture.md
grep -c "## Beat 3 — LOCK" best-finder/references/trip-architecture.md
grep -c "LOAD-BEARING ONLY" best-finder/references/trip-architecture.md
grep -c "Fires only when BOTH hold" best-finder/references/trip-architecture.md
grep -c "## Canonical" best-finder/references/trip-architecture.md
grep -c "trip-id>-arc.html" best-finder/references/trip-architecture.md
grep -c "## Edge cases" best-finder/references/trip-architecture.md
```
Expected: the title line `# Trip Architecture — the staged educate→elicit→lock layer (Phase 2)` prints; then `1` for each of the eight `grep -c` commands (each pattern is a unique heading/marker). If any is `0`, the file content is incomplete — re-apply Step 1.

- [ ] **Step 3: Commit**

```bash
git add best-finder/references/trip-architecture.md
git commit -m "feat(best-finder): add Trip Architecture recipe (3-beat protocol + inference guard + arc-board)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Extend `references/strategy.md` (function E, inference guard, leg-identity, 3-beat note)

Four surgical edits: a pointer to the staged protocol in the intro, the inference-guard bullet + new function E under D, and the Interaction section upgraded to A–E + the Leg-Identity board.

**Files:**
- Modify: `best-finder/references/strategy.md`

- [ ] **Step 1: Add the staged-protocol pointer to the intro**

Old:
```
A venue choice is **downstream** of a regional strategy the user usually doesn't have. Build the
strategy FIRST, then discover venues for the refined, leg-allocated interests.
```
New:
```
A venue choice is **downstream** of a regional strategy the user usually doesn't have. Build the
strategy FIRST, then discover venues for the refined, leg-allocated interests.

On multi-leg / MEDIUM+ trips this layer runs as the staged **Trip Architecture** protocol
(PAINT→ELICIT→LOCK) — present the per-leg possibility space, draw out the user's own arc, then lock a
canonical arc the rest of the trip anchors to. Recipe: `references/trip-architecture.md`. It scales
down to inline function-A on single-leg / low-stakes lookups.
```

- [ ] **Step 2: Add the inference-guard bullet to function D and the new function E**

Old:
```
- **Constructive elicitation:** when a preference can't be explained by existing criteria, add a new
  criterion dimension.
```
New:
```
- **Constructive elicitation:** when a preference can't be explained by existing criteria, add a new
  criterion dimension.
- **Inference guard (means→end, load-bearing only):** the SAME "why is that important?" climb, fired
  defensively against the skill's OWN inferred filters — before benching an otherwise-strong option on
  an attribute the user never stated, surface the proxy-vs-value choice as a menu and rebuild from the
  value. Full procedure + trigger: `references/trip-architecture.md`.

**E. Day-budget (portfolio over time).** Given the total trip days, propose a per-leg night split:
weight each leg by (its monopoly strength × the user's interest fit from B), respect realistic
minimums (a leg generally needs ≥2 nights to pay off; flag arrival/transit days), and sequence with
Peak-End (end on a reliably-great leg). Output "what fits" per leg. Re-flow when the user changes the
total or drags a day between legs; if the legs can't fit the days, surface the conflict ("4 legs in 6
days → no leg gets its monopoly; cut a leg or add days?") rather than under-allocating silently.
Formal model: the Tourist Trip Design Problem / Team Orienteering line in the framework map.
```

- [ ] **Step 3: Upgrade the Interaction section to A–E + the Leg-Identity board**

Old:
```
## Interaction
Present the strategy (A–D) via option-menus; let the user accept/override the fit and allocation, and
adopt any surfaced missing-criteria as new interests. THEN run discovery for the refined interest set.
```
New:
```
## Interaction
Present the strategy via option-menus. On multi-leg/MEDIUM+ trips this is the **Leg-Identity board**
(monopoly · feeling/verb · don't-duplicate · days · candidate experiences · view · Peak-End role — the
canonical product of functions A+C+E; see `references/trip-architecture.md`): let the user
accept/override the fit, the day-split, and the allocation, and adopt any surfaced missing-criteria
(incl. inference-guard resolutions) as new interests. THEN lock the arc and run discovery for the
refined interest set.
```

- [ ] **Step 4: Verify all four edits landed**

Run:
```bash
grep -c "staged \*\*Trip Architecture\*\* protocol" best-finder/references/strategy.md
grep -c "Inference guard (means→end, load-bearing only)" best-finder/references/strategy.md
grep -c "E. Day-budget (portfolio over time)" best-finder/references/strategy.md
grep -c "Leg-Identity board" best-finder/references/strategy.md
```
Expected: each prints `1`. If any is `0`, that edit was missed — re-apply it.

- [ ] **Step 5: Commit**

```bash
git add best-finder/references/strategy.md
git commit -m "feat(best-finder): strategy.md — add day-budget (E), inference guard, leg-identity board

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Extend `agents/strategy-researcher.md` (return leg-identity framing + day-reward data)

Feed the two new strategy pieces: the leg's experiential monopoly framing and the pace/day-reward data function E needs.

**Files:**
- Modify: `best-finder/agents/strategy-researcher.md`

- [ ] **Step 1: Extend task item 1 with the experiential-monopoly framing**

Old:
```
1. **What the region is uniquely best at** — ranked world-class-here vs just-okay-here, so
   interests can be allocated to where they actually pay off. Ground every claim in a source.
```
New:
```
1. **What the region is uniquely best at** — ranked world-class-here vs just-okay-here, so
   interests can be allocated to where they actually pay off. Ground every claim in a source.
   Distill this into the leg's **experiential monopoly**: the ONE thing only this region gives, its
   **feeling/verb** (the emotion + action — e.g. look · taste · feel · awe), and **what it is NOT
   for** (so the conductor can compute the "don't-duplicate" across legs).
```

- [ ] **Step 2: Extend task item 2 with day-reward pace data**

Old:
```
2. **Canonical way to structure a visit** — where to base, day-trip patterns, realistic pace,
   key logistics (drive times, when things close, seasonality traps).
```
New:
```
2. **Canonical way to structure a visit** — where to base, day-trip patterns, realistic pace,
   key logistics (drive times, when things close, seasonality traps). Include **how many days the
   region rewards** before diminishing returns, and the **realistic minimum** to capture its
   monopoly — the conductor needs this for the day-budget (strategy function E).
```

- [ ] **Step 3: Add the two new Return bullets**

Old:
```
## Return (dense digest — the conductor turns it into the strategy menus)
- Ranked "uniquely-best-at" list with source URLs per claim.
- Visit-structure synthesis (base options, day-trip map, pace, logistics) with sources.
- "If you only do 3 things" + the overrated/avoid list.
- Proposed unstated criteria to put to the user.
- Self-graded source quality + gaps.
- Do NOT write persistent state — return the digest; the conductor presents and captures.
```
New:
```
## Return (dense digest — the conductor turns it into the strategy menus)
- Ranked "uniquely-best-at" list with source URLs per claim.
- **Leg-identity line:** the single experiential monopoly + feeling/verb + what the region is NOT for.
- Visit-structure synthesis (base options, day-trip map, pace, logistics) with sources.
- **Day-reward:** how many days the region rewards + the minimum to capture its monopoly (for function E).
- "If you only do 3 things" + the overrated/avoid list.
- Proposed unstated criteria to put to the user.
- Self-graded source quality + gaps.
- Do NOT write persistent state — return the digest; the conductor presents and captures.
```

- [ ] **Step 4: Verify**

Run:
```bash
grep -c "experiential monopoly" best-finder/agents/strategy-researcher.md
grep -c "how many days the" best-finder/agents/strategy-researcher.md
grep -c "Leg-identity line:" best-finder/agents/strategy-researcher.md
grep -c "Day-reward:" best-finder/agents/strategy-researcher.md
```
Expected: each prints `1`.

- [ ] **Step 5: Commit**

```bash
git add best-finder/agents/strategy-researcher.md
git commit -m "feat(best-finder): strategy-researcher returns leg-identity + day-reward data

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Wire Trip Architecture into `SKILL.md`

Five edits: the pipeline Phase-2 line, the Phase 2 section (rewrite to the 3-beat protocol + function E), the Output-locations arc-board path, two new Hard rules, and the References list.

**Files:**
- Modify: `best-finder/SKILL.md`

- [ ] **Step 1: Update the pipeline Phase-2 line**

Old:
```
PHASE 2   Destination Strategy   → references/strategy.md + agents/strategy-researcher.md
```
New:
```
PHASE 2   Destination Strategy → Trip Architecture (PAINT→ELICIT→LOCK)  → references/strategy.md + references/trip-architecture.md + agents/strategy-researcher.md
```

- [ ] **Step 2: Rewrite the PHASE 2 section**

Old:
```
### PHASE 2 — Destination Strategy (`references/strategy.md`)
Before hunting venues, build the strategy: (A) "how to do X" consensus, (B) preference↔offering
fit, (C) trip-level allocation across legs (capitalize where each excels; avoid redundancy/
variety-penalty; Peak-End sequencing), (D) surface missing criteria the user didn't list.
On MEDIUM/HIGH-stakes multi-interest or multi-leg trips, dispatch `agents/strategy-researcher.md`
(one per region) to ground function (A) in real consensus before you present; on low-stakes
single lookups, do (A) inline. Present it; let the user adjust via menus. THEN discover venues
for the refined, allocated interests.
```
New:
```
### PHASE 2 — Destination Strategy → Trip Architecture (`references/strategy.md`, `references/trip-architecture.md`)
Before hunting venues, build the strategy: (A) "how to do X" consensus, (B) preference↔offering
fit, (C) trip-level allocation across legs (capitalize where each excels; avoid redundancy/
variety-penalty; Peak-End sequencing), (D) surface missing criteria the user didn't list,
(E) day-budget — split the total days across legs, weighted by monopoly strength × interest fit.
On MEDIUM/HIGH-stakes multi-interest or multi-leg trips, dispatch `agents/strategy-researcher.md`
(one per region) to ground functions (A)+(E) in real consensus, then run the **3-beat Trip
Architecture protocol** (`references/trip-architecture.md`): **PAINT** the per-leg possibility space
as a Leg-Identity board (monopoly · feeling/verb · don't-duplicate · days · candidate experiences ·
view · Peak-End) — shown, not asked; **ELICIT** the user's own arc via critique menus + the inference
guard; **LOCK** the agreed arc to a canonical `## Trip Architecture` section + render the visual
arc-board deliverable. On low-stakes single lookups, do (A) inline — no board, no beats. THEN
discover venues for the refined, allocated interests; every per-leg query re-anchors to the locked arc.
```

- [ ] **Step 3: Add the arc-board to the Output-locations list**

Old:
```
  - HTML full-picture page → `…/<trip-id>/<query>.html`
```
New:
```
  - HTML full-picture page → `…/<trip-id>/<query>.html`
  - Trip Architecture arc-board → `…/<trip-id>/<trip-id>-arc.html`
```

- [ ] **Step 4: Add two new Hard rules**

Old:
```
## Hard rules
- Option-menus at every decision point. Never a blank "what do you want?"
- Independent-source convergence over any single score. Read distribution where obtainable.
```
New:
```
## Hard rules
- Option-menus at every decision point. Never a blank "what do you want?"
- **Inference guard (load-bearing only).** Before benching an otherwise-strong option on a constraint
  the user did NOT state, climb means→end and surface the proxy-vs-value choice as a reactable menu —
  never silently filter on your own inference (see `references/trip-architecture.md`).
- **Re-anchor per-leg work to the locked arc.** Once `## Trip Architecture` exists, open each per-leg
  answer with that leg's job and weigh the pick against it.
- Independent-source convergence over any single score. Read distribution where obtainable.
```

- [ ] **Step 5: Add `trip-architecture.md` to the References list**

Old:
```
- `references/methodology.md` — convergence engine, anti-inflation scoring, data-sufficiency gate.
- `references/strategy.md` — destination-strategy layer + the named-framework map.
```
New:
```
- `references/methodology.md` — convergence engine, anti-inflation scoring, data-sufficiency gate.
- `references/strategy.md` — destination-strategy layer (functions A–E) + the named-framework map.
- `references/trip-architecture.md` — the staged Trip Architecture protocol (PAINT→ELICIT→LOCK), the inference guard, the Leg-Identity board + state schema, the visual arc-board template.
```

- [ ] **Step 6: Verify all edits landed (and the build anchor is intact)**

Run:
```bash
grep -c "references/trip-architecture.md" best-finder/SKILL.md
grep -c "3-beat Trip" best-finder/SKILL.md
grep -c "Inference guard (load-bearing only)" best-finder/SKILL.md
grep -c "Re-anchor per-leg work to the locked arc" best-finder/SKILL.md
grep -c "trip-id>-arc.html" best-finder/SKILL.md
grep -c 'State lives at `~/.claude/best-finder/` and SURVIVES across sessions:' best-finder/SKILL.md
```
Expected, command by command:
- `grep -c "references/trip-architecture.md"` → **5** (pipeline line, Phase 2 heading, Phase 2 body, Hard rule, references list).
- `grep -c "3-beat Trip"` → **1**.
- `grep -c "Inference guard (load-bearing only)"` → **1**.
- `grep -c "Re-anchor per-leg work to the locked arc"` → **1**.
- `grep -c "trip-id>-arc.html"` → **1**.
- last grep → **1** (the `build-chat-zip.py` STATE anchor is untouched by this task — confirms no collateral damage).

If any count is off, re-apply the missed edit.

- [ ] **Step 7: Commit**

```bash
git add best-finder/SKILL.md
git commit -m "feat(best-finder): wire Trip Architecture (3-beat Phase 2 + inference-guard/re-anchor rules) into SKILL.md

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Cross-link the guard + arc-board in `references/output-style.md`

Two edits: fire the inference guard inside the critique loop, and register the arc-board as a deliverable distinct from the pick-card page.

**Files:**
- Modify: `best-finder/references/output-style.md`

- [ ] **Step 1: Add the inference guard to the critique-refine loop**

Old:
```
## The critique-refine loop (compound critiquing)
After presenting, invite reaction and offer the critiques AS MENUS (you generate them):
"more like this but [cheaper / more local / closer / quieter / more adventurous]?" Each reaction →
refine the shortlist AND **append the revealed preference to the user's needs file** (continuous
capture). This is how preferences get constructed — by reacting to real options.
```
New:
```
## The critique-refine loop (compound critiquing)
After presenting, invite reaction and offer the critiques AS MENUS (you generate them):
"more like this but [cheaper / more local / closer / quieter / more adventurous]?" Each reaction →
refine the shortlist AND **append the revealed preference to the user's needs file** (continuous
capture). This is how preferences get constructed — by reacting to real options.
**Fire the inference guard here too:** if you are about to drop an otherwise-strong option on an
attribute the user never stated, don't — surface the proxy-vs-value choice as a menu and rebuild from
the value (means→end; see `references/trip-architecture.md`).
```

- [ ] **Step 2: Register the arc-board as a distinct deliverable**

Old:
```
## The "full-picture" HTML deliverable (DEFAULT final output)
The final recommendation should be a **self-contained, browser-openable HTML page** — a full picture,
not a chat blurb. A short chat summary is fine as a preface, but produce the HTML for any non-trivial
recommendation.
```
New:
```
## The "full-picture" HTML deliverable (DEFAULT final output)
The final recommendation should be a **self-contained, browser-openable HTML page** — a full picture,
not a chat blurb. A short chat summary is fine as a preface, but produce the HTML for any non-trivial
recommendation.

> **Distinct from the Phase-2 arc-board.** On multi-leg trips Phase 2 also produces a *Trip
> Architecture arc-board* (`references/trip-architecture.md`): the arc-board answers **"what is each
> leg for"** (monopoly · feeling · days, leg by leg); this full-picture page answers **"which specific
> option"** per leg. The arc precedes the per-leg picks.
```

- [ ] **Step 3: Verify**

Run:
```bash
grep -c "Fire the inference guard here too" best-finder/references/output-style.md
grep -c "Distinct from the Phase-2 arc-board" best-finder/references/output-style.md
```
Expected: each prints `1`.

- [ ] **Step 4: Commit**

```bash
git add best-finder/references/output-style.md
git commit -m "docs(best-finder): output-style — fire inference guard in critique loop + register arc-board

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Full verification pass (structural + behavioral acceptance)

**Files:** none (verification only).

- [ ] **Step 1: All five files present with their load-bearing markers**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
test -f best-finder/references/trip-architecture.md && echo "recipe OK"
grep -c "Beat 2 — ELICIT" best-finder/references/trip-architecture.md
grep -c "E. Day-budget (portfolio over time)" best-finder/references/strategy.md
grep -c "experiential monopoly" best-finder/agents/strategy-researcher.md
grep -c "3-beat Trip" best-finder/SKILL.md
grep -c "Fire the inference guard here too" best-finder/references/output-style.md
```
Expected: `recipe OK`, then `1` for each grep.

- [ ] **Step 2: Cross-references resolve (every `references/trip-architecture.md` mention points to a real file)**

Run:
```bash
for f in best-finder/SKILL.md best-finder/references/strategy.md best-finder/references/output-style.md; do
  grep -q "references/trip-architecture.md" "$f" && echo "$f → references it"
done
test -f best-finder/references/trip-architecture.md && echo "target exists"
```
Expected: all three files print `→ references it`, and `target exists` prints. (No dangling reference.)

- [ ] **Step 3: Build anchor + scoring engine untouched (no collateral damage)**

Run:
```bash
grep -c 'State lives at `~/.claude/best-finder/` and SURVIVES across sessions:' best-finder/SKILL.md
git status --short best-finder/scripts/
```
Expected: grep prints `1` (the `build-chat-zip.py` anchor is intact); `git status` on `scripts/` prints nothing (untouched, per spec non-goal).

- [ ] **Step 4: Git history is coherent**

Run:
```bash
git log --oneline -7
```
Expected: commits for (spec+plan), trip-architecture recipe, strategy.md, strategy-researcher, SKILL.md, output-style.md — in order, on `feat/best-finder-trip-architecture`.

- [ ] **Step 5: Behavioral acceptance checklist (MANUAL — a grep cannot prove these)**

These are the spec §9 criteria. They are verified by reading the wired skill and/or walking a real multi-leg run — not by a command. Check each:
- [ ] On a multi-leg MEDIUM+ trip, the SKILL.md Phase-2 prose **forces** a Leg-Identity board + day-split + arc-board *without the user asking for the "monopoly" framing* (read Task 4 Step 2 output — the protocol is mandatory, not "if reached for").
- [ ] The `## Trip Architecture` schema is the documented source of truth and SKILL.md's re-anchor rule makes later per-leg queries read it (Task 1 schema + Task 4 Step 4 rule).
- [ ] The inference guard's **two-condition trigger** is unambiguous and load-bearing-only (Task 1 guard section): fires on an unstated attribute that would bench a strong option; does NOT fire for user-stated attributes or no-effect inferences.
- [ ] Scale-down is explicit: single-leg / low-stakes → no board, no beats (Task 1 intro + Task 4 Step 2).
- [ ] strategy-researcher returns the leg-identity framing + day-reward data (Task 3).
- [ ] `scripts/score.py` and the Phase 3/3.5/4 pipeline are unchanged (Task 6 Step 3).

No commit.

---

## Final: push the branch / open PR (when the user asks)

After Tasks 0–6 are green, offer to push `feat/best-finder-trip-architecture` and open a PR against `main` (matching the repo's PR-merge convention). Do not push without the user's go-ahead.
