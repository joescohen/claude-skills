#!/usr/bin/env node
/**
 * best-finder-capture.js — UserPromptSubmit hook.
 *
 * Reinforces the best-finder continuous-needs-capture protocol so it can't be
 * silently skipped: when the user's message carries travel / itinerary /
 * preference signals AND a best-finder trip is active, inject a short reminder
 * to (a) append stated preferences to the active trip file + promote durable
 * ones to USER-PROFILE.md, and (b) update the trip file's "## Current Itinerary"
 * section whenever an itinerary is pasted or changed.
 *
 * Stays QUIET (emits nothing) for non-travel prompts or when no trip exists, so
 * it does not nag during unrelated (CEI / app-dev / etc.) sessions.
 *
 * Fail-open: any error → exit 0 with no output (never blocks the prompt).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

function readStdin() {
  try { return fs.readFileSync(0, "utf8"); } catch { return ""; }
}

(function main() {
  let prompt = "";
  let sessionId = "";
  try {
    const raw = readStdin();
    if (raw) {
      const j = JSON.parse(raw);
      prompt = (j && (j.prompt || j.user_prompt || j.message)) || "";
      if (typeof prompt !== "string") prompt = JSON.stringify(prompt);
      sessionId = (j && j.session_id) || "";
    }
  } catch { /* fall through with empty prompt */ }

  if (!prompt || prompt.length < 3) process.exit(0);

  // --- scope gate 1: travel / preference signal in the prompt -------------
  const TRAVEL = /(itinerar|trip|trav(el|elling)|vacation|honeymoon|restaurant|where (to|should) (eat|stay)|hotel|airbnb|villa|castle|agriturismo|where.*stay|stay in|dinner|lunch|aperitivo|vineyard|winer|wine (tour|tasting)|cooking class|day[ -]?trip|\bday \d|michelin|tuscany|chianti|florence|firenze|siena|montepulciano|pienza|montalcino|cortona|monteriggioni|san gimignano|gaiole|radda|greve|castellina|amalfi|ravello|positano|rome|roma|italy|charleston|baltimore|\bdc\b|best[- ]finder|overrated|tourist[- ]?trap|hidden gem|low[- ]key|romantic|walkable|walk to)/i;
  const PREF = /(i (like|love|prefer|want|hate|don'?t|do not)|we (like|love|prefer|want|don'?t|do not)|i'?d rather|we'?d rather|my preference|our preference|favorite|favourite|not into|rather than|instead of|more like|too touristy|vibe)/i;
  if (!TRAVEL.test(prompt) && !PREF.test(prompt)) process.exit(0);

  // --- scope gate 2: an active best-finder trip must exist ----------------
  const tripsDir = path.join(os.homedir(), ".claude", "best-finder", "trips");
  let active = null;
  try {
    const files = fs.readdirSync(tripsDir)
      .filter(f => f.endsWith(".md"))
      .map(f => {
        const p = path.join(tripsDir, f);
        return { f, p, m: fs.statSync(p).mtimeMs };
      })
      .sort((a, b) => b.m - a.m);
    if (files.length) active = files[0];
  } catch { process.exit(0); } // no trips dir → not a best-finder context

  if (!active) process.exit(0);

  const profile = path.join(os.homedir(), ".claude", "best-finder", "USER-PROFILE.md");
  const ctx =
    "[BEST-FINDER:CAPTURE] A travel/preference signal was detected. Per the best-finder " +
    "continuous-needs-capture protocol, BEFORE finishing this turn:\n" +
    "1. If the user stated any preference, constraint, like/dislike, or reaction → append it " +
    "(dated, with the 'user said…' source) to the active trip file: " + active.p + ". " +
    "Promote anything durable/cross-trip to " + profile + ".\n" +
    "2. If the user pasted or changed their itinerary → update the '## Current Itinerary' " +
    "section of " + active.p + " (create it once if missing) so it always reflects the latest plan, " +
    "and note the change in the Change Log.\n" +
    "Only the conductor writes these files. Skip silently if the message has no real preference/itinerary content.";

  // Drop a session marker so the Stop flush hook knows THIS session is a
  // best-finder/travel session (and only acts on those — never on dev sessions).
  try {
    if (sessionId) {
      const marker = path.join(os.tmpdir(), "best-finder-active-" + sessionId.replace(/[^\w.-]/g, "_"));
      fs.writeFileSync(marker, active.p);
    }
  } catch { /* non-fatal */ }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: ctx }
  }));
  process.exit(0);
})();
