# Research Lineage

This skill recombines several established LLM-agent techniques into one operating model. Each
component is documented here so the loop is grounded in fact, not vibes.

---

## Chain-of-Verification (CoVe)

**Paper:** Dhuliawala et al., 2023 / ACL 2024 Findings. ["Chain-of-Verification Reduces
Hallucination in Large Language Models"](https://arxiv.org/abs/2309.11495).

**Method:** The model (i) drafts an initial response, (ii) plans verification questions to
fact-check its draft, (iii) answers those questions independently so the answers are not biased
by other responses, (iv) generates its final verified response.

**How this skill applies it:**
- Phase 1's numbered, falsifiable sub-claims are the "verification questions" decomposed
  upfront, not after the fact.
- Phase 2's parallel sub-claim auditors answer each question **independently** (no peer
  visibility) — the bias-isolation property CoVe relies on.
- Phase 5's verdict-auditor performs the final "verified response" step, but only over
  evidence artifacts, not over the closers' narrative.

**Reported gains (from the paper):** On a Wikidata-style list task, CoVe more than doubles
precision compared to a few-shot baseline (0.17 → 0.36). On MultiSpanQA closed-book, F1
improves from 0.39 to 0.48. On biography generation with factor+revise, FACTSCORE improves
from 55.9 to 71.4.

---

## Reflexion

**Paper:** Shinn et al., NeurIPS 2023. ["Reflexion: Language Agents with Verbal Reinforcement
Learning"](https://arxiv.org/abs/2303.11366).

**Method:** Three roles operate in a loop until convergence:
- **Actor** generates text and actions based on state observations
- **Evaluator** scores the Actor's trajectory (binary success/failure or scalar reward)
- **Self-Reflection** generates verbal reinforcement cues that inform the next Actor attempt

Completion criteria can include fixed iteration count, quality threshold, convergence
detection, or external verification.

**How this skill applies it:**
- The conductor's loop control is the Reflexion loop: iterate until verdict-auditor (Evaluator
  role) approves the trajectory.
- The Actor / Evaluator / Self-Reflection roles map to: gap-closers (Actor) / verdict-auditor
  (Evaluator) / conductor's delta synthesis (Self-Reflection, but human-readable rather than
  embedding-based).
- External verification (canonical-store-xref) is preferred over LLM judgment per the Reflexion
  paper's findings on completion criteria.

**Key design implication:** The separation of Actor and Evaluator into different agents is
what makes Reflexion's gains real. Same-agent self-evaluation is what motivates Phase 5's
explicit blindness rules.

---

## Constitutional AI

**Paper:** Bai et al., Anthropic 2022. ["Constitutional AI: Harmlessness from AI
Feedback"](https://arxiv.org/abs/2212.08073).

**Method:** The model critiques and revises its own outputs against an explicit constitution —
a list of rules / principles defining desired behavior. The constitution is locked at training
time and is the canonical reference for all critique steps.

**How this skill applies it:**
- Phase 1's locked rubric IS the constitution for this loop iteration.
- Just as a CAI principle is interpreted the same way by every critique step, the rubric is
  the same artifact every subagent references.
- The "do not relax mid-loop" rule mirrors CAI's training-time lock: changing the constitution
  mid-training would invalidate the alignment signal.

---

## Same-Model Self-Correction Limits

**Paper:** Huang et al., 2024. ["Large Language Models Cannot Self-Correct Reasoning
Yet"](https://arxiv.org/abs/2310.01798).

**Finding:** When a single model is asked to critique and revise its own reasoning, performance
often *degrades* rather than improves, unless an external signal (oracle, test runner, ground
truth) is involved. The model lacks reliable internal signal about its own errors.

**How this skill applies it:**
- This is the primary motivation for splitting Phase 5 (verdict-auditor) into a separate
  subagent that is blind to the closer narratives.
- Even better: the verdict-auditor's verdict is grounded in fresh **deterministic evidence**
  (canonical-store queries, test outputs) — not the auditor's own reasoning about the
  evidence. The auditor is a structured reader of ground truth, not a reasoner over claims.
- The v1 single-agent version of this skill ran into this failure mode: the agent that closed
  gaps also assessed whether they were closed, with predictable bias.

---

## Test-Driven Prompt Engineering

**Tools:** [Promptimize](https://github.com/preset-io/promptimize),
[promptfoo](https://github.com/promptfoo/promptfoo).

**Method:** Write and run falsification-first evaluations on prompts and agent outputs before
deploying. The test is what counts as done. "Trust me bro" is not a verdict; the data is.

**How this skill applies it:**
- Phase 4's "proof infrastructure first" mandate is TDPE applied to agent claims, not just
  code. Build the test that would fail under the claim's negation; then make it pass.
- Evidence artifacts (`evidence/*`) are the structured outputs that the verdict-auditor reads,
  analogous to a TDPE test suite's output.

---

## Popperian Falsification

**Origin:** Karl Popper's philosophy of science. A claim is scientific only if it is testable
and refutable — if no observation could prove it false, it is unfalsifiable and outside the
domain of science.

**How this skill applies it:**
- Sub-claim format: every C<n> includes an explicit `negation` field — what would prove it
  false. If you can't write the negation, the claim is unfalsifiable and the rubric is
  malformed.
- Phase 2 auditors are instructed to articulate the negation before reading any code. If they
  can't, they escalate the rubric back to the conductor.
- The "include at least one negative claim" rule (e.g., "when X is absent, Y must not appear")
  protects against vacuous-pass failure modes where a positive-only rubric never catches
  fabrication.

---

## Chain-of-Custody Verification

**Origin:** Digital forensics; recent applications in agent-trust frameworks (e.g.,
[MAIF](https://arxiv.org/html/2511.15097)).

**Method:** Every artifact has a traceable provenance from upstream source to final state,
where every transition is logged and verifiable. Tamper-proof in forensics; bias-proof here.

**How this skill applies it:**
- Phase 5's chain-of-custody trace is the terminator for DEFINITIVE YES. Every sub-claim's
  ✅ requires showing the unbroken chain from canonical source through transforms to the
  final artifact.
- This is the specific countermeasure to the failure mode observed in the SEPAL session that
  motivated this skill: a model that generates chunk_ids *looking* real but not actually
  appearing in the source corpus. Chain-of-custody catches fabrication that naive "output
  exists" checks miss.

---

## Multi-Agent Debate & Bias Isolation

**Papers:**
- Du et al., 2023. ["Improving Factuality and Reasoning in Language Models through Multiagent
  Debate"](https://arxiv.org/abs/2305.14325)
- Liang et al., 2023. ["Encouraging Divergent Thinking in Large Language Models through
  Multi-Agent Debate"](https://arxiv.org/abs/2305.19118)

**Finding:** Independent agents reduce confirmation bias and catch errors a single chain
misses. Bias isolation gains hold even when the underlying model is the same — the contextual
isolation does the work.

**How this skill applies it:**
- Parallel sub-claim auditors are independent contexts looking at different parts of the
  rubric. No peer visibility.
- Parallel gap closers are independent contexts working on different gaps. No peer visibility.
- The verdict-auditor is isolated from closer narratives.
- Same model can run all of these — the gain comes from *contextual* isolation, not from a
  different model class.

---

## The Composition (Why It Works)

The novelty of this skill is the composition:

```
Constitutional AI (locked rubric)
  → drives → Reflexion (audit-close-verdict loop)
  → loop body uses → CoVe (decomposed verification questions, answered independently)
                  + TDPE (proof infrastructure before fix)
                  + Falsifiability (every sub-claim has an explicit negation)
  → loop terminator is → Chain-of-Custody (not a confidence score)
  → bias isolation comes from → Multi-Agent Debate (parallel contexts, blind verdict auditor)
  → motivated by → Huang et al. on same-model self-correction limits
```

The v1 single-agent version of this skill demonstrated the loop in principle and produced
strong results, but ran into the failure mode the multi-agent split is designed to prevent:
the same agent closing a gap also assessed whether it was closed, with the predictable bias
that motivates the entire multi-agent literature. The v2 multi-agent architecture realizes
the bias-isolation gains while preserving the rubric coherence that requires a single
conductor.
