# Reporting Templates

Read this file when you reach Phase 6 (Issue Reporting) or Phase 7 (Audit Report).

---

## Issue Report Template

Every issue gets a structured report. Consistency matters because these reports become the input for
prioritization and fixing.

```markdown
## Issue: [Short, specific title]

- **Severity:** Critical / High / Medium / Low
- **Category:** Visual | Functional | Data | UX | Performance | AI Quality
- **Location:** [Page/feature/component where it occurs]
- **Use case:** UC-[NN] — [Title] (or "Coverage sweep" if found outside a use case)
- **Phase:** Phase N, step N

### Reproduction
1. [Exact steps to reproduce]
2. [Be specific — include the data you entered, the button you clicked]

### Expected behavior
[What should happen — cite the specific specification section that defines this expectation]

### Actual behavior
[What actually happened — be precise]

### Specification violation
[Which part of the specification is violated? e.g., "Spec §2 Feature Inventory: Trip Creation via
Chatbot states 'geocodes every location and places map pins' — pin placed in wrong country"]

### Evidence
- Screenshot: [path or description]
- DOM state: [relevant element state if applicable]
- Console errors: [any JS errors observed]

### Channels verified
- Visual (screenshot): [pass/fail — what was observed]
- Structural (DOM): [pass/fail — what was observed]
- Interactive (click/type): [pass/fail — what was observed]
- Data (values): [pass/fail — what was observed]

### Reproducibility
Always / Intermittent / Once only

### Blast radius
[Does this affect other features? Other user flows?]
```

---

## Severity Guide

| Severity | Definition | Examples |
|----------|-----------|----------|
| **Critical** | System crashes, data loss, security issue, complete feature failure | Blank screen, data not saved, auth bypass, infinite loop |
| **High** | Major feature broken, significant UX confusion, wrong data | Wrong values displayed, navigation dead-end, feature silently fails |
| **Medium** | Feature works but with friction, minor incorrect behavior | Laggy interaction, confusing label, off-by-one error, styling inconsistency |
| **Low** | Polish, cosmetic, nice-to-have | Alignment, hover state missing, placeholder text, minor spacing |

---

## Audit Report Template

After completing all use cases and the coverage sweep, compile a final report.

```markdown
# System Validation Audit — [YYYY-MM-DD]

**System:** [Name and version]
**Scope:** [What was tested]
**Specification:** [path to specification.md]
**Use cases executed:** UC-XX, UC-XX, ...
**Duration:** [How long the audit took]

## Configuration Baseline
- Git commit / version: [hash or tag]
- Environment: [local dev / staging / production]
- Browser: [name and version]
- Feature flags: [any non-default settings]
- External services: [live vs. mock, API keys configured]

## Summary
[2-3 sentence overall assessment. Is the system ready? What's the biggest risk?]

## Statistics
- Issues found: [N] (Critical: [N], High: [N], Medium: [N], Low: [N])
- Features verified: [N] / [Total]
- Use cases completed: [N] / [Total planned]
- Use cases blocked by upstream failures: [N]
- Specification coverage: [N] / [Total spec features] verified

## Critical & High Issues
[List each with one-line summary — these are the "fix before release" items]

## All Issues
[Full issue reports from Phase 6]

## Features Verified ✅
[List of everything that passed — positive confirmation is valuable too]

## Specification Compliance
[For each Tier 1 specification feature, note whether it was fully verified, partially verified,
or not verified. This is the definitive answer to "does the system do what it's supposed to do?"]

## Coverage Gaps
[Any features or scenarios you couldn't test, and why]

## Blocked Use Cases
[Use cases or steps that could not execute due to upstream failures. Note what they would have
tested and why they were blocked.]

## Re-Verification Needed
[For each Critical/High issue, list which use cases should be re-run after the fix is applied,
and what the acceptance criteria are for confirming the fix.]

## Work Products
### Assumptions
[Judgment calls made when the specification was ambiguous or incomplete]

### Decisions & Rationale
[Why specific severity ratings were assigned, why use cases were aborted or skipped]

### Lessons Learned
[What would improve the next audit — specification gaps, missing tooling, redundant use cases]

## Recommendations
[Prioritized list of suggested actions]
```

Save to `docs/audit-logs/YYYY-MM-DD-audit.md` (or the project's preferred location).
