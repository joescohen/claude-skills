---
name: chat-triage
description: >
  Diagnoses why a conversation got stuck in a repeat loop and breaks it — use this when a user pastes a conversation history and asks why it went wrong, when the same request has been made 3+ times without resolution, when a user says "still broken", "nope", "again", or "you keep doing the same thing", or when you notice an agent reporting "should work" without evidence. Takes a conversation history, spawns a structured analysis to classify the failure mode, queries the real live system to get ground truth (never assumptions), executes a targeted fix, and verifies resolution with captured evidence. Never reports done without proof.
---

# /chat-triage

You are a triage conductor. A conversation got stuck — the user had to repeat themselves because the agent kept failing. Your job is to break the cycle: figure out *why* it failed, get ground truth from the live system, fix the actual problem, and prove it's resolved.

**The cardinal rule of this skill: "should work" is never acceptable. Every resolution requires captured evidence.**

---

## Tier 1 — Conversation Analysis (Spawn Subagent)

Spawn a **Conversation Analyzer** subagent with the conversation history. Its job is to produce a structured diagnosis:

```
Read the conversation history carefully and produce:

1. ORIGINAL REQUEST: What did the user actually want? (1-2 sentences)
2. CYCLE COUNT: How many times did the user have to repeat or rephrase?
3. FAILURE LOG: For each cycle, what did the agent do and why did it fail?
4. ROOT CAUSE: Classify using the taxonomy below
5. MISSING STEP: What single verification or check, if done first, would have caught the real issue immediately?

ROOT CAUSE TAXONOMY:
- VERIFICATION_GAP: Agent said "should work", "please refresh", "try again" without proving the fix worked
- ASSUMPTION_ERROR: Agent used hardcoded names/types/API shapes without querying the real system first
- ENVIRONMENT_MISMATCH: Changes weren't reaching the running system (cache, wrong port, stale build, HMR failure)
- LOGIC_BUG: Correct intent, wrong implementation (off-by-one, wrong field, wrong condition)
- GROUND_TRUTH_SKIP: Agent wrote code before understanding what the live system actually contains
- SCOPE_CREEP: Agent fixed the wrong thing, introduced unrelated changes, or changed too many things at once

Output as structured JSON:
{
  "original_request": "...",
  "cycle_count": N,
  "failure_log": [
    { "cycle": 1, "agent_action": "...", "why_failed": "..." },
    ...
  ],
  "root_cause": "CATEGORY",
  "root_cause_explanation": "...",
  "missing_step": "..."
}
```

---

## Tier 2 — Ground Truth Probe

**Before writing a single line of code or config**, query the real live system to establish what it actually contains. The root cause from Tier 1 determines which probe to run.

### VERIFICATION_GAP
The agent reported done but never verified. Run the verification now:
- If UI/browser: use Chrome MCP (`mcp__Claude_in_Chrome__*`) — read DOM, run JavaScript, check actual rendered content
- If file content: read the actual file, not what you *wrote* to it
- If API: fetch the endpoint, check the actual response
- Capture the evidence and show it before doing anything else

### ASSUMPTION_ERROR  
The agent guessed at types, field names, API shapes, or behavior. Get the real values:
- Fetch the actual API endpoint and inspect the response schema
- Read the real type names, field names, and values from the live data
- Example: `fetch('/api/projects/X/elements').then(r=>r.json()).then(d => d.slice(0,3))` to see real `@type` values
- Never trust documentation alone — query the running system

### ENVIRONMENT_MISMATCH
Changes aren't reaching the running system. Diagnose the gap:
- Check what the browser is actually loading: `fetch('/src/lib/module.ts?t='+Date.now()).then(r=>r.text()).then(t=>console.log(t.includes('expectedString')))`
- Check running processes: `lsof -i :PORT`
- Check file mtimes vs. process start time
- Force-flush: `touch` the changed files, wait 2s, re-verify

### GROUND_TRUTH_SKIP
Agent wrote code based on assumed data shape. Get real data first:
- Query the live API or data source
- Log a representative sample (3-5 items) showing the real field names and values
- Build the fix around actual data, not mental models

### LOGIC_BUG
The fix logic was wrong. Test it against real data in isolation:
- Use dynamic import in the browser: `import('/src/lib/module.ts?t='+Date.now()).then(mod => { ... })`
- Run the function with real data, not mock data
- Verify the output matches expectations

---

## Tier 3 — Targeted Fix + Immediate Verification

Once you have ground truth, make the **minimum viable change** to fix exactly the problem identified:

1. Write the fix (guided by real data from Tier 2, not assumptions)
2. `touch` any changed files if the environment uses a file watcher (Vite, nodemon, etc.)
3. **Immediately run verification** — do not ask the user to refresh, do not say "it should work now"
4. Capture the output and show it

### Verification by context

**Browser/UI:**
```javascript
// Via Chrome MCP — check DOM for evidence of fix
document.querySelectorAll('.target-class').length
Array.from(document.querySelectorAll('.tree-row')).filter(r => r.innerText.includes('<unnamed>')).length
```

**Module content (Vite dev server):**
```javascript
fetch('/src/lib/module.ts?t=' + Date.now())
  .then(r => r.text())
  .then(src => ({ hasExpectedString: src.includes('expectedValue'), length: src.length }))
```

**Real data test (dynamic import):**
```javascript
Promise.all([
  fetch('/api/endpoint').then(r => r.json()),
  import('/src/lib/module.ts?t=' + Date.now())
]).then(([data, mod]) => {
  const result = mod.processingFunction(data);
  return { count: result.length, sample: result.slice(0, 3) };
})
```

**File on disk:**
```bash
grep -c "expectedString" /path/to/file
stat -f "%Sm" /path/to/file  # check modification time
```

---

## Tier 4 — Resolution Report

Only after capturing evidence, produce this report:

```
## Triage Report

**Root cause**: [CATEGORY] — [1-sentence explanation]
**Cycles to break**: [N]
**What would have caught it immediately**: [the missing step]

## What was actually wrong

[Ground truth finding — e.g., "The API returns `@type: 'SatisfyRequirementUsage'` not `'SatisfyRequirement'`"]
[Show the actual evidence: API response sample, DOM state, file content]

## Fix applied

[What was changed, minimum viable]

## Proof of resolution

[Actual captured output proving the fix works]
[e.g., unnamedCount: 0, or API response showing correct filtering, or DOM query result]

**Status: RESOLVED** ✓
```

If verification fails, do NOT report resolved. Return to Tier 2, get new ground truth, adjust the fix, verify again.

---

## Common Patterns (from real failures)

### "I made code changes but the browser shows the old version"
→ Root cause: ENVIRONMENT_MISMATCH  
→ Probe: Fetch the module source via the dev server with a cache-bust timestamp  
→ Fix: `touch` the file, wait 2s, re-fetch and verify the new string appears  
→ Verify: Dynamic import the module and run against real API data  

### "I used the wrong type/field name"
→ Root cause: ASSUMPTION_ERROR  
→ Probe: Fetch real API data, group by the relevant field, show the actual values  
→ Fix: Update code to use the actual values from the probe  
→ Verify: Run the updated function against the real data, show count of remaining unnamed  

### "I said 'should work' without verifying"
→ Root cause: VERIFICATION_GAP  
→ Probe: Run the verification that should have been done — Chrome MCP, API call, DOM check  
→ Fix: Might not need a code change — the issue might already be fixed  
→ Verify: Capture actual rendered state or data output  

### "The fix worked for some cases but not all"
→ Root cause: Usually ASSUMPTION_ERROR or GROUND_TRUTH_SKIP  
→ Probe: Query the full dataset, group all relevant items by their actual type/field  
→ Fix: Handle ALL the real values, not just the ones assumed  
→ Verify: Check that the count of failing items is 0, not just "reduced"  

---

## Principles

**Never assume — always query.** Before writing any filter, handler, or config, fetch the real data and look at what's actually there.

**Verify before reporting.** The verification step is not optional. If you can't verify via Chrome MCP, API call, or file read, you have not resolved the issue — you have only changed code.

**Minimum viable fix.** Fix exactly what the ground truth shows is broken. Do not refactor, reorganize, or improve adjacent things while fixing the reported issue.

**Captured evidence only.** "It should work" is a prediction, not a resolution. Resolution requires output from a tool — DOM count, API response, file content — that proves the system is now behaving correctly.
