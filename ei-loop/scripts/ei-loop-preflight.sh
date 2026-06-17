#!/usr/bin/env bash
# ei-loop preflight — enforce single-run isolation + a dedicated worktree.
#
# Collision cause this prevents: two ei-loop runs (e.g. two Claude sessions)
# targeting the same repo edited the same worktree/branch/STATE.md at once and
# corrupted each other. This makes that impossible: an atomic repo-scoped lock
# refuses a second concurrent run, and each run gets its own git worktree.
#
# Usage (run with cwd = the TARGET repo, or pass it as $2):
#   ei-loop-preflight.sh acquire   <repo> <slug>   # exit 0 + prints WORKTREE=...; exit 3 if another live run holds the lock
#   ei-loop-preflight.sh heartbeat <repo> <slug>   # refresh liveness; call once at the start of every invocation
#   ei-loop-preflight.sh release   <repo> <slug>   # drop the lock; call at the terminal stop (RUN_CLOSED / abort)
#
# Lock lives in the shared git common-dir so it is visible to ALL worktrees and
# checkouts of the repo. Staleness is heartbeat-based (default 30 min) so a
# crashed run cannot wedge the lock forever.
set -euo pipefail

cmd="${1:-}"; repo="${2:-$PWD}"; slug="${3:-default}"
TTL="${EI_LOOP_LOCK_TTL:-1800}"            # seconds; steal a lock whose heartbeat is older than this
WT_BASE="${EI_LOOP_WORKTREE_BASE:-/tmp/ei-loop}"

cd "$repo" 2>/dev/null || { echo "ERR: no such repo dir: $repo" >&2; exit 2; }
common_git="$(git rev-parse --git-common-dir 2>/dev/null)" || { echo "ERR: not a git repo: $repo" >&2; exit 2; }
case "$common_git" in /*) ;; *) common_git="$(cd "$common_git" && pwd)";; esac
lockdir="$common_git/ei-loop-${slug}.lock"
wt="$WT_BASE/$(basename "$(pwd)")-$slug"
branch="ei-loop/$slug"

heartbeat_age() {                          # seconds since the lock's heartbeat (or huge if none)
  local hb="$lockdir/heartbeat" m
  [ -f "$hb" ] || { echo 999999; return; }
  # Portable mtime: GNU `stat -c %Y`, then BSD/macOS `stat -f %m`, else treat as stale.
  m="$(stat -c %Y "$hb" 2>/dev/null || stat -f %m "$hb" 2>/dev/null || echo 0)"
  echo $(( $(date +%s) - m ))
}

case "$cmd" in
  acquire)
    # Steal a stale lock (holder crashed: heartbeat older than TTL).
    if [ -d "$lockdir" ] && [ "$(heartbeat_age)" -gt "$TTL" ]; then
      echo "NOTE: stealing stale lock (heartbeat $(heartbeat_age)s > ${TTL}s)" >&2
      rm -rf "$lockdir"
    fi
    # Atomic gate: mkdir succeeds for exactly one racer.
    if ! mkdir "$lockdir" 2>/dev/null; then
      echo "REFUSED: another ei-loop run holds the lock for slug='$slug' on this repo." >&2
      echo "  lock:      $lockdir" >&2
      echo "  worktree:  $(cat "$lockdir/worktree" 2>/dev/null || echo '?')" >&2
      echo "  heartbeat: $(heartbeat_age)s ago (TTL ${TTL}s)" >&2
      echo "  -> do NOT run a second ei-loop on the same target. Wait for it, or release a dead lock with: $0 release '$repo' '$slug'" >&2
      exit 3
    fi
    date -u +%FT%TZ > "$lockdir/acquired_at"
    echo "$wt" > "$lockdir/worktree"
    : > "$lockdir/heartbeat"
    # Create the dedicated worktree if it isn't already registered.
    if ! git worktree list --porcelain 2>/dev/null | grep -qxF "worktree $wt"; then
      mkdir -p "$WT_BASE"
      if git show-ref --verify --quiet "refs/heads/$branch"; then
        git worktree add "$wt" "$branch" >&2
      else
        git worktree add "$wt" -b "$branch" >&2
      fi
    fi
    echo "WORKTREE=$wt"
    echo "BRANCH=$branch"
    echo "LOCK=$lockdir"
    ;;
  heartbeat)
    [ -d "$lockdir" ] && { : > "$lockdir/heartbeat"; echo "HEARTBEAT $lockdir"; } || { echo "WARN: no lock to heartbeat ($lockdir)" >&2; exit 1; }
    ;;
  release)
    rm -rf "$lockdir" && echo "RELEASED $lockdir" || true
    ;;
  *)
    echo "usage: $0 acquire|heartbeat|release <repo> <slug>" >&2; exit 2 ;;
esac
