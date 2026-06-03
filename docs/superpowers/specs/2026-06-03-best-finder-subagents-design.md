# best-finder — Consolidation + Conductor/Subagent Redesign

**Date:** 2026-06-03
**Status:** Approved design (pre-implementation)
**Scope:** Two coupled changes to the `best-finder` skill: (A) consolidate the
duplicated/drifted copies into one git-tracked source of truth delivered like the
`ei-*` skills, and (B) formalize a conductor + subagent architecture for the discovery
and verification pipeline.

---

## 1. Background & problem

`best-finder` is a conversational, critique-based travel recommender whose thesis is
**agreement across structurally independent sources** beats any single inflated rating.
Its pipeline already fans out parallel "source readers" in Phase 3 and reserves synthesis
for a single conductor.

Two problems motivated this work:

1. **Duplication/drift.** The skill content exists in four places that have already
   diverged:
   - `claude-skills/best-finder/` — bare skill, in git, but **stale + build-patched**
     (older `references/data-sources.md`; `SKILL.md` carries the claude.ai-sandbox state
     path, which is a *build output*, not source).
   - `~/Engineering/projects/best-finder/plugin/skills/best-finder/` — **newest content**,
     **not in git**, and the copy that actually loads (via a plugin marketplace).
   - `~/.claude/plugins/cache/best-finder/best-finder/1.0.0/skills/best-finder/` —
     auto-managed install copy of the above.
   - `~/Engineering/projects/best-finder/dist/best-finder.zip` — built claude.ai artifact
     containing yet another copy.

   Confirmed drift: `data-sources.md` (marketplace copy is newer/richer — verified-2026-06
   Apify access paths, relevance filtering, provenance rules) and the `SKILL.md` state-path
   line (marketplace copy is the canonical Claude Code form; the claude-skills copy is the
   claude.ai-patched form, which would also break `build-chat-zip.py`'s anchor).

2. **best-finder is the odd one out.** The `ei-*` skills are delivered as **symlinked
   personal skills**: canonical content lives in `claude-skills/<skill>/` (git) and is
   exposed to Claude Code via a symlink in `~/.claude/skills/`. best-finder instead uses a
   heavyweight plugin-marketplace rooted outside git — the direct cause of the drift.

## 2. Goals / non-goals

**Goals**
- One git-tracked source of truth for best-finder, delivered identically to `ei-*`.
- Remove the drift surface entirely (no more hand-synced copies).
- Formalize conductor + subagents: a verification gate, a blind adversarial verifier, a
  Phase-2A strategy researcher, and stakes-scaled dispatch.
- Keep the claude.ai zip build path working.

**Non-goals**
- Restructuring how the `ei-*` or `gsd-*` skills are packaged (out of scope).
- Changing the deterministic scoring math in `scripts/score.py`.
- Touching the sibling `best-options-research/` project (separate; only referenced).
- Re-adding marketplace/`claude plugin install` distribution for best-finder (dropped in
  favor of the symlink convention; GitHub distribution remains possible via the
  `claude-skills` repo itself).

## 3. Decisions (locked)

| Decision | Choice |
|---|---|
| Target runtime | **Claude Code primary; claude.ai degrades** to inline-sequential |
| Subagent scope | **All four**: verification gate, blind verifier, strategy researcher, stakes-scaled dispatch |
| Delivery mechanism | **Symlinked personal skill**, like `ei-*` |
| Drift winner | **Newer marketplace-source versions** of `data-sources.md` and `SKILL.md` state-path line |
| Old external project | **Archive, not delete** (it is not in git) |
| `ei-research` real-dir → symlink | **Optional**, offered as a bonus fix |

---

## PHASE A — Consolidation

### A1. Canonical source + drift reconciliation
`claude-skills/best-finder/` is the single source of truth (bare skill layout, matching
`ei-*`: `SKILL.md` + `agents/` + `references/` + `scripts/`). Before any redesign:
- Overwrite `claude-skills/best-finder/references/data-sources.md` with the
  marketplace-source version (the newer Apify content).
- Restore the canonical Claude Code state-path line in `claude-skills/best-finder/SKILL.md`:
  `State lives at \`~/.claude/best-finder/\` and SURVIVES across sessions:` — replacing the
  claude.ai-patched line currently committed. This is also the exact anchor
  (`STATE_OLD`) that `build-chat-zip.py` searches for, so it must match verbatim.
- Diff every other skill file across the two copies; for any additional drift, the
  marketplace-source version wins unless it is itself a build artifact.

Commit message: `consolidate canonical best-finder source (reconcile drift)`.

### A2. Delivery switch
- Create symlink: `~/.claude/skills/best-finder -> …/claude-skills/best-finder`.
- Uninstall the plugin: `claude plugin uninstall best-finder@best-finder`.
- Remove the `best-finder` entry from `~/.claude/plugins/known_marketplaces.json` (and the
  corresponding entry in `installed_plugins.json` if not auto-removed). The cache copy
  becomes inert and may be removed.
- **Destructive/outward steps → confirm with the user before running.**

### A3. Build tooling relocation
- Move `build-chat-zip.py` → `claude-skills/best-finder/build-chat-zip.py`, rewritten so
  `REPO`/`SKILL_SRC` resolve to its own directory (skill files live alongside it, not under
  `plugin/skills/best-finder/`).
- `dist/` is a build artifact → add to `.gitignore`; do not commit the zip.
- Rewrite `README.md` → `claude-skills/best-finder/README.md` describing the **symlink**
  delivery and the claude.ai zip build, removing the obsolete `claude plugin marketplace`
  instructions.

### A4. Retire the external project
After A1–A3 are committed and verified, archive (do not delete) the external copy:
`~/Engineering/projects/best-finder` → `~/Engineering/projects/_archive/best-finder-pre-consolidation/`.
Rationale: it is not in git, so deletion is unrecoverable; archiving is reversible.
**Confirm with the user before moving.** The sibling `best-options-research/` is untouched.

### A5. Optional bonus
Convert `~/.claude/skills/ei-research` (currently a real directory) into a symlink to
`…/claude-skills/ei-research`, matching its siblings — only if the user opts in, and only
after confirming the real dir holds nothing newer than the git copy.

---

## PHASE B — Conductor + subagents

### B1. The conductor (main thread)
The conductor is the main agent the user talks to — **never a subagent**. It owns:
- All interaction: Phase 1 stakes/scoping menus, Phase 2 B/C/D strategy adjustment,
  Phase 5 critique-refine loop.
- **All writes to persistent state** (`USER-PROFILE.md`, `trips/<id>.md`) — single-writer.
  Subagents return data; they never write state (prevents concurrent-append clobbering).
- Dispatch of read/verify subagents, the verification gate, and final synthesis.

### B2. Verification gate (between reader-return and synthesis) — on EVERY run
A mandatory step the conductor performs before tagging or painting any claim. It checks
reader outputs against ground truth, not vibes:
- Every load-bearing URL resolves (no 404 / silent redirect-to-home).
- Each candidate's scores trace to a real, cited listing.
- `[VERIFIED]` is allowed only when ≥2 **genuinely independent** source *types* are present
  (two mirrors of one crowd do not count).
- Citation sanity-check: a mismatched or repeatedly-wrong URL demotes the claim to
  unverified — it is not painted as fact.

Failed claims are **demoted, not silently dropped**, and surfaced in the sourcing-gaps
panel. This formalizes the "relaying ≠ verifying" rule: the conductor verifies subagent
findings against deterministic ground truth before reporting them as conclusions.

### B3. Reader fan-out + new strategy researcher
- Keep the existing parallel source-readers (`agents/source-readers.md`): one per
  independent source type (expert-curation, community, calibrated-crowd, local-language /
  YouTube).
- Add `agents/strategy-researcher.md` — a Phase-2A subagent that researches "how to do X"
  regional consensus (what a region is uniquely best at, canonical visit structure, common
  regrets) and returns a structured digest, keeping its raw reading out of conductor
  context. Same dispatch/return contract as the source-readers.

### B4. Blind adversarial verifier
Add `agents/verifier.md`. Contract:
- **Input:** only the candidate + its evidence bundle (URLs, scores, distribution, source
  types). **Never** the conductor's narrative, fit-verdict, or ranking.
- **Task:** refute the pick — recurring dealbreaker in 1★/3★ text; manufactured-review
  tells; tourist-trap signals; "is this just a chain where the crowd average already
  suffices?"; citation sanity-check.
- **Output:** a structured verdict (refuted / survives + reasons + flags) the conductor
  reconciles against the B2 gate result before finalizing.
Independence is the point — the verifier must not see the conductor's reasoning.

### B5. Stakes-scaled dispatch
The conductor sizes the fleet off the existing Phase 1 stakes gate:

| Stakes | Discovery | Verification |
|---|---|---|
| **Low** | inline, no fan-out (de-biased top pick + one sanity check) | B2 gate only |
| **Medium** | standard parallel readers | B2 gate only |
| **High** | readers + mandatory local-language reader + strategy researcher | B2 gate **+ blind verifier subagent** |

This honors methodology.md's existing warning against over-engineering low-stakes picks.

### B6. claude.ai degrade
SKILL.md prose carries both runtimes in one place, e.g.:
*"In Claude Code, dispatch the readers/verifier in parallel via the Agent tool. In
claude.ai (no subagents), run the same reader/verifier prompts inline and sequentially."*
The verification gate (B2) and stakes-scaling (B5) are runtime-agnostic.
`build-chat-zip.py` continues to apply **only** the state-path patch.

### B7. File changes
- `SKILL.md` — pipeline section gains: the verification gate as **Phase 3.5** (after
  discovery returns, before the Phase 4 data-sufficiency scoring), the stakes-scaled
  dispatch table, and the degrade note. Hard-rules gains "verify before synthesize" and
  "single-writer state."
- `agents/source-readers.md` — add a reference to the conductor-verification contract.
- **new** `agents/verifier.md` (blind adversarial verifier).
- **new** `agents/strategy-researcher.md` (Phase-2A researcher).
- `references/methodology.md` — promote the adversarial pass + citation check from
  "high-stakes only" into the always-on verification gate; cross-link from the gate.
- `scripts/score.py` — unchanged.

---

## 4. Migration order
Sequenced so we never edit a copy that is about to be overwritten:

1. **A1** — reconcile drift into `claude-skills/best-finder`; commit.
2. **B** — apply the subagent redesign to the canonical source; commit.
3. **A2 / A3** — switch delivery to symlink, relocate build tooling, gitignore `dist/`;
   commit. (Outward steps confirmed first.)
4. **Verify** — skill loads via the symlink; `python3 build-chat-zip.py` produces a valid
   zip whose `SKILL.md` carries the patched (claude.ai) state line; `score.py` runs.
5. **A4** — archive the external project (after user confirm).
6. **A5** — optional `ei-research` symlink fix (if opted in).

## 5. Error handling & edge cases
- Destructive/outward actions (plugin uninstall, marketplace dereg, archiving the non-git
  dir) pause for explicit confirmation.
- `build-chat-zip.py` raises if the `STATE_OLD` anchor is missing — A1 guarantees the
  canonical `SKILL.md` carries it verbatim, so the build stays green.
- If a reader/verifier subagent fails or returns nothing (or the user skips it), the
  conductor degrades that source to "unavailable," lowers confidence accordingly, and notes
  it in the sourcing-gaps panel rather than fabricating coverage.
- A subagent must never write persistent state; if state needs updating from a finding, the
  conductor performs the write.

## 6. Verification / acceptance
- `claude-skills/best-finder` is the only hand-maintained copy; `~/.claude/skills/best-finder`
  is a symlink to it; the `best-finder` plugin and marketplace entry are gone.
- `references/data-sources.md` matches the newer (Apify) content; `SKILL.md` carries the
  canonical Claude Code state-path line.
- `SKILL.md` documents the verification gate (Phase 3.5), the stakes-scaled dispatch table,
  and the claude.ai degrade; `agents/verifier.md` and `agents/strategy-researcher.md` exist
  with the contracts above.
- `python3 build-chat-zip.py` produces `dist/best-finder.zip` with the sandbox state path;
  `dist/` is gitignored.
- The external `~/Engineering/projects/best-finder` is archived, not present at its old path.
