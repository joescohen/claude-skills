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
offer to dig (Apify Google-Maps histogram / Reddit / local-language).

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

**STRUCTURAL-CONSISTENCY RULE — every page is built from the same skeleton (NON-NEGOTIABLE).** Do not
free-improvise the markup per run; structural drift is a defect. Every deliverable MUST include the same
boilerplate and use the same card structure so layout (and the photo gallery) lands identically every
time:
- **Always include the boilerplate**: the `:root` palette vars, the base component CSS, the gallery CSS,
  and the shared lightbox `<script>` — all of it, every page. Source of truth: `references/gallery-lightbox.md`.
- **Every pick card uses the canonical pick-card skeleton** from `references/gallery-lightbox.md`
  (`.card › .rank · .prop-h · .meta · .hsplit › [.story, right-rail wrapper › .scorebox › .gallery]`).
  The `.scorebox` is ALWAYS inside a right-rail wrapper `<div>`, and the `.gallery` placeholder is ALWAYS
  the last child INSIDE the `.scorebox`. Same structure for the lead pick and every alternative.
- **The photo gallery is a DEFAULT, required element of every pick card** (see §11) — not optional, not
  "on request." A pick card without its gallery placeholder is incomplete.

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
11. **Photos — inline per-pick gallery + shared lightbox (DEFAULT — required on every pick card).**
    Every pick card's right rail (inside the calibrated-signal scorebox) carries a photo gallery for that
    property — **as many good photos as available, up to ~10** (aim 6–10 for hotels/restaurants/sights
    with rich galleries; 3 is the practical floor). In-card footprint is **just a single hero thumbnail**
    with a "▦ N" count badge and a "📷 Photos · N · click to expand" header — the hero does NOT expand the
    card past its story; all N photos live in the lightbox. Clicking the hero opens a **single shared
    full-screen lightbox**
    (reused by every gallery) with prev/next arrows, ← / → keys, Esc / backdrop-click to close, and a
    caption bar of **property name · "i / N" counter · a "Google Maps ↗" verify-link to the place's
    listing · a "this photo ↗" link to the individual source image** (so the user can confirm each set is
    the right place).
    This is not optional and not "on request" — a pick card without its gallery is incomplete. (Only omit
    for a pick with no resolvable place/photos, e.g. an abstract activity; the lightbox JS skips empty
    galleries gracefully.)
    **Sourcing (default = Apify Google Places, scales to all picks at once):** run
    `compass/crawler-google-places` ONCE with every pick in `searchStringsArray` (bake city/area into each
    query), `maxCrawledPlacesPerSearch:1`, `scrapePlaceDetailPage:true`, `maxImages:10` → each item's
    `title` (verify it matches the pick) + `imageUrls` (direct `lh3.googleusercontent.com` URLs). ~$0.01
    /place. Fallback: harvest the property's official gallery via the connected browser and **verify each
    image resolves to the right property**. **Embedding:** fetch the chosen URLs, downscale to ~1000–1100px
    JPEG (~q72) and **base64-embed as data URIs** — self-contained, unbreakable, **never hot-link** (broken
    images cheapen it). At ~10 photos × N picks keep an eye on weight (a few MB/page is fine). On mobile the
    card grid collapses to one column and the gallery stacks full-width — fine.
    Full recipe — canonical card skeleton + CSS + lightbox JS + the batched fetch/embed/inject scripts:
    `references/gallery-lightbox.md`.
    Reference output with galleries live: `best-options-research/runs/italy-2026/tuscany-castles-rerun.html`.
Put a table-of-contents / jump-nav right after the hero so the deep "why" sections stay one click away
despite sitting lower on the page.
Style: clean editorial design, region-appropriate palette, score bars + confidence badges, print-friendly,
inline CSS (no external deps). Save to the PINNED deliverable base —
`~/Engineering/projects/best-options-research/runs/<trip-id>/<query>.html` (absolute; see SKILL.md →
Output locations — never a cwd-relative `runs/...` path) — and send via SendUserFile.
Reference implementation (canonical structure + visual style — its section *order* is superseded by the
ordering rule above): `best-options-research/runs/italy-2026/tuscany-castles-rerun.html` (the version
WITH per-pick galleries + lightbox; this is the structural reference every page should match).
