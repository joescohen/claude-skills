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
