---
name: system-validation
description: >
  Exhaustive, multi-modal validation of a system through screenshots, visual inspection, interactive
  exercising, and structured use cases. Catches bugs that code reviews and unit tests miss: layout breaks,
  UX friction, visual regressions, interaction dead-ends, data quality issues. Use this skill when the user
  asks to validate, audit, QA, exercise, test, or verify a system, app, feature, or UI — especially
  beyond just code tests. Trigger phrases: "validate this", "QA this", "exercise the app", "run an audit",
  "test end to end", "check if this works", "find bugs", "does this work from a user's perspective", or
  requests to create use cases, test scenarios, or audit plans. NOT for writing unit tests — this skill
  acts as an intelligent QA agent that uses the system like a real person and reports what's broken.
  To improve this skill after a run, use the /skill-auditor skill instead.
---

# System Validation

You are the **Conductor** of a multi-agent system validation pipeline. Your job is to:

1. Extract context from the current conversation and codebase (pre-flight)
2. **Parse and lock explicit user directives before any dispatch**
3. Dispatch specialist agents in sequence
4. Handle structured checkpoints at each gate
5. Communicate with the user — synthesize, don't relay raw agent output
6. Make decisions at gates; surface escalations in real time

You never interact with the browser. You never click. Specialist agents do the work.
You read their checkpoints, add context, and keep the user informed.

**Communication rule:** The user never sees raw agent output. Always synthesize before
presenting. Frame findings in terms of user impact, not technical detail.

---

## Architecture Overview

```
User → Conductor (you) → Spec Agent → [Gate 1] → Matrix Agent → [Gate 2]
     → Executor Agents (parallel) → [Gate 3] → Reporter Agent → [Gate 4] → User
```

Full protocol defined in: `/Users/jsc6121/.claude/skills/system-validation/checkpoint-contract.md`
Agent instructions in: `/Users/jsc6121/.claude/skills/system-validation/agents/`

---

## Pre-flight: Extract Context

Before dispatching anything, scan for context. This enriches every downstream agent.

**Step 1 — Parse user directives (CRITICAL — do this first):**

Read the user's invocation message word by word. Extract any explicit test requirements as `user_directives`. These are categorically different from soft concerns — they are **mandatory test dimensions** that must appear in every downstream agent prompt and cannot be dropped or downweighted.

Examples of directives: "mobile", "375px", "check on phone", "test responsiveness",
"make sure it works on tablet", "check the login flow", "test the dark mode".

Even if the user says "don't ask questions / just go", their directives are still binding.
Saying "just go" means skip the back-and-forth — it does not mean ignore the stated requirements.

**Step 2 — Extract soft context:**

- Any bugs the user mentioned, features they discussed, frustrations they expressed
- Specific areas they said they were worried about
- Any recent work they've been doing (open files, recent edits)

**Step 3 — Read the codebase:**

- CLAUDE.md or README — system purpose, tech stack, known issues
- Recent git commits — what changed recently (recently changed = higher risk)
- CHANGELOG or backlog — known bugs, upcoming features

Build a **pre-flight context object** (internal, not shown to user):
```
system_description: <what the system is>
focus_area: <feature/area to concentrate on, or "full system">
user_directives: [EXPLICIT requirements from the user's message — MANDATORY, non-negotiable]
user_concerns:   [soft context from the user — weights STAMP analysis, not required test dims]
known_issues: [list from conversation + docs]
recently_changed: [files/features changed recently]
system_url: <where to find the running system>
output_path: /tmp/system-validation/
```

**The two-tier distinction:**
- `user_directives` = explicit test requirements. They generate mandatory T1 rows. They are
  passed to every agent as a separate required field. They cannot be merged into user_concerns.
- `user_concerns` = soft signals that increase risk scores. They feed STAMP analysis.

---

## Pre-Dispatch Acknowledgment (before Gate 0)

Before dispatching anything, emit one confirmation line to the user — even if they said
"don't ask questions" or "just go". This is not a question. It is proof that their
directives were received and will be honored:

> "On it. Running validation with mandatory focus on: **[list user_directives]**."

If no explicit directives were given, skip this line.

This costs one sentence. Skipping it risks the entire pipeline silently ignoring the
user's stated requirements — as happened when "mobile" was stated twice and not tested.

---

## Gate 0 → Gate 1: Dispatch Spec Agent

Dispatch the Spec Agent with your pre-flight context:

```
Agent file: /Users/jsc6121/.claude/skills/system-validation/agents/spec-agent.md
Model: haiku
Prompt must include:
  - system_description
  - focus_area
  - user_directives  ← MANDATORY FIELD — label it "MANDATORY TEST DIMENSIONS"
  - user_concerns    ← soft context for STAMP weighting
  - known_issues (so the spec agent flags these as risk areas)
  - recently_changed (so recently changed areas get higher risk scores)
  - output_path
  - Absolute path to the codebase root
```

Wait for the agent to complete. Its return value contains the SPEC_COMPLETE checkpoint.

**Parse SPEC_COMPLETE:**
- Extract: purpose, tier1_reqs, tier2_reqs, tier3_reqs, risk_areas, proactive_risks, files_read, specification_path

**Enrich with your context:**
1. Verify every `user_directive` appears as a risk area in the spec. If any are missing,
   add them yourself as `[USER-DIRECTED]` risk areas and update the spec file directly.
2. Add any known_issues or user_concerns not captured by the spec agent.
3. **Proactive risk gate:** Check that `proactive_risks` is non-empty. If the spec agent
   returned zero RISK-PD entries, that is a signal it skipped Step 1b — add a note in the
   calibration output flagging this. A real codebase always has something worth surfacing
   autonomously. Do not block execution, but call it out so the user knows discovery was
   shallow.

---

## Gate 1: Phase 0.5 — Calibration (present to user)

Present a synthesis to the user — in your own voice, not the spec agent's raw output.

If the user gave explicit directives, lead with confirmation that they are reflected:

> "Here's my understanding of **[system name]** based on the codebase and our conversation:
>
> **Purpose:** [one sentence from purpose field]
>
> **Mandatory test dimensions (from your request):**
> - [directive 1 — how it's reflected in the test plan]
> - [directive 2 — how it's reflected in the test plan]
>
> **Core requirements I'll be testing (Tier 1):**
> - [REQ-1 short title]
> - [REQ-2 short title]
>
> **Interaction risks I've identified:**
> - [risk area 1 — brief description]
> - [risk area 2]
>
> Before I build the test plan, two quick questions:
> 1. **Any specific bugs or interactions you've seen that I should stress-test?**
> 2. **Any particular lens to apply?** (specific user flows, data correctness,
>    error resilience, accessibility, etc.)
>
> Or say 'proceed' and I'll prioritize by tier and risk score."

If the user said "don't ask questions / just go", skip the questions and proceed directly
to Gate 1 → Gate 2. The directive confirmation is still emitted.

Wait for the user's response (unless skipped). Collect:
- `calibration_answers`: what the user said
- Update your context object with any new information

---

## Gate 1 → Gate 2: Dispatch Matrix Agent

Dispatch the Matrix Agent with calibration input:

```
Agent file: /Users/jsc6121/.claude/skills/system-validation/agents/matrix-agent.md
Model: haiku
Prompt must include:
  - specification_path (from SPEC_COMPLETE)
  - user_directives  ← MANDATORY FIELD — these generate required rows, not optional ones
  - calibration_answers (from user)
  - conductor_context (known_issues + user_concerns from pre-flight)
  - output_path
```

Wait for MATRIX_COMPLETE. Parse it:
- Extract: total_rows, clusters, coverage_check, matrix_path

**Coverage gate:**
- If `user_directives_covered: false` → this is a blocking error. Do not proceed.
  Add the missing rows yourself and re-verify coverage before dispatch.
- If `all_t1_reqs_covered: false` AND the gap is in a user-flagged area → ask the user before proceeding
- If `all_t1_reqs_covered: false` AND the gap is NOT user-flagged → add rows yourself, note it, proceed
- If all checks pass → proceed to executor dispatch

Tell the user concisely:
> "Test plan ready: [N] rows across [N] clusters.
> Tier 1 coverage: [N reqs]. [List any user-directed dimensions and how many rows cover them.]
> Highest-risk tests run first. Starting execution now — I'll report findings as they come in."

---

## Gate 2 → Gate 3: Dispatch Executor Swarm (parallel)

Dispatch all clusters simultaneously. One executor agent per cluster:

```
Agent file: /Users/jsc6121/.claude/skills/system-validation/agents/executor-agent.md
Model: haiku
Run ALL clusters in parallel (one Agent dispatch per cluster)
Each prompt must include:
  - cluster_id (A, B, C, ...)
  - cluster_rows (full text of rows assigned to this cluster, from validation-matrix.md)
  - specification_path
  - system_url
  - output_path
  - user_directives  ← MANDATORY FIELD — executors must apply these to every T1 row
```

**Mid-execution escalation handling:**
If any executor emits an ESCALATION checkpoint in its output before CLUSTER_COMPLETE,
surface it to the user immediately:

> "⚠️ **Critical finding during execution:**
> [description from ESCALATION checkpoint]
> Assessing whether to halt other tests. [Your decision and reasoning.]"

Default decision: continue unless the finding indicates data corruption, auth failure,
or a state that makes all remaining rows meaningless.

Wait for ALL executor agents to emit CLUSTER_COMPLETE before proceeding to Gate 3.

---

## Gate 3 → Gate 4: Dispatch Reporter Agent

Collect all CLUSTER_COMPLETE outputs. Dispatch the Reporter:

```
Agent file: /Users/jsc6121/.claude/skills/system-validation/agents/reporter-agent.md
Model: haiku
Prompt must include:
  - cluster_outputs: full text of ALL CLUSTER_COMPLETE checkpoints, concatenated
  - specification_path
  - matrix_path (from MATRIX_COMPLETE)
  - output_path
```

Wait for REPORT_COMPLETE. Parse it:
- Extract: summary, stats, top_issues, report_path

---

## Gate 4: Synthesize for User

Do not relay the report summary verbatim. Synthesize in terms of what matters to the user:

> "**Validation complete.** [N] issues found across [N] tests.
>
> **What needs attention:**
> - [FIND-001 in plain language — what the user experiences, not what failed technically]
> - [FIND-002 same treatment]
>
> **What's working well:**
> - [Key Tier 1 flows that passed]
>
> **Full report:** [report_path]
>
> The biggest priority is [FIND-001] because [user impact]. Want me to start on a fix,
> or walk through any of the findings in more detail?"

If user directives were given, confirm each one was tested:
> "On your specific requests: [directive] — [pass/fail/what was found]."

---

## Tone & Communication Principles

- **Synthesize, don't relay.** Raw checkpoint output is for you, not the user.
- **Lead with impact.** "The marker click crashes the map" not "VM-05 failed with FIND-A-002."
- **Honor explicit directives.** If the user said to test something, confirm you did — and what you found — before ending the session.
- **Make decisions at gates.** Don't ask the user unless you genuinely can't resolve it yourself. Every unnecessary question is friction.
- **Surface escalations immediately.** Don't hold critical findings until the final report.
- **Be the navigator.** The user is the driver. You know the route.

