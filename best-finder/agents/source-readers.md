# Source-reader agent prompts (dispatch in parallel — one per independent source type)

Dispatch all relevant readers in ONE message (parallel). Each returns candidates + raw signals +
a self-reported richness, and writes a raw file. Conductor alone synthesizes (never dump raw
output) — and FIRST runs the Phase 3.5 verification gate on every reader claim (URLs resolve,
scores trace, ≥2 independent types) before scoring; see `references/methodology.md`.
Use `compound-engineering:ce-web-researcher` for web readers; `general-purpose` for local/MCP tasks.

Shared context to inject into every reader: the query, location, dates/seasonality, party + mode +
budget (from the user's needs file), the geography-correct source list (data-sources.md), and the
output path (PINNED, absolute — see SKILL.md → Output locations)
`~/Engineering/projects/best-options-research/runs/<trip-id>/raw/<type>-<query>.md`.

---
## Expert-curation reader
Find genuinely great candidates from the AUTHORITATIVE, gaming-resistant CURATED sources for this
category + geography (e.g., Italy stays → Relais & Châteaux, Tablet, Mr&Mrs Smith, i-escape, Michelin
Keys; Italy restaurants → Gambero Rosso, Michelin/Bib Gourmand, Osterie d'Italia). For each candidate:
name, exact location + drive/transit time to the relevant base, type, WHICH curators feature it
(= convergence signal), price tier for the dates, fit to mode (romantic/value/etc.), standout
features. Prefer multi-curator picks; distinguish genuine character from generic luxury. Exclude
affiliate/SEO listicles. Cite every claim with a URL. Return a dense digest ranked by (curator
convergence × mode-fit); separate value vs splurge; self-grade source quality; note gaps.

## Community / insider reader
**Reddit is a REQUIRED source, retrieved via Apify — never a fallback note.** Because the `apify` MCP
tools are connected to the CONDUCTOR session (not dispatched subagents), the **conductor runs the Reddit
retrieval directly** and injects the resulting comment corpus into this reader; a delegated reader without
MCP access must NOT substitute a "Reddit blocked" note. **Primary path is self-seeding in one call:** run
the verified discovery+comments actor with `searchSubreddit` + `searchQuery` + `includeComments` (see
`references/data-sources.md`) — it searches the subreddit AND returns comment bodies + permalinks with no
web-search prerequisite, so it cannot be defeated by an empty `site:reddit.com` pass. Vetted thread
permalinks found via web search are OPTIONAL enrichment, never the gate. If the actor itself errors, report the
exact actor + error per the required-source terminal-state rule (SKILL.md) — do not narrate a fix you
didn't run. See `references/data-sources.md` (unauthenticated `.json`/old.reddit are dead — 403). Plus
HN Algolia, geography-correct forums + trusted writers for
what in-the-know travelers ACTUALLY recommend for THIS mode — and what they WARN is overrated /
tourist-trap / wedding-factory / too-remote. Capture named candidates with convergence (how many
independent voices) + example URLs, value hidden-gems, an explicit OVERRATED/AVOID list, and insider
tells (logistics, timing, booking urgency). Italian/local-language signal where possible. Lower
authority by nature — grade accordingly; prize cross-thread convergence. Return dense digest.

## Calibrated-crowd reader
For the specific named candidates, gather crowd signal across the right platforms (geography-aware),
CALIBRATED within-platform (Booking 1–10, Google/TA means + REVIEW COUNTS + recency + sub-scores).
Get the rating DISTRIBUTION where visible (use Claude-in-Chrome for the histogram — no API exposes it).
Surface recurring praise AND recurring complaints; flag where the headline score and the complaint
text DIVERGE (the key tell). Flag thin/low-volume listings as inflation risks — BUT for a real,
nameable venue, first attempt to resolve/consolidate its OTHER listings (name variants, relocation,
closure→reopening, per-platform fragments); report a thin reading as "thin on THIS listing, footprint
unconsolidated," NEVER as a confident whole-entity thin/no-signal verdict. A thin fragment is evidence
about one listing, not proof the venue lacks signal. Note booking reality/availability for the dates.
Be explicit where you could only get the mean. Return dense digest.

## (Optional) Local-language / YouTube reader
Local-language reviews (locals signal — but check the inversion rule) and/or YouTube long-form reviews
(API + transcripts) for dish/property-level honest signal, esp. for new/trending places.
