# ei-loop — State Directory Schema

The `.ei-loop/` directory lives at the **target repo root** (not the skills repo).
All files are UTF-8 plain text unless noted. Every stage exits with one git commit
that includes updated state files — this is what makes crash recovery clean.

---

## Directory layout

```
.ei-loop/
  OBJECTIVE.md          # locked global rubric — immutable after Gate 1
  STATE.md              # conductor bookkeeping — mutable every stage
  WORKLIST.md           # ordered sub-tasks — appended/updated by stages 2, 3, 4, 5
  RESEARCH.md           # Stage 1 output
  contracts/
    g1-objective.md     # Gate 1 contract (Stage 0 → Stage 1 boundary)
    g2-research.md      # Gate 2 contract (Stage 1 → Stage 2 boundary)
    g3-worklist.md      # Gate 3 contract (Stage 2 → Stage 3 boundary)
    g4-built.md         # Gate 4 contract (Stage 3 → Stage 4 boundary, per item)
    g5-validated.md     # Gate 5 contract (Stage 4 → Stage 5 boundary, per item)
  evidence/
    baseline/
      oracle-green.txt  # Gate-0 baseline oracle-green output (BLIND auditor MAY read)
    <id>/               # per-item evidence dir, e.g. evidence/item-01/
      name-status.txt   # git diff --name-status (input to diff-guard.mjs)
      diff.patch        # full diff for the item
      red.txt           # failing-test capture (pre-implementation)
      green.txt         # passing-test capture (post-implementation)
      verify.txt        # verbatim verification_method output
  verdicts/
    <id>.json           # per-sub-task verdict, e.g. verdicts/item-01.json (Stage 4 output)
    global-<iter>.json  # global verdict (Stage 5 output)
```

---

## OBJECTIVE.md

**Immutable after Gate 1.** The conductor writes this at Stage 0; no stage may
modify it thereafter.

### Template

```markdown
# Objective

## Validation target

<The user's original validation target — verbatim, unedited.>

## Global rubric (LOCKED)

thoroughness_tier: smoke | exhaustive (default) | deep   <!-- coverage policy; population auto-derived from codebase, tier human-set/confirmed at Gate 0. See SKILL.md → Coverage & thoroughness. -->

**Definitive question:** <Single yes/no question whose answer is "done".>

### Sub-claims

1. **<Claim title>**
   - Assertion: <Falsifiable, objective assertion.>
   - Verification method: `<named verifier>` — e.g., `npm test`, `tsc --noEmit`, `eslint src/`, `diff <file>`, `wc -l <file> | awk '$1 == N'`.
   - Oracle kind: `test` | `lint` | `typecheck` | `file-diff` | `scalar`
   - Layer: `interface` | `IR` | `output`

2. **<Claim title>**
   - Assertion: ...
   - Verification method: ...
   - Oracle kind: ...
   - Layer: ...

<!-- Repeat for each sub-claim. Minimum one per layer (interface / IR / output). -->

### Design-rationale sources

- `<path-or-url>`: <one-line reason this source shaped the rubric>
```

### Filled example

```markdown
# Objective

## Validation target

Add a `sortByScore` export to `src/lib/ranking.ts` with full test coverage and
no TypeScript errors.

## Global rubric (LOCKED)

**Definitive question:** Does `sortByScore` exist, pass all tests, and compile
cleanly with no type errors?

### Sub-claims

1. **Export exists and is typed**
   - Assertion: `src/lib/ranking.ts` exports a function named `sortByScore` with
     the signature `(items: ScoredItem[]) => ScoredItem[]`.
   - Verification method: `tsc --noEmit`
   - Oracle kind: `typecheck`
   - Layer: `interface`

2. **Tests pass**
   - Assertion: `npm test -- --testPathPattern=ranking` exits 0 with ≥1 test for
     `sortByScore`.
   - Verification method: `npm test -- --testPathPattern=ranking`
   - Oracle kind: `test`
   - Layer: `IR`

3. **No regressions**
   - Assertion: Full test suite exits 0.
   - Verification method: `npm test`
   - Oracle kind: `test`
   - Layer: `output`

### Design-rationale sources

- `docs/superpowers/specs/2026-06-16-ei-loop-design.md §6`: three-layer
  decomposition prevents output-only criteria on multi-phase builds.
```

---

## STATE.md

**Mutable.** Updated at the end of every stage, before the stage's git commit.

### Template

```markdown
# ei-loop STATE

## Run metadata

mode: supervised | unattended
iteration: 1                    # initializes to 1; increments after each Stage 5 (Global Verdict) run
iteration_cap: <N>
current_stage: INTAKE | RESEARCH | DECOMPOSE | BUILD | VALIDATE | GLOBAL_VERDICT
last_gate: G0 | G1 | G2 | G3 | G4 | G5 | G6 | — (none yet)
oracle_baseline: evidence/baseline/oracle-green.txt

## Cost ledger

tokens_in: <N>
tokens_out: <N>
cost_usd: <N.NN>
cost_cap_usd: <N.NN>

## Circuit breakers

stall_counter: <N>
stall_window: <N>

## Cursor (next action)

next_stage: INTAKE | RESEARCH | DECOMPOSE | BUILD | VALIDATE | GLOBAL_VERDICT
next_item_id: <item-id> | — (not applicable)
resume_reason: <one-line reason, e.g. "item-03 failed BUILD, re-entering BUILD">

## Parked items (BLOCKED)

- <item-id>: <reason>

## Gate log

| Gate | Iteration | Outcome | Timestamp        |
|------|-----------|---------|------------------|
| G0   | 1         | PASS    | 2026-06-16T14:00Z |
```

### Filled example

```markdown
# ei-loop STATE

## Run metadata

mode: unattended
iteration: 3
iteration_cap: 10
current_stage: VALIDATE
last_gate: G4
oracle_baseline: evidence/baseline/oracle-green.txt

## Cost ledger

tokens_in: 84230
tokens_out: 21450
cost_usd: 1.47
cost_cap_usd: 10.00

## Circuit breakers

stall_counter: 1
stall_window: 3

## Cursor (next action)

next_stage: VALIDATE
next_item_id: item-02
resume_reason: "item-02 completed BUILD stage, entering VALIDATE"

## Parked items (BLOCKED)

- item-04: dependency change required (new npm package); needs human approval

## Gate log

| Gate | Iteration | Outcome | Timestamp         |
|------|-----------|---------|-------------------|
| G0   | 1         | PASS    | 2026-06-16T14:00Z |
| G1   | 1         | PASS    | 2026-06-16T14:02Z |
| G2   | 1         | PASS    | 2026-06-16T14:08Z |
| G3   | 1         | PASS    | 2026-06-16T14:11Z |
| G4   | 1         | PASS    | 2026-06-16T14:22Z |
| G5   | 1         | FAIL    | 2026-06-16T14:23Z |
| G4   | 2         | PASS    | 2026-06-16T14:35Z |
| G4   | 3         | PASS    | 2026-06-16T14:47Z |
```

---

## WORKLIST.md

**Appended by Stage 2; status fields updated by Stages 3, 4, 5.**
Items are ordered; the conductor processes them top-to-bottom, skipping BLOCKED.

### Template

The item `id` is the canonical `item-NN` (lowercase `item-` prefix, zero-padded, e.g. `item-01`).
It is the single source of the per-item paths: the verdict is `verdicts/<id>.json`
(e.g. `verdicts/item-01.json`) and the evidence dir is `evidence/<id>/` (e.g. `evidence/item-01/`).

```markdown
# WORKLIST

## item-01: <Short title>

status: PENDING | BUILDING | VALIDATING | PASS | BLOCKED
attempts: <N>

### Acceptance criteria

- <Falsifiable criterion 1>
- <Falsifiable criterion 2>

### Verification method

name: <human-readable name, e.g. "TypeScript compile + unit test suite">
command: `<exact shell command>`
oracle_kind: test | lint | typecheck | file-diff | scalar
layer: interface | IR | output
pass_condition: <what exit code / output constitutes PASS>

### Diff-guard inputs

acceptance_test: <path/substring of the test of record (diff-guard arg2)>
scope_paths: <comma-separated allowed edit path prefixes (diff-guard arg3)>

### Notes

<Optional: re-entry reason, attempt history.>
```

**Status enum (canonical — stated here, referenced elsewhere):**
`{PENDING, BUILDING, VALIDATING, PASS, BLOCKED}`. The worklist-decomposer initializes every item to
`PENDING` (or `BLOCKED` for a parked conservative-posture item); the conductor transitions
`PENDING → BUILDING → VALIDATING → PASS`, or to `BLOCKED`, during the loop.

### Filled example

```markdown
# WORKLIST

## item-01: Export sortByScore from ranking.ts

status: PASS
attempts: 1

### Acceptance criteria

- `src/lib/ranking.ts` exports a function `sortByScore`.
- Function signature is `(items: ScoredItem[]) => ScoredItem[]`.
- `tsc --noEmit` exits 0 after the change.

### Verification method

name: TypeScript typecheck
command: `tsc --noEmit`
oracle_kind: typecheck
layer: interface
pass_condition: exit 0, zero errors

### Diff-guard inputs

acceptance_test: src/lib/ranking.test.ts
scope_paths: src/lib/

### Notes

Passed on first attempt.

---

## item-02: Write and pass unit tests for sortByScore

status: VALIDATING
attempts: 2

### Acceptance criteria

- `src/lib/ranking.test.ts` contains ≥2 test cases for `sortByScore`.
- `npm test -- --testPathPattern=ranking` exits 0.

### Verification method

name: Jest unit tests
command: `npm test -- --testPathPattern=ranking`
oracle_kind: test
layer: IR
pass_condition: exit 0, ≥1 test suite passed

### Diff-guard inputs

acceptance_test: src/lib/ranking.test.ts
scope_paths: src/lib/

### Notes

Attempt 1: test file missing. BUILD re-entered.
Attempt 2: tests written; awaiting VALIDATE.

---

## item-03: Full regression suite

status: PENDING
attempts: 0

### Acceptance criteria

- `npm test` exits 0.

### Verification method

name: Full test suite
command: `npm test`
oracle_kind: test
layer: output
pass_condition: exit 0

---

## item-04: Add @ranklib peer dependency

status: BLOCKED
attempts: 0

### Acceptance criteria

- `package.json` lists `@ranklib` as a peer dependency.

### Verification method

name: package.json diff
command: `grep -c '"@ranklib"' package.json`
oracle_kind: file-diff
layer: interface
pass_condition: exit 0, output ≥ 1

### Notes

BLOCKED: adding an npm dependency requires human approval (conservative posture).
```

---

## contracts/

One file per stage boundary. The conductor verifies the contract at each gate
before advancing. If the contract is not satisfied the gate is FAIL and the run
does not advance.

### Shape of a contract file

```markdown
# Gate <N> — <GATE_NAME>

## What enters this gate

- <Required artifact 1>: <what it must contain / schema / exit code>
- <Required artifact 2>: ...

## Required schema / content

<Exact fields or headings that MUST be present. Reference OBJECTIVE.md, WORKLIST.md, etc.>

## What must be ABSENT

- No uncommitted changes in the working tree.
- No `BLOCKED` items without a parked reason in STATE.md.
- <Other negative requirements.>

## Automated checks

- `<check>` — description
- `<check>` — description

## Human-gated (supervised mode only)

- <What the human must approve before this gate passes, if anything.>
```

### Example: `contracts/g3-worklist.md` (Gate 3 — WORKLIST_LOCKED)

```markdown
# Gate 3 — WORKLIST_LOCKED

## What enters this gate

- `OBJECTIVE.md`: present, not modified since Gate 1.
- `RESEARCH.md`: present, non-empty.
- `WORKLIST.md`: freshly written by Stage 2.

## Required schema / content

- At least one item in `WORKLIST.md`.
- Every item has: `id` (canonical `item-NN`), `status: PENDING`, `acceptance_criteria`
  (≥1 bullet), `verification_method` with `name`, `command`, `oracle_kind`, `layer`,
  `pass_condition`, plus `acceptance_test` and `scope_paths` (the diff-guard inputs).
- At least one item per layer (`interface`, `IR`, `output`) across the full
  worklist.
- `contracts/g4-built.md` and `contracts/g5-validated.md` exist.

## What must be ABSENT

- No item with `status: BLOCKED` (none should be blocked before any BUILD).
- No item missing a `command` field.
- No criterion that resolves only to LLM opinion (oracle_kind must be one of:
  `test`, `lint`, `typecheck`, `file-diff`, `scalar`).

## Automated checks

- All `command` values are shell commands (non-empty strings starting with a
  runnable binary).
- `OBJECTIVE.md` sha matches Gate 1 recorded sha.

## Human-gated (supervised mode only)

- Human confirms the worklist covers the full objective before any BUILD begins.
```

---

## RESEARCH.md

Written by Stage 1 (`ei-research`). Read by Stage 2 (Decompose) and Stage 3
(Build). Never modified after Stage 1 commits it.

### Required sections (Gate 2 checks for these headings)

```markdown
# Research

## Approach

<How to implement the objective: pattern, algorithm, or architectural approach
recommended based on the codebase.>

## Libraries / APIs

<Relevant existing libraries, APIs, or codebase patterns to follow. Specific
file paths and function names preferred.>

## Risks and unknowns

<Known risks, edge cases, or unknowns the builder must handle.>

## Open questions for Build

<Checklist: questions Stage 2 and Stage 3 need answered. Gate 2 checks this
section is non-empty and each question is answered or marked N/A.>
```

---

## evidence/

Raw oracle output captured during Build and Validate stages. Each file is a
plain-text snapshot — never interpreted by the conductor, only passed to the
blind global auditor and stored for chain-of-custody.

### Canonical layout (stated here; referenced elsewhere)

Evidence is organized **per item** under `evidence/<id>/`, plus a single Gate-0
`evidence/baseline/` directory:

```
evidence/
  baseline/
    oracle-green.txt   # Gate-0 baseline oracle-green output (the BLIND auditor MAY read this)
  <id>/                # one dir per worklist item, e.g. evidence/item-01/
    name-status.txt    # git diff --name-status for the item (input to diff-guard.mjs)
    diff.patch         # full diff for the item
    red.txt            # failing-test capture (pre-implementation)
    green.txt          # passing-test capture (post-implementation)
    verify.txt         # verbatim verification_method output
```

### Examples

```
evidence/baseline/oracle-green.txt
evidence/item-01/name-status.txt
evidence/item-01/red.txt
evidence/item-01/green.txt
evidence/item-02/diff.patch
evidence/item-02/verify.txt
```

Files MUST NOT contain secrets, API keys, or credentials. The diff-guard
(`scripts/diff-guard.mjs`) is run against `evidence/<id>/name-status.txt` before
the stage commits.

---

## verdicts/

Machine-readable JSON verdict files. Two kinds:

Both kinds conform to the shared **ei-validate `verdict.json` schema**
(`~/.claude/skills/ei-validate/references/verdict-schema.md`): top-level `overall`
∈ {PASS, FAIL, INCONCLUSIVE} and `stop_recommendation` ∈ {DONE, NOT_YET, INCONCLUSIVE}.
There is **NO** top-level `verdict` field anywhere.

### Per-item verdict: `verdicts/<id>.json`

Emitted by `ei-validate` at Stage 4. `<id>` matches the `id` field from `WORKLIST.md`
exactly (e.g. `verdicts/item-02.json`). Validated with:

```
node ~/.claude/skills/ei-validate/scripts/validate-verdict.mjs verdicts/<id>.json
```

Exit 0 = valid. Gate 5 will not pass a malformed verdict file. The conductor reads
`overall` and `stop_recommendation` from the file.

### Global verdict: `verdicts/global-<iter>.json`

Emitted by the blind global verdict-auditor at Stage 5. `<iter>` is the
zero-padded iteration number, e.g. `verdicts/global-003.json`. The auditor
receives ONLY `OBJECTIVE.md` + `evidence/` — never build narratives. It conforms to the
same ei-validate `verdict.json` schema (full field-level detail and the ei-loop extension
fields — `kind`, `iteration`, `chain_of_custody`, `remaining_gap`, `isolation_attestation` —
are documented in `agents/global-verdict-auditor.md`).

Minimal shape:

```json
{
  "schema_version": "1.0",
  "run_id": "ei-loop-global-iter-3",
  "target": "<definitive question, verbatim from OBJECTIVE.md>",
  "timestamp": "2026-06-16T14:50:00Z",
  "overall": "PASS",
  "stop_recommendation": "DONE",
  "criteria": [
    {
      "id": "C1",
      "title": "<sub-claim, short>",
      "status": "PASS",
      "verification_method": "tsc --noEmit",
      "evidence": "evidence/item-01/verify.txt"
    }
  ],
  "adversarial": { "applied": true, "overturned": [], "unproven": [], "canary_calibration": "n/a" },
  "blocking_findings": [],
  "iteration": 3,
  "chain_of_custody": [
    { "claim_id": "C1", "steps": [ { "step": 1, "verified_by": "tsc --noEmit", "observed": "exit 0" } ] }
  ]
}
```

Global `criteria[].status` is **`PASS | FAIL` only** (an unverifiable global sub-claim is `FAIL`,
never `UNPROVEN`/`BLOCKED`), so `overall` is `PASS` or `FAIL` and never `INCONCLUSIVE`.
When `stop_recommendation` is `DONE` (with `overall: PASS`), `chain_of_custody` must be
non-empty. When `stop_recommendation` is `NOT_YET` (with `overall: FAIL`), `remaining_gap` /
`blocking_findings` name what is missing and the conductor appends a new worklist item.

---

## Resume algorithm

On every invocation, the conductor executes this algorithm to determine the
**single next action** before doing any work.

```
1. Does .ei-loop/STATE.md exist?
   NO  → this is a fresh run; start Stage 0 (Intake & Lock). Verify repo is clean first (Gate 0).
   YES → read STATE.md.

2. Read cursor:
     next_stage    ← STATE.md `next_stage` (named: INTAKE | RESEARCH | DECOMPOSE | BUILD | VALIDATE | GLOBAL_VERDICT)
     next_item_id  ← STATE.md `next_item_id` (may be "—")

3. Validate cursor integrity:
   a. If next_stage ∈ {BUILD, VALIDATE} and next_item_id is "—" → STATE.md is corrupt.
      Do NOT proceed. Emit "CORRUPT STATE" and stop.
   b. If next_stage is more than one stage past the last completed stage → gap detected;
      stop with BLOCKED.

4. Check stop conditions (delegate to scripts/stop-condition.mjs):
   - Derive the loop-state.json object from STATE.md + WORKLIST.md + the latest global verdict
     (see §Machine-readable state below).
   - Run: node ~/.claude/skills/ei-loop/scripts/stop-condition.mjs <derived-json-path>
   - The script prints the decision WORD on stdout (DONE | CAP | DRY | BLOCKED | CONTINUE) and
     exits 0 for ANY valid decision; exit 1 ONLY on malformed input.
   - Read the stdout word: if it is `CONTINUE`, proceed to step 5; otherwise (DONE | CAP | DRY |
     BLOCKED) write the final report and do NOT execute any more stages. Exit 1 means the derived
     input was malformed — fix the derivation, do not treat it as a stop decision.

5. Execute exactly one stage:
   - next_stage = INTAKE         → Stage 0 (Intake & Lock)
   - next_stage = RESEARCH       → Stage 1 (Research)
   - next_stage = DECOMPOSE      → Stage 2 (Decompose & Contract)
   - next_stage = BUILD          → Stage 3 (Build) for item next_item_id
   - next_stage = VALIDATE       → Stage 4 (Validate) for item next_item_id
   - next_stage = GLOBAL_VERDICT → Stage 5 (Global Verdict)

6. After stage completes:
   a. Update STATE.md (increment iteration if stage 5 just ran, update cursor, update cost ledger, update last_gate).
   b. Update WORKLIST.md if status changed.
   c. git add .ei-loop/ && git commit -m "ei-loop: stage <N> iter <M> [item-<id>]"
   d. Exit.
```

### Crash recovery

Because every stage ends with a `git commit` of `.ei-loop/` before exiting,
a crash mid-stage leaves the state files in the state of the **last successful
commit**. On re-entry:

1. `git status` must show a clean working tree (Gate 0 guard). If dirty, the
   conductor stops with `BLOCKED: dirty repo after crash — inspect and commit
   or restore manually`.
2. If clean, the cursor in `STATE.md` points to the stage that was in progress
   when the crash occurred (it was not yet committed). The conductor re-executes
   that stage from scratch.
3. If the stage had partially written files (e.g. a partial `RESEARCH.md`),
   those changes are not present (they were not committed), so the re-run starts
   clean.

The invariant is: **committed state is always self-consistent**. The stage that
crashed is simply re-run.

---

## Machine-readable state: loop-state.example.json

`STATE.md` is the human-readable source of truth. `scripts/stop-condition.mjs`
requires a small derived JSON object. The conductor (or a thin helper) derives
this from `STATE.md` + `WORKLIST.md` before invoking `stop-condition.mjs`.

The canonical shape is documented by the example at
`references/examples/loop-state.example.json`.

### Fields consumed by stop-condition.mjs

| Field | Type | Source |
|---|---|---|
| `iteration` | integer | STATE.md `iteration` |
| `iteration_cap` | integer | STATE.md `iteration_cap` |
| `cost` | number (USD) | STATE.md `cost_usd` |
| `cost_cap` | number (USD) | STATE.md `cost_cap_usd` |
| `stall_counter` | integer | STATE.md `stall_counter` |
| `stall_window` | integer | STATE.md `stall_window` |
| `worklist` | array of `{status}` | WORKLIST.md items |
| `global_verdict` | `"DONE"` \| `"NOT_YET"` \| `""` | latest `verdicts/global-*.json` `.stop_recommendation`, or `""` if none |
| `has_blocked` | boolean | any item in WORKLIST.md with `status: BLOCKED` |
| `has_pending` | boolean | any item in WORKLIST.md with `status: PENDING` or `BUILDING` or `VALIDATING` |

`stop-condition.mjs` reads this object from the file path given as its single
argument and writes the decision WORD to stdout — one of `DONE`, `CAP`, `DRY`,
`BLOCKED`, `CONTINUE`. It exits **0 for ANY valid decision** (including
`CONTINUE`) and exits **1 ONLY on malformed input**. The conductor branches on
the stdout word, not the exit code: `CONTINUE` means keep going; any other word
is a terminal stop condition.

See `references/examples/loop-state.example.json` for a concrete mid-run
example.
