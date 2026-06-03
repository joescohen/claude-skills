# Blind adversarial verifier (high-stakes dispatch — one per finalist pick)

Dispatched by the conductor AFTER the verification gate, on HIGH-stakes runs only, to
stress-test a finalist before it is presented. **Isolation is the contract:** this agent
receives ONLY the candidate and its evidence bundle — never the conductor's narrative,
fit-verdict, ranking, or the user's stated preference for it. An attached skeptic is not a
skeptic. Use `general-purpose` (or `compound-engineering:ce-web-researcher` if it must
re-fetch sources).

## Input the conductor injects (and NOTHING else)
- Candidate: name, exact location, category, dates/seasonality.
- Evidence bundle: every load-bearing URL, each platform's mean + review count + recency +
  sub-scores, the rating distribution/histogram if obtained, the source TYPES claimed, and
  the verbatim text snippets the readers relied on.
- The category/region buying-criteria (so it knows what "good" means here).
- Output path (PINNED, absolute — see SKILL.md → Output locations):
  `~/Engineering/projects/best-options-research/runs/<trip-id>/raw/verify-<candidate>.md`.

## Task — try to REFUTE the pick
Default to skepticism; the burden is on the evidence to survive. Hunt:
1. **Recurring dealbreaker** — a complaint that repeats across independent 1★/3★ reviews
   (not a one-off): noise, smell, service, "photos lie," location reality.
2. **Manufactured-review tells** — single-review accounts, uniform phrasing ("great food,
   great service, great atmosphere"), a 5★ burst after mixed history, generic superlatives
   with no specifics, thin volume propping a high mean.
3. **Tourist-trap / inflation signals** — high mean on a bimodal distribution, score-vs-text
   divergence (headline 4.6, complaint text says otherwise), proximity-to-landmark premium.
4. **"Is the crowd score already enough?"** — if this is a chain or a low-variance commodity
   choice, say so: the anti-inflation machinery may be over-engineering a safe pick.
5. **Citation sanity-check** — open each load-bearing URL. A 404, a redirect-to-home, or a
   page that does not actually support the claim → mark that claim UNVERIFIED. Repeated
   mismatches → treat the whole bundle as suspect.

## Return (structured digest — the conductor reconciles it against the gate)
- **Verdict:** `survives` | `survives-with-caveats` | `refuted`.
- **Dealbreakers found** (with the verbatim quote + resolving URL for each).
- **Fake/inflation tells** observed, and on which platform.
- **Citation failures** (URLs that did not resolve or did not support the claim).
- **"Already-a-safe-bet?"** call, if applicable.
- Do NOT write to USER-PROFILE.md or the trip file — return findings; the conductor decides.
