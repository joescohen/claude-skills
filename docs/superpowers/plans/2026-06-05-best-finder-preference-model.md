# best-finder Layered Preference Model Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the durable **L1/L2/L3 preference model** beneath Trip Architecture so a value learned on one leg/trip re-instantiates for the next place-type instead of being transplanted — via a Phase 1.5 Value-Instantiation step, ladder-on-capture (unified with the inference guard), a don't-transplant guard, lead-value+salience at LOCK, and an append-only L2 mapping that compounds across trips.

**Architecture:** Skill-content (Markdown) change on the existing `feat/best-finder-trip-architecture` branch (Trip Architecture already implemented + committed). No unit suite — "tests" are `grep -c` checks on unique markers + cross-reference resolution + a manual behavioral checklist. Dependency-first: create the new `references/preference-model.md` contract (P1), wire `SKILL.md` (P2), integrate the Trip-Architecture recipe (P3), cross-link `strategy.md` (P4) + `strategy-researcher.md` (P5), then verify (P6). `scripts/` untouched.

**Tech Stack:** Markdown skill files, `git`, shell, `grep`.

**Spec:** `docs/superpowers/specs/2026-06-05-best-finder-preference-model-design.md` (origin: `~/Engineering/projects/best-options-research/best-finder-preference-model-SPEC.md`; live example: `~/.claude/best-finder/USER-PROFILE.md`).

**Working branch:** `feat/best-finder-trip-architecture` (already checked out; tree clean). Base for this plan's verification = current HEAD `09a4894`.

**Key paths:**
- Create: `best-finder/references/preference-model.md`
- Modify: `best-finder/SKILL.md`, `best-finder/references/trip-architecture.md`, `best-finder/references/strategy.md`, `best-finder/agents/strategy-researcher.md`
- Untouched: `best-finder/scripts/`, `best-finder/references/{methodology,data-sources,output-style,gallery-lightbox}.md`, `best-finder/agents/{source-readers,verifier}.md`

---

## Task P1: Create the preference-model contract (`references/preference-model.md`)

**Files:**
- Create: `best-finder/references/preference-model.md`

- [ ] **Step 1: Create the file**

Create `best-finder/references/preference-model.md` with EXACTLY the content inside the ````markdown … ```` fence below (write the inner content only; do not include the outer fence):

````markdown
# Preference Model — the layered L1/L2/L3 value infrastructure

The skill captures preferences as a **3-layer model** so a value learned on one trip **re-instantiates**
for the next place-type instead of being blindly transplanted. It is the durable layer beneath the Trip
Architecture protocol (`references/trip-architecture.md`): **Phase 1.5 reads it, Phase 2 renders it, LOCK
writes back to it.** Grounding: Value-Focused Thinking (fundamental vs means objectives) + means-end
laddering — the same frameworks `strategy.md` function D cites.

## The three layers
- **L1 — CORE VALUES** (durable, place-AGNOSTIC) → `USER-PROFILE.md`. The terminal "why behind the why"
  (e.g. *belonging · beauty-as-lived · taste & terroir · ease/flow*). Travels to every trip.
- **L2 — CONTEXT SHAPES** (mapping `core value × place-archetype → concrete criteria`) → `USER-PROFILE.md`.
  The SAME value rendered differently per place-type. **The reusable infrastructure** — append-only; grows
  a row/column per new trip-type.
- **L3 — INSTANCE DECISIONS** (scoped to one leg) → `trips/<trip-id>.md` (the `## Trip Architecture`
  section). The actual pick + evidence + the leg's per-value salience + the lead value.

## The four operating rules
1. **Ladder up on capture.** A stated surface-pref is a MEANS → ladder to its L1 value; store BOTH (value
   → L1 durable, surface form → L3 scoped). "Good views" → *beauty-as-lived*. Store the L1 value
   **silently** for any decision-bearing pref; only **probe** the user when load-bearing — that probe IS
   the inference guard (`references/trip-architecture.md`).
2. **Don't transplant the shape.** A new leg never reuses a prior leg's L3 concrete criteria. Load L1,
   classify the place-archetype, RE-INSTANTIATE L2 fresh; surface to the user when a value's shape changes
   by place. (Durable control for the shape-transplant failure — the conductor defaulting the user into a
   prior leg's concrete shape, e.g. "an in-town base," across a different archetype.)
3. **Lead value is discoverable.** Which value drove the decision is an OUTPUT of the critique loop,
   recorded after convergence — not assumed from the opening brief. (A latent lead value, e.g. *belonging*,
   often surfaces only after several critique cycles.)
4. **Salience per leg.** Record which L1 values are dialed UP for each leg (one leg may lead with a
   different value than another).

## Phase 1.5 — Value Instantiation (the procedure)
Runs between Phase 1 (scope/stakes) and Phase 2 (Trip Architecture); feeds the Leg-Identity board.
1. **Load L1** core values from `USER-PROFILE.md`.
2. **Classify** each leg's **place-archetype** (enum below; the strategy-researcher proposes it).
3. **Instantiate** concrete criteria from the **L2** mapping for each `(value × archetype)`.
4. **ASK where the mapping is missing/uncertain** for this archetype (option-menu, per the decision-fork
   rule) — then seed that L2 row (first instantiation grows the table).
5. **Emit** the per-leg working brief (instantiated criteria) + per-value **salience** → the Phase-2 board.
Scale-down: single-leg / low-stakes → instantiate inline for the one archetype; no board.

## Place-archetype enum (starting set)
`rural-wine · rural-other · city · coast/island · alpine · desert · urban-beach · other`. "other" is a
free-form escape; once an "other" recurs (≥2 trips) it is a candidate to promote to a named archetype. The
conductor classifies; the strategy-researcher proposes.

## L2 — append-only learning (write-back at LOCK)
At LOCK, append each leg's `(value × archetype → concrete criteria)` to the L2 table in `USER-PROFILE.md`.
**Append-only:** never overwrite an existing cell — if a new trip yields a different shape for the same
`(value × archetype)`, keep both as dated variants (the newer/user-confirmed one leads). This is how the
mapping compounds into the user's personal "how my values look in each kind of place."

## State layout
- `USER-PROFILE.md` → **L1** (core-values list) + **L2** (the mapping table). Existing prose = L1/L2
  **evidence** (non-destructive; back-fill layers as they surface).
- `trips/<trip-id>.md` → **L3** in the `## Trip Architecture` section (+ per-leg salience + lead value).
- **Single-writer:** the strategy-researcher *proposes* archetype + instantiations; only the conductor
  writes L1/L2 (profile) and L3 (trip file).

## Relationship to the inference guard
The **inference guard** (`references/trip-architecture.md`) is rule 1 fired at a decision point
(load-bearing). The **don't-transplant guard** (rule 2) is its cross-leg sibling. Both are the same
instinct — separate the durable value from its place-specific shape — applied at different moments: the
guard when *filtering an option*, don't-transplant when *opening a new leg*.

## Edge cases
- **No L2 mapping yet** for a `(value × archetype)` → ASK, then seed the row.
- **Shape genuinely differs** from a prior leg → that's the point; surface it, don't flag a conflict.
- **Conflicting rows** for one cell across trips → keep both as dated variants; newer/confirmed leads;
  never silently overwrite.
- **Backwards-compatible** — a flat (pre-layered) profile still works; treat existing prefs as L1/L2
  evidence and back-fill as layers surface.
````

- [ ] **Step 2: Verify**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
test -f best-finder/references/preference-model.md && head -1 best-finder/references/preference-model.md
for p in "## The three layers" "Don't transplant the shape." "## Phase 1.5 — Value Instantiation (the procedure)" "## L2 — append-only learning" "rural-wine · rural-other" "## Relationship to the inference guard"; do
  printf '%2s  %s\n' "$(grep -c "$p" best-finder/references/preference-model.md)" "$p"
done
```
Expected: title line `# Preference Model — the layered L1/L2/L3 value infrastructure` prints; each `grep -c` prints `1`.

- [ ] **Step 3: Commit**

```bash
git add best-finder/references/preference-model.md
git commit -m "feat(best-finder): add layered preference model (L1/L2/L3 + rules + Phase 1.5 + archetype enum)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task P2: Wire the preference model into `SKILL.md`

Six edits: pipeline (add Phase 1.5), persistent-state (L1/L2/L3 layout), capture-protocol (laddering substep), a new Phase 1.5 section, the hard-rules block (reword guard + add don't-transplant + clarify re-anchor), references list.

**Files:**
- Modify: `best-finder/SKILL.md`

- [ ] **Step 1: Pipeline — insert the Phase 1.5 line**

Old:
```
PHASE 1   Scope + Stakes (option-menus)
PHASE 2   Destination Strategy → Trip Architecture (PAINT→ELICIT→LOCK)  → references/strategy.md + references/trip-architecture.md + agents/strategy-researcher.md
```
New:
```
PHASE 1   Scope + Stakes (option-menus)
PHASE 1.5 Value Instantiation (L1 → archetype → L2 criteria)  → references/preference-model.md
PHASE 2   Destination Strategy → Trip Architecture (PAINT→ELICIT→LOCK)  → references/strategy.md + references/trip-architecture.md + agents/strategy-researcher.md
```

- [ ] **Step 2: Persistent-state — document the L1/L2/L3 layering**

Old:
```
State lives at `~/.claude/best-finder/` and SURVIVES across sessions:
- `USER-PROFILE.md` — durable, cross-trip: who the user is, taste tendencies, decision style,
  recurring constraints, interaction preferences.
- `trips/<trip-id>.md` — the living needs doc for an active trip: context, interests,
  per-category needs + current picks, open decisions, and a dated **Change Log**.
```
New:
```
State lives at `~/.claude/best-finder/` and SURVIVES across sessions, structured as a **layered
preference model** (L1/L2/L3 — see `references/preference-model.md`):
- `USER-PROFILE.md` — durable, cross-trip: **L1 core values** (place-agnostic) + the **L2 context-shape
  mapping** (`value × place-archetype → criteria`, append-only) + who the user is, taste tendencies,
  decision style, recurring constraints, interaction preferences.
- `trips/<trip-id>.md` — the living needs doc for an active trip: context, interests, per-category needs
  + current picks, **L3 instance decisions + per-leg salience + lead value**, open decisions, and a dated
  **Change Log**.
```

- [ ] **Step 3: Capture protocol — add the ladder-up substep**

Old:
```
2. **Throughout the session:** whenever the user states a preference, constraint, like/dislike,
   reaction to an option, or makes a decision — **append it immediately** to the active trip
   file (and promote cross-trip patterns to `USER-PROFILE.md`), with a dated Change Log entry
   and the source ("user said…"). Do this WITHOUT being asked.
```
New:
```
2. **Throughout the session:** whenever the user states a preference, constraint, like/dislike,
   reaction to an option, or makes a decision — **append it immediately** to the active trip
   file (and promote cross-trip patterns to `USER-PROFILE.md`), with a dated Change Log entry
   and the source ("user said…"). Do this WITHOUT being asked. **Ladder up on capture:** a stated
   surface-pref is a MEANS — ladder it to its durable **L1 value** and store both (value → L1 profile,
   place-specific form → L3 trip file); see `references/preference-model.md`.
```

- [ ] **Step 4: Insert the new PHASE 1.5 section (immediately before `### PHASE 2`)**

Find this line:
```
### PHASE 2 — Destination Strategy → Trip Architecture (`references/strategy.md`, `references/trip-architecture.md`)
```
Insert the following block immediately BEFORE it (leave a blank line between this block and the PHASE 2 header):
```
### PHASE 1.5 — Value Instantiation (`references/preference-model.md`)
Between scope and strategy, translate durable values into THIS trip's criteria — so a value learned
elsewhere re-instantiates correctly instead of being transplanted:
- **Load L1** core values from `USER-PROFILE.md`.
- **Classify** each leg's **place-archetype** (rural-wine · rural-other · city · coast/island · alpine ·
  desert · urban-beach · other; the strategy-researcher proposes it).
- **Instantiate** concrete criteria from the **L2** mapping for each `(value × archetype)`; for any cell
  with no/uncertain mapping, **ASK** (option-menu) and seed the row.
- **Emit** the per-leg working brief + per-value **salience** → feeds the Phase-2 Leg-Identity board.
- **Don't-transplant guard:** never copy a prior leg's L3 criteria onto a new archetype — re-instantiate
  from L1+L2 and tell the user how the shape differs. On low-stakes single lookups, instantiate inline.

```

- [ ] **Step 5: Hard rules — reword the inference-guard rule, add the don't-transplant rule, clarify re-anchor**

Old:
```
- **Inference guard (load-bearing only).** Before benching an otherwise-strong option on a constraint
  the user did NOT state, climb means→end and surface the proxy-vs-value choice as a reactable menu —
  never silently filter on your own inference (see `references/trip-architecture.md`).
- **Re-anchor per-leg work to the locked arc.** Once `## Trip Architecture` exists, open each per-leg
  answer with that leg's job and weigh the pick against it.
```
New:
```
- **Inference guard = load-bearing laddering.** Before benching an otherwise-strong option on a constraint
  the user did NOT state, climb means→end (ladder the proxy to its L1 value) and surface the proxy-vs-value
  choice as a reactable menu — never silently filter on your own inference (see
  `references/trip-architecture.md` + `references/preference-model.md`).
- **Don't transplant the shape.** A new leg never inherits a prior leg's concrete (L3) criteria — load L1,
  classify the place-archetype, re-instantiate L2 fresh, and name how the shape differs (see
  `references/preference-model.md`). The durable control for the shape-transplant failure.
- **Re-anchor per-leg work to the locked arc.** Once `## Trip Architecture` exists, open each per-leg
  answer with that leg's job and weigh the pick against it — re-anchor to the leg's **values / monopoly**,
  NOT a prior leg's concrete shape (see the don't-transplant rule).
```

- [ ] **Step 6: References list — add `preference-model.md`**

Old:
```
- `references/trip-architecture.md` — the staged Trip Architecture protocol (PAINT→ELICIT→LOCK), the inference guard, the Leg-Identity board + state schema, the visual arc-board template.
```
New:
```
- `references/trip-architecture.md` — the staged Trip Architecture protocol (PAINT→ELICIT→LOCK), the inference guard, the Leg-Identity board + state schema, the visual arc-board template.
- `references/preference-model.md` — the layered L1/L2/L3 preference model: ladder-on-capture, the don't-transplant guard, Phase 1.5 Value Instantiation, the archetype enum, append-only L2 learning.
```

- [ ] **Step 7: Verify all SKILL.md edits + the build anchor**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
for p in "PHASE 1.5 Value Instantiation (L1" "### PHASE 1.5 — Value Instantiation" "L1 core values\*\* (place-agnostic)" "Ladder up on capture:" "Don't transplant the shape." "Inference guard = load-bearing laddering" "preference-model.md — the layered"; do
  printf '%2s  %s\n' "$(grep -c "$p" best-finder/SKILL.md)" "$p"
done
echo "build STATE anchor: $(grep -c 'State lives at `~/.claude/best-finder/` and SURVIVES across sessions:' best-finder/SKILL.md)  (exp 1)"
```
Expected: each of the seven markers prints `1`; the build STATE anchor prints `1`. (`grep` treats `\*\*` as the literal `**`.) If any is `0`, re-apply that edit.

- [ ] **Step 8: Commit**

```bash
git add best-finder/SKILL.md
git commit -m "feat(best-finder): wire layered preference model into SKILL.md (Phase 1.5 + ladder/don't-transplant rules + L1/L2/L3 state)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task P3: Integrate the model into `references/trip-architecture.md`

Four edits: PAINT consumes Phase-1.5 instantiation; LOCK records lead value + salience + writes back L2; the inference-guard section reconciles with laddering; the state schema gains lead-value + salience.

**Files:**
- Modify: `best-finder/references/trip-architecture.md`

- [ ] **Step 1: PAINT — the board is fed by Phase 1.5 (value-tagged)**

Old:
```
After the strategy-researcher returns (one per region), present the WHOLE arc at once — every leg side
by side — as the **Leg-Identity board**. This is the user's "environment to play in," shown so they
**construct preferences by reacting** (not a blank questionnaire). Fill every column for each leg:
```
New:
```
After the strategy-researcher returns (one per region) and **Phase 1.5 has instantiated each leg's values**
(`references/preference-model.md`), present the WHOLE arc at once — every leg side by side — as the
**Leg-Identity board**. Its criteria ARE the Phase-1.5 output: the candidate-experiences and feeling
columns are the user's **L1 values instantiated for that leg's place-archetype** (value-tagged), never a
prior leg's shape copied over. This is the user's "environment to play in," shown so they **construct
preferences by reacting** (not a blank questionnaire). Fill every column for each leg:
```

- [ ] **Step 2: LOCK — record lead value + salience + write back L2**

Old:
```
## Beat 3 — LOCK (write the arc, re-render)
When the arc settles:
- Write/replace the canonical `## Trip Architecture` section in `trips/<trip-id>.md` (schema below).
- Re-render the visual arc-board deliverable.
- From here on, **every per-leg query re-anchors to this section** (read at STEP 0): open each per-leg
  answer with "this leg's job is X — here's how this pick leverages (or fights) it," and apply any
  guard-resolved criteria as standing filters for that leg.
```
New:
```
## Beat 3 — LOCK (write the arc, re-render)
When the arc settles:
- Write/replace the canonical `## Trip Architecture` section in `trips/<trip-id>.md` (schema below).
- **Record the lead value (post-convergence)** — which L1 value actually drove the arc, and whether it was
  stated up front or surfaced latently — plus **per-leg salience** (which values were dialed up per leg).
  (`references/preference-model.md`.)
- **Write back the L2 row(s)** — append each leg's `(value × archetype → concrete criteria)` to the
  profile's L2 table so the mapping compounds across trips (append-only; never overwrite a variant).
- Re-render the visual arc-board deliverable.
- From here on, **every per-leg query re-anchors to this section** (read at STEP 0): open each per-leg
  answer with "this leg's job is X — here's how this pick leverages (or fights) it," apply any
  guard-resolved criteria as standing filters, and re-anchor to the leg's **values/monopoly, never a prior
  leg's shape** (the don't-transplant rule).
```

- [ ] **Step 3: Inference-guard section — reconcile with laddering + don't-transplant**

Old:
```
## The inference guard (means→end; LOAD-BEARING ONLY)
The recurring failure this prevents: the skill infers a constraint the user never stated (often
generalized from ONE loved example), then silently benches strong options on it — forcing the user to
discover and correct it a round later. Instead: when about to filter on an *unstated* attribute,
**climb from the means (the proxy) to the end (the real value)** and surface it as a reactable menu
BEFORE filtering. (This operationalizes Value-Focused Thinking — means-objectives vs fundamental-
objectives — already in `strategy.md` function D.)
```
New:
```
## The inference guard (means→end; LOAD-BEARING ONLY)
The inference guard is **ladder-up-on-capture fired at a decision point** — the load-bearing case of the
general laddering rule in `references/preference-model.md`. The recurring failure it prevents: the skill
infers a constraint the user never stated (often generalized from ONE loved example), then silently
benches strong options on it — forcing the user to discover and correct it a round later. Instead: when
about to filter on an *unstated* attribute, **climb from the means (the proxy) to the end (the real value
/ L1)** and surface it as a reactable menu BEFORE filtering. (This operationalizes Value-Focused Thinking
— means-objectives vs fundamental-objectives — already in `strategy.md` function D.) Distinct from the
**don't-transplant guard** (`references/preference-model.md`), which prevents copying a prior leg's shape
onto a new archetype.
```

- [ ] **Step 4: State schema — add lead-value + salience**

Old:
```
**Day-split:** <leg A N nights · leg B N nights · …>  (arrival/transit days noted)

**Drawn-out criteria (means→end resolutions):**
```
New:
```
**Day-split:** <leg A N nights · leg B N nights · …>  (arrival/transit days noted)

**Lead value (post-convergence):** <which L1 value drove the arc · stated up front? yes/no>
**Per-leg salience:** <leg → which L1 values were dialed up for it>

**Drawn-out criteria (means→end resolutions):**
```

- [ ] **Step 5: Verify**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
for p in "Phase 1.5 has instantiated each leg's values" "Record the lead value (post-convergence)" "Write back the L2 row" "ladder-up-on-capture fired at a decision point" "Lead value (post-convergence):\*\*" "Per-leg salience:\*\*"; do
  printf '%2s  %s\n' "$(grep -c "$p" best-finder/references/trip-architecture.md)" "$p"
done
```
Expected: each prints `1`. (`\*\*` matches the literal `**`.)

- [ ] **Step 6: Commit**

```bash
git add best-finder/references/trip-architecture.md
git commit -m "feat(best-finder): trip-architecture integrates preference model (Phase-1.5 board, lead value + salience + L2 write-back at LOCK)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task P4: Cross-link in `references/strategy.md`

Two edits: the intro notes Phase 1.5 feeds it; function D's inference-guard bullet links laddering + don't-transplant.

**Files:**
- Modify: `best-finder/references/strategy.md`

- [ ] **Step 1: Intro — note Phase 1.5 feeds the strategy**

Old:
```
On multi-leg / MEDIUM+ trips this layer runs as the staged **Trip Architecture** protocol
(PAINT→ELICIT→LOCK) — present the per-leg possibility space, draw out the user's own arc, then lock a
canonical arc the rest of the trip anchors to. Recipe: `references/trip-architecture.md`. It scales
down to inline function-A on single-leg / low-stakes lookups.
```
New:
```
On multi-leg / MEDIUM+ trips this layer runs as the staged **Trip Architecture** protocol
(PAINT→ELICIT→LOCK) — present the per-leg possibility space, draw out the user's own arc, then lock a
canonical arc the rest of the trip anchors to. Recipe: `references/trip-architecture.md`. It scales
down to inline function-A on single-leg / low-stakes lookups. It is fed by **Phase 1.5 Value
Instantiation** (`references/preference-model.md`), which renders the user's durable L1 values into this
trip's criteria per place-archetype before the strategy is built.
```

- [ ] **Step 2: Function D — link the guard to laddering + the don't-transplant sibling**

Old:
```
- **Inference guard (means→end, load-bearing only):** the SAME "why is that important?" climb, fired
  defensively against the skill's OWN inferred filters — before benching an otherwise-strong option on
  an attribute the user never stated, surface the proxy-vs-value choice as a menu and rebuild from the
  value. Full procedure + trigger: `references/trip-architecture.md`.
```
New:
```
- **Inference guard (means→end, load-bearing only):** the SAME "why is that important?" climb, fired
  defensively against the skill's OWN inferred filters — before benching an otherwise-strong option on
  an attribute the user never stated, surface the proxy-vs-value choice as a menu and rebuild from the
  value. It is the load-bearing case of **ladder-up-on-capture** (the durable value goes to L1); its
  sibling is the **don't-transplant guard** (don't copy a prior leg's shape onto a new archetype). Full
  procedures: `references/trip-architecture.md` + `references/preference-model.md`.
```

- [ ] **Step 3: Verify**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
grep -c "fed by \*\*Phase 1.5 Value" best-finder/references/strategy.md
grep -c "load-bearing case of \*\*ladder-up-on-capture\*\*" best-finder/references/strategy.md
```
Expected: each prints `1`.

- [ ] **Step 4: Commit**

```bash
git add best-finder/references/strategy.md
git commit -m "docs(best-finder): strategy.md links Phase 1.5 + ladder/don't-transplant to the preference model

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task P5: Return the place-archetype from `agents/strategy-researcher.md`

Two edits: task item 1 proposes the archetype; the Return's leg-identity line includes it.

**Files:**
- Modify: `best-finder/agents/strategy-researcher.md`

- [ ] **Step 1: Task item 1 — propose the place-archetype**

Old:
```
   Distill this into the leg's **experiential monopoly**: the ONE thing only this region gives, its
   **feeling/verb** (the emotion + action — e.g. look · taste · feel · awe), and **what it is NOT
   for** (so the conductor can compute the "don't-duplicate" across legs).
```
New:
```
   Distill this into the leg's **experiential monopoly**: the ONE thing only this region gives, its
   **feeling/verb** (the emotion + action — e.g. look · taste · feel · awe), and **what it is NOT
   for** (so the conductor can compute the "don't-duplicate" across legs). Also **propose the leg's
   place-archetype** (rural-wine · rural-other · city · coast/island · alpine · desert · urban-beach ·
   other) — the conductor needs it for Phase 1.5 value-instantiation (`references/preference-model.md`).
```

- [ ] **Step 2: Return — add the archetype to the leg-identity line**

Old:
```
- **Leg-identity line:** the single experiential monopoly + feeling/verb + what the region is NOT for.
```
New:
```
- **Leg-identity line:** the single experiential monopoly + feeling/verb + what the region is NOT for + the proposed **place-archetype**.
```

- [ ] **Step 3: Verify**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
grep -c "propose the leg's" best-finder/agents/strategy-researcher.md
grep -c "what the region is NOT for + the proposed" best-finder/agents/strategy-researcher.md
```
Expected: each prints `1`.

- [ ] **Step 4: Commit**

```bash
git add best-finder/agents/strategy-researcher.md
git commit -m "feat(best-finder): strategy-researcher proposes the leg's place-archetype (for Phase 1.5)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task P6: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Five files carry their markers**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
test -f best-finder/references/preference-model.md && echo "contract OK"
echo "SKILL Phase 1.5     : $(grep -c '### PHASE 1.5 — Value Instantiation' best-finder/SKILL.md)"
echo "SKILL dont-transplant: $(grep -c \"Don't transplant the shape.\" best-finder/SKILL.md)"
echo "TA lead-value LOCK  : $(grep -c 'Record the lead value (post-convergence)' best-finder/references/trip-architecture.md)"
echo "strategy Phase 1.5  : $(grep -c 'fed by \*\*Phase 1.5 Value' best-finder/references/strategy.md)"
echo "researcher archetype: $(grep -c \"propose the leg's\" best-finder/agents/strategy-researcher.md)"
```
Expected: `contract OK`, then `1` for each grep.

- [ ] **Step 2: Cross-references resolve (every `preference-model.md` pointer hits a real file)**

Run:
```bash
for f in best-finder/SKILL.md best-finder/references/trip-architecture.md best-finder/references/strategy.md best-finder/agents/strategy-researcher.md; do
  grep -q "references/preference-model.md" "$f" && echo "$f -> references it"
done
test -f best-finder/references/preference-model.md && echo "target exists"
```
Expected: all four files print `-> references it`, and `target exists` prints.

- [ ] **Step 3: Build anchor intact + scripts untouched**

Run:
```bash
echo "STATE anchor: $(grep -c 'State lives at `~/.claude/best-finder/` and SURVIVES across sessions:' best-finder/SKILL.md)  (exp 1)"
git diff --stat 09a4894 HEAD -- best-finder/scripts/ | tail -1; echo "(empty above = scripts untouched)"
```
Expected: STATE anchor `1`; no `scripts/` changes.

- [ ] **Step 4: Git history coherent**

Run:
```bash
git log --oneline 09a4894..HEAD
```
Expected: five commits — preference-model contract (P1), SKILL.md (P2), trip-architecture (P3), strategy.md (P4), strategy-researcher (P5).

- [ ] **Step 5: Behavioral acceptance checklist (MANUAL — grep can't prove these)**

- [ ] **Phase 1.5 runs before Phase 2** and instantiates `value × archetype → criteria` (SKILL.md pipeline + Phase 1.5 section + the board's "criteria ARE the Phase-1.5 output" wording).
- [ ] **Ladder-on-capture** stores the L1 value silently and only *probes* when load-bearing (capture substep + the guard's load-bearing trigger — no questionnaire creep).
- [ ] **Don't-transplant guard** is a named hard rule and is distinct from the inference guard (SKILL.md hard rules + preference-model.md "Relationship to the inference guard").
- [ ] **LOCK records lead value + salience and writes back the L2 row** (trip-architecture Beat 3 + the schema rows).
- [ ] **L2 is append-only** and compounds across trips (preference-model.md "append-only learning").
- [ ] **Single-writer preserved** + `scripts/`/pipeline unchanged (Step 3).

No commit.

---

## Final: finishing the branch
Both features (Trip Architecture + the preference model) now live on `feat/best-finder-trip-architecture`. Resume `superpowers:finishing-a-development-branch` to push & open the PR (base = the gallery parent for a clean stacked diff, or main) once the user confirms — per the choice already made.
