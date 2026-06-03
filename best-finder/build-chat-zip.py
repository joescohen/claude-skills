#!/usr/bin/env python3
"""Build dist/best-finder.zip for upload to claude.ai (Settings -> Capabilities -> Skills).

The skill now lives alongside this script (canonical source in claude-skills/best-finder/).
This rewrites the persistent-state path to be sandbox-safe (claude.ai has no
~/.claude/best-finder), and zips the skill with the skill folder at the archive root.
Re-run after editing the skill to refresh the upload artifact.
"""
import os
import zipfile

REPO = os.path.dirname(os.path.abspath(__file__))   # claude-skills/best-finder/
OUT = os.path.join(REPO, "dist", "best-finder.zip")

# Only these are the skill; everything else in REPO (this script, README, dist/) is excluded.
SKILL_ROOT_FILES = ["SKILL.md"]
SKILL_DIRS = ["references", "agents", "scripts"]

# (anchor in SKILL.md, sandbox-safe replacement)
STATE_OLD = "State lives at `~/.claude/best-finder/` and SURVIVES across sessions:"
STATE_NEW = (
    "State lives in `./best-finder-state/` (the conversation's working directory). "
    "In claude.ai this persists *within* a conversation/project but does NOT carry across "
    "separate chats — re-upload or paste your `USER-PROFILE.md` to resume. "
    "(In Claude Code this skill instead uses `~/.claude/best-finder/`.):"
)


def patched_skill_md(path):
    with open(path, encoding="utf-8") as f:
        s = f.read()
    if STATE_OLD not in s:
        raise SystemExit(f"anchor line not found in {path}; update STATE_OLD")
    return s.replace(STATE_OLD, STATE_NEW)


def _add_file(z, full, arc):
    if os.path.basename(full) == "SKILL.md":
        z.writestr(arc, patched_skill_md(full))
    else:
        z.write(full, arc)


def main():
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
        for name in SKILL_ROOT_FILES:
            _add_file(z, os.path.join(REPO, name), os.path.join("best-finder", name))
        for d in SKILL_DIRS:
            src = os.path.join(REPO, d)
            for root, dirs, files in os.walk(src):
                dirs[:] = [x for x in dirs if x != "__pycache__"]
                for fn in files:
                    if fn.endswith(".pyc"):
                        continue
                    full = os.path.join(root, fn)
                    rel = os.path.relpath(full, REPO)
                    _add_file(z, full, os.path.join("best-finder", rel))
    print("wrote", OUT)


if __name__ == "__main__":
    main()
