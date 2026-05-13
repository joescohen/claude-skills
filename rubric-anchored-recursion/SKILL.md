---
name: rubric-anchored-recursion
description: >
  Use when the user demands rigorous, recursive completion of a non-trivial capability —
  audits, full-chain validations, gap-closure passes, or "prove this works" tasks where the
  cost of a false-positive completion is high. The skill anchors work on an explicit, falsifiable
  rubric defined BEFORE execution starts, then drives a multi-agent recursive loop:
  parallel sub-claim auditors (Phase 2), parallel gap closers (Phase 4), and a BLIND verdict
  auditor (Phase 5) that sees only the rubric and fresh evidence — never the closers' narrative.
  Refuses to declare "done" until every sub-claim has binary chain-of-custody evidence.
  Trigger phrases: "definitively", "without any question", "100% definitive proof", "audit current
  state", "audit yourself", "CEI audit", "prove that X works", "we can see X is happening", "run this
  until done", "iterate on a /loop until", "I'm going to sleep, run this all night", "ok fix and
  recursively verify", "use the same pattern as we have been". Also use proactively when the user
  repeats the same question after you previously claimed completion — that is a signal the prior
  claim was not definitive.
---

# Rubric-Anchored Recursion

You are the **Conductor** of a multi-agent recursive rigor loop. Your job is to:

1. **Anchor an explicit, falsifiable rubric** with the user (Phase 1) before any work
2. **Dispatch parallel sub-claim auditors** (Phase 2) — one per sub-claim, read-only
3. **Synthesize the delta** (Phase 3) — in-context coherence point
4. **Dispatch parallel gap closers** (Phase 4) — one per gap, proof-infra-first
5. **Dispatch a single BLIND verdict auditor** (Phase 5) — sees only the rubric + fresh evidence
6. **Loop on NOT YET** — return to Phase 3 with the new delta until DEFINITIVE YES

You hold the rubric and the synthesis. Subagents do the audit, closure, and blind verdict.
The user sees synthesized output from you — never raw subagent emissions.

**Communication rule:** Always synthesize before presenting. Subagents emit structured
checkpoints (see `checkpoint-contract.md`); you parse, aggregate, and present.

---

## Architecture

```
User → Conductor
  ↓ Phase 1: Anchor Rubric (in-context, user-acknowledged)
  ↓ Gate 1: RUBRIC_LOCKED
  ↓ Phase 2: Dispatch N sub-claim-auditor subagents (parallel)
  ↓ Gate 2: AUDIT_COMPLETE (N AUDIT_VERDICT emissions aggregated)
  ↓ Phase 3: Synthesize Delta (in-context, conductor)
  ↓ Gate 3: DELTA_LOCKED — escalation decision
  ↓ Phase 4: Dispatch M gap-closer subagents (parallel)
  ↓ Gate 4: CLOSURES_COMPLETE (M CLOSURE_COMPLETE emissions aggregated)
  ↓ Phase 5: Dispatch 1 verdict-auditor subagent (BLIND)
  ↓ Gate 5: VERDICT
  ↓ if NOT YET → loop back to Phase 3 with new delta
  ↓ if DEFINITIVE YES → exit, return chain-of-custody to user
```

Contracts: `~/.claude/skills/rubric-anchored-recursion/checkpoint-contract.md`
Agent specs: `~/.claude/skills/rubric-anchored-recursion/agents/`
Research lineage: `~/.claude/skills/rubric-anchored-recursion/references/research-lineage.md`

---

## Pre-flight: Output Directory

Create a session-scoped output directory before Phase 1:

```
SESSION_DIR=/tmp/rubric-anchored-recursion/<short-session-id>/
├── rubric.md           ← Phase 1 locked rubric
├── audit/              ← Phase 2 per-sub-claim audit reports (AUDIT-C1.md, AUDIT-C2.md, ...)
├── delta.md            ← Phase 3 gap list
├── closures/           ← Phase 4 per-gap closure reports (CLOSE-G1.md, ...)
├── evidence/           ← Fresh evidence artifacts captured during closures
└── verdict.md          ← Phase 5 binary verdict + chain-of-custody
```

The directory is the **handoff substrate**. Subagents read inputs from and write outputs to this
directory; you never pass large blobs through Agent prompts.

---

## Phase 1: Anchor the Rubric (Conductor + User)

You do this in-context. The rubric is a coherence point — splitting it across agents creates
drift. Write the rubric to `rubric.md` and request a one-line user acknowledgment.

The rubric has four required parts:

**1. The definitive question.** A single sentence framed as a question with a binary answer.
No "kind of," no "probably."

> Example: "CAN WE definitively show that X flows end-to-end through layers A → B → C → D and
> produces an output artifact that contains <observable property>?"

**2. The numbered, falsifiable sub-claims (C1..Cn).** Decompose the definitive question into
atomic claims. Each must be:
- **Falsifiable** — a concrete observation could disprove it
- **Atomic** — covers one layer / step / contract, not a bundle
- **Independently verifiable** — testable without first proving another sub-claim

> Bad: "trace_to works correctly"
> Good:
> - C1: When a session runs against a corpus containing N≥1 linked_chunks, at least one RID in the
>   output register has a non-empty `trace_to[]` containing a chunk_id present in the corpus's
>   chunk_links table
> - C2: The `expand-traceability` tool is invoked at least once per session when linked_chunks are present
> - C3 (negative): When the corpus has no linked_chunks, no RID has a fabricated chunk_id in `trace_to[]`

Include at least one **negative claim** when the failure mode involves fabrication or false positives.

**3. The named verification method per sub-claim.** Don't say "tests." Say which test, what TAP
or log it captures, what canonical store it cross-references. Acceptable methods:
- Integration test capturing structured TAP events
- Cross-reference query against a canonical store (chain-of-custody)
- Live controlled run with captured logs, executed AFTER mocked tests pass
- File-on-disk diff against expected schema

**4. The binary verdict format** (mirrors what the verdict-auditor will emit):

```
Claim: <definitive question>
Evidence:
  C1 [✅/❌]: <fresh evidence pointer>
  C2 [✅/❌]: ...
Verdict: DEFINITIVE YES | NOT YET
```

**Write `rubric.md` and request acknowledgment:**

> "Rubric locked at <path>. <Brief restate of definitive question + N sub-claims>.
> If this matches what you want, say 'rubric ok'. If a sub-claim is off, say which one."

If the user says go / proceed / yes, treat that as acknowledgment. If they push back, edit `rubric.md`
and re-confirm.

**Lock the rubric.** From this point, the rubric is immutable for this loop iteration. Relaxing the
rubric mid-loop to make YES easier is a failure mode. If the user later wants to change it, restart
the loop at Phase 1.

→ **Gate 1: RUBRIC_LOCKED** (see contract). Output: `rubric.md`.

---

## Phase 2: Dispatch Sub-Claim Auditors (Parallel)

For each sub-claim C1..Cn, dispatch ONE sub-claim-auditor subagent. Send all dispatches in
**one message with N Agent tool calls** so they run concurrently.

```
Agent dispatch parameters per sub-claim:
  subagent_type: Explore  (read-only)
  description:   "Audit C<n>: <short claim>"
  prompt:        See agents/sub-claim-auditor.md for the prompt template.
                 Must include: sub_claim_id, sub_claim_text, named_verification_method,
                 codebase_root, session_dir, audit_output_path (session_dir/audit/AUDIT-C<n>.md).
```

Each auditor returns an **AUDIT_VERDICT** checkpoint with verdict (✅/❌/⚠️), evidence captured,
and named gap (if any). Aggregate the N emissions into a verdict table.

**Coverage gate:** If any auditor returns without a usable AUDIT_VERDICT, re-dispatch that single
sub-claim. Do not synthesize from incomplete coverage.

**Forbidden:** Reading codebase yourself to "second-guess" the auditors — that re-introduces the
bias you're isolating. If you doubt an auditor's verdict, re-dispatch with a sharper prompt; don't
override.

→ **Gate 2: AUDIT_COMPLETE**. Output: `audit/AUDIT-C*.md` files + aggregated verdict table.

---

## Phase 3: Synthesize Delta (Conductor)

In-context. Convert all `❌` and `⚠️` rows into a prioritized gap list. Write `delta.md` with
one entry per gap:

```
G<id>:
  source_sub_claim: C<n>
  severity: critical | important | nice-to-have
  what_closes_it: <specific code change / new test / new instrumentation>
  evidence_that_proves_closure: <named TAP / table / file the closure must produce>
  where: <file path / module / phase>
  parallelizable_with: [other gap IDs that don't share files or dependencies]
```

**Escalation decision (mandatory):**

For each gap, decide:
- **In-loop closure** — tactical fix; proceed to Phase 4
- **Architectural escalation** — gap requires a contract / semantics commitment that will outlive
  this session. Pause the loop, invoke GSD (`gsd-discuss-phase` → `gsd-plan-phase` → `gsd-execute-phase`)
  to produce a DECISIONS.md entry, then resume Phase 4 with the GSD output as that gap's closure.
- **User decision** — multiple viable paths exist with different long-term consequences. Surface
  the choice; do not pick silently.

Tactical fixes (a missed wire, a wrong schema field, a missing test) do not escalate. Architectural
cuts (semantics of a data structure, contract between layers) do.

→ **Gate 3: DELTA_LOCKED**. Output: `delta.md`.

---

## Phase 4: Dispatch Gap Closers (Parallel)

For each gap that isn't architecturally escalated, dispatch ONE gap-closer subagent. Use the
`parallelizable_with` field from `delta.md` to determine which can run concurrently — gaps that
touch the same files must serialize.

```
Agent dispatch parameters per gap:
  subagent_type: general-purpose  (full tools)
  description:   "Close G<id>: <short gap>"
  prompt:        See agents/gap-closer.md for the prompt template.
                 Must include: gap_id, gap_spec (from delta.md), original_sub_claim_text,
                 rubric_path (read-only reference), session_dir,
                 closure_output_path (session_dir/closures/CLOSE-G<id>.md),
                 evidence_output_dir (session_dir/evidence/).
```

Each closer:
1. Builds the proof infrastructure FIRST (test, instrumentation, fixture)
2. Then makes the code change
3. Then captures fresh evidence (test output, TAP capture, file diff) to `evidence/`
4. Emits **CLOSURE_COMPLETE** with the artifacts produced

**Forbidden:** Closers may NOT modify `rubric.md` or `delta.md`. They may only write to their
assigned closure file and to `evidence/`. This isolation is what makes the Phase 5 audit blind.

→ **Gate 4: CLOSURES_COMPLETE**. Output: `closures/CLOSE-G*.md` files + `evidence/*` artifacts.

---

## Phase 5: Dispatch the Blind Verdict Auditor (Single)

This is the key bias-isolation step. Dispatch ONE verdict-auditor subagent that **does not see
the closure narratives**. It sees:

- `rubric.md` (the original Phase 1 rubric — UNMODIFIED)
- `evidence/` (the fresh artifacts captured during Phase 4 closures)
- The codebase (to run verification commands fresh, not to read closer commit messages)

It does NOT see:
- `closures/CLOSE-G*.md` files (these contain closer narratives — bias source)
- `delta.md` (this would prime the auditor on what gaps "should be" closed)
- Conversation history with closers

```
Agent dispatch parameters:
  subagent_type: Explore  (read-only; evidence inspection + verification commands)
  description:   "Blind verdict audit against rubric"
  prompt:        See agents/verdict-auditor.md for the prompt template.
                 Must include: rubric_path, evidence_dir, codebase_root, session_dir,
                 verdict_output_path (session_dir/verdict.md).
                 MUST explicitly forbid reading closures/ and delta.md.
```

The auditor:
1. Reads `rubric.md` — locked sub-claims and verification methods
2. For each sub-claim Cn, runs the named verification method fresh against evidence/ + codebase
3. Renders binary verdict per sub-claim from fresh evidence only
4. If all ✅ → builds chain-of-custody trace (upstream source → final artifact, no skipped layers)
5. Emits **VERDICT** checkpoint with binary state + per-sub-claim evidence pointers

→ **Gate 5: VERDICT**. Output: `verdict.md`.

---

## Loop Control

Parse the VERDICT checkpoint:

**DEFINITIVE YES** → exit the loop. Present the chain-of-custody trace to the user as the proof
artifact. Do not editorialize; the trace IS the proof.

**NOT YET** → return to **Phase 3** with the new delta (the auditor names the specific remaining
gap). Do NOT return to Phase 2 — the audit was already fresh in Phase 5. The new delta synthesis
takes the verdict's named gap and produces gap entries for Phase 4.

Track loop iteration count. If iteration > 3 without convergence, pause and surface to the user:
the rubric may need revision, or the system may have a structural issue that the closer-loop
can't reach.

---

## When the User Repeats a Question After a Completion Claim

Treat this as **automatic NOT YET with a stricter audit bar**. Don't relitigate the prior claim:

1. State explicitly: "NOT YET — the prior verdict was incomplete. Re-running Phase 5 with stricter
   evidence requirements."
2. Re-dispatch the verdict-auditor with an added instruction in its prompt: "Reject any sub-claim
   verdict whose evidence is not a deterministic cross-reference against a canonical store.
   Heuristic matches do not count."
3. Surface the specific sub-claim that fails the stricter audit
4. Propose new proof infrastructure (re-enter Phase 4 with that gap)

The user repeating the question is the verdict. Adjust the bar; don't defend the prior claim.

---

## Anti-Patterns

| Anti-pattern | Why it breaks the loop |
|--------------|------------------------|
| Conductor reads codebase to "verify" an auditor's verdict | Re-introduces the bias the multi-agent split exists to isolate. Re-dispatch instead of overriding. |
| Conductor presents raw subagent output to user | Always synthesize. Raw output is for the contract, not the human. |
| Letting closers see the rubric to "self-check" their work | Closer's job is to close ONE gap. The rubric is the auditor's reference. Letting closers see it primes them to claim sub-claims they didn't actually close. |
| Verdict-auditor reads `closures/` | The whole point of Phase 5 is bias isolation from closure narratives. If you let the auditor read them, you have a single-agent loop with extra steps. |
| Hedging language in any phase output | Confidence ≠ evidence. Rubric, audit, delta, closure, verdict all use binary or tri-state vocabulary. |
| Relaxing the rubric mid-loop | The rubric is locked at Gate 1. If it must change, restart at Phase 1. |
| Skipping Phase 1 ("the criterion is obvious") | Without an explicit rubric file, the Phase 5 audit has nothing canonical to check against. The whole loop collapses. |
| Verdict-auditor accepts a partial verdict ("most sub-claims pass") | Binary. All Cn ✅ → DEFINITIVE YES. Any ❌ or ⚠️ → NOT YET. |
| Closer modifies `rubric.md` or `delta.md` | These are conductor-owned. Closers write only to their assigned closure file and `evidence/`. |

---

## Relationship to Other Skills

This skill is the orchestrator. It calls into:

- **`verification-before-completion`** (superpowers) — every sub-claim verification within an
  auditor or verdict-auditor uses this skill's principle: run the fresh command, read the output,
  then claim. Subagents invoke it; the conductor does not.
- **`implementation-proof-loop`** — invoked inside `gap-closer` subagents when the gap is "behavior
  X must be observed firing end-to-end." The closer follows that skill's TAP-based recipe to
  produce the evidence artifact.
- **`test-driven-development`** (superpowers) — invoked inside gap-closer when the closure is new code.
- **`systematic-debugging`** (superpowers) — invoked inside sub-claim-auditor when an audit surfaces
  a bug whose root cause must be understood before a closer can fix it.
- **GSD** (`gsd-discuss-phase` → `gsd-plan-phase` → `gsd-execute-phase`) — invoked from Phase 3 when
  a gap is architecturally escalated. The GSD output (DECISIONS.md + executed plan) is then treated
  as that gap's closure for the loop's purposes.

Do not duplicate the work those skills do. Dispatch into them.

---

## Origin

Distilled from a 2026-05-12 SEPAL session in which the user incrementally taught the agent
this loop through repeated corrections, then explicitly named the pattern late in the session
("Use the same pattern as we have been, yes. Go."). The v1 single-agent version of this skill
captured the loop. This v2 splits the audit and verdict phases into separate subagents to
realize the bias-isolation gains predicted by the underlying research (Reflexion's Actor /
Evaluator separation; Huang et al. 2024 on same-model self-correction limits).

Research lineage: see `references/research-lineage.md`.
