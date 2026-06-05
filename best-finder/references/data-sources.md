# Data sources — the $0 stack, source maps, ToS posture

Personal use → ~zero paid APIs needed. Cost target: $0 for typical volume.

## Tiered fetch/search stack (cheapest-first; Tiers 0/1/3 already connected)
- **Tier 0 — WebSearch + WebFetch (native, $0):** the workhorse; finding pages + reading static
  editorial HTML.
- **Tier 1 — Jina Reader (`https://r.jina.ai/<url>`, free):** JS-rendered pages WebFetch can't read
  (food blogs, SPA share links). Does NOT bypass anti-bot.
- **Tier 2 — Tavily/Exa (free tiers) or Serper.dev ($0 first 2,500):** semantic discovery if native
  search misses.
- **Tier 3 — Claude-in-Chrome MCP ($0, your browser):** the **fallback** escape hatch for login-walled /
  anti-bot pages whose Apify actor does NOT expose the breakdown (some Yelp/TripAdvisor/Booking surfaces).
  Real fingerprint, real cookies. ⚠️ **For Google, Chrome is NOT needed for the histogram** — Apify's
  Google Maps scraper returns the per-star distribution as structured numbers (see "Google Maps histogram +
  images" below). Reach for Chrome only when no actor returns the breakdown for a given source.
- **Stays:** reuse local hotel MCPs — trivago (`search-suggestions`→`accommodation-search`) and
  DirectBooker (`hotel-search`/`hotel-details`; emit its `golden_link` verbatim). Note DirectBooker
  favors bookable/branded inventory (survivorship bias) — don't equate "bookable" with "best."

## Google Maps histogram + images (Apify is the PRIMARY path — Chrome is fallback only)
> ✅ **VERIFIED LIVE 2026-06** (run `6jMBDFuUegYs8H4df`, All'Antico Vinaio / Florence, 21s, ~$0.02): the
> rating DISTRIBUTION and place photos come back as **structured fields** — no Chrome screenshot/OCR needed.

**Actor = `compass/crawler-google-places`** ("Google Maps Scraper", `apify` MCP). Pass `searchStringsArray`
(the place name) + `locationQuery` (`"City, Country"`) + `maxCrawledPlacesPerSearch: 1`, and — **critically**
— **`scrapePlaceDetailPage: true`** (the histogram, `reviewsTags`, popular-times, opening hours, and hotel
fields are ALL gated behind this flag; without it you get only `totalScore` + `reviewsCount`). For photos add
**`maxImages: N`** (e.g. 5–10). Set `maxReviews: 0` unless you also want review text (it costs extra per place).

Fields returned (place-level, structured):
- **`reviewsDistribution`** = `{ oneStar, twoStar, threeStar, fourStar, fiveStar }` — THE histogram, as counts.
  In the live run: `{1522, 1164, 2751, 7215, 34050}` on 46,702 reviews / 4.5★ → feed straight into the
  bimodal/inflation check (methodology.md). No mean-only fallback, no UI reading.
- **`imageUrls`** = array of direct `lh3.googleusercontent.com` photo URLs (1920×1080) + **`imagesCount`** —
  use for the inline photo gallery in the HTML output (output-style.md), no Chrome screenshot pass.
- **`reviewsTags`** = `[{title, count}]` — Google's own aggregated review themes, and it **literally tallies
  "tourist trap"** (478 in the live run) alongside "the queue" (3046) etc. A direct, free trap signal.
- Bonus: `popularTimesHistogram` (busy-by-hour), `additionalInfo` (atmosphere/crowd/offerings), `price`.

**Cost:** base ~$4/1,000 places + the detail-page add-on; a handful of finalist places is a few cents on the
free credits — an accepted default, never a reason to skip. **Run via the CONDUCTOR** (the `apify` MCP is on
the conductor session, not dispatched readers — same rule as Reddit below).

**Scope caveat:** this is **Google Maps specifically**. Yelp / TripAdvisor / Booking have their own actors and
the per-star breakdown is NOT guaranteed on each — when a source's actor doesn't return the distribution, THEN
fall back to Tier-3 Claude-in-Chrome to read it off the rendered UI.

## Reddit (Apify is the path — free access is DEAD)
> ⚠️ **ENVIRONMENT REALITY (verified 2026-06):** unauthenticated Reddit is **closed**. The `.json`
> endpoint AND old.reddit BOTH return **HTTP 403** (bot-wall HTML), and the research crawler is
> blocked too — even from the user's local residential IP. **Do not append `.json`, do not rely on
> old.reddit, do not WebFetch threads directly.** They no longer work as a data path.

**WORKING PATH = Apify** (MCP connected as `apify`, or REST `api.apify.com/v2`). `trudax/reddit-scraper`
(full) is a PAID rental (gated — "actor-is-not-rented").

**PRIMARY — self-seeding discovery+comments in ONE call (no web-search prerequisite).**
VERIFIED working 2026-06 (live run: r/florence, 53 items / 9.7s / ~$0.05, zero 403):
**`automation-lab/reddit-scraper`** — pass `searchSubreddit` + `searchQuery` + `includeComments:true`
(`maxPostsPerSource`, `maxCommentsPerPost`, `filterKeywords`, `sort:"top"`). It searches the subreddit
AND returns the comment bodies + `permalink` in one run — this is the path that defeats the old "empty
`site:reddit.com` → no seeds → Reddit blocked" failure. ⚠️ **Its comment `score` is best-effort and may
return `0`** (Reddit hides exact scores on some public surfaces). When upvote-weighting matters, take the
`postUrls` this search surfaced and feed them to a **score-returning comment actor** —
**`clearpath/reddit-post-comments-bulk-scraper`** (~$0.001/comment, full trees) or
`crawlerbros/reddit-comment-scraper` (explicit score, takes `postUrls`). AVOID `trudax/reddit-scraper-lite`
(no scores, no comments). A full Reddit pass ≈ $0.05–$0.30 on the free credits — an accepted default cost,
never a reason to skip. **Run via the CONDUCTOR** (the `apify` MCP is on the conductor session, not
dispatched readers).

**RELEVANCE (kill keyword noise — r/Oscars, r/Smite, the French town "Ponte Leccia", etc.):**
- Seed the actor's `startUrls` with (a) **subreddit-restricted search URLs** (the PRIMARY, self-contained
  path — needs no prior web search and survives an empty `site:reddit.com` pass), e.g.
  `https://www.reddit.com/r/ItalyTravel/search/?q=<terms>&restrict_sr=1&sort=relevance`, and (b) any
  **VETTED relevant thread permalinks** found via a broad search pass as OPTIONAL enrichment on top.
- Then apply a **relevance filter** = subreddit **allowlist** (ItalyTravel, tuscany, florence, travel,
  solotravel, FATTravel, hotelsreviewed, wine, ItalianFood*… region-appropriate) **∪** on-topic
  title/body terms, **MINUS** a noise **denylist** (off-topic/look-alike subs).

**ACCURACY / WEIGHTING:** when a score-returning actor is used, weight every signal by upvote `score`
(+ recency + cross-thread corroboration). When the primary self-seeding actor returns `score:0`
(best-effort), weight by **cross-thread convergence + recency + named-specificity** instead — do NOT treat
score 0 as "low signal." Either way, a thread title that is itself a verdict (e.g. "[Travel Warning] Avoid
… total tourist trap") is a strong trap signal regardless of comment score.

**PROVENANCE / no fabrication:** every extracted Reddit claim MUST carry a resolving `permalink` and a
**VERBATIM** quote that appears in the fetched corpus. Never paraphrase into a "Reddit said …" claim
without the permalink + quote.

Reference implementation in this repo:
`best-options-research/runs/italy-2026/raw/apify_reddit_full.py`. Plus **Hacker News Algolia API**
(free, no key) as an independent corroborating source.

## Social media
- **YouTube: INCLUDE** — Data API (free, ~100 searches/day) + transcripts (long-form honest reviews).
- **Instagram/TikTok: only via `site:` web search** (free); their APIs are useless/inaccessible.
- **Facebook + IG/TikTok APIs: SKIP.** Comped-content is rampant → social is discovery/cross-check, not
  a primary vote. **Reddit beats all social.**

## Geography-correct source maps (don't default to Yelp/Google everywhere)
- **Italy:** Gambero Rosso (the authority; "Tre Forchette"), Michelin + **Bib Gourmand**, **Osterie
  d'Italia (Slow Food)** for authentic/value, La Liste; stays: Relais & Châteaux, Tablet, Mr&Mrs Smith,
  i-escape, Michelin Keys. Italian-language reviews = locals. **Yelp is near-useless in Italy.**
- **Japan:** Tabelog (3.5+ = excellent; recalibrate). **France:** Michelin/Gault&Millau/Le Fooding.
  **Spain:** Guía Repsol. **US:** Eater/Infatuation/James Beard + local critics + Reddit.
- **Local-language heuristic INVERTS** where tourist-language = review language, or locals use a
  different platform: **China → Dianping, Korea → Naver, Russia → 2GIS.** Be region-aware.
- **Local-language sourcing is MANDATORY, not optional — it changes the answer.** Proven in the Italy
  run: adding an Italian-language pass surfaced a top romantic pick the English-only pass missed
  (Castello La Leccia) and flipped a candidate (Tornano — locals: "resort aspirations, farmhouse
  service"). Always run a local-language reader for non-English destinations.

## ToS-safe posture (personal, read-only)
Logged-out public access; **ephemeral** (no stored review DB — only the user's own needs/profile);
rate-limit 2–5s/domain; respect robots.txt; use Chrome-with-your-account only for the few walls.
Public-data reading for personal use is the legal sweet spot (Van Buren / hiQ / Meta v. Bright Data).
