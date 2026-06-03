# Output style — paint the picture, tag provenance, run the critique loop

## Paint the picture (don't dump a scored list)
For each recommended option, give an **experiential picture**, not just metrics:
- **Vibe / experience** — what it actually feels like (intimate vs grand, owner-run vs polished,
  setting, who else is there, the romantic/standout texture).
- **Day-to-day reality** — the practical truth the user must live with. For stays this MUST include
  the **food/dining logistics**: is there on-site dining, which nights is it open, can you eat in every
  night, what's the nearest town/shops for the off-nights, provisioning. For experiences: booking
  difficulty, time cost, crowds.
- **Fit** — 2–3 sentences weighing it against THIS user's stated wants + mode + budget; who it's
  perfect for vs who'd be frustrated.

Keep it vivid but **accurate** — flag anything unverified; never invent specifics.

## Provenance tags (every load-bearing claim)
- **[VERIFIED]** ≥2 independent source TYPES converge ON THE SAME ENTITY, each with its own
  resolvable per-datum provenance — i.e. it passed the Phase 3.5 gate for THIS pick. The badge
  asserts only what the gate checked per-pick; never word it to claim more.
- **[SUPPORTED]** 1 strong source type, no contradiction
- **[ASSUMED]** weak/inference — flag it
- **[CONTESTED]** sources disagree — surface BOTH, don't hide
Every cited score/crowd datum carries a resolvable link or is marked unlinked; unlinked data
cannot earn [VERIFIED].

## Confidence tier (from the data-sufficiency gate)
State HIGH / MEDIUM / LOW per recommendation. On LOW, do **not** fake a "best" — say what's thin and
offer to dig (Chrome histogram / Reddit / local-language).

## The critique-refine loop (compound critiquing)
After presenting, invite reaction and offer the critiques AS MENUS (you generate them):
"more like this but [cheaper / more local / closer / quieter / more adventurous]?" Each reaction →
refine the shortlist AND **append the revealed preference to the user's needs file** (continuous
capture). This is how preferences get constructed — by reacting to real options.

## Decisions & honesty
Surface open decisions (e.g., base location, splurge allocation) for the USER to make — don't silently
resolve them. Validate genuinely-good user picks (don't contrarian-reject); proximity to a landmark is
not auto-disqualifying — judge on convergence.

## The "full-picture" HTML deliverable (DEFAULT final output)
The final recommendation should be a **self-contained, browser-openable HTML page** — a full picture,
not a chat blurb. A short chat summary is fine as a preface, but produce the HTML for any non-trivial
recommendation.

**ORDERING RULE — answer first, supporting material below (NON-NEGOTIABLE).** Lead with the picks.
The user wants to see *what to do* immediately, then the context/criteria/methodology/evidence that
justifies it — never the reverse. Do NOT open with paragraphs of context, "what you're looking for,"
or "how I scored." A page that buries the picks below the fold is wrong even if every section is present.

Required sections, **in this exact order**:
1. **Hero / context chips only** — a compact strip of who/when/mode/budget/constraints as chips in the
   header. Minimal — orientation, not a section. No prose context block here.
2. **The picks — painted** — THE ANSWER, up top. Group by job (e.g. "the one splurge" / "romantic-value
   nights" / "hidden-gem" / "skip"). For the lead pick AND every alternative: full STORY (vibe +
   day-to-day reality incl. food/logistics) + calibrated crowd scores (with review counts) + provenance
   tags + confidence badge + fit verdict + flags. Each alternative framed as "right for a different
   version of the trip." Put a **one-line confidence-tier key** at the top of this section so the badges
   read immediately (the full rubric lives lower in "How I scored").
3. **Scorecard table** — all options side by side with confidence tiers.
4. **Considered & set aside** — the contested/avoid picks, showing the method working (inflation traps,
   score↔text divergence).
5. **Before you book** — the LOW-confidence / verify-first items, not faked.
--- everything below this line is the supporting "why," placed AFTER the answer ---
6. **"What I think you're looking for"** — general + specific-to-this-place (from USER-PROFILE + strategy).
7. **"What you should be looking for"** — the insider buying-criteria for this category/region (teach the user).
8. **"How I scored"** — the anti-inflation rubric + the full confidence-tier legend, in plain terms.
9. **"How it all came together"** — the synthesis narrative + strategy reallocation.
10. **Evidence base** (don't bury it — sourcing is the thesis) — organized by **independent source
    TYPE** (expert/editorial · community/forums · crowd platforms · local-language · methodology/
    academic), with a **breadth count** (how many sources / types) and real links per type + per
    property. Plus an honest **sourcing-gaps panel**: what was genuinely thin (e.g., a venue with few
    crowd reviews even after consolidation; an optional YouTube pass that found nothing). **A REQUIRED
    source type may NEVER appear here as merely "unreachable, here's how to close it"** — required types
    (incl. Reddit-via-Apify) must be retrieved, or, if their retrieval tool itself errored, the panel
    states the exact recovery that was RUN and the specific block hit (not a fix you only described). A
    "Reddit blocked — fix: the Apify actor ~$0.30" line is a defect, not an acceptable gap entry. NEVER
    let the displayed sources look single-platform — that mimics the inflation the tool exists to defeat.
11. **Photos** — embed real inline images when possible (a Claude-in-Chrome screenshot pass of the
    property gallery), otherwise prominent gallery links + offer to embed on request. Never hot-link
    images you can't verify (broken images cheapen it).
Put a table-of-contents / jump-nav right after the hero so the deep "why" sections stay one click away
despite sitting lower on the page.
Style: clean editorial design, region-appropriate palette, score bars + confidence badges, print-friendly,
inline CSS (no external deps). Save to the PINNED deliverable base —
`~/Engineering/projects/best-options-research/runs/<trip-id>/<query>.html` (absolute; see SKILL.md →
Output locations — never a cwd-relative `runs/...` path) — and send via SendUserFile.
Reference implementation (visual style ONLY — its section *order* is superseded by the ordering rule
above): `best-options-research/runs/italy-2026/tuscany-castles.html`.
