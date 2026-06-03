#!/usr/bin/env python3
"""
best-finder deterministic scoring.

Keeps the anti-inflation math out of the prompt: within-platform percentile,
Bayesian shrinkage, recency decay, convergence bonus, and a data-sufficiency
confidence tier. Pure stdlib. I/O is JSON so this lifts cleanly into an MCP later.

Usage:
    echo '<candidates-json>' | python3 score.py
    python3 score.py candidates.json

Input JSON: {"category_global_mean": 4.15, "shrink_m": 50, "candidates": [
  {"name": "...", "platforms": [
     {"platform":"google","mean":4.6,"count":820,"platform_mean":4.2,
      "newest_review_age_days":20,"distribution":{"5":600,"4":120,"3":40,"2":20,"1":40}}],
   "source_types": ["expert","community","crowd"],  # independent types present
   "text_depth": 14,        # # of substantive text reviews seen
   "burst_flag": false}     # sudden review spike detected
]}
"""
import sys, json, math


def bayesian_shrunk(mean, count, prior_mean, m):
    if count <= 0:
        return prior_mean
    return (count / (count + m)) * mean + (m / (count + m)) * prior_mean


def recency_weight(age_days, half_life_days=540):  # ~18 month half-life
    if age_days is None:
        return 0.5
    lam = math.log(2) / half_life_days
    return math.exp(-lam * age_days)


def distribution_bimodality(dist):
    """Crude polarization flag: high share at the extremes (5 and 1) vs middle."""
    if not dist:
        return None
    total = sum(dist.values()) or 1
    extremes = (dist.get("5", 0) + dist.get("1", 0)) / total
    middle = (dist.get("3", 0) + dist.get("2", 0) + dist.get("4", 0)) / total
    return round(extremes - middle, 3)  # higher = more polarized = more suspect


def confidence_tier(c):
    types = len(set(c.get("source_types", [])))
    depth = c.get("text_depth", 0)
    has_dist = any(p.get("distribution") for p in c.get("platforms", []))
    recent = any((p.get("newest_review_age_days") or 9999) <= 540
                 for p in c.get("platforms", []))
    if types >= 3 and depth >= 10 and recent:
        return "HIGH"
    if types >= 2 and depth >= 4:
        return "MEDIUM"
    return "LOW"


def score_candidate(c, prior_mean, m):
    platform_scores, flags = [], []
    for p in c.get("platforms", []):
        shrunk = bayesian_shrunk(p["mean"], p.get("count", 0), prior_mean, m)
        # within-platform relative position (how far above this platform's own mean)
        rel = p["mean"] - p.get("platform_mean", prior_mean)
        w = recency_weight(p.get("newest_review_age_days"))
        platform_scores.append({
            "platform": p.get("platform"),
            "shrunk": round(shrunk, 3),
            "within_platform_delta": round(rel, 3),
            "recency_weight": round(w, 3),
            "bimodality": distribution_bimodality(p.get("distribution")),
        })
        if (p.get("count", 0) < 30):
            flags.append(f"{p.get('platform')}: thin volume ({p.get('count',0)}) — inflation risk")
        bim = distribution_bimodality(p.get("distribution"))
        if bim is not None and bim > 0.6:
            flags.append(f"{p.get('platform')}: polarized distribution — read the 1-stars")
    if c.get("burst_flag"):
        flags.append("review burst detected — possible manufactured 5-stars")

    base = sum(s["shrunk"] * s["recency_weight"] for s in platform_scores)
    base = base / (sum(s["recency_weight"] for s in platform_scores) or 1)
    convergence = len(set(c.get("source_types", [])))
    convergence_bonus = 0.15 * max(0, convergence - 1)  # reward independent agreement
    final = round(base * (1 + convergence_bonus), 3)
    return {
        "name": c.get("name"),
        "final_score": final,
        "confidence": confidence_tier(c),
        "convergence_types": convergence,
        "platform_detail": platform_scores,
        "flags": flags,
    }


def main():
    raw = open(sys.argv[1]).read() if len(sys.argv) > 1 else sys.stdin.read()
    data = json.loads(raw)
    prior = data.get("category_global_mean", 4.15)
    m = data.get("shrink_m", 50)
    out = [score_candidate(c, prior, m) for c in data.get("candidates", [])]
    out.sort(key=lambda x: x["final_score"], reverse=True)
    print(json.dumps({"ranked": out}, indent=2))


if __name__ == "__main__":
    main()
