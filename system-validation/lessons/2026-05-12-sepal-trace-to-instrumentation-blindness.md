---
id: 2026-05-12-sepal-trace-to-instrumentation-blindness
date: 2026-05-12
status: active
severity: high
tags: [tracing, observability-gap, false-pass, capture-mechanism, silent-failure]
applies_when:
  components: [pipeline, trace-pipeline, cli, api, classification, routing]
  signals: ["missing spans", "silent drop", "structured logging", "pino", "winston", "stdout shim", "TAP capture", "log parsing"]
  preconditions: ["structured logger present", "capture relies on stdout or log file"]
do_not_apply_if: ["system is web_ui only with no backend pipeline", "no structured logging in scope"]
---

## Problem

**Context:** A CLI pipeline (Sepal) used Pino for structured logging. The validation pipeline's executor agents relied on capturing stdout to parse structured log fields as test evidence. Pipeline stages emitted structured events with decision fields (`doc_type`, `confidence`, `routing_decision`).

**Symptom:** All negative-test rows passed — the executor reported "no erroneous event captured" as PASS. All positive-test rows also passed at the execution level. The overall run reported clean results. But the pipeline was actually misclassifying documents silently — the capture mechanism was blind.

## Trigger

Post-run review revealed that Pino's SonicBoom transport writes directly to a file descriptor, bypassing `process.stdout.write` shims. The executor's stdout capture intercepted nothing. Every "absence of event" assertion was vacuously true — not because the event didn't fire, but because no events were visible to the capture path.

## Root Cause

The capture mechanism (stdout interception) was never validated against the actual transport layer (SonicBoom fd-level writes). The validation pipeline assumed that "logger present in code" meant "logger output reachable by test harness." This assumption was false and undetectable without an explicit capture-path smoke test.

The deeper issue: negative tests ("X should not happen") are structurally vulnerable to capture blindness. A blind capture makes every negative assertion vacuously true. Without a paired positive control proving the capture path works, a negative PASS is meaningless.

## Detection Gap

Prior QA missed this because:
1. No capture-mechanism smoke test existed — the pipeline trusted that stdout capture worked
2. Negative tests had no paired positive controls — there was no way to distinguish "event correctly absent" from "capture blind"
3. The executor reported PASS on negative rows without proving it could see positive events through the same path
4. Code review confirmed logging calls existed but never verified they reached the capture surface

## Solution

**Validation steps:**
1. Before any test execution, emit a known sentinel event through the production logger and verify it arrives in the capture stream intact (Gate -1 Step 5)
2. Pair every negative-test row with a positive-control row using the same capture mechanism and a shared `pair_id`
3. If the positive control fails, downgrade the paired negative test to INCONCLUSIVE, never PASS
4. For state-propagation claims, use three-layer W/B/O rows with correlated IDs — a single end-to-end row cannot localize which layer broke

**Probes:**
- `{ "sv_smoke": "<run-id>", "ts": "<iso>" }` sentinel through production logger — must appear in captured stream within 2s
- Positive-control row asserting presence of a known event before any negative row runs
- W/B/O triple for each cross-layer state-propagation claim with matching `correlation_id`

## Outcome

**Verified on:** 2026-05-14 (Sepal re-validation after Gate -1 Step 5 and paired positive controls added)

**Artifact refs:**
- Gate -1 Step 5 (capture-mechanism smoke test) added to SKILL.md
- Negative-test / positive-control pairing rule added to matrix-agent.md
- Three-layer W/B/O state-propagation rows added to matrix-agent.md

## Adaptation Hints

**Generalizes to:**
- Any system where test evidence comes from log parsing rather than direct observation
- Any pipeline with structured logging where the transport layer differs from the capture layer
- Winston with file transports (logs go to file, not stdout)
- OpenTelemetry exporters writing to collectors (not available in test process)
- Any negative test in any system — capture blindness is not logger-specific

**Anti-patterns:**
- Trusting that "logger exists in code" means "logger output is capturable by test harness"
- Running negative tests without positive controls through the same capture path
- Reporting PASS on absence-of-signal without proving the signal path works
- Single end-to-end rows for cross-layer state propagation (cannot localize failures)

confidence: 0.95
provenance:
  author: system-validation skill audit
  source_run: sepal-validation-2026-05-12
  supersedes: []
