# best-finder

A Claude **skill** that finds genuinely *best* restaurants / stays / experiences and helps
plan trips — defeating rating inflation via **agreement across structurally independent
sources** (expert/editorial + niche-community + a de-biased crowd score). Guided
option-menus at every step, a destination-strategy layer, painted-picture output, and
continuous needs-capture.

## Layout

```
best-finder/                     ← canonical source (in the claude-skills repo, git-tracked)
├── SKILL.md
├── references/                  (methodology, strategy, data-sources, output-style)
├── agents/                      (source-readers, strategy-researcher, verifier)
├── scripts/score.py             (deterministic scoring engine)
├── build-chat-zip.py            (builds the claude.ai upload artifact)
└── dist/best-finder.zip         (build output — gitignored)
```

## Use in Claude Code

Exposed as a personal skill via a symlink (same pattern as the ei-* skills):

```bash
ln -s "$PWD/best-finder" ~/.claude/skills/best-finder
```

Edit the skill in place — changes are picked up on the next session. Persistent state lives
in `~/.claude/best-finder/` (`USER-PROFILE.md` + `trips/`) and is intentionally **not** part
of this repo.

## Use in claude.ai chat

claude.ai accepts the same SKILL.md format. Build/refresh the uploadable zip (it rewrites the
state path to be sandbox-safe):

```bash
python3 build-chat-zip.py     # writes dist/best-finder.zip
```

Then in claude.ai: **Settings → Capabilities → Skills → upload** `dist/best-finder.zip`.
In the chat sandbox, state (`./best-finder-state/`) persists only within a
conversation/project — re-upload or paste your `USER-PROFILE.md` to resume.

## Conductor + subagents

best-finder runs as a conductor (the main thread — owns all interaction and the only writer
of persistent state) that dispatches read/verify subagents:
`agents/source-readers.md` (parallel discovery), `agents/strategy-researcher.md` (Phase-2A
regional consensus), `agents/verifier.md` (blind adversarial finalist check). Dispatch is
stakes-scaled (see SKILL.md Phase 3). The conductor runs an always-on Phase 3.5 verification
gate (URLs resolve, scores trace, ≥2 independent types) before scoring — relaying ≠ verifying.
