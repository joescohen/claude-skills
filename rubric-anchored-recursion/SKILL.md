---
name: rubric-anchored-recursion
description: >
  Use when the user demands rigorous, recursive completion of a non-trivial capability —
  audits, full-chain validations, gap-closure passes, or "prove this works" tasks where the
  cost of a false-positive completion is high. The skill anchors work on an explicit, falsifiable
  rubric defined BEFORE execution starts, drives a recursive audit→delta→close→self-audit
  loop, and refuses to declare "done" until every sub-claim has binary evidence.
  Trigger phrases: "definitively", "without any question", "100% definitive proof", "audit current
  state", "audit yourself", "CEI audit", "prove that X works", "we can see X is happening", "run this
  until done", "iterate on a /loop until", "I'm going to sleep, run this all night", "ok fix and
  recursively verify", "use the same pattern as we have been". Also use proactively when the user
  repeats the same question after you previously claimed completion — that is a signal the prior
  claim was not definitive.
---

# Rubric-Anchored Recursion

## When to use this skill

Use this for work where:
- The user has named a **definitive completion criterion** (a single question that has a binary answer)
- The cost of claiming "done" prematurely is high (architectural commitments, audits, capability proofs, gap closures)
- The work is **multi-step, cross-layer, or cross-component** (no single test proves it)
- The user has previously had to push back on hedged or partial completion claims

If the task is a single localized change with a clear test, use `verification-before-completion` instead. If the task is "prove a specific runtime behavior fires end-to-end", use `implementation-proof-loop`. This skill is the **meta-loop** that orchestrates those (and other audits) against a rubric, with a recursion gate.

---

## The core principle

> A claim is only complete when every sub-claim of the rubric is **binary-verified** with **fresh evidence**, AND a self-audit against the original rubric surfaces **no new gap**.

Until then, the work is "in progress" — even if the current iteration produced something useful.

Operationalize the loop in five phases. Do not skip Phase 1; doing so collapses the whole loop into vibes.

---

## Phase 1 — Anchor the Rubric (BEFORE any code, audit, or investigation)

Write the rubric explicitly before doing anything else. The rubric has four required parts:

**1. The definitive question.** A single sentence, written as a question, whose answer must be either YES or NOT YET. No "kind of," no "probably," no "we're trending in the right direction."

> Example from real session: "CAN WE RAG → chunk + context → chunk similarity → similarity debate → trace_to definition → skill ingest/recall of chunks / usage of trace_to to connect important pieces of information together, resulting in an output document that includes information generated based on trace_tos?"

**2. The numbered, falsifiable sub-claims.** Decompose the definitive question into N atomic sub-claims (Cn). Each sub-claim must be:
- Falsifiable: a concrete observation could disprove it
- Atomic: it covers one layer / step / contract, not a bundle
- Independently verifiable: you can test it without first proving another sub-claim

Bad: "trace_to works correctly"
Good:
- C1: When a session runs against a corpus containing N≥1 linked_chunks, at least one RID in the output register has a non-empty `trace_to[]` containing a chunk_id present in the corpus's chunk_links table
- C2: The `expand-traceability` tool is invoked at least once per session when linked_chunks are present
- C3 (negative): When the corpus has no linked_chunks, no RID has fabricated chunk_ids in its `trace_to[]`

**3. The named verification methods.** For each sub-claim, name HOW it will be checked. Don't say "tests"; say which test, what TAP/log it captures, what data it compares against. Acceptable methods:
- Integration test capturing structured TAP events
- Cross-reference against a canonical store (e.g., `chunk_links` table) — chain-of-custody verification
- Live controlled run with captured logs, executed AFTER mocked tests pass
- Diff of artifact-on-disk against expected schema

**4. The binary verdict format.** State up-front how the answer will be reported:
```
Claim: <restate the definitive question>
Evidence:
  C1 [✅/❌]: <captured TAP / data / file content>
  C2 [✅/❌]: ...
  Cn [✅/❌]: ...
Verdict: DEFINITIVE YES  |  NOT YET (continue loop)
```

**Get user acknowledgment on the rubric before proceeding.** This is not formality — if the rubric is wrong, every subsequent loop is wasted. A one-line "rubric looks right, go" is enough.

---

## Phase 2 — Audit Current State Against the Rubric

Investigate; do not assert. For each sub-claim Cn, determine whether the current system already satisfies it. The audit must:

- **Be evidence-first.** Read code, query data, inspect artifacts. Reasoning from general principles is not audit; it's guessing.
- **Run in parallel when possible.** If sub-claims are independent, dispatch a sub-agent per claim (Explore for read-only investigation, general-purpose if a small fix is in scope). Parallel audits collapse the wall-clock cost of rigor.
- **Report per sub-claim with one of three states**:
  - ✅ WORKS — concrete evidence shown
  - ❌ BROKEN — concrete evidence of failure shown
  - ⚠️ PARTIAL — works for case A but not case B; name both

- **Forbid hedging.** No "looks like it should work." No "probably fine." If the evidence isn't there yet, the state is `⚠️ PARTIAL` with the specific gap named.

Output of Phase 2 is a sub-claim verdict table:

```
| Sub-claim | State | Evidence | Gap (if any) |
|-----------|-------|----------|--------------|
| C1        | ✅    | ...      | —            |
| C2        | ❌    | ...      | <specific>   |
| C3        | ⚠️    | ...      | <specific>   |
```

---

## Phase 3 — Synthesize the Delta

Convert all `❌` and `⚠️` rows into a prioritized gap list. Each gap has four fields:

- **Severity**: critical (blocks definitive YES) / important / nice-to-have
- **What closes it**: specific code change, new test, new instrumentation, new artifact
- **What evidence will prove closure**: name the exact TAP / table / file the closure must produce
- **Where to make the change**: file path / module / phase

This is where to decide if any gap warrants formal escalation:
- If a gap requires an architectural commitment (semantics of a data structure, contract between layers), **escalate to a GSD phase** with a DECISIONS.md entry. Tactical fixes do not get DECISIONS.md; architectural cuts do.
- If a gap requires changing a fundamental approach (Path A vs Path B vs Path C), **ask the user to pick** before closing — do not silently choose.

Do NOT skip to Phase 4 if any gap is architecturally ambiguous. Surface it.

---

## Phase 4 — Close Gaps with Proof Infrastructure First

For each gap, **build the proof infrastructure before fixing the code**. This is non-negotiable.

- For a runtime-behavior gap → use `implementation-proof-loop` (TAP-based claim → instrumentation → integration test → proof execution → live demo). The proof scaffold persists in the test suite.
- For a contract / schema gap → write the schema validator and a failing test that asserts the contract, before touching the producer.
- For an architectural gap → write the DECISIONS.md entry and the planning doc, before writing code.

Why proof-first: the proof infrastructure is durable; the fix is bounded. If the fix is reverted, the proof catches the regression. If the proof comes after, it just rubber-stamps whatever was written.

Execute the fix. Do not declare it done. Phase 5 will decide.

---

## Phase 5 — Self-Audit Against the Original Rubric

After you think the work is done, you must self-audit. Do not wait to be asked. Do not skip because tests pass — tests passing is a Phase 4 output, not a rubric-level verdict.

The self-audit re-runs Phase 2 with **fresh evidence** against the **original rubric** (not a relaxed version). Two outputs:

**Output A — the verdict block** (always, even if the answer is NOT YET):

```
Claim: <the definitive question, restated verbatim from Phase 1>

Evidence:
  C1 ✅  <fresh TAP / data captured this iteration>
  C2 ✅  <fresh TAP / data captured this iteration>
  C3 ⚠️  <what is proven; what is NOT proven; specifically what's missing>
  ...
  
Verdict: NOT YET
  Remaining gap: <one specific sentence>
  Next iteration will: <one specific action>
```

**Output B — the chain-of-custody trace** (only if claiming DEFINITIVE YES):

For every sub-claim, show the chain from the upstream source through every transform to the final artifact. No skipped layers. Example structure:

```
C1 chain-of-custody:
  1. corpus contains chunk_id=X (verified by: query chunk_links table)
  2. session loads chunk_id=X into context (verified by: TAP "corpus:load" with id=X)
  3. tool invocation receives chunk_id=X (verified by: TAP "tool:invoked" payload)
  4. final register contains trace_to=[X] (verified by: diff against rendered output file)
  5. X in register matches X in corpus (verified by: per-chunk verification table — VERIFIED, not FABRICATED)
```

If any link in the chain is not verifiable with fresh evidence, the verdict is NOT YET.

**If verdict is NOT YET → return to Phase 3 with the new delta. Do not return to Phase 2; the state is fresh from Phase 4's execution.** Iterate.

**If verdict is DEFINITIVE YES → exit the loop, return the chain-of-custody trace to the user as the proof artifact.**

---

## Anti-patterns (refuse to do these)

| Anti-pattern | Why it breaks the loop |
|--------------|------------------------|
| Skipping Phase 1 ("I know the criterion already") | Without an explicit rubric, the self-audit in Phase 5 has nothing to check against, and gap detection collapses to vibes. |
| Hedging language anywhere: "should work", "probably", "looks correct", "I'm confident" | Confidence ≠ evidence. The whole skill exists because the user got burned by this in past sessions. |
| Claiming partial proof as victory | The verdict is binary. Partial proof is `NOT YET` with a named gap. |
| Waiting for the user to ask "did you audit yourself?" | The skill REQUIRES Phase 5 to fire automatically. The user noticing first means the agent failed to internalize the loop. |
| Tests pass → declare done | Tests passing is a Phase 4 output. Phase 5 still has to evaluate the rubric. Tests cover what was written; the rubric covers what was promised. |
| Relaxing the rubric to make YES easier | The rubric is locked in Phase 1 with user acknowledgment. Changing it requires explicit user agreement, not silent loosening. |
| Inferring success from another agent's report | If a sub-agent reports its work as done, the parent's verification re-checks the artifact (diff, query, TAP capture), not the report. |
| Continuing past a Path-ambiguous gap without asking | Architectural cuts get user input; don't silently pick. |

---

## When the user repeats a question after a completion claim

**Treat this as an automatic Phase 5 re-trigger with a stricter rubric.**

If the user re-asks the same question after the agent already said "yes, done" (especially with formatting like "so, I'll ask the same question I keep asking..."), the prior claim was wrong. Default response:

1. State explicitly: "NOT YET 100%. Here's exactly where the gap is."
2. Show the verdict block with the specific sub-claim that's missing fresh evidence
3. Name what proof infrastructure is missing to close it
4. Propose building it (Phase 4) before re-running the loop

Do not relitigate the prior claim. Do not defend it. The user repeating the question is the verdict.

---

## When to escalate to formal methods (GSD)

Move the work out of this skill's loop and into a GSD phase when:
- A gap requires an architectural commitment (a contract between layers, a data semantics decision)
- The chosen fix will outlive this session — future maintainers need to know why
- More than one viable path exists, and the choice has long-term consequences

In those cases, the loop pauses, you generate a DECISIONS.md entry via `gsd-discuss-phase` → `gsd-plan-phase` → `gsd-execute-phase`, then resume Phase 4 of THIS loop with the GSD output as the closure for that gap.

Tactical fixes (a missed wire, a wrong schema field, a missing test) do not get formal escalation. They get closed in-loop.

---

## Connection to existing skills

This skill is the orchestrator. It calls into:
- **`verification-before-completion`** — the single-claim verification gate. Every Phase 5 sub-claim verification uses this skill's principle (run the fresh command, read the output, then claim).
- **`implementation-proof-loop`** — the recipe for proving a specific runtime behavior. Used inside Phase 4 when a gap is "behavior X must be observed firing".
- **`test-driven-development`** — used inside Phase 4 when the gap closure is a new piece of code.
- **`systematic-debugging`** — used inside Phase 2/3 when a sub-claim audit surfaces a bug that needs root-cause investigation before closure.
- **GSD `gsd-discuss-phase` / `gsd-plan-phase` / `gsd-execute-phase`** — used when escalating an architectural gap out of the loop.

Do not duplicate the work those skills do. Invoke them.

---

## Research lineage (why this works)

This pattern recombines several established LLM-agent techniques into one operating model. It is documented here so the loop is grounded in fact, not vibes:

- **Chain-of-Verification (CoVe)** (Dhuliawala et al., 2023 / ACL 2024 Findings) — draft → plan verification questions → answer them independently → revised final. Phase 1's falsifiable sub-claims and Phase 5's per-sub-claim verification implement CoVe at the meta-task level. CoVe more than doubles precision on list tasks (0.17 → 0.36) and improves FACTSCORE on biography generation (55.9 → 71.4). [Paper](https://arxiv.org/abs/2309.11495)
- **Reflexion** (Shinn et al., NeurIPS 2023) — Actor + Evaluator + Self-Reflection loop, iterates until the Evaluator deems the trajectory correct, with persistent reflection memory across trials. Phase 5's NOT YET → return to Phase 3 is the Reflexion loop; the rubric is the Evaluator's spec. [Paper](https://arxiv.org/abs/2303.11366)
- **Constitutional AI** (Bai et al., Anthropic 2022) — the model critiques its own outputs against an explicit constitution / rubric. Phase 1's locked-in rubric is the "constitution" for this task. [Paper](https://arxiv.org/abs/2212.08073)
- **Test-Driven Prompt Engineering** (Promptimize, promptfoo) — falsification-first evaluation of agent outputs; the test is what counts as done. Phase 4's "proof infrastructure first" is TDD applied to agent claims, not just code.
- **Popperian falsification** — a claim only counts as scientific if it is testable and falsifiable. Phase 1's sub-claim format ("could be proven false by X") is Popper's criterion.
- **Chain-of-custody verification** (digital forensics; recent agent-trust frameworks like MAIF) — every artifact has a traceable provenance from upstream source to final state. Phase 5's chain-of-custody trace borrows this directly, used to detect fabrication (a real failure mode observed when models invent chunk_ids that look real but aren't in the source corpus).

The novelty here is composition: the rubric (Constitutional AI) is the input to the recursive loop (Reflexion), the loop body uses verification-question decomposition (CoVe) and falsifiable claim format (Popper / TDPE), and the terminator is a chain-of-custody trace, not a confidence score. This composition is what makes the loop self-correcting against the failure mode the user kept hitting — fabricated success claims.

---

## Origin

This skill was distilled from a 2026-05-12 SEPAL session in which the user incrementally taught the agent the pattern through repeated corrections, then explicitly named it ("Use the same pattern as we have been, yes. Go.") near the end of the session. The skill exists so the loop fires on the first turn, not the sixtieth.

The agent's reciprocal behaviors that mark internalization of this loop (and that other agents should reproduce):
- Volunteers a self-audit before being asked
- Reports findings in a verdict table with binary states, not prose
- Identifies its own gaps before the user does
- Builds new proof infrastructure when existing proof is insufficient, without being prompted
- Switches its own claim from YES to NOT YET when a gap surfaces, with no defensive posture
- Invokes formal methods (GSD) for durable decisions, not session notes

If you find yourself wanting to say "this should work now" — stop. That is the failure mode this skill exists to prevent. Run Phase 5 against fresh evidence.
