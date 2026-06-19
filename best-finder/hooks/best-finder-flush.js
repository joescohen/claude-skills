#!/usr/bin/env node
/**
 * best-finder-flush.js — Stop hook.
 *
 * Final safety net for the best-finder continuous-capture protocol: at the end
 * of a TRAVEL session, force one verification pass that every preference /
 * itinerary change was actually written to the trip file + USER-PROFILE.md and
 * the "## Current Itinerary" section is current.
 *
 * SCOPING: only acts when best-finder-capture.js dropped a session marker this
 * session (i.e. a travel signal fired). Dev/CEI sessions leave no marker → this
 * hook no-ops, so it never nags or blocks unrelated work.
 *
 * LOOP-SAFE: honors `stop_hook_active` (set when the stop is already a hook
 * continuation) and deletes the marker before blocking, so it fires at most once.
 *
 * Fail-open: any error → exit 0, never blocks stopping.
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

function readStdin() {
  try { return fs.readFileSync(0, "utf8"); } catch { return ""; }
}

(function main() {
  let sessionId = "", stopActive = false;
  try {
    const raw = readStdin();
    if (raw) {
      const j = JSON.parse(raw);
      sessionId = (j && j.session_id) || "";
      stopActive = !!(j && j.stop_hook_active);
    }
  } catch { process.exit(0); }

  // Already continuing from a stop hook → let it stop cleanly (no loop).
  if (stopActive) process.exit(0);
  if (!sessionId) process.exit(0);

  const marker = path.join(os.tmpdir(), "best-finder-active-" + sessionId.replace(/[^\w.-]/g, "_"));
  let tripPath = "";
  try {
    tripPath = fs.readFileSync(marker, "utf8").trim();
  } catch { process.exit(0); } // no marker → not a travel session → stay silent

  // One-shot: remove the marker so we never block twice for this session.
  try { fs.unlinkSync(marker); } catch { /* ignore */ }

  const profile = path.join(os.homedir(), ".claude", "best-finder", "USER-PROFILE.md");
  const reason =
    "[BEST-FINDER:FLUSH] Travel session ending. Before you stop, verify the continuous-capture " +
    "protocol is satisfied:\n" +
    "1. Every preference / constraint / like-dislike / reaction the user expressed this session is " +
    "written (dated) to the active trip file: " + tripPath + ", and any durable/cross-trip ones are " +
    "promoted to " + profile + ".\n" +
    "2. The '## Current Itinerary' section of the trip file reflects the latest plan if it changed.\n" +
    "If everything is already captured, simply confirm and stop — do NOT redo work.";

  process.stdout.write(JSON.stringify({ decision: "block", reason }));
  process.exit(0);
})();
