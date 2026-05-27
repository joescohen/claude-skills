# Research Lineage: EI Research Skill

## Origin Data

Distilled from analysis of 28 user research prompts across 20 sessions in 5 projects
(SEPAL, CEI, portfolio, travel_tool, root), collected 2025-2026.

### User Prompt Patterns That Drove Design

| Pattern | Frequency | Skill Response |
|---|---|---|
| "do research online" | ~15 prompts | Phase 2: web research agents as default |
| "academic/deeply rooted in academic research" | 3-4 prompts | Depth: thorough; academic dimension mandatory |
| "use multiple subagents to research" | 3 prompts | Phase 2: parallel multi-dimension dispatch |
| "ensure these align with industry standards" | 5 prompts | Type: validation; convergence required |
| "research then suggest a path forward" | 4 prompts | Phase 5: recommendation section in output |
| "rooted in fact and logic" | 2 prompts | Phase 4: GRADE-adapted evidence grading |
| "research to inform design" | 4 prompts | Integration: output feeds gsd-plan-phase |
| "just check if this is common" | 2 prompts | Depth: quick; inline response |

## Academic Methodology Sources

### PRISMA (Preferred Reporting Items for Systematic Reviews and Meta-Analyses)
- **Adopted:** Auditable exclusion funnel — every source exclusion logged with reason
  (→ sources.md Excluded section)
- **Adopted:** 4-phase flow (Identify → Screen → Eligibility → Include) as structural
  inspiration for the research pipeline
- Source: distillersr.com/resources/systematic-literature-reviews/prisma-methodology

### Cochrane / GRADE
- **Adopted:** Pre-specification — lock research plan before seeing results (→ Phase 1:
  PLAN_LOCKED gate). Single most impactful rigor mechanism.
- **Adopted:** GRADE evidence certainty grading (HIGH/MODERATE/LOW/VERY LOW) adapted for
  non-clinical sources (→ Phase 4: Source Quality Grading)
- **Adopted:** PICO question decomposition adapted as sub-question framing
- Source: cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-01

### FRAMES (2025)
- **Adopted:** Decision-tree methodology selection — match method to question type before
  executing (→ Phase 0: intake interview + Phase 1: type classification)
- Source: PMC article PMC12970308

### Arksey & O'Malley Scoping Review Framework
- **Adopted:** Scoping reviews answer "what's out there?" without quality gating — most
  research requests are this type (→ scoping type default)
- **Adopted:** Explicitly iterative, non-linear stages (→ Phase 3 follow-up rounds)
- Source: tandfonline.com/doi/abs/10.1080/1364557032000119616

### Grounded Theory (Strauss & Corbin)
- **Adopted:** Theoretical saturation as stop condition — stop when new searches yield no
  new concepts (→ Phase 3: Saturation Check)
- **Adopted:** Constant comparison across sources (→ Phase 3: concept tracking)
- Source: delvetool.com/blog/openaxialselective

### Hevner's Design Science Research
- **Adopted:** Three-cycle model (relevance ↔ rigor ↔ design) as meta-framework
- Source: Wikipedia: Design_science_(methodology)

### AI-Assisted Research Workflows (2025-2026)
- "A Vision for Auto Research with LLM Agents" (arXiv 2504.18765)
- "Deep Research Agents: Major Breakthrough or Incremental" (JMIR 2026) — 50%+ citation
  inaccuracy finding informed the critique phase requirement

## Production Architecture Sources

### Stanford STORM / Co-STORM
- **Adopted:** Perspective mining — enumerate viewpoints before searching
- **Adopted:** Outline-first synthesis — build structure, then populate
- Source: storm-project.stanford.edu/research/storm/

### OpenAI Deep Research
- **Referenced:** 5-phase pipeline, coverage-based stopping, ~30-60 searches
- Source: developers.openai.com/cookbook/examples/deep_research_api

### Google Gemini Deep Research
- **Adopted:** Collaborative planning with user before execution (→ Phase 1)
- Source: ai.google.dev/gemini-api/docs/deep-research

### O-Researcher (arXiv 2601.03743)
- **Referenced:** Multi-agent Planner → parallel sub-agents → Summarizer pattern

### MA-RAG (arXiv 2505.20096)
- **Referenced:** 4-agent pipeline with accumulated history; informed follow-up round design

### Critic-CoT (arXiv 2408.16326)
- **Adopted:** Separate critique as distinct pipeline stage (→ Phase 4)

### MAR — Multi-Agent Reflexion (arXiv 2512.20845)
- **Referenced:** Critic persona diversity > single critic; informed multi-dimensional evaluation

## Existing Tool Sources

### Open-Source Skills
- lingzhi227/agent-research-skills — 6-phase academic pipeline with adversarial novelty assessment
- qx-labs/agents-deep-research — knowledge-deficit-closing loop model
- Orchestra-Research/AI-Research-SKILLs — dual-loop architecture
- 24601/agent-deep-research — RAG grounding + cost estimation

### Installed Local Skills (compound-engineering / GSD)
- ce-web-researcher — 5-step web research with convergence stopping; dispatched as Phase 2 agent
- ce-best-practices-researcher — skills-first authority hierarchy; pre-dispatch local check
- ce-learnings-researcher — grep-first efficiency; pre-dispatch local check
- ce-repo-research-analyst — scoped codebase analysis; dispatched as codebase dimension agent
- gsd-phase-researcher — claim provenance tagging; adapted as provenance trail
- rubric-anchored-recursion — conductor/subagent architecture; structural template for skill
