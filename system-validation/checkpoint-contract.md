# Checkpoint Contract

This file defines the communication protocol between specialist agents and the Conductor.
Every gate has a defined emit schema. The conductor reads these blocks from the Agent tool's
return value (the final message the subagent emits). Agents MUST emit their checkpoint as the
final content in their response, after all other work is complete.

---

## Gate 1: SPEC_COMPLETE
**Emitted by:** Spec Agent  
**Consumed by:** Conductor at Gate 1 (Phase 0.5 calibration)

```
## CHECKPOINT: SPEC_COMPLETE
- purpose: <one sentence — why this system exists for its users>
- tier1_reqs:
  - REQ-1: <short title, e.g. "Marker click shows flyout">
  - REQ-2: <short title>
- tier2_reqs:
  - REQ-N: <short title>
- risk_areas:
  - <ComponentA> × <ComponentB/StateB>: <why this interaction is risky>
- files_read:
  - <path>
  - <path>
- specification_path: <absolute path to specification.md>
```

---

## Gate 2: MATRIX_COMPLETE
**Emitted by:** Matrix Agent  
**Consumed by:** Conductor at Gate 2 (cluster approval before executor dispatch)

```
## CHECKPOINT: MATRIX_COMPLETE
- total_rows: <N>
- clusters:
  - id: A
    tier: T1
    risk_range: 20-25
    row_ids:
      - VM-01
      - VM-02
  - id: B
    tier: T1
    risk_range: 10-19
    row_ids:
      - VM-03
  - id: C
    tier: T2
    risk_range: 1-9
    row_ids:
      - VM-07
- coverage_check:
  - all_t1_reqs_covered: true
  - risk_areas_covered: true
  - user_focus_areas_covered: true
- matrix_path: <absolute path to validation-matrix.md>
```

---

## Gate 3: CLUSTER_COMPLETE
**Emitted by:** Each Executor Agent (one emission per agent, when its cluster finishes)  
**Consumed by:** Conductor at Gate 3 (aggregated, passed to Reporter Agent)

```
## CHECKPOINT: CLUSTER_COMPLETE
- cluster_id: <A/B/C/...>
- rows_executed:
  - VM-01
  - VM-02
- rows_passed:
  - VM-01
- rows_failed:
  - VM-02
- rows_blocked: []
- findings:
  - id: FIND-<cluster_id>-<NN>  (e.g. FIND-A-001 — reporter promotes these to FIND-001, FIND-002, ...)
    severity: <critical|high|medium|low>
    req_id: <REQ-N or RISK>
    vm_row: VM-02
    description: <what happened>
    expected: <what the spec says should happen>
    actual: <what was observed>
    evidence: <screenshot path or inline description>
    reproducible: <true|false>
- screenshots_taken: <N>
- execution_time_ms: <N>
```

---

## Gate 4: REPORT_COMPLETE
**Emitted by:** Reporter Agent  
**Consumed by:** Conductor at Gate 4 (synthesized for user)

```
## CHECKPOINT: REPORT_COMPLETE
- summary: <2-3 sentences>
- stats:
    total_findings: <N>
    critical: <N>
    high: <N>
    medium: <N>
    low: <N>
    rows_passed: <N>
    rows_failed: <N>
    rows_blocked: <N>
    features_verified: <N>
- top_issues:
  - FIND-001
  - FIND-002
- report_path: <absolute path to audit-report.md>
```

---

## Escalation: ESCALATION (mid-execution, any time)
**Emitted by:** Any Executor Agent when it finds a critical finding  
**Consumed by:** Conductor immediately (does not wait for CLUSTER_COMPLETE)

Emit this IN ADDITION to the normal cluster execution — do not skip CLUSTER_COMPLETE at the end.

```
## CHECKPOINT: ESCALATION
- cluster_id: <A/B/C/...>
- finding_id: FIND-001
- severity: critical
- description: <what broke>
- continuing_execution: <true|false — executor's assessment of whether remaining rows are still meaningful>
```

The conductor (not the executor) makes the final halt/continue decision. Default: continue unless
the finding indicates data corruption, auth failure, or a state that makes all subsequent rows meaningless.
