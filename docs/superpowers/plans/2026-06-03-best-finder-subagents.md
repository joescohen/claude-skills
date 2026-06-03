# best-finder Consolidation + Conductor/Subagent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the drifted best-finder copies into one git-tracked source delivered like the ei-* skills (symlink), and formalize a conductor + subagent architecture (always-on verification gate, blind adversarial verifier, Phase-2A strategy researcher, stakes-scaled dispatch).

**Architecture:** All edits target the canonical source at `claude-skills/best-finder/`. Work proceeds in order: (1) reconcile drift onto the canonical copy, (2) apply the subagent redesign to that copy, (3) switch delivery to a symlink + relocate build tooling, (4) verify, (5) archive the old external project. This is a documentation/skill-content + filesystem-ops change — there is no unit-test suite. "Tests" here are concrete verification commands with expected output (file diffs, the zip build, `score.py` smoke-run, symlink resolution).

**Tech Stack:** Markdown skill files, a small stdlib Python build script (`build-chat-zip.py`), `git`, shell, `claude plugin` CLI.

**Spec:** `docs/superpowers/specs/2026-06-03-best-finder-subagents-design.md`

**Working branch:** `feat/best-finder-subagents` (already created; the spec commit is on it).

**Key paths:**
- Canonical source: `/home/joescohen/Engineering/projects/claude-skills/best-finder/`
- External (to retire): `/home/joescohen/Engineering/projects/best-finder/` (a plugin marketplace, NOT in git)
- Marketplace skill copy (drift source for reconcile): `/home/joescohen/Engineering/projects/best-finder/plugin/skills/best-finder/`
- Personal-skill symlink dir: `/home/joescohen/.claude/skills/`

---

## Task 1: Reconcile drift onto the canonical source

Adopt the newer marketplace-source versions of the two drifted files so `claude-skills/best-finder` is the true source before any redesign.

**Files:**
- Modify: `best-finder/references/data-sources.md` (replace with marketplace version)
- Modify: `best-finder/SKILL.md:30` (restore canonical Claude Code state-path line)

- [ ] **Step 1: Verify the current drift (pre-state)**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
diff best-finder/SKILL.md /home/joescohen/Engineering/projects/best-finder/plugin/skills/best-finder/SKILL.md
```
Expected: a single hunk at line 30 (claude-skills has the `./best-finder-state/` line; marketplace has `State lives at \`~/.claude/best-finder/\` and SURVIVES across sessions:`).

- [ ] **Step 2: Copy the newer data-sources.md from the marketplace source**

Run:
```bash
cp /home/joescohen/Engineering/projects/best-finder/plugin/skills/best-finder/references/data-sources.md \
   best-finder/references/data-sources.md
sha1sum best-finder/references/data-sources.md
```
Expected: sha1 = `3c0616f46737b9463cfa9358596f0981c7090668`

- [ ] **Step 3: Restore the canonical Claude Code state-path line in SKILL.md**

Replace the single line at `best-finder/SKILL.md:30`.

Old line (exact):
```
State lives in `./best-finder-state/` (the conversation's working directory). In claude.ai this persists *within* a conversation/project but does NOT carry across separate chats — re-upload or paste your `USER-PROFILE.md` to resume. (In Claude Code this skill instead uses `~/.claude/best-finder/`.):
```
New line (exact):
```
State lives at `~/.claude/best-finder/` and SURVIVES across sessions:
```

- [ ] **Step 4: Verify SKILL.md now matches canonical and the build anchor is present**

Run:
```bash
diff best-finder/SKILL.md /home/joescohen/Engineering/projects/best-finder/plugin/skills/best-finder/SKILL.md && echo "IDENTICAL"
grep -c 'State lives at `~/.claude/best-finder/` and SURVIVES across sessions:' best-finder/SKILL.md
```
Expected: `IDENTICAL` printed, and grep prints `1` (this exact string is the `STATE_OLD` anchor `build-chat-zip.py` requires).

- [ ] **Step 5: Commit**

```bash
git add best-finder/SKILL.md best-finder/references/data-sources.md
git commit -m "fix(best-finder): reconcile drift — adopt newer canonical source

- data-sources.md: adopt marketplace version (verified-2026-06 Apify access paths)
- SKILL.md: restore canonical Claude Code state-path line (also fixes build-chat-zip anchor)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Add the blind adversarial verifier agent

**Files:**
- Create: `best-finder/agents/verifier.md`

- [ ] **Step 1: Create the verifier agent file**

Create `best-finder/agents/verifier.md` with exactly:

```markdown
# Blind adversarial verifier (high-stakes dispatch — one per finalist pick)

Dispatched by the conductor AFTER the verification gate, on HIGH-stakes runs only, to
stress-test a finalist before it is presented. **Isolation is the contract:** this agent
receives ONLY the candidate and its evidence bundle — never the conductor's narrative,
fit-verdict, ranking, or the user's stated preference for it. An attached skeptic is not a
skeptic. Use `general-purpose` (or `compound-engineering:ce-web-researcher` if it must
re-fetch sources).

## Input the conductor injects (and NOTHING else)
- Candidate: name, exact location, category, dates/seasonality.
- Evidence bundle: every load-bearing URL, each platform's mean + review count + recency +
  sub-scores, the rating distribution/histogram if obtained, the source TYPES claimed, and
  the verbatim text snippets the readers relied on.
- The category/region buying-criteria (so it knows what "good" means here).
- Output path: `runs/<trip>/raw/verify-<candidate>.md`.

## Task — try to REFUTE the pick
Default to skepticism; the burden is on the evidence to survive. Hunt:
1. **Recurring dealbreaker** — a complaint that repeats across independent 1★/3★ reviews
   (not a one-off): noise, smell, service, "photos lie," location reality.
2. **Manufactured-review tells** — single-review accounts, uniform phrasing ("great food,
   great service, great atmosphere"), a 5★ burst after mixed history, generic superlatives
   with no specifics, thin volume propping a high mean.
3. **Tourist-trap / inflation signals** — high mean on a bimodal distribution, score-vs-text
   divergence (headline 4.6, complaint text says otherwise), proximity-to-landmark premium.
4. **"Is the crowd score already enough?"** — if this is a chain or a low-variance commodity
   choice, say so: the anti-inflation machinery may be over-engineering a safe pick.
5. **Citation sanity-check** — open each load-bearing URL. A 404, a redirect-to-home, or a
   page that does not actually support the claim → mark that claim UNVERIFIED. Repeated
   mismatches → treat the whole bundle as suspect.

## Return (structured digest — the conductor reconciles it against the gate)
- **Verdict:** `survives` | `survives-with-caveats` | `refuted`.
- **Dealbreakers found** (with the verbatim quote + resolving URL for each).
- **Fake/inflation tells** observed, and on which platform.
- **Citation failures** (URLs that did not resolve or did not support the claim).
- **"Already-a-safe-bet?"** call, if applicable.
- Do NOT write to USER-PROFILE.md or the trip file — return findings; the conductor decides.
```

- [ ] **Step 2: Verify the file exists and is well-formed**

Run:
```bash
test -f best-finder/agents/verifier.md && head -1 best-finder/agents/verifier.md
grep -c "Isolation is the contract" best-finder/agents/verifier.md
```
Expected: the title line prints, and grep prints `1`.

- [ ] **Step 3: Commit**

```bash
git add best-finder/agents/verifier.md
git commit -m "feat(best-finder): add blind adversarial verifier agent

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Add the Phase-2A destination-strategy researcher agent

**Files:**
- Create: `best-finder/agents/strategy-researcher.md`

- [ ] **Step 1: Create the strategy-researcher agent file**

Create `best-finder/agents/strategy-researcher.md` with exactly:

```markdown
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
- Output path: `runs/<trip>/raw/strategy-<region>.md`.

## Task — synthesize expert + community wisdom into a regional strategy brief
1. **What the region is uniquely best at** — ranked world-class-here vs just-okay-here, so
   interests can be allocated to where they actually pay off. Ground every claim in a source.
2. **Canonical way to structure a visit** — where to base, day-trip patterns, realistic pace,
   key logistics (drive times, when things close, seasonality traps).
3. **"If you only do 3 things"** — the consensus high-value experiences.
4. **Common mistakes / regrets** — what experienced visitors warn against (over-packing the
   itinerary, the overrated must-see, the wrong base town).
5. **Candidate unstated criteria (Kano/VFT)** — dimensions the user did not list but likely
   cares about given the offering (e.g., "wine" → tasting vs scenery vs harvest vs romance),
   surfaced as proposals, not assumptions.

## Return (dense digest — the conductor turns it into the strategy menus)
- Ranked "uniquely-best-at" list with source URLs per claim.
- Visit-structure synthesis (base options, day-trip map, pace, logistics) with sources.
- "If you only do 3 things" + the overrated/avoid list.
- Proposed unstated criteria to put to the user.
- Self-graded source quality + gaps.
- Do NOT write persistent state — return the digest; the conductor presents and captures.
```

- [ ] **Step 2: Verify the file exists and is well-formed**

Run:
```bash
test -f best-finder/agents/strategy-researcher.md && head -1 best-finder/agents/strategy-researcher.md
grep -c "uniquely best at" best-finder/agents/strategy-researcher.md
```
Expected: the title line prints, and grep prints `1`.

- [ ] **Step 3: Commit**

```bash
git add best-finder/agents/strategy-researcher.md
git commit -m "feat(best-finder): add Phase-2A destination-strategy researcher agent

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 4: Wire the new architecture into SKILL.md

Six exact edits: the pipeline block (add Phase 3.5), Phase 2 (strategy researcher), Phase 3 (stakes-scaled dispatch + runtime degrade + fix stale Reddit `.json` reference), new Phase 3.5 section, hard rules (two new rules), references list (two new agents).

**Files:**
- Modify: `best-finder/SKILL.md`

- [ ] **Step 1: Edit the pipeline ASCII block (Phase list)**

Old:
```
STEP 0  Load state (profile + active trip)            ← always
PHASE 1 Scope + Stakes (option-menus)
PHASE 2 Destination Strategy   → references/strategy.md
PHASE 3 Discovery (convergence engine)  → references/methodology.md + agents/
PHASE 4 Data-Sufficiency Gate (confidence tiers)
PHASE 5 Painted-picture output + critique-refine loop  → references/output-style.md
(capture needs continuously across all phases)
```
New:
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

- [ ] **Step 2: Edit the PHASE 2 section — dispatch the strategy researcher**

Old:
```
### PHASE 2 — Destination Strategy (`references/strategy.md`)
Before hunting venues, build the strategy: (A) "how to do X" consensus, (B) preference↔offering
fit, (C) trip-level allocation across legs (capitalize where each excels; avoid redundancy/
variety-penalty; Peak-End sequencing), (D) surface missing criteria the user didn't list.
Present it; let the user adjust via menus. THEN discover venues for the refined, allocated interests.
```
New:
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

- [ ] **Step 3: Edit the PHASE 3 section — stakes-scaled dispatch + runtime degrade + Reddit fix**

Old:
```
### PHASE 3 — Discovery (`references/methodology.md`, `agents/`)
Dispatch one reader per **independent source type** in parallel (expert-curation, community,
calibrated-crowd, + local-language / YouTube where relevant). Each returns candidates + raw
signals + a self-reported richness. Use the **$0 data stack** in `references/data-sources.md`
(native WebSearch/WebFetch → Jina → Claude-in-Chrome for the rating histogram → Reddit `.json`,
YouTube). Reuse local hotel MCPs (trivago/DirectBooker) for stays.
```
New:
```
### PHASE 3 — Discovery (`references/methodology.md`, `agents/`)
**Stakes-scaled dispatch** (size the fleet off the Phase 1 stakes gate):

| Stakes | Discovery | Verification (Phase 3.5 / verifier) |
|---|---|---|
| Low    | inline — de-biased top pick + one sanity check, no fan-out | gate only |
| Medium | parallel readers (expert-curation, community, calibrated-crowd) | gate only |
| High   | readers + mandatory local-language reader + `agents/strategy-researcher.md` | gate + `agents/verifier.md` |

Dispatch one reader per **independent source type** (see `agents/source-readers.md`). Each
returns candidates + raw signals + a self-reported richness, and writes a raw file. Use the
**$0 data stack** in `references/data-sources.md` (native WebSearch/WebFetch → Jina →
Claude-in-Chrome for the rating histogram → Apify for Reddit + rating distributions →
YouTube). Reuse local hotel MCPs (trivago/DirectBooker) for stays.

**Runtime:** in Claude Code, dispatch readers/verifier in parallel via the Agent tool; in
claude.ai (no subagents), run the same reader/verifier prompts inline and sequentially. The
verification gate and stakes-scaling are identical in both.
```

- [ ] **Step 4: Insert the new PHASE 3.5 section (immediately before `### PHASE 4`)**

Find this line:
```
### PHASE 4 — Data-Sufficiency Gate (`references/methodology.md`)
```
Insert the following block immediately BEFORE it:
```
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

```

- [ ] **Step 5: Edit the Hard rules section — add two rules**

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
- Independent-source convergence over any single score. Read distribution where obtainable.
- **Verify before synthesize.** Validate reader claims (URLs resolve, scores trace, ≥2 truly
  independent types) at the Phase 3.5 gate before painting or tagging `[VERIFIED]`.
- **Single-writer state.** Only the conductor writes `USER-PROFILE.md` / trip files; subagents
  return data, never write state.
```

- [ ] **Step 6: Edit the References list — add the two new agent files**

Old:
```
- `agents/source-readers.md` — the parallel reader agent prompts.
- `scripts/score.py` — deterministic scoring (Bayesian shrinkage, within-platform percentile, convergence).
```
New:
```
- `agents/source-readers.md` — the parallel reader agent prompts.
- `agents/strategy-researcher.md` — Phase-2A "how to do X" regional-consensus researcher.
- `agents/verifier.md` — blind adversarial verifier (high-stakes finalist stress-test).
- `scripts/score.py` — deterministic scoring (Bayesian shrinkage, within-platform percentile, convergence).
```

- [ ] **Step 7: Verify all edits landed and the build anchor is intact**

Run:
```bash
grep -n "PHASE 3.5" best-finder/SKILL.md
grep -c "agents/strategy-researcher.md" best-finder/SKILL.md
grep -c "agents/verifier.md" best-finder/SKILL.md
grep -c "Verify before synthesize" best-finder/SKILL.md
grep -c "Single-writer state" best-finder/SKILL.md
grep -c "Apify for Reddit" best-finder/SKILL.md
grep -c 'State lives at `~/.claude/best-finder/` and SURVIVES across sessions:' best-finder/SKILL.md
```
Expected, command by command:
- `grep -n "PHASE 3.5"` → **2** matching lines (pipeline block + the `### PHASE 3.5` section header; the Phase 3 table uses "Phase 3.5", which is case-different and not counted here).
- `grep -c "agents/strategy-researcher.md"` → **4** (pipeline block, Phase 2 sentence, Phase 3 table High row, references list).
- `grep -c "agents/verifier.md"` → **2** (Phase 3 table High row, references list).
- `grep -c "Verify before synthesize"` → **1**.
- `grep -c "Single-writer state"` → **1**.
- `grep -c "Apify for Reddit"` → **1**.
- `grep -c 'State lives at \`~/.claude/best-finder/\` and SURVIVES across sessions:'` → **1** (the build anchor is intact).

If any count is `0`, that edit was missed — go back and apply it.

- [ ] **Step 8: Commit**

```bash
git add best-finder/SKILL.md
git commit -m "feat(best-finder): wire conductor verification gate + stakes-scaled dispatch into SKILL.md

Adds Phase 3.5 verification gate, stakes-scaled dispatch table, strategy-researcher
and verifier references, single-writer-state + verify-before-synthesize hard rules,
claude.ai degrade note. Fixes stale Reddit .json reference to Apify.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 5: Promote the verification gate in methodology.md

Split the current "high-stakes only" adversarial section into an always-on gate plus a high-stakes blind verifier.

**Files:**
- Modify: `best-finder/references/methodology.md`

- [ ] **Step 1: Replace the adversarial-verification section**

Old:
```
## Adversarial verification (high-stakes only)
A skeptic pass on the top pick: hunt the recurring dealbreaker in 1★/3★, manufactured-review tells,
tourist-trap signals, "is this just a chain where the crowd score is already enough?", and a
**citation sanity-check** (mismatched/again-wrong URLs → treat the claim as unverified).
```
New:
```
## Verification gate (ALWAYS-ON — between reader-return and scoring)
Relaying reader output is not verifying it. On EVERY run, before scoring or tagging, the
conductor checks reader claims against ground truth:
- every load-bearing URL resolves (no 404 / redirect-to-home);
- each candidate's scores trace to a real, cited listing;
- `[VERIFIED]` only when ≥2 genuinely independent source TYPES are present (not two mirrors
  of one crowd);
- **citation sanity-check** — a mismatched/again-wrong URL demotes the claim to unverified.
Failed claims are demoted (surfaced in the sourcing-gaps panel), never silently dropped.

## Adversarial verifier (HIGH-stakes only — `agents/verifier.md`)
On top of the gate, a BLIND skeptic subagent stress-tests each finalist. It sees only the
candidate + evidence bundle (never the conductor's narrative), and tries to refute it: the
recurring dealbreaker in 1★/3★, manufactured-review tells, tourist-trap signals, "is this
just a chain where the crowd score is already enough?", plus its own citation sanity-check.
The conductor reconciles its verdict against the gate before finalizing.
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -c "Verification gate (ALWAYS-ON" best-finder/references/methodology.md
grep -c "Adversarial verifier (HIGH-stakes only" best-finder/references/methodology.md
```
Expected: each prints `1`.

- [ ] **Step 3: Commit**

```bash
git add best-finder/references/methodology.md
git commit -m "feat(best-finder): promote citation/independence verification to an always-on gate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 6: Reference the verification gate from source-readers.md

**Files:**
- Modify: `best-finder/agents/source-readers.md`

- [ ] **Step 1: Edit the dispatch preamble**

Old:
```
Dispatch all relevant readers in ONE message (parallel). Each returns candidates + raw signals +
a self-reported richness, and writes a raw file. Conductor alone synthesizes (never dump raw output).
```
New:
```
Dispatch all relevant readers in ONE message (parallel). Each returns candidates + raw signals +
a self-reported richness, and writes a raw file. Conductor alone synthesizes (never dump raw
output) — and FIRST runs the Phase 3.5 verification gate on every reader claim (URLs resolve,
scores trace, ≥2 independent types) before scoring; see `references/methodology.md`.
```

- [ ] **Step 2: Verify**

Run:
```bash
grep -c "Phase 3.5 verification gate" best-finder/agents/source-readers.md
```
Expected: `1`.

- [ ] **Step 3: Commit**

```bash
git add best-finder/agents/source-readers.md
git commit -m "docs(best-finder): point source-readers at the Phase 3.5 verification gate

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 7: Relocate build tooling, add README, gitignore the build artifact

Move the claude.ai zip builder into the canonical source so it reads from its own dir; add a README describing symlink delivery; ignore `best-finder/dist/`.

**Files:**
- Create: `best-finder/build-chat-zip.py`
- Create: `best-finder/README.md`
- Modify: `.gitignore`

- [ ] **Step 1: Create the relocated build script**

Create `best-finder/build-chat-zip.py` with exactly:

```python
#!/usr/bin/env python3
"""Build dist/best-finder.zip for upload to claude.ai (Settings -> Capabilities -> Skills).

The skill now lives alongside this script (canonical source in claude-skills/best-finder/).
This rewrites the persistent-state path to be sandbox-safe (claude.ai has no
~/.claude/best-finder), and zips the skill with the skill folder at the archive root.
Re-run after editing the skill to refresh the upload artifact.
"""
import os
import zipfile

REPO = os.path.dirname(os.path.abspath(__file__))   # claude-skills/best-finder/
OUT = os.path.join(REPO, "dist", "best-finder.zip")

# Only these are the skill; everything else in REPO (this script, README, dist/) is excluded.
SKILL_ROOT_FILES = ["SKILL.md"]
SKILL_DIRS = ["references", "agents", "scripts"]

# (anchor in SKILL.md, sandbox-safe replacement)
STATE_OLD = "State lives at `~/.claude/best-finder/` and SURVIVES across sessions:"
STATE_NEW = (
    "State lives in `./best-finder-state/` (the conversation's working directory). "
    "In claude.ai this persists *within* a conversation/project but does NOT carry across "
    "separate chats — re-upload or paste your `USER-PROFILE.md` to resume. "
    "(In Claude Code this skill instead uses `~/.claude/best-finder/`.):"
)


def patched_skill_md(path):
    with open(path, encoding="utf-8") as f:
        s = f.read()
    if STATE_OLD not in s:
        raise SystemExit(f"anchor line not found in {path}; update STATE_OLD")
    return s.replace(STATE_OLD, STATE_NEW)


def _add_file(z, full, arc):
    if os.path.basename(full) == "SKILL.md":
        z.writestr(arc, patched_skill_md(full))
    else:
        z.write(full, arc)


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for name in SKILL_ROOT_FILES:
            _add_file(z, os.path.join(REPO, name), os.path.join("best-finder", name))
        for d in SKILL_DIRS:
            src = os.path.join(REPO, d)
            for root, dirs, files in os.walk(src):
                dirs[:] = [x for x in dirs if x != "__pycache__"]
                for fn in files:
                    if fn.endswith(".pyc"):
                        continue
                    full = os.path.join(root, fn)
                    rel = os.path.relpath(full, REPO)
                    _add_file(z, full, os.path.join("best-finder", rel))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Create the README**

Create `best-finder/README.md` with exactly:

````markdown
# best-finder

A Claude **skill** that finds genuinely *best* restaurants / stays / experiences and helps
plan trips — defeating rating inflation via **agreement across structurally independent
sources** (expert/editorial + niche-community + a de-biased crowd score). Guided
option-menus at every step, a destination-strategy layer, painted-picture output, and
continuous needs-capture.

## Layout

```
best-finder/                     ← canonical source (in the claude-skills repo, git-tracked)
├── SKILL.md
├── references/                  (methodology, strategy, data-sources, output-style)
├── agents/                      (source-readers, strategy-researcher, verifier)
├── scripts/score.py             (deterministic scoring engine)
├── build-chat-zip.py            (builds the claude.ai upload artifact)
└── dist/best-finder.zip         (build output — gitignored)
```

## Use in Claude Code

Exposed as a personal skill via a symlink (same pattern as the ei-* skills):

```bash
ln -s "$PWD/best-finder" ~/.claude/skills/best-finder
```

Edit the skill in place — changes are picked up on the next session. Persistent state lives
in `~/.claude/best-finder/` (`USER-PROFILE.md` + `trips/`) and is intentionally **not** part
of this repo.

## Use in claude.ai chat

claude.ai accepts the same SKILL.md format. Build/refresh the uploadable zip (it rewrites the
state path to be sandbox-safe):

```bash
python3 build-chat-zip.py     # writes dist/best-finder.zip
```

Then in claude.ai: **Settings → Capabilities → Skills → upload** `dist/best-finder.zip`.
In the chat sandbox, state (`./best-finder-state/`) persists only within a
conversation/project — re-upload or paste your `USER-PROFILE.md` to resume.

## Conductor + subagents

best-finder runs as a conductor (the main thread — owns all interaction and the only writer
of persistent state) that dispatches read/verify subagents:
`agents/source-readers.md` (parallel discovery), `agents/strategy-researcher.md` (Phase-2A
regional consensus), `agents/verifier.md` (blind adversarial finalist check). Dispatch is
stakes-scaled (see SKILL.md Phase 3). The conductor runs an always-on Phase 3.5 verification
gate (URLs resolve, scores trace, ≥2 independent types) before scoring — relaying ≠ verifying.
````

- [ ] **Step 3: Gitignore the build artifact**

Add a re-ignore line for the build output. In `.gitignore`, find:
```
!best-finder/
!best-finder/**
```
Add immediately AFTER those two lines:
```
best-finder/dist/
```

- [ ] **Step 4: Verify the build script runs and ignores work**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills
python3 best-finder/build-chat-zip.py
unzip -l best-finder/dist/best-finder.zip
git check-ignore best-finder/dist/best-finder.zip
git status --short
```
Expected: prints `wrote .../best-finder/dist/best-finder.zip`; the zip listing shows `best-finder/SKILL.md`, `best-finder/agents/*`, `best-finder/references/*`, `best-finder/scripts/score.py` and does NOT contain `build-chat-zip.py` or `README.md`; `git check-ignore` echoes the dist path (confirming it's ignored); `git status` shows only `best-finder/build-chat-zip.py`, `best-finder/README.md`, and `.gitignore` as changes (no `dist/`).

- [ ] **Step 5: Verify the zipped SKILL.md carries the sandbox state path**

Run:
```bash
unzip -p best-finder/dist/best-finder.zip best-finder/SKILL.md | grep -c "State lives in \`./best-finder-state/\`"
unzip -p best-finder/dist/best-finder.zip best-finder/SKILL.md | grep -c "State lives at \`~/.claude/best-finder/\`"
```
Expected: first prints `1` (patched for claude.ai), second prints `0` (original line was replaced in the zip only).

- [ ] **Step 6: Commit**

```bash
git add .gitignore best-finder/build-chat-zip.py best-finder/README.md
git commit -m "build(best-finder): relocate claude.ai zip builder + README into canonical source

Reads skill from its own dir; gitignore best-finder/dist/ build artifact.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 8: Switch delivery to a symlink (OUTWARD — confirm before running)

> ⚠️ This task changes the live environment: it makes best-finder load from `claude-skills` and removes the plugin install. **Pause and get explicit user confirmation before Step 2 onward.**

**Files:** none in-repo (environment changes under `~/.claude/`).

- [ ] **Step 1: Pre-state snapshot**

Run:
```bash
ls -la ~/.claude/skills/ | grep -E "best-finder|ei-"
cat ~/.claude/plugins/known_marketplaces.json | grep -A4 '"best-finder"'
```
Expected: best-finder is NOT yet in `~/.claude/skills/`; a `best-finder` marketplace entry exists.

- [ ] **Step 2: Create the personal-skill symlink**

Run:
```bash
ln -s /home/joescohen/Engineering/projects/claude-skills/best-finder /home/joescohen/.claude/skills/best-finder
readlink ~/.claude/skills/best-finder
test -f ~/.claude/skills/best-finder/SKILL.md && echo "RESOLVES"
```
Expected: `readlink` prints the claude-skills path; `RESOLVES` prints.

- [ ] **Step 3: Uninstall the plugin and deregister the marketplace**

Try the CLI first:
```bash
claude plugin uninstall best-finder@best-finder
claude plugin marketplace remove best-finder
```
If either subcommand is unavailable/errors, do it manually by removing the `best-finder` keys from both JSON files (use an editor or `python3 -c` to load/del/dump):
- `~/.claude/plugins/installed_plugins.json` → delete the `"best-finder@best-finder"` entry under `plugins`.
- `~/.claude/plugins/known_marketplaces.json` → delete the top-level `"best-finder"` entry.
Then optionally remove the now-inert cache: `rm -rf ~/.claude/plugins/cache/best-finder`.

- [ ] **Step 4: Verify the plugin is gone and the symlink is the live source**

Run:
```bash
grep -c '"best-finder"' ~/.claude/plugins/known_marketplaces.json
grep -c 'best-finder@best-finder' ~/.claude/plugins/installed_plugins.json
readlink ~/.claude/skills/best-finder
grep -c "PHASE 3.5" ~/.claude/skills/best-finder/SKILL.md
```
Expected: first two print `0`; `readlink` prints the claude-skills path; last prints `2` (the live skill via symlink now has the redesign).

No commit (environment-only changes).

---

## Task 9: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Skill resolves via symlink with the new architecture**

Run:
```bash
head -1 ~/.claude/skills/best-finder/SKILL.md
test -f ~/.claude/skills/best-finder/agents/verifier.md && echo "verifier OK"
test -f ~/.claude/skills/best-finder/agents/strategy-researcher.md && echo "strategy OK"
```
Expected: `# best-finder`; `verifier OK`; `strategy OK`.

- [ ] **Step 2: Scoring engine still runs (smoke test)**

Run:
```bash
echo '{"category_global_mean":4.15,"shrink_m":50,"candidates":[{"name":"X","platforms":[{"platform":"google","mean":4.6,"count":820,"platform_mean":4.2,"newest_review_age_days":20,"distribution":{"5":600,"4":120,"3":40,"2":20,"1":40}}],"source_types":["expert","community","crowd"],"text_depth":14,"burst_flag":false}]}' | python3 ~/.claude/skills/best-finder/scripts/score.py
```
Expected: JSON with a `ranked` array, one entry `"name": "X"`, `"confidence": "HIGH"`, numeric `final_score`.

- [ ] **Step 3: claude.ai zip builds clean from the canonical source**

Run:
```bash
cd /home/joescohen/Engineering/projects/claude-skills && python3 best-finder/build-chat-zip.py && echo "BUILD OK"
```
Expected: `wrote .../dist/best-finder.zip` then `BUILD OK` (no anchor error).

- [ ] **Step 4: Confirm git tree is clean and branch history is coherent**

Run:
```bash
git status --short
git log --oneline -9
```
Expected: clean working tree (dist/ ignored); commits for spec + Tasks 1–7 present in order.

No commit.

---

## Task 10: Archive the external project (OUTWARD/IRREVERSIBLE — confirm before running)

> ⚠️ `~/Engineering/projects/best-finder` is NOT in git. Archive (move), do not delete. **Get explicit user confirmation before running.**

**Files:** none in-repo.

- [ ] **Step 1: Final safety check — nothing unique left behind**

Run:
```bash
diff -rq /home/joescohen/Engineering/projects/best-finder/plugin/skills/best-finder \
         /home/joescohen/Engineering/projects/claude-skills/best-finder \
  --exclude=build-chat-zip.py --exclude=README.md --exclude=dist
ls /home/joescohen/Engineering/projects/best-finder
```
Expected: skill content matches (only the intentionally-added build-chat-zip.py / README.md / dist differ, which now live in claude-skills); review the remaining top-level files (README.md, build-chat-zip.py, dist/, .claude-plugin/) — all reproduced or intentionally dropped.

- [ ] **Step 2: Move to archive**

Run:
```bash
mkdir -p /home/joescohen/Engineering/projects/_archive
mv /home/joescohen/Engineering/projects/best-finder \
   /home/joescohen/Engineering/projects/_archive/best-finder-pre-consolidation
ls -d /home/joescohen/Engineering/projects/best-finder 2>&1 || echo "OLD PATH GONE"
ls -d /home/joescohen/Engineering/projects/_archive/best-finder-pre-consolidation && echo "ARCHIVED"
```
Expected: `OLD PATH GONE` and `ARCHIVED`.

- [ ] **Step 3: Confirm the live skill is unaffected by the move**

Run:
```bash
test -f ~/.claude/skills/best-finder/SKILL.md && echo "LIVE SKILL OK"
```
Expected: `LIVE SKILL OK` (the symlink points at claude-skills, not the archived dir).

No commit.

---

## Task 11 (OPTIONAL): Fix the ei-research symlink inconsistency

> Only if the user opts in. `~/.claude/skills/ei-research` is a real directory, not a symlink like its siblings.

**Files:** none in-repo.

- [ ] **Step 1: Confirm the git copy is not behind the real dir**

Run:
```bash
diff -rq ~/.claude/skills/ei-research \
         /home/joescohen/Engineering/projects/claude-skills/ei-research
```
Expected: no differences (identical). If there ARE differences, STOP and surface them — the real dir may hold unmerged edits to preserve first.

- [ ] **Step 2: Replace the real dir with a symlink**

Run:
```bash
rm -rf ~/.claude/skills/ei-research
ln -s /home/joescohen/Engineering/projects/claude-skills/ei-research /home/joescohen/.claude/skills/ei-research
readlink ~/.claude/skills/ei-research && echo "SYMLINKED"
```
Expected: prints the claude-skills path and `SYMLINKED`.

No commit (environment-only).

---

## Final: push the branch / open PR (when the user asks)

After Tasks 1–10 are green, offer to push `feat/best-finder-subagents` and open a PR against `main` (matching the repo's PR-merge convention). Do not push without the user's go-ahead.
