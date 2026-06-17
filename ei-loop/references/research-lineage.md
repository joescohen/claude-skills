# Research Lineage

ei-loop is not a new paradigm. It is the LLM-agent form of a decades-old closed-loop
control architecture, with well-documented failure modes and a known set of engineering
controls. This file names the lineage precisely, maps it to ei-loop's design, and records
the two genuine gaps the skill must own itself.

The full research study is at:
`.planning/research/autonomous-coding-loops/RESEARCH.md` (relative to the claude-skills
repo root), with source grades in the sibling `sources.md`.

---

## The Core Paradigm: CEGIS / Closed-Loop Generate-and-Verify

**ei-loop is CEGIS with an LLM synthesizer.**

CEGIS (Counterexample-Guided Inductive Synthesis) — Jha & Seshia, Acta Informatica 2015,
arXiv:1505.03953 — defines the loop: a *synthesizer* proposes a candidate program; a
*verifier* checks it and, on failure, returns a counterexample; the synthesizer uses that
counterexample to rule out the failed candidate and try again. Repeat until verified or
resources exhausted. In ei-loop: the LLM (via `gsd-execute-phase` or TDD maker/checker) is
the synthesizer; `ei-validate` is the verifier; a failing `verdict.json` is the
counterexample; the conductor re-enters at the stage the verdict names.

The broader intellectual ancestry:

- **PDCA / closed-loop control** (Shewhart-Deming 1939; Wiener Cybernetics 1948): the
  passing validation target is the setpoint; the gap between the current state and that
  target is the error signal; the agent is the controller. The loop runs until the error
  signal is zero (global rubric PASS) or a hard bound fires.

- **TDD red-green** (Beck 2003): write the failing test that encodes the acceptance
  criterion first — the test is the verifier. Stage 3's Build step is TDD run by an agent:
  write the test that *encodes* the acceptance criterion, then implement until it goes green.
  The diff-guard (see `scripts/diff-guard.mjs`) enforces TDD discipline: a Build diff may
  not modify the test files that encode its own acceptance criteria.

- **Genetic programming / fitness functions** (Koza 1992): the verifier is the fitness
  function; the synthesizer is the variation operator; convergence is fitness saturation or
  generation cap. The generate-and-test asymmetry (Cook 1971 / P-vs-NP intuition) makes the
  loop economical: verifying a candidate is cheaper than generating a correct one from
  scratch — but this asymmetry *breaks down when the verifier is noisy or gameable*.

- **Reflexion** (Shinn et al., NeurIPS 2023, arXiv:2303.11366): inference-time verbal RL
  from an external pass/fail signal, without weight updates. The Actor / Evaluator /
  Self-Reflection triad maps directly: the builder is the Actor; `ei-validate` is the
  Evaluator; the conductor's loop re-entry with the failed verdict is the Self-Reflection
  step.

**Deployed analogues at scale:**

- **FunSearch / AlphaEvolve** (DeepMind, Nature 2024): LLM generate-evaluate loop over
  mathematical programs. The verifier is objective and external (running the program and
  checking the output against a known scorer). This is the same shape as ei-loop, at a
  different scale and domain.

- **Karpathy's autoresearch** (github.com/karpathy/autoresearch, 2026): agent edits
  `train.py`, runs a fixed 5-minute training loop, reads a single scalar verifier
  (`val_bpb`), binary keep/discard, ~100× runs overnight. Human controls only the objective
  in `program.md`. This is the minimal reference implementation. Karpathy's design law:
  *"LLMs can automate what you can verify."*

**Industry convergence:** AWS Kiro, GitHub spec-kit, and OpenAI Codex all converge on
"spec-driven development" (SDD) as the 2024–2026 production form: a human-approved spec
with acceptance criteria becomes a verifiable stop condition. The *full* outer meta-loop
(research → rubric → execute → validate, re-run to convergence) appears in emerging
practitioner pipelines (Hayashi, blog.mariohayashi.com, 2026; the "chained-phase pipeline"
pattern) but not yet as one canonical named system. That outer composition is what ei-loop
provides.

---

## The Load-Bearing Design Law: The Verifier Must Be External and Objective

**The single most-converged finding across every research dimension:**

> The verifier must be external, objective, and hard to game. LLMs largely cannot
> self-correct without a genuine external signal.

Two peer-reviewed papers establish this as the hard constraint, not a design preference:

- **Huang et al., "Large Language Models Cannot Self-Correct Reasoning Yet"** — ICLR 2024,
  arXiv:2310.01798: when a single model critiques and revises its own reasoning, performance
  *degrades* unless an external oracle (test runner, ground truth) is involved. The model
  has no reliable internal signal about its own errors.

- **Kamoi et al., "When Can LLMs Actually Correct Their Own Mistakes?"** — TACL 2024 (MIT
  Press): taxonomy of self-correction settings; reliable external feedback is the *necessary
  condition* for reliable self-correction. Without it, gains are task-specific and do not
  generalize.

Karpathy independently arrives at the same conclusion from practice: "I don't trust current
metrics; LLM judges get gamed" (Dwarkesh Patel interview, Oct 2025). He calls this an
"evaluation crisis."

**How ei-loop operationalizes this law:**

1. **External oracle, not LLM opinion.** Every global-rubric criterion must resolve to an
   objective verifier (test, lint, type-check, file-diff, scalar metric). The oracle-boundary
   guard at Gate 0 enforces this: any criterion that cannot resolve to an objective verifier
   must either become a human-owned verdict or cause the unattended run to refuse to start.
   See `references/safety-and-autonomy.md`.

2. **Blind global auditor.** The Stage 5 global verdict-auditor (see
   `agents/global-verdict-auditor.md`) sees *only* `OBJECTIVE.md` and `evidence/` — never
   the build narratives or closer reasoning. This is the architectural control the Huang /
   Kamoi null result demands: the same agent that built cannot reliably assess whether it
   built correctly.

3. **Machine-readable verdict as convergence signal.** `ei-validate` emits a `verdict.json`
   (schema: `~/.claude/skills/ei-validate/references/verdict-schema.md`). The loop's
   re-entry logic reads this machine-readable file, not a human-readable summary. A verdict
   that a loop could self-interpret — "yes, I think I passed" — is exactly the failure mode
   the Huang / Kamoi papers document.

---

## Documented Failure Modes and ei-loop's Controls

The research catalog identifies six failure modes for autonomous coding loops. Each has a
named control in ei-loop's design.

### Verifier gaming / In-Context Reward Hacking (ICRH)

**Evidence:** Pan et al., "In-Context Reward Hacking" — ICML 2024, arXiv:2402.06627:
inference-time loops optimize a proxy verifier and degrade the true objective; standard
evaluations cannot detect it. Also: Gao, Schulman & Hilton "Scaling Laws for Reward Model
Overoptimization" (OpenAI 2022, arXiv:2210.10760) for training-time Goodhart dynamics; the
EvilGenie benchmark (arXiv:2511.21654) for coding-specific cheating patterns (hardcoding
outputs, deleting failing tests, reading `git log` for answers).

**ei-loop control:** The `scripts/diff-guard.mjs` deterministic check runs on every Build
commit and enforces: (a) the Build diff may not touch the test files that encode its own
acceptance criteria; (b) the Build diff may not delete files. The blind global auditor at
Stage 5 enforces a second layer: it sees the raw evidence artifacts, not the build narrative
the agent might have written to justify a pass.

### LLM self-correction limits (the "fake PASS" failure)

**Evidence:** Huang et al. ICLR 2024; Kamoi et al. TACL 2024 (see above).

**ei-loop control:** External oracle as the verifier; blind auditor at Stage 5; no
LLM-judgment-only verdict accepted in the unattended path.

### The 70% problem

**Evidence:** Osmani, "The 70% Problem" (addyo.substack.com, 2024–2025): autonomous agents
reliably reach ~70% of a task; the last 30% requires human judgment on ambiguity, edge
cases, and architectural trade-offs that the verifier does not capture.

**ei-loop control:** The `BLOCKED` status in `WORKLIST.md` and the conservative autonomy
posture (see `references/safety-and-autonomy.md`): deletions, schema migrations,
architectural escalations, dependency changes, secrets/network mutations, and destructive
git operations are automatically parked as BLOCKED and handed to a human. The loop does not
attempt to solve what it cannot safely verify.

### Context rot

**Evidence:** Chroma Research (2025): quality degrades over long agentic runs as the context
window accumulates noise. The research is CONFIRMED; the specific magnitude claims are not
reliable and are not cited here.

**ei-loop control:** Re-entrant, one-stage-per-invocation execution model inherited from
`ei-audit-project`. State lives on disk in `.ei-loop/` and in git, not in context. Every
stage invocation starts with a fresh context window that reads only the state it needs. See
`references/state-schema.md` and `checkpoint-contract.md`.

### Doom loops / oscillation

**Evidence:** Practitioner reports (Huntley "Ralph Wiggum technique," ghuntley.com 2025;
Osmani "Loop Engineering," 2025): agents revert their own work, re-attempt the same failed
approach, or declare success with failing tests. Confirmed in production systems.

**ei-loop control:** Per-sub-task attempt cap of 3 failed BUILD→VALIDATE cycles before
parking the item as BLOCKED. Global stall detection: the `DRY` stop condition fires when no
worklist item reaches PASS across the stall window. Both are evaluated deterministically by
`scripts/stop-condition.mjs`, not by LLM judgment.

### Cost blowups

**Evidence:** Real incidents confirmed (Uber/Microsoft/Priceline cluster, TechCrunch
Jun 2026). Direction is reliable; specific dollar figures are not cited here as those numbers
are poorly attributed.

**ei-loop control:** Hard global iteration ceiling and cost/token ceiling in `STATE.md`.
When either ceiling is reached, the run exits with stop condition `CAP` rather than
continuing. The cost ledger in `STATE.md` is updated every stage so a crash leaves an
accurate accounting.

---

## Two Gaps ei-loop Must Own

The research is sparse — not silent, but sparse — in two areas that directly affect ei-loop.
These are not speculative; they are places where the literature stops and the design must
proceed without external guidance.

### Gap 1: Unattended-run security

The threat model for overnight autonomous loops is near-absent from published research and
from the production system documentation surveyed. For an unattended run, the attack surface
includes: prompt injection via research-fetched content; secret exfiltration through
`evidence/` artifacts or commit messages; destructive git operations on the wrong branch;
and blast-radius containment if the loop misbehaves.

ei-loop's security contract (see `references/safety-and-autonomy.md`) defines these controls
because no prior work defines them. The key invariants: never start on a dirty repo (Gate 0
dirty-repo guard); run in a dedicated branch/worktree; research output is DATA, not
executable commands; confine writes to declared paths; no secrets in `evidence/` or commits.
This is the area of highest implementation risk and lowest external validation.

### Gap 2: The oracle boundary

The generate-and-verify loop is only sound where a real external oracle exists. For code:
tests, lint, type-check, file-diff, and scalar metrics provide genuine objective verification.
For domains without a clean oracle — research quality, travel recommendations, design
judgment — the loop degrades: the "verifier" becomes an LLM-judge, and the Huang / Kamoi
null result means the loop will converge on a confident-looking result that is not reliably
correct.

The oracle-boundary guard at Gate 0 makes this explicit: every criterion in the global rubric
must name its verification method, and any criterion whose verification method resolves only
to LLM judgment must either become a human-owned verdict or cause an unattended run to refuse
to start. This is a first-class architectural constraint, not a caveat. The full treatment is
in `references/safety-and-autonomy.md`.

---

## Summary: What ei-loop Is and Is Not

ei-loop is a well-grounded engineering composition of known parts. The paradigm
(CEGIS/PDCA/generate-and-verify), the failure modes (ICRH, self-correction limits, context
rot, doom loops, cost blowups), and the primary controls (external oracle, blind auditor,
fresh context, hard caps) are all documented in the literature. The value ei-loop adds is
the composition and the safety rails — specifically, the outer meta-orchestrator that chains
the heterogeneous sequence (ei-research → ei-recursive-goal rubric → `gsd-execute-phase` →
ei-validate) with re-entrant state, machine-readable convergence verdict, and the
conservative autonomy posture that the "70% problem" and oracle-boundary gap demand.

The claim "this is not new" is a feature, not a limitation. It means the design inherits a
full failure-mode catalog from the literature, each with a named control.
