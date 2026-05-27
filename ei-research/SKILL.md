---
name: ei-research
description: >
  Structured research skill invoked via /ei-research [topic] [--depth quick|standard|thorough].
  Auto-defines a rigorous research process: classifies the research type, pre-specifies a plan
  with the user, dispatches parallel research agents across multiple source dimensions, grades
  evidence quality, uses saturation as the stop condition, and produces an auditable synthesis
  with claim provenance.
  Trigger phrases: "do research", "research online", "academic rooted", "deeply rooted in
  academic research", "investigate", "do a deep dive", "research best practices", "what does
  the literature say", "grounded in evidence", "research before we build", "use subagents to
  research", "research to ensure", "research and suggest a path forward", "does this match
  academic research", "rooted in fact and logic".
  Also trigger proactively when the user is about to build something non-trivial and has not
  yet researched the problem space — offer the research phase before jumping to implementation.
---

# EI Research

You are the **Research Conductor**. Your job is to transform a vague "do research on X" into
a rigorous, multi-source investigation that produces grounded, citable findings the user (or
a downstream planning skill) can act on.

The process is adapted from academic evidence-synthesis methodology (PRISMA, Cochrane/GRADE,
FRAMES, grounded theory) and production AI research architectures (Stanford STORM, OpenAI
Deep Research, agentic RAG). It is structured but not bureaucratic — the phases scale to the
question's complexity.

---

## Invocation

```
/ei-research <topic or question>
/ei-research <topic> --depth quick
/ei-research <topic> --depth thorough
/ei-research   (no args — interactive mode, prompts for topic)
```

**Arguments:**
- `topic` (positional, optional) — the research subject. If omitted, prompt the user.
- `--depth` (optional) — one of `quick`, `standard`, `thorough`. If omitted, auto-determine.

---

## Architecture

```
User → Research Conductor
  ↓ Phase 0: Parse Args + Intake Interview (interactive)
  ↓ Phase 1: Classify + Plan (in-context, user-acknowledged)
  ↓ Gate 1: PLAN_LOCKED
  ↓ Phase 2: Dispatch Research Agents (parallel, multi-dimension)
  ↓ Gate 2: RAW_EVIDENCE_COMPLETE
  ↓ Phase 3: Saturation Check (in-context)
  ↓   if NOT SATURATED → dispatch targeted follow-up agents → re-check
  ↓ Gate 3: SATURATION_REACHED
  ↓ Phase 4: Critique + Grade (single agent, adversarial) [standard+ only]
  ↓ Gate 4: CRITIQUE_COMPLETE
  ↓ Phase 5: Synthesize + Recommend (in-context, conductor)
  ↓ Output: RESEARCH.md + sources.md (or inline for quick)
```

Agent specs: `agents/`
Research lineage: `references/research-lineage.md`

---

## Phase 0: Parse Args + Intake Interview

### Step 0a: Parse Arguments

Extract from the user's invocation:
- **Topic**: the subject of research (may be a question, a technology name, an architecture
  decision, a feature concept, etc.)
- **Depth override**: if `--depth` was provided, lock it. Otherwise leave for auto-determination.

If no topic was provided, prompt:

> **What would you like me to research?**
> Give me the topic, question, or decision you want investigated.

### Step 0b: Intake Interview

Ask the user **up to 3 targeted questions** to scope the research. Use AskUserQuestion with
options where possible — don't make the user write essays.

**Question 1: Research intent** (always ask unless obvious from context)

> What's the goal of this research?

Options:
- **Landscape scan** — "What's out there? What are the options?"
- **Validate an approach** — "Does our plan align with best practices / academic evidence?"
- **Compare alternatives** — "Which of these approaches is better and why?"
- **Feasibility check** — "Can we actually do this? What are the blockers?"

**Question 2: Depth** (only ask if `--depth` was NOT provided AND auto-determination is ambiguous)

> How deep should this go?

Options:
- **Quick** — "5-minute scan. I need a fast answer, not a research paper."
- **Standard** — "Solid investigation. Multiple sources, grounded findings."
- **Thorough** — "Academic-grade. I want citations, evidence grading, and full provenance."

**Question 3: Context-specific** (ask only when it would materially change the research plan)

Examples of context-specific questions:
- "Are there specific technologies or constraints I should factor in?"
- "Is this for a greenfield build or does it need to fit into the existing architecture?"
- "Any sources or prior work I should start from?"

**Skip questions when the user has already provided the answers.** If they said "do research
online to ensure our audit pipeline aligns with industry standards, deeply rooted in academic
research" — that's intent=validate, depth=thorough, topic=audit pipeline. Don't re-ask what
they already told you.

### Step 0c: Auto-Determine Depth (if not specified)

If the user didn't pass `--depth` and the intake interview didn't ask (or they said "you decide"),
infer from these signals:

| Signal | → Depth |
|--------|---------|
| "just check", "quick", "is this a common issue" | quick |
| "do research", "investigate", no intensity qualifiers | standard |
| "deeply rooted", "academic", "exhaustive", "state of the art" | thorough |
| Single narrow factual question | quick |
| Multi-faceted design question | standard |
| Architecture/pipeline decision, new system design | thorough |
| Mid-implementation, fixing a specific problem | quick |
| Pre-planning, before building something new | standard |
| "use multiple subagents to research" | standard minimum |
| Explicitly asks for citations or evidence grading | thorough |

State the determination:
> "Running this as **[depth]** research. [One sentence why.] Upgrading to [higher] if you want more rigor."

---

## Depth Controls

The depth parameter scales every phase of the pipeline:

### Quick Depth
- **Intake**: 0-1 questions (skip if context is sufficient)
- **Plan**: Internal only — don't present to user, just execute
- **Agents**: 1-2 agents, sequential (ce-web-researcher + optional codebase check)
- **Saturation**: Skip — 1 round is sufficient for a quick check
- **Critique**: Skip — no formal quality grading
- **Output**: Inline response in conversation (no RESEARCH.md file)
- **Provenance**: Mention sources naturally, no formal provenance trail
- **Time budget**: ~2-3 minutes

### Standard Depth
- **Intake**: 1-2 questions
- **Plan**: Present to user, get acknowledgment before dispatch
- **Agents**: 2-4 agents, parallel (web + codebase + optional learnings/community)
- **Saturation**: Full check, 1 follow-up round if gaps found
- **Critique**: Full critique phase
- **Output**: RESEARCH.md written to session directory or `.planning/research/`
- **Provenance**: [VERIFIED]/[SUPPORTED]/[ASSUMED] tags on key claims
- **Time budget**: ~5-10 minutes

### Thorough Depth
- **Intake**: 2-3 questions (full scoping)
- **Plan**: Present to user with sub-questions and source strategy, require acknowledgment
- **Agents**: 4-5 agents, parallel (academic + industry + codebase + community + adjacent)
- **Saturation**: Full check, up to 2 follow-up rounds
- **Critique**: Full critique + bias audit + missing perspectives
- **Output**: RESEARCH.md + sources.md with full provenance trail
- **Provenance**: Every claim tagged, exclusion log, GRADE-quality source grading
- **Time budget**: ~10-20 minutes

---

## Phase 1: Classify + Plan (Pre-specification)

Pre-specification is the single most impactful rigor mechanism from academic methodology
(Cochrane). Lock the research plan BEFORE seeing any results. This prevents the common
failure mode where early findings bias the search direction.

### Research Type Classification

Based on the intake interview answers, classify:

| Type | Signal | Methodology |
|------|--------|-------------|
| **Scoping** | intent=landscape scan | Broad sweep, map the territory, no quality gating |
| **Validation** | intent=validate | Targeted search against a hypothesis, evidence grading required |
| **Comparison** | intent=compare | Structured comparison, same dimensions applied to each option |
| **Feasibility** | intent=feasibility | Constraints-first, blockers-first, then possibilities |

### Build the Research Plan

**For quick depth:** Build the plan internally. Don't present it — just execute.

**For standard/thorough depth:** Build and present:

```markdown
## Research Plan: <topic>
Type: <scoping | validation | comparison | feasibility>
Depth: <quick | standard | thorough>

### Question Decomposition
The core question, decomposed into sub-questions:
- SQ1: <sub-question> → [dimension: academic | industry | codebase | community | adjacent]
- SQ2: ...

### Source Strategy
Which dimensions to search, and what counts as evidence in each:
- Academic: peer-reviewed papers, arxiv preprints, conference proceedings
- Industry: official docs, engineering blogs, postmortems, benchmarks
- Codebase: existing patterns in this project, git history, conventions
- Community: GitHub issues/discussions, Stack Overflow, forum consensus
- Adjacent: cross-domain analogies, related fields, prior art in different contexts

### Inclusion/Exclusion Criteria
What sources count (recency, authority, relevance threshold).
What sources are excluded and why.

### Agent Dispatch Plan
Which research agents to dispatch, what each covers, expected parallelism.
```

State to the user:
> "Research plan ready. [2-3 sentence summary]. If this looks right, I'll dispatch [N]
> agents in parallel."

If the user approves, lock. If they adjust, revise and re-present.

**Sub-question count by depth:**
- Quick: 1-2 sub-questions
- Standard: 3-5 sub-questions
- Thorough: 5-7 sub-questions

→ **Gate 1: PLAN_LOCKED** (standard/thorough) or implicit (quick).

---

## Phase 2: Dispatch Research Agents (Parallel)

Dispatch one agent per research dimension from the plan. Send all dispatches in **one message
with N Agent tool calls** so they run concurrently.

### Pre-dispatch: Local Knowledge Check (always, fast)

Before dispatching external research agents, check local knowledge:
- Dispatch `ce-learnings-researcher` (if available) against the topic
- Dispatch `ce-best-practices-researcher` (if available) if the topic maps to a skill domain
These are fast and free — always run them even at quick depth.

### Dimension Agents

**Academic Researcher** (thorough only, or validation type at standard+)
```
subagent_type: compound-engineering:ce-web-researcher
Focus: arxiv, Google Scholar, ACM DL, IEEE, conference proceedings.
Search strategy: 2-3 broad searches to map vocabulary, then targeted searches
  using discovered terminology. Fetch and extract from primary sources.
Output: raw/academic.md — per-sub-question findings with full citations.
```

**Industry Researcher** (always dispatched at standard+)
```
subagent_type: compound-engineering:ce-web-researcher
Focus: official documentation, engineering blogs (practitioners, not marketing),
  postmortems, benchmarks, vendor-neutral comparisons.
Search strategy: start with official docs (Context7 if applicable), then
  practitioner sources. Prefer postmortems over tutorials.
Output: raw/industry.md
```

**Codebase Researcher** (when a project exists, standard+)
```
subagent_type: compound-engineering:ce-repo-research-analyst
Focus: existing patterns in this project that relate to the research question.
Scope: technology, architecture, patterns.
Output: raw/codebase.md
```

**Community Researcher** (scoping/comparison types at standard+, always at thorough)
```
subagent_type: compound-engineering:ce-web-researcher
Focus: GitHub issues/discussions, Stack Overflow, Reddit, HN, forum consensus.
Output: raw/community.md
```

**Adjacent Domain Researcher** (thorough only)
```
subagent_type: compound-engineering:ce-web-researcher
Focus: cross-domain analogies. How have other fields solved structurally similar problems?
Output: raw/adjacent.md
```

### Quick Depth Dispatch

For quick depth, dispatch just 1-2 agents sequentially (not parallel):
- 1 ce-web-researcher with a focused, narrow query
- Optionally 1 codebase check if the question is project-specific

→ **Gate 2: RAW_EVIDENCE_COMPLETE**.

---

## Phase 3: Saturation Check (standard+ only)

Saturation (from grounded theory) is the stop condition. Instead of a fixed search count,
track whether new evidence is introducing new concepts or just confirming existing ones.

**Process:**

1. Read all raw evidence
2. Extract the set of **distinct concepts** — named ideas, patterns, frameworks, tradeoffs,
   constraints, or recommendations
3. For each concept, count independent sources (convergence signal)
4. Identify gaps — sub-questions with thin or single-source coverage

**Saturation test:**
- All sub-questions have ≥2 independent sources converging → **SATURATED**
- Any sub-question has 0-1 sources → **NOT SATURATED** on that sub-question
- Any critical contradiction unresolved → **NOT SATURATED**

**If NOT SATURATED:** Dispatch 1-2 targeted follow-up agents for specific gaps.

**Hard cap by depth:**
- Standard: 1 follow-up round max
- Thorough: 2 follow-up rounds max

If still not saturated after the hard cap, note gaps explicitly in the synthesis.

→ **Gate 3: SATURATION_REACHED** (or hard cap with documented gaps).

---

## Phase 4: Critique + Grade (standard+ only)

Dispatch a single **Research Critic** agent that reviews the evidence adversarially.

```
See agents/research-critic.md for the prompt template.
Input: plan + all raw evidence + saturation log
Output: critique.md
```

The critic evaluates:

1. **Coverage** — does the evidence answer the sub-questions from the plan?
2. **Source quality** — GRADE-adapted scale:
   - **HIGH**: peer-reviewed, replicated, authoritative primary source
   - **MODERATE**: official docs, practitioner blog with expertise, established benchmark
   - **LOW**: single blog post, forum opinion, marketing material, undated
   - **VERY LOW**: no attribution, contradicted by higher sources, speculative
3. **Contradiction resolution** — where sources disagree, which has more weight?
4. **Bias detection** — vendor bias, survivorship bias, recency bias, confirmation bias
5. **Missing perspectives** — what viewpoints or stakeholders are absent?

**Thorough depth adds:** The critic also produces a per-source quality table and an explicit
"overall evidence certainty" statement for the synthesis to reference.

The critic does NOT see the user's original request — only the plan and evidence.

→ **Gate 4: CRITIQUE_COMPLETE**.

---

## Phase 5: Synthesize + Recommend

Conductor-owned. Read all artifacts and produce the final synthesis.

### Quick Depth Output

No file. Respond inline in the conversation:

> **Research: <topic>**
> [3-5 sentence answer with key finding and confidence level]
> Sources: [inline citations]
> [1-2 sentence recommendation if applicable]

### Standard Depth Output

Write `RESEARCH.md` to the session output directory or `.planning/research/`:

```markdown
# Research: <topic>
Type: <type> | Depth: standard | Saturation: <full | partial> | Date: <YYYY-MM-DD>

## Executive Summary
3-5 sentences. Lead with the recommendation.

## Key Findings
Per sub-question:
### SQ1: <sub-question>
**Finding:** <1-2 sentence answer>
**Evidence quality:** <HIGH | MODERATE | LOW>
**Convergence:** <N sources agree>
**Key sources:** <refs>

## Recommendation
1. Primary recommendation with confidence level
2. Alternative if caveats exist
3. Risks to watch

## Provenance Trail
- [VERIFIED]: ≥2 independent HIGH/MODERATE sources confirm
- [SUPPORTED]: 1 HIGH/MODERATE source, no contradictions
- [ASSUMED]: LOW sources or inference
- [CONTESTED]: sources disagree — both noted
```

### Thorough Depth Output

Write `RESEARCH.md` + `sources.md`:

RESEARCH.md adds to standard:
- Evidence Landscape section (convergences, contradictions, gaps)
- Per-claim provenance tags throughout all findings
- Design rationale sources section (if research informs architecture)

sources.md:
```markdown
# Sources

## HIGH quality
- [1] <full citation> — <what it contributed>

## MODERATE quality
- [2] ...

## LOW quality
- [3] ...

## Excluded
- <source> — excluded because: <reason>
```

### Present to the User

> "Research complete. [2-3 sentence summary of core finding and confidence].
> [For standard+: Full synthesis at <path>.]
> [Note significant gaps or contested areas.]
> [Suggest logical next step if applicable.]"

---

## Integration with Other Skills

This skill produces research artifacts. It does NOT plan or implement. Downstream handoffs:

- **`gsd-plan-phase`** — consumes RESEARCH.md as input context for planning
- **`gsd-discuss-phase`** — uses findings to ground architecture discussions
- **`ce-brainstorm`** / **`ce-ideate`** — findings inform ideation constraints
- **`rubric-anchored-recursion`** — research lineage feeds rubric design rationale sources

When invoked mid-workflow, produce the output and return control to the calling workflow.

---

## Anti-Patterns

| Anti-pattern | Why it fails |
|-------------|-------------|
| Searching before planning | Early results bias the search direction. Pre-specify first. |
| Single-source conclusions | One blog post is an opinion. Require convergence. |
| Treating all sources as equal | A vendor whitepaper ≠ a peer-reviewed paper. Grade them. |
| Searching forever | Saturation is the stop condition. If searches return same concepts, stop. |
| Hiding contradictions | Contested findings are MORE valuable than unanimous ones. Surface them. |
| Synthesizing without critique | The critic catches bias the conductor is blind to. |
| Presenting raw agent output | Always synthesize. The user sees RESEARCH.md, not dumps. |
| Skipping codebase context | External research without project grounding = generic advice. |
| Over-scoping quick research | "Quick" means 1-2 agents, inline response. Don't build a RESEARCH.md for a yes/no question. |
| Defaulting to thorough | Most research questions are standard. Over-methodology wastes budget. |
| Asking questions the user already answered | If their prompt contained the answer, don't re-ask. |
| Skipping the plan presentation | Pre-specification is the #1 rigor mechanism. Don't skip it for standard+. |

---

## Origin

Distilled from 28 research-requesting prompts across 20 sessions in SEPAL, CEI, portfolio,
and root projects (2025-2026). The user's consistent pattern: "do research online" + "academic
rooted" + "use subagents" + "suggest a path forward."

Methodology grounded in:
- **PRISMA** — auditable exclusion funnel, 4-phase flow
- **Cochrane/GRADE** — pre-specification, evidence grading, PICO question decomposition
- **FRAMES (2025)** — decision-tree methodology selection (match method to question)
- **Grounded theory** — theoretical saturation as stop condition
- **Hevner DSR** — three-cycle model for artifact-producing research
- **Stanford STORM** — perspective mining, outline-first synthesis
- **OpenAI/Gemini Deep Research** — collaborative planning, iterative search loops
- **Critic-CoT / MAR** — adversarial critique as distinct pipeline stage

See `references/research-lineage.md` for full provenance chain.
