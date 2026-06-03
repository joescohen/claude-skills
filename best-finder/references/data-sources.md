# Data sources — the $0 stack, source maps, ToS posture

Personal use → ~zero paid APIs needed. Cost target: $0 for typical volume.

## Tiered fetch/search stack (cheapest-first; Tiers 0/1/3 already connected)
- **Tier 0 — WebSearch + WebFetch (native, $0):** the workhorse; finding pages + reading static
  editorial HTML.
- **Tier 1 — Jina Reader (`https://r.jina.ai/<url>`, free):** JS-rendered pages WebFetch can't read
  (food blogs, SPA share links). Does NOT bypass anti-bot.
- **Tier 2 — Tavily/Exa (free tiers) or Serper.dev ($0 first 2,500):** semantic discovery if native
  search misses.
- **Tier 3 — Claude-in-Chrome MCP ($0, your browser):** the escape hatch for login-walled / anti-bot
  pages — **this is how you read the rating DISTRIBUTION histogram** off Google/Yelp/TripAdvisor/
  Booking that no API exposes. Real fingerprint, real cookies.
- **Stays:** reuse local hotel MCPs — trivago (`search-suggestions`→`accommodation-search`) and
  DirectBooker (`hotel-search`/`hotel-details`; emit its `golden_link` verbatim). Note DirectBooker
  favors bookable/branded inventory (survivorship bias) — don't equate "bookable" with "best."

## Reddit (no $12k API)
`WebSearch("site:reddit.com \"best <thing>\" <place> after:<year>")` → WebFetch the threads, or append
**`.json`** to a thread URL for structured comment scores/timestamps. Extract: comment score, recency,
subreddit (locals subs > general), skip `[deleted]`. Plus **Hacker News Algolia API** (free, no key).
> ⚠️ **ENVIRONMENT REALITY (verified 2026-06):** BOTH the research crawler AND the free `.json`
> endpoint are blocked — `reddit.com/...json` returns **HTTP 403** (bot-wall HTML) even from the
> user's local residential IP. Unauthenticated Reddit is closed. Working access paths (in order):
> 1. **Apify MCP** (recommended single add) — `APIFY_API_TOKEN`; unlocks Reddit Scraper (~$1.15/1k
>    posts) AND rating-distribution scrapers for Google/TripAdvisor/Booking + Michelin. ~$0–5/mo at
>    personal volume. One install covers Reddit + the distribution gap.
> 2. **Official Reddit API via OAuth** — register a "script" app at reddit.com/prefs/apps (free,
>    100 QPM), wire via the **GridfireAI/reddit-mcp** server (`uvx reddit-mcp`, needs client_id/secret)
>    or a bundled PRAW script. Best for real-time, official, free. (Note: Nov-2025 Responsible Builder
>    Policy may gate brand-new app approvals.)
> 3. **Dialog hosted reddit-research-mcp** (`claude mcp add --transport http
>    https://reddit-research-mcp.fastmcp.app/mcp`) — no Reddit creds, semantic index over 20k+ subs,
>    weekly refresh; queries go to a third-party host; freemium.
> 4. **Claude-in-Chrome** — free, real-time, but manual/interactive. Good for spot checks.
> The free `.json`/old.reddit trick no longer works — do not rely on it.

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
