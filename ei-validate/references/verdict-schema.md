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
