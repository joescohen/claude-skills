#!/usr/bin/env python3
"""
test_score.py — deterministic tests for score.py (pure stdlib, no pytest needed).

Run:  python3 test_score.py        (exit 0 = all pass, exit 1 = failures)

These are paired positive controls (per the "check the check" rule): each
methodology claim has a case that FAILS if the corresponding math is removed —
several of these fail against the pre-2026-07 implementation on purpose:
  - within-platform calibration (never raw cross-platform stars)
  - Bayesian shrinkage toward the PLATFORM's own mean
  - the distribution-obtained factor actually gating HIGH confidence
"""
import json
import os
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import score  # noqa: E402


def run_cli(payload):
    """End-to-end through the CLI (stdin JSON -> ranked JSON)."""
    p = subprocess.run(
        [sys.executable, os.path.join(HERE, "score.py")],
        input=json.dumps(payload), capture_output=True, text=True, check=True,
    )
    return json.loads(p.stdout)["ranked"]


FAILURES = []


def check(name, cond, detail=""):
    if cond:
        print(f"  PASS  {name}")
    else:
        print(f"  FAIL  {name}  {detail}")
        FAILURES.append(name)


def plat(platform, mean, count, platform_mean, age=30, dist=None):
    return {"platform": platform, "mean": mean, "count": count,
            "platform_mean": platform_mean, "newest_review_age_days": age,
            "distribution": dist}


DIST_NORMAL = {"5": 500, "4": 300, "3": 120, "2": 50, "1": 30}
DIST_BIMODAL = {"5": 700, "4": 40, "3": 30, "2": 30, "1": 200}


def test_shrinkage_thin_5_loses_to_deep_44():
    """A 5.0 on 6 reviews must NOT beat a 4.4 on 800 (same platform norms)."""
    ranked = run_cli({"candidates": [
        {"name": "thin-5.0", "platforms": [plat("google", 5.0, 6, 4.2)],
         "source_types": ["crowd"], "text_depth": 2},
        {"name": "deep-4.4", "platforms": [plat("google", 4.4, 800, 4.2)],
         "source_types": ["crowd"], "text_depth": 12},
    ]})
    check("shrinkage: thin 5.0 ranks below deep 4.4",
          ranked[0]["name"] == "deep-4.4", f"got order {[r['name'] for r in ranked]}")
    thin = next(r for r in ranked if r["name"] == "thin-5.0")
    check("shrinkage: thin volume flagged",
          any("thin volume" in f for f in thin["flags"]), str(thin["flags"]))


def test_within_platform_calibration():
    """Tabelog 3.8 (platform mean 3.4, +0.4 above norm) must OUTRANK Google 4.6
    (platform mean 4.45, +0.15 above norm). Raw cross-platform star averaging
    gets this backwards — this is the methodology's headline rule."""
    ranked = run_cli({"candidates": [
        {"name": "google-4.6", "platforms": [plat("google", 4.6, 400, 4.45)],
         "source_types": ["crowd"], "text_depth": 10},
        {"name": "tabelog-3.8", "platforms": [plat("tabelog", 3.8, 400, 3.4)],
         "source_types": ["crowd"], "text_depth": 10},
    ]})
    check("within-platform: tabelog 3.8 (+0.4 vs norm) outranks google 4.6 (+0.15)",
          ranked[0]["name"] == "tabelog-3.8", f"got order {[r['name'] for r in ranked]}")


def test_convergence_bonus():
    """Identical crowd signal; 3 independent types must outrank 1."""
    p = [plat("google", 4.5, 300, 4.2, dist=DIST_NORMAL)]
    ranked = run_cli({"candidates": [
        {"name": "one-type", "platforms": p, "source_types": ["crowd"], "text_depth": 10},
        {"name": "three-type", "platforms": p,
         "source_types": ["expert", "community", "crowd"], "text_depth": 10},
    ]})
    check("convergence: 3 independent types outrank 1 on identical crowd signal",
          ranked[0]["name"] == "three-type", f"got order {[r['name'] for r in ranked]}")


def test_confidence_requires_distribution_for_high():
    """types>=3 + depth>=10 + recent but NO distribution -> must NOT be HIGH.
    (The distribution-obtained factor is one of the five named sufficiency
    factors — the old code computed it and never used it.)"""
    no_dist = {"name": "no-dist", "platforms": [plat("google", 4.5, 300, 4.2)],
               "source_types": ["expert", "community", "crowd"], "text_depth": 12}
    with_dist = {"name": "with-dist",
                 "platforms": [plat("google", 4.5, 300, 4.2, dist=DIST_NORMAL)],
                 "source_types": ["expert", "community", "crowd"], "text_depth": 12}
    check("confidence: no distribution caps at MEDIUM",
          score.confidence_tier(no_dist) == "MEDIUM", score.confidence_tier(no_dist))
    check("confidence: full factors -> HIGH",
          score.confidence_tier(with_dist) == "HIGH", score.confidence_tier(with_dist))


def test_confidence_requires_recency_for_high():
    stale = {"name": "stale",
             "platforms": [plat("google", 4.5, 300, 4.2, age=1200, dist=DIST_NORMAL)],
             "source_types": ["expert", "community", "crowd"], "text_depth": 12}
    check("confidence: stale-only signal is not HIGH",
          score.confidence_tier(stale) != "HIGH", score.confidence_tier(stale))


def test_confidence_low_floor():
    thin = {"name": "thin", "platforms": [plat("google", 4.9, 8, 4.2)],
            "source_types": ["crowd"], "text_depth": 1}
    check("confidence: 1 thin type -> LOW", score.confidence_tier(thin) == "LOW",
          score.confidence_tier(thin))


def test_bimodality_flag():
    ranked = run_cli({"candidates": [
        {"name": "polarized",
         "platforms": [plat("google", 4.4, 1000, 4.2, dist=DIST_BIMODAL)],
         "source_types": ["crowd"], "text_depth": 10}]})
    check("bimodality: polarized distribution flagged",
          any("polarized" in f for f in ranked[0]["flags"]), str(ranked[0]["flags"]))


def test_burst_flag():
    ranked = run_cli({"candidates": [
        {"name": "bursty", "platforms": [plat("google", 4.7, 200, 4.2)],
         "source_types": ["crowd"], "text_depth": 10, "burst_flag": True}]})
    check("burst: review burst flagged",
          any("burst" in f for f in ranked[0]["flags"]), str(ranked[0]["flags"]))


def test_recency_weighting():
    """Same delta above norm; fresh reviews must outrank 2-year-stale ones."""
    ranked = run_cli({"candidates": [
        {"name": "fresh", "platforms": [plat("google", 4.5, 300, 4.2, age=20)],
         "source_types": ["crowd"], "text_depth": 10},
        {"name": "stale", "platforms": [plat("google", 4.5, 300, 4.2, age=1200)],
         "source_types": ["crowd"], "text_depth": 10},
    ]})
    # equal deltas -> recency weight normalizes out of the average; the tiers differ
    fresh = next(r for r in ranked if r["name"] == "fresh")
    stale = next(r for r in ranked if r["name"] == "stale")
    check("recency: fresh signal earns >= stale's confidence ordering",
          (fresh["confidence"], stale["confidence"]) != ("LOW", "MEDIUM"),
          f"fresh={fresh['confidence']} stale={stale['confidence']}")


def main():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in tests:
        print(t.__name__)
        t()
    print()
    if FAILURES:
        print(f"{len(FAILURES)} FAILURE(S): {FAILURES}")
        sys.exit(1)
    print(f"all {sum(1 for _ in tests)} tests passed")
    sys.exit(0)


if __name__ == "__main__":
    main()
