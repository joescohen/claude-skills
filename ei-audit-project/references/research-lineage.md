# Research Lineage — ei-audit-project

Design decisions in this skill trace to a standard-depth ei-research run (2026-06-09):
`Engineering/projects/.planning/research/RESEARCH-autonomous-audit-loop-2026-06-09.md`
(3 parallel researchers — academic / industry / community — plus blind adversarial critique).

| Design element | Evidence |
|---|---|
| External oracle gates; never model self-judgment | TDFlow 94.3% (human tests) vs 68% (LLM-judged), arXiv:2510.23761; Olausson arXiv:2306.09896; Huang arXiv:2310.01798; Kamoi survey arXiv:2406.01297 |
| Per-iteration scaffold vs free-run | Goal-drift scaffolding result, arXiv:2505.02709; Agentless fixed pipelines competitive on SWE-bench |
| One item per iteration | Anthropic "Effective Harnesses for Long-Running Agents" ("one feature at a time… critical"); Ralph community consensus |
| Fresh context per iteration; state on disk | Lost-in-the-middle arXiv:2307.03172; Huntley's critique of context-accumulating ralph plugin; CI-pipeline-not-conversation practitioner pattern |
| Test files untouchable; reward-hack check in verifier | METR reward-hacking documentation; Anthropic harness rule "unacceptable to remove or edit tests" |
| Deletion = proposal only | PocketOS/Cursor 9-second production DB deletion; Replit incident; zero practitioner endorsement of unattended deletion |
| Features = proposal only | "Overbaking" (unprompted post-quantum crypto); 31.7% AI-bloat debloat case (Saplin) |
| Dual-condition completion sentinel | Hallucinated-COMPLETE failure mode; frankbria/ralph-claude-code dual-condition exit |
| Dry-round + park-twice stop conditions | Ralph non-convergence loops; escape-hatch consensus |
| Blind verifier (no resolver narrative) | ei-recursive-goal verdict-auditor pattern; LLM self-preference bias arXiv:2410.21819 |
| Critique caveat honored: lean structure, not a rigid DAG | Adversarial critique finding #3 — evidence supports "some structure beats none", not "more is better" |
| Risk stratification across find/fix/feature/delete | Adversarial critique finding #4 — four distinct risk profiles, distinct gates |

Hard Rules 1-5 counter rationalizations captured verbatim in RED-phase baseline testing
(unattended-loop pressure scenario, 2026-06-09): test-rewrite ("the fix is ground truth"),
delete-after-grep, 8-item batch commit, src/ stub ("no exports, no risk"), and
"Expected: all tests pass" done-claims.
