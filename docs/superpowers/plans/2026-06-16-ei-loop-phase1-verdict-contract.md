# ei-loop Phase 1 — Verdict Contract Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give `ei-validate` a machine-readable, post-adversarial `verdict.json` output and a zero-dependency validator for it — the convergence signal every later `ei-loop` phase reads.

**Architecture:** `ei-validate` already produces a blind, post-adversarial verdict at Gate 5 (it drops OVERTURNED claims and relabels UNPROVEN). Today that truth is only emitted as prose. This phase adds a documented JSON schema, a standalone Node validator (no deps, run via `node`, like `best-finder/hooks`), and a Gate-5 step that writes + self-validates `verdict.json`. The validator also re-derives `overall`/`stop_recommendation` from the criteria, so a verdict that claims PASS while a criterion FAILs is rejected (deterministic anti-gaming).

**Tech Stack:** Markdown skill files; zero-dependency Node ESM (`.mjs`) run via `node`. No test framework, no `package.json`.

## Global Constraints

- Skills follow the repo convention: `SKILL.md` + `agents/*.md` + `references/*.md` + `checkpoint-contract.md`. New helper scripts go in a `scripts/` dir (extension precedent: `best-finder/hooks/`).
- **No new test framework and no `package.json`.** Helper scripts are zero-dependency Node ESM (`.mjs`), run via `node <script>`; "tests" are fixture runs asserting exit code.
- `ei-validate`'s internal cross-references use `~/.claude/skills/system-validation/...` paths (the installed symlink name). Match that style for new references so it is consistent with siblings; create the actual files under the repo's `ei-validate/` dir.
- The verdict reflects **post-adversarial truth** derived from external evidence — never LLM self-judgment.
- Commit messages end with: `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`.
- Work happens on branch `feat/ei-loop-architecture`.

---

## Phase Map (full ei-loop arc — this plan is Phase 1 of 4)

| Phase | Deliverable | Standalone value |
|---|---|---|
| **1 (this plan)** | **Verdict contract** — `verdict.json` schema + validator + `ei-validate` emits it | `ei-validate` gains a machine-readable output usable by anything |
| 2 | `ei-loop` conductor skeleton — `SKILL.md`, `.ei-loop/` state schema, re-entrant one-stage-per-invocation loop, dual mode, stop conditions, Gate-0 preconditions (dirty-repo guard, oracle baseline) | A runnable re-entrant conductor that drives state transitions on a no-op objective |
| 3 | Stages + contracts — wire Stage 1 (ei-research), Stage 2 (decompose + three-layer contracts), Stage 3 (TDD maker/checker + GSD-escalation build adapter), Stage 4 (ei-validate → reads Phase-1 verdict), Stage 5 (blind global verdict) | Tiny end-to-end objective driven to DONE on a throwaway repo |
| 4 | Safety hardening — circuit breakers, oracle-boundary guard, diff-guard (Node), conservative autonomy gating, unattended-run security, canary + dual-mode + e2e scenarios | Unattended-safe overnight runs |

Spec: `docs/superpowers/specs/2026-06-16-ei-loop-design.md`. Research: `.planning/research/autonomous-coding-loops/`.

---

## File Structure (Phase 1)

- Create `ei-validate/references/verdict-schema.md` — the schema + field semantics + derivation rules (the contract).
- Create `ei-validate/references/examples/verdict.pass.json`, `verdict.fail.json`, `verdict.malformed.json`, `verdict.inconsistent.json` — fixtures.
- Create `ei-validate/scripts/validate-verdict.mjs` — zero-dependency validator.
- Modify `ei-validate/SKILL.md` — Gate 5 emits + self-validates `verdict.json`.
- Modify `ei-validate/checkpoint-contract.md` — document `verdict.json` as the Gate-5 final artifact.

---

## Task 1: Verdict schema contract + fixtures

**Files:**
- Create: `ei-validate/references/verdict-schema.md`
- Create: `ei-validate/references/examples/verdict.pass.json`
- Create: `ei-validate/references/examples/verdict.fail.json`
- Create: `ei-validate/references/examples/verdict.malformed.json`
- Create: `ei-validate/references/examples/verdict.inconsistent.json`

**Interfaces:**
- Produces: the `verdict.json` shape (consumed by Task 2's validator, Task 3's Gate-5 emission, and every later ei-loop phase). Required top-level keys: `schema_version, run_id, target, timestamp, overall, stop_recommendation, criteria[], adversarial{}`. Enums: `overall ∈ {PASS,FAIL,INCONCLUSIVE}`, `stop_recommendation ∈ {DONE,NOT_YET,INCONCLUSIVE}`, `criteria[].status ∈ {PASS,FAIL,UNPROVEN,BLOCKED}`, `adversarial.canary_calibration ∈ {ok,recalibrated,n/a}`.

- [ ] **Step 1: Write `ei-validate/references/verdict-schema.md`**

````markdown
# Machine-Readable Verdict — `verdict.json`

`ei-validate` writes this file at Gate 5 (after the adversarial pass is applied). It is the
post-adversarial, machine-readable verdict consumed by orchestrators such as `ei-loop`. The prose
synthesis the user sees is derived from the same truth; this file is the signal a program reads.

## Shape

```json
{
  "schema_version": "1.0",
  "run_id": "string — unique id for this validation run",
  "target": "string — what was validated (system / feature / sub-task id)",
  "timestamp": "string — ISO 8601",
  "overall": "PASS | FAIL | INCONCLUSIVE",
  "stop_recommendation": "DONE | NOT_YET | INCONCLUSIVE",
  "criteria": [
    {
      "id": "string — REQ-1 / RISK-N / sub-task criterion id",
      "title": "string — short",
      "status": "PASS | FAIL | UNPROVEN | BLOCKED",
      "verification_method": "string — the named method used",
      "evidence": "string — path, or command+output reference"
    }
  ],
  "adversarial": {
    "applied": true,
    "overturned": ["string — claim_id overturned by the blind reviewer"],
    "unproven": ["string — HIGH/CRITICAL claim_id still UNPROVEN after rebuttal"],
    "canary_calibration": "ok | recalibrated | n/a"
  },
  "blocking_findings": ["string — one-line, OVERTURNED Tier-1 corrections"]
}
```

## Required fields
`schema_version`, `run_id`, `target`, `timestamp`, `overall`, `stop_recommendation`, `criteria`
(array; may be empty), `adversarial` (object with `applied: boolean` and `canary_calibration`).
`blocking_findings` is optional (defaults to empty).

## Mapping from the adversarial pass (Gate 5)
- A surviving Tier-1 requirement / user directive → one `criteria[]` entry with `status: PASS`.
- An OVERTURNED Tier-1 claim → `status: FAIL` **and** a `blocking_findings` line.
- A HIGH/CRITICAL claim still UNPROVEN after the single rebuttal → `status: UNPROVEN`.
- A run where `capture_mechanism_proven` was false → `overall: INCONCLUSIVE` regardless of rows.

## Derivation rules (a program re-derives these; they must be internally consistent)
- `overall = FAIL` if any `criteria[].status == FAIL`.
- else `overall = INCONCLUSIVE` if any `criteria[].status` is `UNPROVEN` or `BLOCKED`, or
  `adversarial.canary_calibration == "recalibrated"`.
- else `overall = PASS`.
- `stop_recommendation = DONE` iff `overall == PASS` and `blocking_findings` is empty;
  `NOT_YET` if `overall == FAIL`; `INCONCLUSIVE` if `overall == INCONCLUSIVE`.

A verdict whose stated `overall`/`stop_recommendation` contradict these rules is **invalid** —
`scripts/validate-verdict.mjs` rejects it. This is the deterministic guard against a verdict that
claims PASS while a criterion failed.
````

- [ ] **Step 2: Write the four fixtures**

`ei-validate/references/examples/verdict.pass.json`:
```json
{
  "schema_version": "1.0",
  "run_id": "demo-pass-001",
  "target": "subtask:add-foo",
  "timestamp": "2026-06-16T12:00:00Z",
  "overall": "PASS",
  "stop_recommendation": "DONE",
  "criteria": [
    { "id": "REQ-1", "title": "foo returns 42", "status": "PASS", "verification_method": "unit test", "evidence": "node test exit 0" }
  ],
  "adversarial": { "applied": true, "overturned": [], "unproven": [], "canary_calibration": "ok" },
  "blocking_findings": []
}
```

`ei-validate/references/examples/verdict.fail.json`:
```json
{
  "schema_version": "1.0",
  "run_id": "demo-fail-001",
  "target": "subtask:add-foo",
  "timestamp": "2026-06-16T12:05:00Z",
  "overall": "FAIL",
  "stop_recommendation": "NOT_YET",
  "criteria": [
    { "id": "REQ-1", "title": "foo returns 42", "status": "FAIL", "verification_method": "unit test", "evidence": "assert 0 === 42" }
  ],
  "adversarial": { "applied": true, "overturned": [], "unproven": [], "canary_calibration": "ok" },
  "blocking_findings": ["REQ-1 unmet: foo returns 0"]
}
```

`ei-validate/references/examples/verdict.malformed.json` (missing `overall` + `stop_recommendation` → schema violation):
```json
{
  "schema_version": "1.0",
  "run_id": "demo-malformed-001",
  "target": "subtask:add-foo",
  "timestamp": "2026-06-16T12:10:00Z",
  "criteria": [],
  "adversarial": { "applied": true, "canary_calibration": "ok" }
}
```

`ei-validate/references/examples/verdict.inconsistent.json` (claims PASS while a criterion FAILs → consistency violation):
```json
{
  "schema_version": "1.0",
  "run_id": "demo-inconsistent-001",
  "target": "subtask:add-foo",
  "timestamp": "2026-06-16T12:15:00Z",
  "overall": "PASS",
  "stop_recommendation": "DONE",
  "criteria": [
    { "id": "REQ-1", "title": "foo returns 42", "status": "FAIL", "verification_method": "unit test", "evidence": "assert 0 === 42" }
  ],
  "adversarial": { "applied": true, "overturned": [], "unproven": [], "canary_calibration": "ok" },
  "blocking_findings": []
}
```

- [ ] **Step 3: Sanity-check the JSON parses**

Run: `for f in ei-validate/references/examples/*.json; do node -e "JSON.parse(require('fs').readFileSync('$f','utf8')); console.log('ok $f')"; done`
Expected: four `ok ...` lines, no parse errors.

- [ ] **Step 4: Commit**

```bash
git add ei-validate/references/verdict-schema.md ei-validate/references/examples/
git commit -m "feat(ei-validate): define machine-readable verdict.json schema + fixtures

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 2: Zero-dependency verdict validator

**Files:**
- Create: `ei-validate/scripts/validate-verdict.mjs`

**Interfaces:**
- Consumes: a `verdict.json` path (argv[2]) and the schema/derivation rules from Task 1.
- Produces: CLI `node validate-verdict.mjs <path>` → exit `0` (valid + internally consistent, prints `VALID: ...`) or exit `1` (prints one `INVALID: <reason>` line per violation to stderr). Later ei-loop phases shell out to this exact contract.

- [ ] **Step 1: Write `ei-validate/scripts/validate-verdict.mjs`**

```javascript
#!/usr/bin/env node
// validate-verdict.mjs — zero-dependency validator for ei-validate's verdict.json.
// Usage: node validate-verdict.mjs <path-to-verdict.json>
// Exit 0 = valid & internally consistent; exit 1 = invalid (one reason per line on stderr).
import { readFileSync } from 'node:fs';

const OVERALL = ['PASS', 'FAIL', 'INCONCLUSIVE'];
const STOP = ['DONE', 'NOT_YET', 'INCONCLUSIVE'];
const CRIT = ['PASS', 'FAIL', 'UNPROVEN', 'BLOCKED'];
const CALIB = ['ok', 'recalibrated', 'n/a'];

function die(errors) {
  for (const e of errors) console.error(`INVALID: ${e}`);
  process.exit(1);
}

const path = process.argv[2];
if (!path) die(['no verdict path argument given']);

let doc;
try {
  doc = JSON.parse(readFileSync(path, 'utf8'));
} catch (e) {
  die([`could not read/parse JSON at ${path}: ${e.message}`]);
}

const errors = [];
for (const k of ['schema_version', 'run_id', 'target', 'timestamp', 'overall', 'stop_recommendation', 'criteria', 'adversarial']) {
  if (!(k in doc)) errors.push(`missing required field: ${k}`);
}
if ('overall' in doc && !OVERALL.includes(doc.overall)) errors.push(`overall not in {${OVERALL}}`);
if ('stop_recommendation' in doc && !STOP.includes(doc.stop_recommendation)) errors.push(`stop_recommendation not in {${STOP}}`);

if (!Array.isArray(doc.criteria)) {
  errors.push('criteria must be an array');
} else {
  doc.criteria.forEach((c, i) => {
    if (typeof c !== 'object' || c === null) { errors.push(`criteria[${i}] not an object`); return; }
    if (!c.id) errors.push(`criteria[${i}].id missing`);
    if (!CRIT.includes(c.status)) errors.push(`criteria[${i}].status not in {${CRIT}}`);
  });
}

const adv = doc.adversarial;
if (typeof adv !== 'object' || adv === null) {
  errors.push('adversarial must be an object');
} else {
  if (typeof adv.applied !== 'boolean') errors.push('adversarial.applied must be boolean');
  if (!CALIB.includes(adv.canary_calibration)) errors.push(`adversarial.canary_calibration not in {${CALIB}}`);
}

// Internal consistency — re-derive overall + stop from the rules (deterministic anti-gaming guard).
if (Array.isArray(doc.criteria) && OVERALL.includes(doc.overall) && adv && typeof adv === 'object') {
  const statuses = doc.criteria.map((c) => c && c.status);
  const anyFail = statuses.includes('FAIL');
  const anySoft = statuses.includes('UNPROVEN') || statuses.includes('BLOCKED');
  const recalib = adv.canary_calibration === 'recalibrated';
  const derived = anyFail ? 'FAIL' : (anySoft || recalib) ? 'INCONCLUSIVE' : 'PASS';
  if (derived !== doc.overall) {
    errors.push(`overall="${doc.overall}" inconsistent with criteria/adversarial (derived "${derived}")`);
  }
  const blocking = Array.isArray(doc.blocking_findings) ? doc.blocking_findings.length : 0;
  const derivedStop = derived === 'PASS' && blocking === 0 ? 'DONE' : derived === 'FAIL' ? 'NOT_YET' : 'INCONCLUSIVE';
  if (STOP.includes(doc.stop_recommendation) && derivedStop !== doc.stop_recommendation) {
    errors.push(`stop_recommendation="${doc.stop_recommendation}" inconsistent (derived "${derivedStop}")`);
  }
}

if (errors.length) die(errors);
console.log(`VALID: ${path} (overall=${doc.overall}, stop=${doc.stop_recommendation})`);
process.exit(0);
```

- [ ] **Step 2: Run it against the two valid fixtures — expect exit 0**

Run: `node ei-validate/scripts/validate-verdict.mjs ei-validate/references/examples/verdict.pass.json; echo "exit=$?"`
Expected: `VALID: ...verdict.pass.json (overall=PASS, stop=DONE)` then `exit=0`.

Run: `node ei-validate/scripts/validate-verdict.mjs ei-validate/references/examples/verdict.fail.json; echo "exit=$?"`
Expected: `VALID: ...verdict.fail.json (overall=FAIL, stop=NOT_YET)` then `exit=0`.

- [ ] **Step 3: Run it against the malformed fixture — expect exit 1 (schema)**

Run: `node ei-validate/scripts/validate-verdict.mjs ei-validate/references/examples/verdict.malformed.json; echo "exit=$?"`
Expected: stderr includes `INVALID: missing required field: overall` and `INVALID: missing required field: stop_recommendation`, then `exit=1`.

- [ ] **Step 4: Run it against the inconsistent fixture — expect exit 1 (anti-gaming consistency)**

Run: `node ei-validate/scripts/validate-verdict.mjs ei-validate/references/examples/verdict.inconsistent.json; echo "exit=$?"`
Expected: stderr includes `INVALID: overall="PASS" inconsistent with criteria/adversarial (derived "FAIL")`, then `exit=1`.

- [ ] **Step 5: Commit**

```bash
git add ei-validate/scripts/validate-verdict.mjs
git commit -m "feat(ei-validate): add zero-dependency verdict.json validator

Validates schema + re-derives overall/stop_recommendation so a verdict that
claims PASS while a criterion FAILs is rejected (deterministic anti-gaming).

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Task 3: Retrofit `ei-validate` to emit `verdict.json` at Gate 5

**Files:**
- Modify: `ei-validate/SKILL.md` (Gate 5 section — add the emission + self-validation step)
- Modify: `ei-validate/checkpoint-contract.md` (document the final artifact)

**Interfaces:**
- Consumes: the Gate-5 post-adversarial state (surviving claims, OVERTURNED/UNPROVEN sets, canary calibration, `capture_mechanism_proven`).
- Produces: `<output_path>/verdict.json` (Task 1 schema), self-validated via Task 2's script before the user synthesis.

- [ ] **Step 1: Add the emission step to `ei-validate/SKILL.md`**

Find this text in `ei-validate/SKILL.md` (top of the Gate 5 section):

```
**Precondition — Gate 5 first:** do not synthesize until ADVERSARIAL_COMPLETE (above) is parsed and
applied — drop/correct OVERTURNED claims, relabel UNPROVEN as unconfirmed (never PASS), lead with any
blocking Tier-1 correction, and surface unresolved HIGH/CRITICAL disputes for a human. Synthesize only
over claims that SURVIVED the adversarial pass.

Do not relay the report summary verbatim. Synthesize in terms of what matters to the user:
```

Replace it with (inserts a new Step 0 between the precondition and the prose synthesis):

```
**Precondition — Gate 5 first:** do not synthesize until ADVERSARIAL_COMPLETE (above) is parsed and
applied — drop/correct OVERTURNED claims, relabel UNPROVEN as unconfirmed (never PASS), lead with any
blocking Tier-1 correction, and surface unresolved HIGH/CRITICAL disputes for a human. Synthesize only
over claims that SURVIVED the adversarial pass.

**Gate 5 Step 0 — Emit the machine-readable verdict (REQUIRED).** After applying the adversarial
results, write `<output_path>/verdict.json` conforming to
`~/.claude/skills/system-validation/references/verdict-schema.md`, reflecting the POST-adversarial
truth: each Tier-1 requirement / user directive becomes a `criteria[]` entry whose `status` is its
surviving verdict (OVERTURNED Tier-1 → `FAIL` plus a `blocking_findings` line; HIGH/CRITICAL still
UNPROVEN after the rebuttal → `UNPROVEN`; a run where `capture_mechanism_proven` was false →
`overall: INCONCLUSIVE`). Set `overall` and `stop_recommendation` per the derivation rules in the
schema doc. Then self-validate:

    node ~/.claude/skills/system-validation/scripts/validate-verdict.mjs <output_path>/verdict.json

It MUST exit 0 before you present to the user; if it exits 1, fix the verdict so it is internally
consistent (a non-zero exit means your stated `overall`/`stop_recommendation` contradict the
criteria — usually an over-optimistic PASS). This file is the convergence signal consumed by
orchestrators such as `ei-loop`; the prose synthesis below is for the human and must agree with it.

Do not relay the report summary verbatim. Synthesize in terms of what matters to the user:
```

- [ ] **Step 2: Document the artifact in `ei-validate/checkpoint-contract.md`**

Append this section to the end of `ei-validate/checkpoint-contract.md`:

```
---

## Final Artifact: verdict.json (Gate 5)

**Written by:** the Conductor at Gate 5 Step 0, after ADVERSARIAL_COMPLETE is parsed and applied.
**Consumed by:** the user (as the human synthesis) and any orchestrator (e.g. `ei-loop`) as the
machine-readable convergence signal.

Schema, field semantics, and the `overall`/`stop_recommendation` derivation rules:
`references/verdict-schema.md`. The file MUST pass
`scripts/validate-verdict.mjs <output_path>/verdict.json` (exit 0) before the Gate-5 user synthesis —
the validator re-derives `overall` from the criteria, so a verdict that claims PASS while a criterion
FAILed is rejected. This is the deterministic guard that keeps the prose synthesis and the
machine-readable signal in agreement.
```

- [ ] **Step 3: Author a representative Gate-5 verdict and validate it**

Create a temp verdict that mirrors what a real Gate-5 run would emit (two surviving requirements, one OVERTURNED), then validate:

```bash
cat > /tmp/verdict.gate5.json <<'JSON'
{
  "schema_version": "1.0",
  "run_id": "gate5-rep-001",
  "target": "system:demo-app",
  "timestamp": "2026-06-16T13:00:00Z",
  "overall": "FAIL",
  "stop_recommendation": "NOT_YET",
  "criteria": [
    { "id": "REQ-1", "title": "login succeeds", "status": "PASS", "verification_method": "live run + TAP", "evidence": "live-behavioral/REQ-1.jsonl" },
    { "id": "REQ-2", "title": "marker click shows flyout", "status": "FAIL", "verification_method": "screenshot diff", "evidence": "shots/req2.png" }
  ],
  "adversarial": { "applied": true, "overturned": ["REQ-2"], "unproven": [], "canary_calibration": "ok" },
  "blocking_findings": ["REQ-2 OVERTURNED: flyout never renders on marker click"]
}
JSON
node ei-validate/scripts/validate-verdict.mjs /tmp/verdict.gate5.json; echo "exit=$?"
```
Expected: `VALID: /tmp/verdict.gate5.json (overall=FAIL, stop=NOT_YET)` then `exit=0`.

- [ ] **Step 4: Structural review of the edits**

Confirm by reading the two files:
- `ei-validate/SKILL.md` Gate 5 now contains "Gate 5 Step 0 — Emit the machine-readable verdict (REQUIRED)" and the `validate-verdict.mjs` self-validation command, positioned before "Do not relay the report summary verbatim."
- `ei-validate/checkpoint-contract.md` ends with the "Final Artifact: verdict.json (Gate 5)" section.

Expected: both present; no other Gate-5 behavior changed.

- [ ] **Step 5: Commit**

```bash
git add ei-validate/SKILL.md ei-validate/checkpoint-contract.md
git commit -m "feat(ei-validate): emit + self-validate machine-readable verdict.json at Gate 5

Gate 5 now writes verdict.json (post-adversarial truth) and runs validate-verdict.mjs
before the user synthesis. This is the convergence signal ei-loop will consume.

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review (run after implementing, before handing off Phase 1)

1. **Spec coverage:** Phase 1 implements spec §7 Stage 4 ("ei-validate retrofitted to emit a machine-readable verdict") and the §6 anti-gaming "external/objective verifier" principle (the consistency check). Other spec sections are explicitly Phases 2–4 (see Phase Map). No Phase-1 gap.
2. **Placeholder scan:** every code/JSON/edit block above is complete and runnable — no TBD/TODO.
3. **Type consistency:** the enums and required keys in `verdict-schema.md` (Task 1) exactly match the arrays `OVERALL/STOP/CRIT/CALIB` and required-key list in `validate-verdict.mjs` (Task 2), and the Gate-5 emission rules in Task 3. The validator's derivation matches the schema doc's derivation rules verbatim.

---

## Next phase

After Phase 1 lands, Phase 2 (ei-loop conductor skeleton + `.ei-loop/` state + re-entrancy) is the next plan. It consumes this phase's `verdict.json` contract as the signal its loop-control reads.
