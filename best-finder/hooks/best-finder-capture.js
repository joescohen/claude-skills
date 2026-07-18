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
 * SCOPE IS DERIVED FROM LIVE STATE, never hardcoded: place-name terms come from
 * the trip files in ~/.claude/best-finder/trips/ (filenames + first heading) at
 * runtime, so a new trip is covered the moment its file exists. Only generic
 * travel/preference vocabulary is static.
 *
 * Active-trip selection: a trip with `status: active` frontmatter wins; among
 * several actives (or none marked), newest mtime wins. `status: completed`
 * trips are excluded from both matching and selection.
 *
 * Stays QUIET (emits nothing) for non-travel prompts or when no active trip
 * exists, so it does not nag during unrelated (dev / app / etc.) sessions.
 *
 * Fail-open: any error → exit 0 with no output (never blocks the prompt).
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const STATE_DIR = path.join(os.homedir(), ".claude", "best-finder");
const TRIPS_DIR = path.join(STATE_DIR, "trips");
const MARKER_DIR = path.join(STATE_DIR, ".session-markers");

function readStdin() {
  try { return fs.readFileSync(0, "utf8"); } catch { return ""; }
}

/** Parse minimal frontmatter / heading info from a trip file's head. */
function tripMeta(p) {
  let head = "";
  try {
    const fd = fs.openSync(p, "r");
    const buf = Buffer.alloc(2048);
    const n = fs.readSync(fd, buf, 0, 2048, 0);
    fs.closeSync(fd);
    head = buf.toString("utf8", 0, n);
  } catch { /* leave empty */ }
  const status = (head.match(/^status:\s*(\S+)/m) || [])[1] || "";
  const h1 = (head.match(/^#\s+(.+)$/m) || [])[1] || "";
  return { status: status.toLowerCase(), h1 };
}

/** Escape a string for use inside a RegExp. */
function reEsc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

/**
 * Build the dynamic place-term list from live trip state:
 * filename tokens ("italy-2026" → "italy") + words from each trip's H1.
 */
function placeTermsFrom(trips) {
  const STOP = new Set(["trip", "needs", "the", "and", "for", "with", "doc",
    "living", "read", "at", "step", "append", "continuously", "2024", "2025",
    "2026", "2027", "2028"]);
  const terms = new Set();
  for (const t of trips) {
    for (const tok of path.basename(t.f, ".md").split(/[-_.]+/)) {
      if (tok.length >= 3 && !/^\d+$/.test(tok) && !STOP.has(tok.toLowerCase()))
        terms.add(tok.toLowerCase());
    }
    for (const tok of (t.meta.h1 || "").split(/[^\p{L}]+/u)) {
      if (tok.length >= 4 && !STOP.has(tok.toLowerCase()))
        terms.add(tok.toLowerCase());
    }
  }
  return [...terms];
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

  // --- load live trip state (also gate 2: no active trips → silent) -------
  let trips = [];
  try {
    trips = fs.readdirSync(TRIPS_DIR)
      .filter(f => f.endsWith(".md"))
      .map(f => {
        const p = path.join(TRIPS_DIR, f);
        return { f, p, m: fs.statSync(p).mtimeMs, meta: tripMeta(p) };
      })
      .filter(t => t.meta.status !== "completed" && t.meta.status !== "archived");
  } catch { process.exit(0); } // no trips dir → not a best-finder context
  if (!trips.length) process.exit(0);

  // --- scope gate 1: travel / preference signal in the prompt -------------
  // Generic travel vocabulary (static) …
  const TRAVEL = /(itinerar|trip\b|trav(el|elling)|vacation|honeymoon|restaurant|where (to|should) (eat|stay)|hotel|airbnb|villa|castle|agriturismo|where.*stay|stay in|dinner|lunch|aperitivo|vineyard|winer|wine (tour|tasting)|cooking class|day[ -]?trip|\bday \d|michelin|best[- ]finder|overrated|tourist[- ]?trap|hidden gem|low[- ]key|romantic|walkable|walk to|book(ed|ing)? (a|the)? ?(room|table|tour))/i;
  const PREF = /(i (like|love|prefer|want|hate|don'?t|do not)|we (like|love|prefer|want|don'?t|do not)|i'?d rather|we'?d rather|my preference|our preference|favorite|favourite|not into|rather than|instead of|more like|too touristy|vibe)/i;
  // … plus place terms DERIVED from the live trip files (never hardcoded).
  const placeTerms = placeTermsFrom(trips);
  const PLACES = placeTerms.length
    ? new RegExp("\\b(" + placeTerms.map(reEsc).join("|") + ")\\b", "i")
    : null;
  if (!TRAVEL.test(prompt) && !PREF.test(prompt) && !(PLACES && PLACES.test(prompt)))
    process.exit(0);

  // --- pick the active trip: explicit status wins, then newest mtime ------
  const actives = trips.filter(t => t.meta.status === "active");
  const pool = actives.length ? actives : trips;
  pool.sort((a, b) => b.m - a.m);
  const active = pool[0];

  const profile = path.join(STATE_DIR, "USER-PROFILE.md");
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
  // Markers live in state (not os.tmpdir(), which cleaners can empty mid-session).
  try {
    if (sessionId) {
      fs.mkdirSync(MARKER_DIR, { recursive: true });
      const marker = path.join(MARKER_DIR, sessionId.replace(/[^\w.-]/g, "_"));
      fs.writeFileSync(marker, active.p);
    }
  } catch { /* non-fatal */ }

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: "UserPromptSubmit", additionalContext: ctx }
  }));
  process.exit(0);
})();
