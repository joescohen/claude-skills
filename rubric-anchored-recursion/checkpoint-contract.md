# Checkpoint Contract

This file defines the communication protocol between specialist subagents and the Conductor.
Every gate has a defined emit schema. The conductor parses these from the Agent tool's return
value (the final block of the subagent's response). Subagents MUST emit their checkpoint as the
**final content** in their response.

The conductor never reads narrative text from a subagent's return value — only the checkpoint
block. Anything outside the checkpoint is the subagent's working notes and is ignored for
loop-control purposes. Files written to `session_dir/` are the canonical handoff.

---

## Gate 1: RUBRIC_LOCKED

**Owner:** Conductor (in-context, not a subagent emission)
**Canonical artifact:** `session_dir/rubric.md`

Schema for `rubric.md`:

```markdown
# Rubric — <one-line label>

## Definitive Question

<single sentence framed as a question with a binary answer>

## Sub-Claims

### C1
**Claim:** <atomic, falsifiable assertion>
**Negation:** <what would prove this false — explicit>
**Verification method:** <named — see allowed methods below>
**Canonical store:** <if applicable — DB table, file, log channel, etc.>

### C2
...

### Cn (negative claim — at least one when fabrication is a risk)
**Claim:** <when condition X holds, NO occurrence of Y>
**Negation:** <a single fabricated Y disproves this>
**Verification method:** <named>

## Verdict Format

\`\`\`
Claim: <definitive question>
Evidence:
  C1 [✅/❌]: <fresh evidence pointer>
  C2 [✅/❌]: ...
  Cn [✅/❌]: ...
Verdict: DEFINITIVE YES | NOT YET
\`\`\`
```

**Allowed verification methods:**
- `integration-test-with-tap` — test captures structured TAP events; assertion checks TAP
- `canonical-store-xref` — query a canonical store (DB table, fixture file) for the expected key
- `live-controlled-run` — small, scoped real run with captured logs (only after mocked tests pass)
- `file-on-disk-diff` — final artifact on disk matches expected schema or contains expected key

Methods like "manual inspection," "looks correct," or "code review" are not allowed.

---

## Gate 2: AUDIT_VERDICT

**Emitted by:** Each sub-claim-auditor (one emission per sub-claim, N total)
**Consumed by:** Conductor at Gate 2 (aggregated into audit verdict table)
**Canonical artifact:** `session_dir/audit/AUDIT-C<n>.md`

```yaml
## CHECKPOINT: AUDIT_VERDICT
sub_claim_id: C<n>
verdict: WORKS | BROKEN | PARTIAL                  # tri-state
evidence_pointer: <path or query that reproduces the evidence>
evidence_summary: <one sentence — what was observed>
gap_if_any:
  description: <one specific sentence; null if verdict=WORKS>
  what_would_close_it: <one specific sentence; null if verdict=WORKS>
  where: <file path or module; null if verdict=WORKS>
files_inspected:
  - <path>
  - <path>
verification_commands_run:
  - <command>
audit_report_path: <absolute path to AUDIT-C<n>.md>
```

**Rules:**
- `verdict: WORKS` requires a concrete `evidence_pointer` (a command + expected output, or a file + line).
- `verdict: BROKEN` or `PARTIAL` requires `gap_if_any` filled in.
- Hedging vocabulary in `evidence_summary` ("looks correct," "should work," "probably") is a
  contract violation. Conductor must re-dispatch with stricter prompt.

---

## Gate 3: DELTA_LOCKED

**Owner:** Conductor (in-context, not a subagent emission)
**Canonical artifact:** `session_dir/delta.md`

Schema for `delta.md`:

```markdown
# Delta — Iteration <N>

## Summary
<one line: M gaps total, K critical, L escalated>

## Gaps

### G1
**Source sub-claim:** C<n>
**Severity:** critical | important | nice-to-have
**What closes it:** <specific code change / new test / new instrumentation>
**Evidence that proves closure:** <named TAP / table / file>
**Where:** <file path / module / phase>
**Parallelizable with:** [G2, G4]   # gaps that don't share files / state
**Disposition:** in-loop | gsd-escalated | user-decision-pending

### G2
...
```

---

## Gate 4: CLOSURE_COMPLETE

**Emitted by:** Each gap-closer (one emission per gap, M total)
**Consumed by:** Conductor at Gate 4 (aggregated; passed by reference to verdict-auditor)
**Canonical artifact:** `session_dir/closures/CLOSE-G<id>.md`

```yaml
## CHECKPOINT: CLOSURE_COMPLETE
gap_id: G<id>
status: closed | partial | blocked                 # closer's self-report; NOT a verdict on the rubric
proof_infrastructure_built:
  - kind: integration-test | instrumentation | fixture | schema-validator
    path: <absolute path>
    description: <one sentence>
code_changes:
  - file: <path>
    description: <one sentence>
fresh_evidence_captured:
  - artifact: <absolute path under session_dir/evidence/>
    captured_by: <command or script that produced it>
    contents_summary: <one sentence>
verification_commands_run:
  - command: <verbatim>
    exit_code: <int>
    stdout_pointer: <path under session_dir/evidence/ or "inline">
blockers_if_any: <one sentence; null if status=closed>
closure_report_path: <absolute path to CLOSE-G<id>.md>
```

**Rules:**
- `proof_infrastructure_built` must be non-empty before any `code_changes` entry. Proof first;
  fix second.
- `fresh_evidence_captured` must include at least one artifact path that exists on disk; the
  verdict-auditor will read it.
- The closer's `status: closed` is NOT a verdict on the rubric — only the verdict-auditor renders
  rubric-level verdicts. A closer reporting `closed` only means "I produced the artifacts I was
  asked to."

---

## Gate 5: VERDICT

**Emitted by:** Verdict-auditor (single emission)
**Consumed by:** Conductor at Gate 5 (loop-control decision)
**Canonical artifact:** `session_dir/verdict.md`

```yaml
## CHECKPOINT: VERDICT
iteration: <int>                                   # which loop iteration this verdict closes
verdict: DEFINITIVE_YES | NOT_YET
per_sub_claim:
  - sub_claim_id: C1
    state: ✅ | ❌                                  # binary at this gate, not tri-state
    evidence_pointer: <command + expected output, OR file:line>
    fresh: true | false                            # was the evidence captured this iteration?
  - sub_claim_id: C2
    ...
chain_of_custody:                                  # required when verdict=DEFINITIVE_YES; null otherwise
  - sub_claim_id: C1
    links:
      - layer: <upstream source>
        verified_by: <command or query>
        observed: <what was seen>
      - layer: <transform>
        verified_by: <command or query>
        observed: <what was seen>
      - layer: <final artifact>
        verified_by: <command or query>
        observed: <what was seen>
remaining_gap:                                     # required when verdict=NOT_YET; null otherwise
  sub_claim_id: C<n>
  what_is_missing: <one specific sentence>
  what_evidence_would_close_it: <one specific sentence>
  recommended_proof_infra: <one specific sentence>
forbidden_inputs_confirmed_unread:                 # auditor confirms isolation
  - session_dir/closures/             # must be true
  - session_dir/delta.md              # must be true
verdict_report_path: <absolute path to verdict.md>
```

**Rules:**
- Binary states only at this gate. PARTIAL is not allowed — partial = NOT_YET with the specific gap.
- `chain_of_custody` is required for DEFINITIVE_YES. No chain = NOT_YET, even if all sub-claims
  show ✅.
- `fresh: false` on any sub-claim's evidence means the auditor reused a prior iteration's evidence;
  this is permitted only if the underlying artifact has not been modified since that capture.
- `forbidden_inputs_confirmed_unread` is the auditor's attestation that it did not read closer
  narratives. If the auditor cannot make this attestation, the verdict is void and the conductor
  re-dispatches with stronger isolation.

---

## Escalation: ESCALATION (mid-execution, any time)

**Emitted by:** Any subagent that hits a blocker outside its assigned scope
**Consumed by:** Conductor immediately (does not wait for the gate emission)

Emit IN ADDITION to the normal gate checkpoint — do not skip the gate emission at the end.

```yaml
## CHECKPOINT: ESCALATION
from_agent: sub-claim-auditor | gap-closer | verdict-auditor
context_id: C<n> | G<id> | verdict
severity: critical | high
description: <what blocks progress>
what_is_needed: user-decision | architectural-cut | restart-from-phase-1
recommendation: <one specific sentence>
```

The conductor (not the subagent) decides the response: continue, halt the loop, escalate to user,
or restart at Phase 1 with a revised rubric.
