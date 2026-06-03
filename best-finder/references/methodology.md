# Methodology — the convergence engine + anti-inflation scoring + data-sufficiency gate

## Core principle
No single source is trusted. Confidence comes from **agreement across structurally independent
source types**: {expert/editorial} + {niche-community} + {de-biased crowd} (+ {local-language},
{YouTube} where relevant). Two mirrors of the same crowd ≠ two sources. Convergence → confidence;
divergence → investigate and surface (don't hide).

## Why mainstream ratings mislead (defend against these)
- J-shaped self-selection; top-end compression (everything clusters 4.x); fake reviews;
  social herding (+~32% / +~25% inflation); two-sided reciprocity (Airbnb ~4.7 floor).
- Steelman to respect: for **chains** and **low-stakes** choices the crowd average is usually fine
  → that's what the **stakes gate** is for. Don't over-engineer low-stakes picks.

## Source weighting (gaming-resistance hierarchy)
Weight by (1) economic independence from the reviewed entity, (2) reviewer anonymity,
(3) multi-visit requirement, (4) friction-to-game. Michelin-tier ≫ serious editorial ≫
text-required crowd ≫ star-only crowd.

## Scoring (deterministic — see scripts/score.py)
- **Within-platform percentile, never raw cross-platform stars** (a 4.3 Google ≠ 4.3 Yelp).
- **Bayesian shrinkage** so low-volume 5.0s don't beat high-volume 4.3s:
  `WR = (v/(v+m))·R + (m/(v+m))·C` (calibrate C, m from the pulled data — never hardcode offsets).
- **Recency decay** + **multi-year consistency** as separate signals; flag review **bursts** (fraud tell).
- **Text/aspect signal > star mean**; prefer reviews that name specific dishes/details.
  (Caveat: AI-generated reviews now mimic specificity — lean on structural/independence signals too.)
- **Convergence bonus**: appears across ≥2 independent source types → boost; single-source high → discount.
- **Popularity de-bias dial** (discovery ↔ safe-bet) to surface non-touristy gems.

## Distribution = the key anti-fraud signal
A bimodal distribution (flood of 5★ + retaliatory 1★) reveals manipulation; a normal-ish spread
~3.8–4.4 is often more trustworthy than a tight all-5★ low-volume listing. **No mainstream API
exposes the histogram** → read it off the UI with Claude-in-Chrome (see data-sources.md). If you
can only get the mean, say so and lower confidence.

## Fake-signal tells (client-side usable)
Single-review accounts; uniform-sounding reviews ("great food, great service, great atmosphere");
sudden 5★ bursts after mixed history; generic superlatives with no specifics; thin volume.

## Data-Sufficiency Gate → confidence tier
Score each candidate on: **independence** (# independent source TYPES), **depth** (enough real text,
not just stars), **recency** (signal within ~12–18mo), **distribution obtained?**, **convergence**.
- **HIGH** — ≥3 independent types, rich + recent, converging → confident pick + evidence.
- **MEDIUM** — 2 types / some text → recommend WITH explicit caveats; name what's missing.
- **LOW** — 1 type, or thin/stale, or sources contradict → **do NOT fake a "best."** Say what's thin,
  offer to dig (Chrome histogram / Reddit `.json` / Italian-language).
Confidence is a **computed property of the inputs**, not a vibe. Degrade honestly in thin regions.

## Adversarial verification (high-stakes only)
A skeptic pass on the top pick: hunt the recurring dealbreaker in 1★/3★, manufactured-review tells,
tourist-trap signals, "is this just a chain where the crowd score is already enough?", and a
**citation sanity-check** (mismatched/again-wrong URLs → treat the claim as unverified).
