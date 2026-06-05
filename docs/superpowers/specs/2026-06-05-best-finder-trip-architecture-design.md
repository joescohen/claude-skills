# best-finder — "Trip Architecture" (staged educate→elicit→lock Phase 2 upgrade)

**Date:** 2026-06-05
**Status:** Approved design (pre-implementation)
**Scope:** Upgrade `best-finder`'s **Phase 2 (Destination Strategy)** from a compute-and-present
step into a guaranteed **3-beat staged sub-protocol** — **PAINT** (possibility space + a per-leg
identity board) → **ELICIT** (draw out the user's own story; a means→end *inference guard*) →
**LOCK** (a canonical state arc + re-rendered board). Adds four pieces, all extending existing
Phase-2 machinery: a **Leg-Identity artifact**, a **day-budget function (E)**, an **inference
guard**, and a **visual arc-board** deliverable. No change to discovery/scoring math.

---

## 1. Background & problem

`best-finder` is a conversational, critique-based recommender. Its **Phase 2** already specifies
four destination-strategy functions ([`references/strategy.md`](../../../best-finder/references/strategy.md)):
A) "how to do X" consensus / what a region is uniquely best at, B) preference↔offering fit,
C) trip-level allocation across legs (variety penalty + Peak-End sequencing), D) missing-criteria
surfacing (Value-Focused Thinking, Kano, constructive elicitation). The bones are there.

Three gaps surfaced from a real multi-leg Italy run:

1. **The most valuable output is emergent, not guaranteed.** The thing the user found decisive —
   a per-leg **"monopoly" framing** ("Florence = look at the Renaissance at the source / Tuscany =
   taste the land / Amalfi = feel the sublime / Rome = stand in awe — and *don't repeat a leg's job
   elsewhere*") — was produced because the model *reached* for it, not because the skill *requires*
   it. The user's stated #1 want is to make this a **named, always-produced artifact**.

2. **The rhythm is backwards.** Phase 2 today *computes a strategy and presents it to tweak.* The
   user wants **educate-first**: be *shown the possibility space* ("what the trip could be, what each
   leg uniquely provides — the environment to play in"), then *tell their own story* back, then
   iterate. A co-construction loop, not a finished-plan-to-edit.

3. **The skill filters on its own unstated inferences.** Worked example: the user loved
   *Agriturismo Marinello*; the skill silently **inferred** the constraint "tiny family farm" and
   used it to **bench genuinely strong options** (Borgo Sant'Ambrogio, Fattoria del Colle) before
   the user ever said size mattered. The user had to *manually* correct it a round later ("tiny was
   never the point — it's a *community that runs activities*, with a *view*"). The skill made the
   user do the drawing-out.

   This is a **class**, not a one-off. Every instance is the same move: the user names a **means
   (proxy)**; the real **end (value)** is one level up; the skill should *climb* and rebuild the
   option set from the end. Other instances from the same trip:
   - "view **from the room**" → the end was *a view-with-wine moment in town* (user self-corrected:
     "doesn't mean the hotel has to provide everything").
   - "Cortona has a great **train system**" → the end was *low-hassle access to wine country*; the
     trains "solved the wrong problem."
   - "**no car**" → is the end *no driving*, or *no hassle*? (A leg-specific fork worth surfacing.)

   Value-Focused Thinking (means-objectives vs fundamental-objectives) is **already cited** in
   function D — it is simply never fired *defensively against the conductor's own inferred filters.*

A fourth, lighter want (the user de-prioritized it): every later per-leg question should re-anchor to
the leg's job. This falls out nearly for free once a canonical arc exists in state.

## 2. Goals / non-goals

**Goals**
- Make the per-leg **monopoly / experiential-identity** framing a **required, repeatable** Phase-2
  output, not an emergent one.
- Replace the Phase-2 rhythm with a guaranteed **PAINT → ELICIT → LOCK** loop ("show the space → draw
  out my story → lock the arc").
- Add an **inference guard**: before benching an otherwise-strong option on an attribute the user did
  **not** state, surface a **means→end** probe (load-bearing only).
- Add a **day-budget** function: total days → a proposed per-leg split + "what fits," re-flowable.
- Produce **both** forms of the possibility space: a canonical `## Trip Architecture` **state section**
  (source of truth) **and** an on-demand **visual arc-board** HTML deliverable.
- Re-anchor downstream per-leg work to the locked arc (the de-prioritized #4), cheaply.

**Non-goals**
- No change to Phase 3 discovery readers, the Phase 3.5 verification gate, Phase 4 data-sufficiency
  scoring, or `scripts/score.py`.
- No change to the per-pick HTML deliverable (the pick-card + gallery page) beyond cross-linking — the
  arc-board is a **separate, simpler** artifact.
- No new external data source or MCP. The arc-board uses content already gathered in Phase 2.
- Not a heavyweight planner: the protocol **scales down** to nothing on single-leg / low-stakes
  lookups (no ceremony tax on "find me a dinner spot").

## 3. Decisions (locked)

| Decision | Choice |
|---|---|
| Architecture | **Named staged sub-protocol "Trip Architecture"** inside Phase 2 (not in-place rule tweaks) — the rhythm becomes guaranteed, not emergent |
| Output form | **Both** — canonical `## Trip Architecture` **state section** (source of truth) **+** on-demand **visual arc-board** HTML |
| Inference-guard aggressiveness | **Load-bearing only** — fire only when an *unstated* attribute would bench an *otherwise-strong* option (regret-efficient; no questionnaire creep) |
| Leg-Identity artifact | **Always produced** on multi-leg trips; columns = monopoly · feeling/verb · don't-duplicate · day-budget · 3–4 candidate experiences · view (key recurring criterion) · Peak-End role |
| Day-budget | New strategy **function E** |
| New reference file | **`references/trip-architecture.md`** — protocol + inference-guard procedure + Leg-Identity/state schema + arc-board template (keeps `strategy.md` focused on the framework map) |
| #4 re-anchor | **Light** — one rule: downstream per-leg queries re-open from the locked arc; no separate mechanism |
| Scale-down | Single-leg / low-stakes → inline function A only, **no board, no 3-beat ceremony** |

---

## 4. The design — Trip Architecture (the 3 beats)

Runs as Phase 2 on **multi-leg AND MEDIUM/HIGH-stakes** trips (the same gate that already dispatches
`agents/strategy-researcher.md`). Beats are sequential; ELICIT loops until the user settles.

### Beat 1 — PAINT (show the possibility space)
After the strategy-researcher returns (one per region), the conductor presents the **whole arc at
once** — every leg side by side — as the **Leg-Identity board**. For each leg:
- **Monopoly** — the single thing *only this leg* gives (one phrase).
- **Feeling / verb** — its experiential mode (e.g., look · taste · feel · awe).
- **Don't-duplicate** — the job *not* to repeat on another leg (variety penalty made explicit).
- **Day-budget** — proposed nights (from function E), shown as a split of the total.
- **Candidate experiences** — 3–4 *reactable seeds* that express the monopoly (enough to react to;
  **not** full discovery — that's Phase 3, after the arc locks).
- **View / key recurring criterion** — explicit, because durable hard-criteria (here: "beautiful
  view") must be visible on the board, not buried.
- **Peak-End role** — this leg's place in the arc (opener · high-variance-early · reliably-great
  finale), from function C sequencing.

Rendered as the **visual arc-board** (left→right, Peak-End annotated) on multi-leg/MEDIUM+; inline
Markdown table on low-stakes/single-leg. **Shown, not asked** — this is preference *construction by
reaction* (Slovic; Payne).

### Beat 2 — ELICIT (draw out the user's story)
The conductor invites the user to react and narrate their version. Two mechanisms:

1. **Arc-level critique menus** (the existing compound-critiquing loop, applied to the arc):
   conductor-generated menus — "trade a day from Rome to the countryside?", "which leg is the
   romance peak?", "is this leg's candidate set the right *kind* of thing?" — never a blank ask.

2. **Inference guard (the heart — load-bearing only).** Whenever the conductor is about to
   **filter / bench / deprioritize an otherwise-strong option** because of an attribute the user did
   **not** explicitly state (an inference the conductor introduced — often generalized from a single
   loved example), it MUST, *before* filtering:
   - **Pause & name the inference.** "You loved Marinello; I was about to treat *'tiny family farm'*
     as a requirement — but you never said that."
   - **Climb means→end.** Offer two readings: the **proxy** vs the **fundamental value** it may stand
     for. "I read 'tiny' two ways: [A] *size itself*, or [B] *a community that runs activities + a
     view*."
   - **Show the peek.** Name the strong options reading [B] would *unlock* (the ones [A] benched).
   - **Menu + capture.** The user picks; the conductor records the resolved criterion to
     `## Trip Architecture` (and promotes to `USER-PROFILE.md` if cross-trip).

   **Fires only when both hold:** (i) the attribute is the conductor's *inference*, not user-stated
   or already in state; **and** (ii) acting on it would *exclude an otherwise-strong option.* It does
   **not** fire for user-stated constraints (apply them), for inferences that exclude nothing strong,
   or for no-regret minor inferences. Before probing, re-check `USER-PROFILE.md` + the trip file —
   never re-ask what's recorded (existing STEP 0 rule).

### Beat 3 — LOCK (write the arc, re-render)
Once the user's arc settles, the conductor (single-writer):
- Writes/replaces the canonical **`## Trip Architecture`** section in `trips/<id>.md` (schema §6).
- Re-renders the **visual arc-board** deliverable.
- This section is the **anchor** all downstream per-leg discovery reads. Every later per-leg query
  ("a hotel in Montepulciano") re-opens *from* it: *"this leg's job is X — here's how this choice
  leverages (or contradicts) it,"* and any guard-resolved criteria become **standing filters** for
  that leg. (This is the light #4.)

---

## 5. The five pieces → file-level changes

| # | Piece | Lands in |
|---|---|---|
| 1 | **Leg-Identity artifact** — the always-produced per-leg table (monopoly · feeling · don't-duplicate · days · candidates · view · Peak-End) | `references/strategy.md` (spec) + `agents/strategy-researcher.md` (returns the framing) + `references/trip-architecture.md` (schema) |
| 2 | **3-beat PAINT→ELICIT→LOCK protocol** | `SKILL.md` Phase 2 (rewrite) + **new** `references/trip-architecture.md` (full protocol) |
| 3 | **Inference guard** (means→end, load-bearing-only) | `references/strategy.md` (operationalize under fn D) + `references/output-style.md` (cross-link into the critique loop) + `SKILL.md` (hard rule) + `references/trip-architecture.md` (procedure + menu template) |
| 4 | **Day-budget (function E)** | `references/strategy.md` (fn E) + `agents/strategy-researcher.md` (returns pace / "days a region rewards") |
| 5 | **Visual arc-board + state-section schema** | **new** `references/trip-architecture.md` (board template + `## Trip Architecture` schema) + `references/output-style.md` (register it as a distinct deliverable) |

### 5.1 `SKILL.md`
- Rewrite the **Phase 2** section as the 3-beat Trip Architecture protocol (PAINT/ELICIT/LOCK),
  keeping the existing dispatch gate (multi-leg AND MEDIUM+/strategy-researcher) and adding the
  scale-down note (single-leg/low-stakes → function A inline, no board).
- Add to the strategy summary: **function E (day-budget).**
- Add two **Hard rules**:
  - *Inference guard:* "Before benching an otherwise-strong option on a constraint the user did not
    state, climb means→end and surface it as a reactable menu — load-bearing inferences only; never a
    blank questionnaire."
  - *Re-anchor:* "Per-leg work re-opens from the locked `## Trip Architecture` — state each pick's fit
    against that leg's monopoly."
- Add `references/trip-architecture.md` to the References list; note the arc-board as a Phase-2
  deliverable (distinct from the per-pick page).

### 5.2 `references/strategy.md`
- Add **function E — Day-budget (portfolio over time):** total days → a per-leg split weighted by
  (monopoly strength × interest fit from fn B), respecting realistic minimums (a leg generally needs
  ≥2 nights to pay off; arrival/transit days flagged), with Peak-End sequencing; re-flows when total
  days or a leg changes; outputs "what fits" (slots per leg). Cross-reference the existing TTDP /
  Team-Orienteering framework line (it's the formal model).
- Add the **Leg-Identity artifact** definition (the columns) as the canonical product of functions
  A+C+E.
- **Operationalize the inference guard** under function D: name it (means-objectives → fundamental-
  objectives), give the **load-bearing trigger**, and the climb procedure. Point to
  `trip-architecture.md` for the menu template.

### 5.3 `references/trip-architecture.md` (new)
The full recipe, so the protocol lands identically every run:
- The **3-beat protocol** (PAINT/ELICIT/LOCK) in operational detail.
- The **inference-guard procedure** + the reactable **menu template** ("I read X two ways: [A
  proxy] / [B value] — here's what B unlocks").
- The **Leg-Identity table** column spec.
- The canonical **`## Trip Architecture` state-section schema** (§6).
- The **visual arc-board HTML template** (skeleton + minimal CSS; region-appropriate palette; one
  panel per leg; top strip = total days + split + don't-duplicate relations; Peak-End marker). Saved
  to the PINNED deliverable base as `…/runs/<trip-id>/<trip-id>-arc.html`; sent via `SendUserFile`.

### 5.4 `references/output-style.md`
- Cross-link the **inference guard** into the critique-refine loop (it is the same compound-critiquing
  loop, fired *earlier* and *defensively* against the conductor's own filters).
- **Register the arc-board** as a distinct deliverable: the arc-board answers *"what is each leg
  for"*; the existing pick-card page answers *"which specific option per leg."* Note ordering — the
  arc precedes per-leg picks.

### 5.5 `agents/strategy-researcher.md`
Extend the return contract to feed pieces 1 and 4:
- The region's **single experiential monopoly** + its **feeling/verb** + **what it is *not* for**
  (so don't-duplicate can be computed) — grounded in sources, not asserted.
- **Pace / day-reward** data: how many days the region rewards before diminishing returns, and the
  realistic minimum to capture its monopoly — the input function E needs.

### 5.6 `scripts/`
No change.

---

## 6. Canonical `## Trip Architecture` state schema

Written by the conductor into `trips/<id>.md` at LOCK (single-writer; dated, alongside the existing
Change Log convention):

```markdown
## Trip Architecture
_Locked <date> · total <N> days_

| Leg (dates) | Monopoly (only here) | Feeling/Verb | Don't-duplicate | Days | Candidate experiences | View/key-criterion | Peak-End role |
|---|---|---|---|---|---|---|---|
| … | … | … | … | … | … | … | … |

**Day-split:** <leg A N nights · leg B N nights · …> (transit/arrival days noted)

**Drawn-out criteria (means→end resolutions):**
- <e.g., "rural-leg archetype = community-that-runs-activities + a view — NOT smallness" (guard, <date>)>

**My story (user's words):** <short narrative the user fed back>
```

Downstream per-leg discovery reads this section at STEP 0 and re-anchors to the relevant leg's row +
the drawn-out criteria.

---

## 7. Scale-down / gating (no ceremony tax)

- **Single-leg OR low-stakes lookup** → function A inline; **no** 3-beat, **no** board, **no**
  `## Trip Architecture` write. (Honors the existing "don't over-engineer low-stakes" principle and
  the strategy-researcher dispatch rule.)
- **Multi-leg AND MEDIUM/HIGH stakes** → full 3-beat + visual arc-board + state section.
- **Inference guard is gate-independent**: it costs nothing when its load-bearing trigger is unmet, so
  it applies even mid-discovery on a single leg (it is a *filter discipline*, not a phase).

---

## 8. Error handling & edge cases

- **Two legs claim the same monopoly** (e.g., two wine regions) → allocation (fn C) assigns it to the
  leg that does it best and gives the other a distinct job, or surfaces the redundancy to the user
  (variety penalty). The board's don't-duplicate strip makes the clash visible.
- **User rejects the arc framing** ("just find me a hotel") → drop to inline single-pick; the 3-beat
  is for trip-shaping, not every lookup. Do not force ceremony.
- **Too few days for the legs** → function E surfaces the conflict ("4 legs in 6 days means no leg
  gets its monopoly — cut a leg or add days?") rather than silently under-allocating.
- **Guard over-probing** → bounded by the load-bearing trigger + the "check state first, never re-ask
  recorded prefs" rule. When unsure whether an attribute is user-stated, read state before probing.
- **Pre-committed leg** (already booked) → its day-budget is fixed; fn E flows the remaining days
  around it; the board marks it locked.
- **claude.ai (no subagents)** → run the strategy-researcher prompt inline/sequentially; the 3-beat,
  guard, and board are runtime-agnostic (consistent with the existing degrade note).
- **Single-writer invariant** preserved: subagents return the leg-identity framing + pace data; only
  the conductor writes `## Trip Architecture`.

---

## 9. Verification / acceptance

- On a multi-leg MEDIUM+ trip, **Phase 2 always produces**, without the user asking for the framing:
  a Leg-Identity table for **all** legs (monopoly · feeling · don't-duplicate · days · candidates ·
  view), a proposed **day-split**, and a **visual arc-board** deliverable.
- After LOCK, **`## Trip Architecture`** exists in the trip file (schema §6) and is **read at the
  start of subsequent per-leg queries** — re-anchoring is visible in the output ("this leg's job is
  X…").
- The **inference guard fires** on a constructed "tiny"-style case: about to bench a strong option on
  an *unstated* attribute → the conductor surfaces a **means→end menu** instead of silently filtering,
  and records the resolved criterion.
- The guard **does not fire** when the attribute is user-stated or excludes nothing strong (no
  questionnaire creep).
- **Single-leg / low-stakes** lookups skip the board and the 3-beat (scale-down verified).
- `agents/strategy-researcher.md` returns the **leg-identity framing + pace/day-reward** data.
- `scripts/score.py` and the Phase 3/3.5/4 pipeline are **unchanged**.

---

## 10. Open questions (resolve during planning)
- **Arc-board ↔ pick-card page relationship**: keep fully separate, or let the arc-board link out to
  each leg's pick-card page once produced? (Lean: separate now; add cross-links later if wanted.)
- **Board palette reuse**: share the `:root` palette / boilerplate from `references/gallery-lightbox.md`,
  or give the arc-board its own minimal stylesheet? (Lean: small shared palette, own layout.)
