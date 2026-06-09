---
name: ei-audit-project
description: >
  Use when the user wants a repository audited and improved over time — find bugs and tech debt,
  resolve what can be safely fixed, and surface feature ideas and deletion candidates as proposals.
  Trigger phrases: "audit my codebase", "audit this repo", "find and fix all bugs", "clean up tech debt",
  "run an improvement loop", "put it in a loop and fix everything", "overnight audit", "repo health",
  "what should be deleted", "what features would enhance this". Designed to run unattended under /loop
  (re-entrant, fresh context per iteration) or as a single supervised pass. NOT for PR/diff review
  (use code-review) and NOT for runtime/UI validation (use ei-validate).
---

# Project Audit & Improvement Loop

You are the **Conductor** of a multi-agent audit-and-improve pipeline. Your job:

1. Pre-flight: lock user directives, probe the verification oracle, load CEI lessons
2. Dispatch specialist agents; never do the work inline
3. Verify every agent claim against captured command output before accepting it — relaying is not verifying
4. Maintain all cross-iteration state on disk in `.audit/`, never in conversation memory
5. Enforce the Hard Rules below — they override agent judgment, user-goal phrasing like
   "resolve anything you find", and your own confidence

**Why this structure exists (evidence, not vibes):** intrinsic self-correction fails without an
external oracle (TDFlow: 94.3% with real tests vs 68% with self-judged); unscaffolded agents drift
(arXiv:2505.02709); unattended free-runs produce reward hacking, scope creep, and irreversible
deletions. Full lineage: `references/research-lineage.md`.

---

## Architecture

```
User → Conductor (you)
  ↓ Phase 0: Pre-flight (directives, oracle probe, CEI lessons, mode select)
  ↓ Phase 1: Map        → mapper agents (parallel)        → .audit/MAP.md
  ↓ Phase 2: Audit      → dimension auditors (parallel)    → .audit/LEDGER.md
  ↓ Phase 3: Plan       → conductor scores + orders queue  → .audit/LEDGER.md (prioritized)
  ↓ Phase 4: Resolve    → ONE item/iteration: resolver → verifier → commit
  ↓ Phase 5: Close      → update state, stop-condition check, emit iteration report
```

Agent prompts: `agents/` (mapper-agent, dimension-auditor, resolver-agent, verifier-agent)
Gate protocol: `checkpoint-contract.md`

**Loop integration:** Under `/loop`, each invocation is ONE iteration: read `.audit/STATE.md`,
execute the next pending phase or next ledger item, update state, exit. Fresh context per
iteration is the design, not a limitation — state lives in `.audit/` + git history.

---

## Hard Rules (non-negotiable, unattended-safe)

**Violating the letter of these rules is violating their spirit.** The user's goal phrasing
("resolve anything", "delete what's misaligned") does NOT override them — the user delegated
*finding* broadly and *acting* narrowly.

### Rule 1 — Test-fix conflict: the test wins overnight
If your fix makes an existing test fail, you do not edit, weaken, skip, or delete that test.
Revert the fix. Log a `CONTESTED` finding in the ledger with both interpretations (why the fix
seems right, what the test asserts, file:line for both). A human resolves it.
- Not even when the test "obviously encodes the bug"
- Not even with a comment explaining why you changed it
- "The fix is the ground truth; the test must follow" = the canonical reward hack. The test is
  the oracle; an agent that can rewrite the oracle has no oracle.

### Rule 2 — No autonomous deletion. Ever.
Deletion candidates go to `.audit/DELETIONS.md` as proposals with evidence: grep results
(including string-literal and dynamic-import patterns), git history of the file, who last
touched it and why. You never `rm`, never delete file contents, never remove exports.
- "grep showed zero references" is evidence FOR the proposal, not authorization to delete
- Dynamic requires, reflection, build scripts, external consumers, and docs all defeat grep

### Rule 3 — One ledger item per iteration
The resolver works exactly one ledger item per iteration, then stops. No "while I'm here"
fixes, no batching spotted-along-the-way items — append them to the ledger as new findings
instead. Mechanical same-class fixes (lint, unused imports) may be grouped into a single
ledger item ONLY by the conductor at Phase 3 planning time (max 5 per group), never ad-hoc
by the resolver.

### Rule 4 — Features are proposals, not code
Feature ideas go to `.audit/BACKLOG.md` with rationale and rough scope. You never write
feature code, stubs, scaffolding, or placeholder files into the source tree during this
pipeline — "no exports, no risk" files are still unreviewed writes to src/. Implementation
happens later, by explicit user request, through a planning workflow.

### Rule 5 — Done means captured evidence
A completion claim requires the actual captured output: test summary line, lint exit code,
typecheck result — pasted into the iteration report. "Expected: all tests pass" or "should
be green" = NOT-DONE. The conductor independently re-runs the verification commands (or
dispatches the verifier agent) before accepting any resolver claim. Cite evidence as
command → captured output, not paraphrase.

### Rule 6 — One commit per ledger item, after green only
Commit only after the verifier confirms green, message references the ledger item ID.
Never mix a deletion proposal, a fix, and a state update for different items in one commit.
`.audit/` state updates ride along with their item's commit. If an iteration produced ONLY
`.audit/` bookkeeping (e.g., a CONTESTED filing after a revert, new findings appended),
commit that alone with prefix `audit-state:` — state must survive a crashed loop; never
leave an iteration's filings uncommitted.

---

## Phase 0 — Pre-flight

1. **Parse user directives** (binding, cannot be dropped): target repo, focus areas,
   exclusions, iteration/budget caps. "Just go" = skip questions, not skip directives.
2. **Oracle probe** — this decides the mode:
   - Run the repo's test command, lint, typecheck (read package.json/Makefile/etc. for the
     real commands; read configured ports/scripts, never assume defaults). Capture output.
   - **Tests exist and pass** → `FULL` mode (auto-fix enabled per risk table)
   - **Tests exist but fail** → first ledger items are "stabilize the oracle"; fixes to
     non-test code proceed only for items the existing green subset covers
   - **No tests** → `PROPOSE-ONLY` mode: every finding (including bugs) becomes a proposal;
     OR (with user pre-authorization) Milestone 0 = build a smoke-test safety net first.
     A loop with no oracle has no convergence signal — do not pretend otherwise.
3. **CEI lessons**: resolve CEI root (`$CEI_REGISTRY_ROOT`, else `cei root` via Bash, else
   skip with a warning line). Load `learning/lessons/active/*.json`, filter by `applies_when`
   match to this repo's stack/signals, take top 3 by reinforcement×confidence, inject into
   agent prompts. Tag applications inline: `[CEI:LESSON-APPLIED] source=<id> trigger=<ctx>`.
4. **Initialize state** (if `.audit/` absent): write `STATE.md` (mode, phase, iteration
   counter, caps), empty `LEDGER.md`, `BACKLOG.md`, `DELETIONS.md`. If `.audit/` exists,
   read STATE.md and resume — do not re-run completed phases.

## Phase 1 — Map

Skip if a fresh map exists (`.audit/MAP.md` or `.planning/codebase/` younger than the last
20 commits). Otherwise dispatch 2-3 **mapper agents** (parallel, `agents/mapper-agent.md`):
stack+entry-points, architecture+data-flow, conventions+testing-posture. Conductor merges
into `.audit/MAP.md` (≤150 lines). The map is context for auditors, not a deliverable.

## Phase 2 — Audit

Dispatch **dimension auditors** in parallel (`agents/dimension-auditor.md`, one per dimension):

| Dimension | Looks for | Output class |
|-----------|-----------|--------------|
| correctness | bugs, error-handling gaps, edge cases | FIX or CONTESTED |
| debt | duplication, complexity hotspots, dead patterns | FIX or PROPOSAL |
| security | secrets, injection, authz gaps, CVE deps | FIX (conservative) or PROPOSAL |
| alignment | code not serving the system's purpose, dead/vestigial modules | DELETION-PROPOSAL only |
| enhancement | missing features users would value | FEATURE-PROPOSAL only |

Every finding: `id, dimension, file:line, what, why-it-matters, severity (C/H/M/L),
proposed action class, evidence`. Findings without file:line citations are rejected at the
gate. Auditors also report strengths (what NOT to break).

Conductor: dedupe, then verify a sample (≥3 findings or 20%, whichever is larger) by opening
the cited files — auditors hallucinate line numbers. Reject what doesn't reproduce.

## Phase 3 — Plan

Score each ledger item: `priority = (Impact + Risk) × (6 − Effort)`, each 1-5. Order the
queue. Flag quick wins (high priority, effort ≤2). Group mechanical same-class items (≤5,
Rule 3). Write the prioritized ledger. **This ledger IS the resolution plan** — present it
to the user at this gate if running supervised; in unattended mode, write it and proceed.

## Phase 4 — Resolve (the loop body)

Per iteration: take the top unresolved `FIX` item →
1. Dispatch **resolver agent** (`agents/resolver-agent.md`) scoped to that item only,
   with Hard Rules embedded
2. Dispatch **verifier agent** (`agents/verifier-agent.md`): runs test/lint/typecheck,
   captures output, checks `git diff` touched only in-scope files and NO test files were
   modified (unless the item is itself a test-debt item the plan marked as such)
3. Green + clean diff → commit (Rule 6), mark item `RESOLVED` with evidence
4. Red or dirty diff → revert working tree, mark item `PARKED` with the failure capture;
   after 2 parks, item becomes `CONTESTED` for human review — do not retry a third time
5. `PROPOSAL` class items skip resolution: they're already filed in BACKLOG/DELETIONS

## Phase 5 — Iteration close & stop conditions

Update STATE.md (iteration++, items resolved/parked). Emit a short iteration report:
item, action, evidence line, ledger remaining. **Stop the run** when any holds:
- Ledger has no unresolved FIX items (emit sentinel `AUDIT-LOOP-COMPLETE` ONLY alongside
  the final verifier's captured green output — dual condition)
- 2 consecutive iterations resolved nothing new (dry rounds)
- Iteration cap or budget cap from STATE.md reached
- Same item parked twice (that item exits the loop, not the run — but 3 consecutive
  all-park iterations = stop, write up blockers)
On stop: write `.audit/REPORT.md` — resolved (with evidence), parked/contested, deletion
proposals awaiting approval, feature backlog, and what a human should look at first.

---

## Rationalization Table (from baseline testing — these are verbatim failures)

| Excuse | Reality |
|--------|---------|
| "The test encodes the bug; the fix is ground truth" | You don't adjudicate oracle-vs-fix unattended. Revert, file CONTESTED. (Rule 1) |
| "grep confirmed zero references — safe to delete" | grep misses dynamic refs. Evidence for the proposal, never authorization. (Rule 2) |
| "Each edit is surgical, no scope creep" (while batching 8) | Batching is the scope creep. One item per iteration. (Rule 3) |
| "It's just a stub, no exports, no risk" | Unreviewed writes to src/ are the risk. Proposals go to BACKLOG.md. (Rule 4) |
| "Expected: all tests pass" | Run it. Paste it. Or it's NOT-DONE. (Rule 5) |
| "User said resolve ANYTHING I can find" | The user delegated finding broadly, acting narrowly. Rules override phrasing. |
| "No human until morning, I must decide" | The decide-now option IS filing it for review. Parking is a decision. |

## Red Flags — STOP and re-read Hard Rules

- About to edit a file under `tests/` (or equivalent) while resolving a non-test item
- About to run `rm` / delete file contents / strip an export
- Iteration log lists more than one ledger item ID
- Creating any new file under the source tree that isn't required by the current FIX item
- Writing "should", "expected", or "likely" in a completion claim
- About to emit the completion sentinel without captured green output in the same report

## Integration

- **Drive with `/loop`** for unattended runs; single supervised pass works identically
- `gsd-map-codebase` output is accepted as Phase 1 (point STATE.md at `.planning/codebase/`)
- Deletion approvals: user reviews `.audit/DELETIONS.md`, marks items `APPROVED`; approved
  deletions become normal FIX items in the next run (still test-gated)
- Feature implementation: hand BACKLOG.md items to a planning workflow (`gsd-plan-phase`,
  `superpowers:brainstorming`) — never this skill
- After a run, improve this skill via `ei-skill-auditor` with the run's REPORT.md
