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
