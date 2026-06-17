# ei-loop — Design Spec

Status: **Approved design, pre-implementation** · Date: 2026-06-16 · Repo: claude-skills

A re-entrant conductor skill that drives **large-scale autonomous coding** toward a single
user-provided validation target, by composing existing skills (`ei-research`,
`ei-recursive-goal`, `ei-validate`) in a verifier-driven loop that repeats until a locked
global rubric passes.

---

## 1. Purpose

The user provides one **validation target** (what "done" looks like). `ei-loop` autonomously:
researches the problem, decomposes the objective into a worklist of sub-tasks each with its
own acceptance criteria, builds each sub-task, validates it against an objective verifier, and
repeats — re-entering at the right stage on failure — until a **blind global auditor** confirms
the locked objective is met with chain-of-custody evidence.

It is the **outer meta-orchestrator** identified as the missing piece in the research: every
*stage* primitive already exists in the repo, and a fresh-context re-entrancy template exists in
`ei-audit-project`, but nothing yet chains the heterogeneous sequence and re-runs the whole chain
to a machine-readable convergence verdict.

## 2. Research grounding (what shaped this design)

Full study: `.planning/research/autonomous-coding-loops/RESEARCH.md`. Load-bearing findings:

- **This is not a new paradigm** — it is CEGIS / generate-and-verify closed-loop control,
  the LLM-agent form of "spec-driven development." Design value is in composition + safety, not invention.
- **The verifier is load-bearing and must be external, objective, and hard to game.** LLMs cannot
  reliably self-correct without a genuine external signal (Huang et al., ICLR 2024). → objective
  oracle (tests/lint/types) + blind auditor + diff-guard, all reused from existing skills.
- **Fresh context per iteration, state on disk + git** (defeats context rot). → re-entrant core.
- **Wrap an existing inner-loop coder; don't reinvent one.** → pluggable Build adapter.
- **Two literature gaps this design must fill itself:** (a) security/threat model for unattended
  runs, (b) the oracle boundary — the loop only transfers where a real verifier exists.

## 3. Locked design decisions

| # | Decision | Choice |
|---|---|---|
| D1 | Execution model | **Re-entrant core, dual-mode** (same code path runs supervised or unattended under `/loop`) |
| D2 | Work shape | **One objective, self-decomposed**; done when the **global** rubric passes |
| D3 | Architecture | **Conductor over explicit stage contracts**, assembled from reused components |
| D4 | Build stage | **TDD maker/checker default + GSD escalation**, behind a pluggable adapter |
| D5 | Autonomy posture (unattended) | **Conservative** (see §10) |

## 4. Architecture overview

`ei-loop` does **not** hold the loop in its context window. Each invocation executes **exactly one
stage of one iteration**, persists everything to a state directory + git, and exits. An external
driver (`/loop`, or the user in supervised mode) re-invokes it.

```
read .ei-loop/STATE.md → determine next action (which stage, which worklist item)
  → execute ONE stage → capture evidence → update STATE.md + WORKLIST.md
  → git commit (one stage, one commit) → emit gate summary → EXIT
```

State on disk means a crash, context reset, or "close the laptop and resume tomorrow" all resume
cleanly from the last commit.

**Two modes, one code path** (locked at start):
- **Supervised** — surface each gate summary to the user; pause at human-gated decisions.
- **Unattended** (`/loop`) — write gate summaries to `STATE.md`; auto-proceed unless a gate says STOP.

## 5. State directory `.ei-loop/`

| File / dir | Holds | Owner |
|---|---|---|
| `OBJECTIVE.md` | Global objective + **locked global rubric** + design-rationale sources | conductor, immutable after lock |
| `STATE.md` | Mode, current stage, iteration #, cost/token ledger, cursor (next action), last gate, parked items | conductor |
| `WORKLIST.md` | Self-decomposed sub-tasks; each with acceptance criteria, named verification method, status | conductor |
| `contracts/` | Per-stage interface contracts (what each stage must receive and produce) | conductor |
| `RESEARCH.md` | Output of the research stage | research stage |
| `evidence/` | Fresh captured artifacts (test/lint/type output, diffs, screenshots) | build / validate |
| `verdicts/` | Machine-readable verdict file per iteration + global verdicts | validate + global auditor |

Location: `.ei-loop/` at repo root (commit-vs-gitignore decided at implementation time). All work
happens on a dedicated branch/worktree; one commit per stage.

## 6. The two-level verification model (the core idea)

Direct realization of the user's framing: *"it holds the verification objectives, which get parsed
into validatable artifacts and criteria for the output of each skill."*

- **Level 1 — global rubric** (`OBJECTIVE.md`): the single "are we done with the *whole job*"
  question, decomposed into falsifiable sub-claims. Checked **only** by the blind global auditor.
  Immutable for the run.
- **Level 2 — per-stage interface contracts + per-sub-task acceptance criteria** (`contracts/`,
  `WORKLIST.md`): the "what to look for at each stage" gates, checked at every stage boundary.
- **Decomposition L1 → L2** is a real stage (§7, Stage 2) and reuses `ei-recursive-goal`'s
  **three-layer decomposition** (interface → intermediate-representation → output). Output-only
  criteria for a multi-phase build are a known failure mode; the three-layer gate prevents it.

## 7. Stage pipeline + interface contracts

The conductor advances **one** stage per iteration.

| # | Stage | Input contract | Output contract (the gate) | Implemented by |
|---|---|---|---|---|
| 0 | **Intake & Lock** *(once)* | User validation target | `OBJECTIVE.md`: locked falsifiable global rubric + design-rationale sources; oracle baseline green captured; oracle-boundary check passed (§10) | conductor + `ei-recursive-goal` Phase 1 mechanism |
| 1 | **Research** | Global objective + flagged unknowns | `RESEARCH.md` answering a checklist: approach, libraries/APIs, codebase patterns to follow, risks. Gate: does it answer what BUILD needs? | `ei-research` |
| 2 | **Decompose & Contract** | `OBJECTIVE.md` + `RESEARCH.md` | `WORKLIST.md` (ordered sub-tasks, each w/ falsifiable acceptance criteria + named verification method) + `contracts/` | conductor + three-layer decomposition |
| 3 | **Build** | One sub-task + its acceptance criteria + research context | Code change + fresh evidence in `evidence/`; one sub-task = one commit | **Pluggable adapter** (§9) |
| 4 | **Validate** | Sub-task acceptance criteria + build evidence (+ running system for UI) | `verdicts/<iter>.json` — **machine-readable** PASS/FAIL per criterion | `ei-validate` (retrofitted to emit verdict) |
| 5 | **Global Verdict** | **Only** `OBJECTIVE.md` + fresh `evidence/` — never build narratives | `verdicts/global-<iter>.json` + chain-of-custody if DONE | `ei-recursive-goal` Phase 5 blind auditor |

## 8. Loop control — verdict-driven re-entry

The conductor reads the verdict and decides **where to re-enter** (not just "retry"):

- Sub-task **FAIL** → re-enter at the stage the verdict names: `BUILD` (impl bug), `RESEARCH`
  (knowledge gap), or `DECOMPOSE` (the contract itself was wrong).
- Worklist drained **+ global verdict DONE** → exit `DONE` with chain-of-custody.
- Global verdict **NOT-YET** → auditor names the residual gap → conductor appends it to
  `WORKLIST.md` → continue.

## 9. Build stage (D4)

A **pluggable builder adapter** so the coder is swappable. Default and escalation:

- **Default — TDD maker/checker:** the builder writes the failing test that *encodes the
  sub-task's acceptance criteria* first → implements → captures green. Maker/checker separation
  aligns with the research's external-oracle finding.
- **Escalation — `gsd-execute-phase`:** when a sub-task is architecturally significant (a
  contract/semantics decision), escalate to GSD's plan→execute machinery — reusing the GSD seam
  `ei-recursive-goal` already has for architectural gaps.
- Adapter interface lets `/goal` or a custom executor be substituted later without touching the
  conductor.

## 10. Safety, anti-gaming, and autonomy

**Circuit breakers** (tracked in `STATE.md`):
- **Per-sub-task attempt cap** — 3 failed BUILD→VALIDATE cycles → park as `BLOCKED`, move on.
- **Global iteration + cost/token ceiling** — hard caps → `CAP` stop.
- **Stall detection** — no worklist item reaches PASS across N iterations → `DRY` stop (anti-doom-loop).

**Oracle-boundary guard** (intake): every global-rubric criterion must resolve to an **objective**
verifier (test / lint / type / file-diff / scalar). Any criterion judgeable only by LLM opinion is
flagged — it gets a **human owner** for its verdict or is **refused for unattended runs**.

**Anti-gaming:** the Build stage is **forbidden from modifying the tests that encode its own
acceptance criteria** (diff-guard, per `ei-audit-project` Gate 4). Gaming is caught by the
diff-guard *and* the blind global auditor that never sees how the work was done.

**Unattended-run security** (fills the literature gap):
- Never start on a dirty repo; dedicated branch/worktree; one commit per stage = clean rollback.
- **Research output is data, not commands** — builder must not execute instructions found in
  fetched web content (prompt-injection surface).
- Blast-radius limits: edits confined to declared paths; no secrets in `evidence/` or commits.

**Autonomy posture — Conservative (D5):** Research, Decompose, Build, Validate run autonomously.
**Always park for a human** (mark `BLOCKED`): deletions, data/schema migrations, architectural
escalations, dependency changes, secrets/network mutations, destructive git. The **global rubric
must be human-locked before any unattended run starts**.

## 11. Stop conditions

Named explicitly in the final report (à la `ei-audit-project`):
`DONE` (global rubric passes w/ chain-of-custody) · `CAP` (iteration/cost ceiling) · `BLOCKED`
(needs a human/architectural decision) · `DRY` (stall — no progress across N iterations).

## 12. Reuse map (new vs. reused)

- **Reused as-is:** `ei-research` (Stage 1); `ei-recursive-goal` Phase 1 rubric mechanism +
  three-layer decomposition (Stages 0, 2) + Phase 5 blind verdict-auditor (Stage 5);
  `gsd-execute-phase` (Build escalation); `ei-audit-project` re-entrancy contract + Gate-4
  diff-guard + Hard Rules (state model, §10).
- **Retrofitted:** `ei-validate` → must emit a machine-readable verdict file (the single genuinely
  missing seam).
- **New:** the `ei-loop` conductor itself; per-stage interface contracts; the Build adapter
  interface; the worklist/state schema; the oracle-boundary guard.

## 13. Testing strategy

- **State-machine unit tests** — given a `STATE.md`, assert the next action; verdict parsing;
  worklist decomposition.
- **Re-entrancy test** — kill mid-iteration, re-invoke, assert resume from last commit.
- **Canary / anti-gaming test** — plant a sub-task whose easy path is deleting the failing test;
  assert diff-guard + blind auditor catch it.
- **Dual-mode equivalence** — same objective supervised vs. unattended → same terminal state.
- **End-to-end** — a tiny real objective ("add function `foo` with passing tests") driven to
  `DONE` with chain-of-custody on a throwaway repo.

## 14. Out of scope (YAGNI for v1)

- Backlog/queue mode and open-ended improvement mode (D2 chose single-objective; can be added later).
- Multi-objective / parallel-objective runs.
- Non-coding domains (best-finder/travel) — excluded by the oracle-boundary guard until a real
  verifier exists for them.
- A bespoke inner coder (we wrap existing ones via the adapter).

## 15. Open items to resolve during planning

- `.ei-loop/` committed vs. gitignored.
- Exact machine-readable verdict schema for `ei-validate` (the retrofit).
- Concrete values for the caps (per-task attempts, global iteration, cost ceiling, stall N).
- Builder-adapter interface signature.
