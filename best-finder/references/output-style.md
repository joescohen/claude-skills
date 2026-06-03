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
- **[VERIFIED]** ≥2 independent source TYPES converge
- **[SUPPORTED]** 1 strong source type, no contradiction
- **[ASSUMED]** weak/inference — flag it
- **[CONTESTED]** sources disagree — surface BOTH, don't hide

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
recommendation. It MUST include, in this spirit:
1. **Context strip** — the trip inputs (who/when/mode/budget/constraints).
2. **"What I think you're looking for"** — general + specific-to-this-place (read from USER-PROFILE + strategy).
3. **"What you should be looking for"** — the insider buying-criteria for this category/region (teach the user).
4. **"How I scored"** — the anti-inflation rubric + the confidence-tier legend, in plain terms.
5. **The pick** — full STORY (vibe + day-to-day reality incl. food/logistics) + calibrated crowd scores
   (with review counts) + provenance tags + confidence badge + a fit verdict + flags.
6. **Every alternative** — same treatment; each framed as "right for a different version of the trip."
7. **Considered & set aside** — the contested/avoid picks, showing the method working (inflation traps, divergence).
8. **A scorecard table** — all options side by side with confidence tiers.
9. **"How it all came together"** — the synthesis narrative + strategy reallocation.
10. **"Before you book"** — the LOW-confidence items, not faked.
11. **Evidence base** (don't bury it — sourcing is the thesis) — organized by **independent source
    TYPE** (expert/editorial · community/forums · crowd platforms · local-language · methodology/
    academic), with a **breadth count** (how many sources / types) and real links per type + per
    property. Plus an honest **sourcing-gaps panel**: what was thin or unreachable (e.g., Reddit is
    Chrome-only here; distributions need a Chrome read) and how to close it. NEVER let the displayed
    sources look single-platform — that mimics the inflation the tool exists to defeat.
12. **Photos** — embed real inline images when possible (a Claude-in-Chrome screenshot pass of the
    property gallery), otherwise prominent gallery links + offer to embed on request. Never hot-link
    images you can't verify (broken images cheapen it).
Style: clean editorial design, region-appropriate palette, score bars + confidence badges, print-friendly,
inline CSS (no external deps). Save to `runs/<trip>/<query>.html` and send via SendUserFile.
Reference implementation: `best-options-research/runs/italy-2026/tuscany-castles.html`.
