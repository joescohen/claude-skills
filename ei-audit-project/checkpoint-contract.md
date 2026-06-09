# ei-audit-project — Checkpoint Contract

Gates the conductor must pass through. At each gate: verify, then proceed. In supervised
mode, surface gate summaries to the user; in unattended (/loop) mode, write them to
`.audit/STATE.md` and proceed unless the gate says STOP.

## Gate 0 — ORACLE_PROBED (after Phase 0)
- Verification commands identified from real config (not assumed) and executed once
- Captured baseline output stored in STATE.md (this is the reference green)
- Mode locked: FULL | PROPOSE-ONLY | STABILIZE-FIRST
- STOP if: repo is dirty (uncommitted changes not made by this pipeline) — never start
  an unattended loop on top of un-snapshotted human work; report and wait

## Gate 1 — MAP_COMPLETE (after Phase 1)
- MAP.md exists, every section cites paths, UNVERIFIED items marked
- Conductor spot-checked ≥2 mapper claims against the repo

## Gate 2 — LEDGER_POPULATED (after Phase 2)
- Every finding has file:line; conductor verified a sample (≥3 or 20%) by opening files
- Findings that failed verification: removed, with a note (auditor hallucination is data)
- alignment findings are DELETION-PROPOSAL class only; enhancement findings are
  FEATURE-PROPOSAL only — any auditor that returned FIX for these classes is overridden

## Gate 3 — PLAN_LOCKED (after Phase 3)
- Queue ordered by priority score; quick wins flagged; mechanical groups ≤5 items
- Supervised mode: present plan, get acknowledgment. Unattended: write and proceed.

## Gate 4 — ITEM_VERIFIED (every Phase 4 iteration)
- Verifier verdict PASS with pasted command output (reject any PASS without it)
- Diff check clean (scope, no test modifications, no deletions)
- Conductor accepts the verdict ONLY after reading the verifier's captured output —
  relaying resolver or verifier claims without reading evidence violates the CEI
  conductor-verification lesson
- Then: commit (one item, one commit), ledger updated, STATE.md updated

## Gate 5 — RUN_CLOSED (Phase 5 stop)
- Stop condition named explicitly in REPORT.md (complete | dry | cap | blocked)
- Sentinel `AUDIT-LOOP-COMPLETE` appears ONLY with final captured green output beside it
- REPORT.md lists: resolved+evidence, parked/contested, DELETIONS.md awaiting approval,
  BACKLOG.md, recommended first human review target
