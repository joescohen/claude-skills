#!/usr/bin/env bash
# Focused lifecycle test for ei-loop-preflight.sh: acquire / refuse / steal / release.
# Exercises heartbeat_age() (the portable-stat fix) on the live platform.
# Run: bash ei-loop/scripts/ei-loop-preflight.test.sh   (exit 0 = pass)
set -uo pipefail

here="$(cd "$(dirname "$0")" && pwd)"
script="$here/ei-loop-preflight.sh"
tmp="$(mktemp -d)"
export EI_LOOP_WORKTREE_BASE="$tmp/wt"
slug="test-$$"
fails=0

cleanup() {
  git -C "$tmp/repo" worktree remove --force "$EI_LOOP_WORKTREE_BASE/repo-$slug" 2>/dev/null || true
  rm -rf "$tmp"
}
trap cleanup EXIT

check() { # check <desc> <expected-exit> <actual-exit>
  if [ "$2" = "$3" ]; then
    echo "ok   - $1"
  else
    echo "FAIL - $1 (expected exit $2, got $3)"; fails=$((fails+1))
  fi
}

# Set up a throwaway git repo with one commit.
mkdir -p "$tmp/repo"; cd "$tmp/repo"
git init -q; git config user.email t@t; git config user.name t
git commit -q --allow-empty -m init

# 1. First acquire succeeds.
bash "$script" acquire "$tmp/repo" "$slug" >/dev/null 2>&1; check "first acquire succeeds" 0 $?

# 2. Second acquire with a live lock is refused (exit 3).
bash "$script" acquire "$tmp/repo" "$slug" >/dev/null 2>&1; check "concurrent acquire refused" 3 $?

# 3. heartbeat refresh works.
bash "$script" heartbeat "$tmp/repo" "$slug" >/dev/null 2>&1; check "heartbeat refresh" 0 $?

# 4. When the heartbeat age exceeds the TTL, the stale lock is stolen → acquire
#    succeeds. TTL=-1 forces age(0) > TTL deterministically (no sleep needed) and
#    exercises heartbeat_age() — the portable-stat path this fix corrected.
EI_LOOP_LOCK_TTL=-1 bash "$script" acquire "$tmp/repo" "$slug" >/dev/null 2>&1; check "stale lock stolen (age > TTL)" 0 $?

# 5. Release drops the lock.
bash "$script" release "$tmp/repo" "$slug" >/dev/null 2>&1; check "release" 0 $?

# 6. After release a fresh acquire succeeds again.
bash "$script" acquire "$tmp/repo" "$slug" >/dev/null 2>&1; check "re-acquire after release" 0 $?

echo "---"
if [ "$fails" -eq 0 ]; then echo "PASS (6/6)"; exit 0; else echo "FAIL ($fails failing)"; exit 1; fi
