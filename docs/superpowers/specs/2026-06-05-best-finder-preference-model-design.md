# best-finder — Layered Preference Model (L1/L2/L3) beneath Trip Architecture

**Date:** 2026-06-05
**Status:** Approved design (pre-implementation)
**Scope:** Add a durable **3-layer preference model** so a value learned on one leg/trip
**re-instantiates** for the next place-type instead of being blindly transplanted. Integrates
*beneath* the Trip Architecture Phase-2 work (same branch `feat/best-finder-trip-architecture`):
adds a **Phase 1.5 Value Instantiation** step, **unifies** the existing inference guard with
*ladder-up-on-capture*, adds a **don't-transplant guard**, records **lead value + per-leg salience**
at LOCK, and makes the **L2 mapping append-only** so it compounds across trips.

**Origin:** authored with the user from the Italy-2026 session; source artifact
`~/Engineering/projects/best-options-research/best-finder-preference-model-SPEC.md`, and the live
example is the restructured `~/.claude/best-finder/USER-PROFILE.md` (already carries L1+L2). This repo
spec adapts that source and adds the **Trip-Architecture integration** decisions.

---

## 1. Background & problem

The skill captures preferences as a flat list. Three failure modes observed in the Italy-2026 session:

1. **Shape transplant** *(a recurrence)*. The conductor repeatedly defaulted the user into a prior
   leg's **concrete** shape (an in-town walkable base) and had to be corrected ("am I once *again*
   placing myself in the city?"). A flat profile can't distinguish a transferable *value* from its
   one-place *expression*, so it copies the expression.
2. **Latent lead value.** The true driver — **Belonging / community** — was never stated up front; it
   surfaced only after many critique cycles. A flat model records surface prefs (views, wine, no-car)
   but never names the fundamental value, so it can't be reused.
3. **No re-instantiation step.** Nothing in the pipeline asks "for THIS place-type, what shape does
   each value take?" — so the skill either re-derives from scratch or transplants.

Grounding: Value-Focused Thinking (fundamental vs means objectives) + means-end laddering — frameworks
the skill already cites in `references/strategy.md` (function D) but does not operationalize as durable,
layered, transferable state.

## 2. The model

- **L1 — CORE VALUES** (durable, place-AGNOSTIC). The terminal "why behind the why." Travels to every
  trip. → `USER-PROFILE.md`.
- **L2 — CONTEXT SHAPES** (mapping: `core value × place-archetype → concrete criteria`). The SAME value
  rendered differently per place-type. **The reusable infrastructure** — append-only; grows a row/column
  per new trip-type. → `USER-PROFILE.md`.
- **L3 — INSTANCE DECISIONS** (scoped to one leg). The actual pick + evidence + the leg's per-value
  salience. → `trips/<trip-id>.md` (this IS the Trip Architecture state section).

**Operating rules:**
- **Ladder up on capture.** A stated surface-pref is a MEANS → ladder to its L1 value; store BOTH
  (value → L1 durable, surface form → L3 scoped).
- **Don't transplant the shape.** New leg → never reuse a prior leg's L3 concrete criteria. Load L1,
  classify the place-archetype, RE-INSTANTIATE L2 fresh; surface to the user when a value's shape
  changes by place.
- **Lead value is discoverable.** Which value drove the decision is an OUTPUT of the critique loop,
  recorded after convergence — not assumed from the opening brief.
- **Salience per leg.** Record which L1 values are dialed UP for this leg.

## 3. Decisions (locked)

| Decision | Choice |
|---|---|
| Placement | **New Phase 1.5 "Value Instantiation"** between Phase 1 (Scope/Stakes) and Phase 2 (Trip Architecture) — it *feeds* Phase 2, doesn't merge into it |
| Guard unification | The Trip-Architecture **inference guard IS** ladder-up-on-capture's **load-bearing, decision-point** firing; capture-time laddering is the general form. One mechanism, two trigger levels |
| Don't-transplant guard | **NEW** — the durable control for the shape-transplant recurrence. "Re-anchor to the locked arc" is clarified to mean re-anchor to the leg's **L1 values / monopoly**, NEVER copy a prior leg's **L3 shape** |
| Lead value + salience | Recorded at **LOCK**, post-convergence, into the `## Trip Architecture` state section |
| L2 learning | **Append-only write-back** at LOCK: each leg writes its `(value × archetype → criteria)` row to the profile's L2 table |
| Archetype taxonomy | **Small enum + "other" escape:** rural-wine · rural-other · city · coast/island · alpine · desert · urban-beach |
| L2 storage | **Inline in `USER-PROFILE.md` for now**; split to a sibling `PREFERENCES-L2.md` past a size threshold (≈ when the table exceeds ~8 archetype columns or becomes unwieldy) |
| Laddering aggressiveness | **Silently store the L1 value for any decision-bearing pref; only *probe* the user when load-bearing** (matches the user's earlier "load-bearing only" choice for the guard) |
| New reference file | **`references/preference-model.md`** — the L1/L2/L3 contract, the rules, Phase 1.5 procedure, the archetype enum, the L2 write-back recipe (parallel to `trip-architecture.md`) |

---

## 4. Integration with Trip Architecture

The preference model is the durable layer *beneath* Trip Architecture. Mapping:

| Preference-model element | Trip-Architecture element | Resolution |
|---|---|---|
| Rule: ladder up on capture | the inference guard (means→end) | **Unify** — the guard is laddering's load-bearing firing; capture-time laddering is the silent general form |
| Rule: don't transplant the shape | — (the *re-anchor* rule risked causing it) | **Add** the guard; clarify re-anchor = to L1/monopoly, not L3 shape |
| Phase 1.5 Value Instantiation | Phase 2 PAINT → Leg-Identity board | 1.5 instantiates `value × archetype → criteria`; PAINT renders those criteria (value-tagged) as the board's candidate-experiences / feeling columns |
| L3 instances + salience + lead value | the `## Trip Architecture` state section | Same section — extended with **lead value** + **per-value salience** rows |
| L2 append-only mapping | — | New cross-trip infra, written back at LOCK |

**Flow:** Phase 1 (scope/stakes) → **Phase 1.5** (load L1, classify each leg's archetype, instantiate
L2 → working criteria + salience; ASK only for missing mappings) → **Phase 2** Trip Architecture
(PAINT the value-tagged Leg-Identity board → ELICIT, with the guard = load-bearing laddering + the
don't-transplant guard active → LOCK: write L3 + lead value + salience, and write back the L2 row) →
Phase 3 discovery.

Single-leg / low-stakes still scales down: Phase 1.5 collapses to "load L1, instantiate inline for the
one archetype," no board.

## 5. File-level changes

| Piece | Lands in |
|---|---|
| **L1/L2/L3 contract + rules + Phase 1.5 procedure + archetype enum + L2 write-back recipe** | **new** `references/preference-model.md` |
| **Pipeline + Phase 1.5 section + state-layout (L1/L2/L3) + capture-laddering substep + hard rules (don't-transplant; guard=load-bearing-laddering; re-anchor→L1) + references entry** | `SKILL.md` |
| **Guard reconciled with laddering; don't-transplant cross-ref; board = value-tagged instantiation; LOCK records lead value + salience + L2 write-back; state schema gains lead-value + salience** | `references/trip-architecture.md` |
| **Phase 1.5 feeds the strategy; function D guard = load-bearing laddering; cross-link preference-model.md** | `references/strategy.md` |
| **Return the place-archetype classification (feeds Phase 1.5)** | `agents/strategy-researcher.md` |

`scripts/` untouched.

## 6. State layout + schemas

`USER-PROFILE.md` (conductor-maintained, single-writer):
- **L1** — the core-values list (place-agnostic).
- **L2** — the `core value × place-archetype → concrete criteria` table (append-only).

`trips/<trip-id>.md` → the `## Trip Architecture` section gains two rows under the existing table:
```markdown
**Lead value (post-convergence):** <which L1 value drove it · stated up front? yes/no>
**Per-leg salience:** <leg → which L1 values were dialed up>
```
Existing prose in `USER-PROFILE.md` becomes the **evidence** for the L1/L2 layers (non-destructive).

## 7. The archetype enum (starting set)
`rural-wine · rural-other · city · coast/island · alpine · desert · urban-beach · other`. "other" is a
free-form escape that, once used twice, becomes a candidate for promotion to a named archetype. The
conductor classifies each leg's archetype in Phase 1.5 (the strategy-researcher proposes it).

## 8. Edge cases
- **No L2 mapping yet for `(value × archetype)`** → ASK the user (option-menu), then write the row
  (first instantiation seeds the table).
- **Value's shape genuinely differs from a prior leg** → that's the point; surface the difference, do
  not flag it as a conflict.
- **Conflicting L2 rows for the same cell across trips** → keep both as variants with dates; the newer/
  user-confirmed one leads, but do not silently overwrite (append-only).
- **Single-writer preserved** — the strategy-researcher *proposes* archetype + instantiations; only the
  conductor writes L1/L2 (profile) and L3 (trip file).
- **Backwards-compatible** — a profile without the layered header still works; the skill treats existing
  flat prefs as L1/L2 evidence and back-fills layers as they surface.

## 9. Verification / acceptance
- A multi-leg run executes **Phase 1.5 before Phase 2**: classifies each leg's archetype and emits
  value-instantiated criteria (visible as the value-tagged Leg-Identity board), without re-deriving from
  scratch.
- The **don't-transplant guard fires** on a constructed case: a new leg of a *different* archetype does
  NOT inherit a prior leg's concrete L3 criteria; the conductor re-instantiates via L2 and names the
  shape difference.
- **Laddering**: a stated surface pref is stored as `surface → L1 value` (silent); the user is *probed*
  only when load-bearing (guard condition) — no questionnaire creep.
- At **LOCK**, the `## Trip Architecture` section records the **lead value** (+ whether it was stated up
  front) and **per-leg salience**, and the profile's **L2 table gains the leg's row**.
- `references/preference-model.md` exists and documents the contract; `SKILL.md` Phase 1.5 + the two
  hard rules + the state layout are present; `scripts/` unchanged.

## 10. Open questions (deferred — non-blocking)
- Machine-readable YAML mirror of L1/L2 for piping to tooling (e.g. the user's Voyage app) — deferred.
- Auto-clustering free-form "other" archetypes into named ones — deferred (manual promotion for now).
