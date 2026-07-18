#!/usr/bin/env python3
"""
validate_deliverable.py — structural ratchet for the best-finder full-picture HTML page.

Turns the NON-NEGOTIABLE prose rules in references/output-style.md +
references/gallery-lightbox.md into an executable gate the conductor runs
BEFORE SendUserFile. Pure stdlib.

Usage:
    python3 validate_deliverable.py <page.html>     # exit 0 = pass, 1 = failures
    python3 validate_deliverable.py --selftest      # prove the gate can fail

Checks (FAIL = ship-blocking, WARN = surface but don't block):
  path      FAIL  page lives under the pinned deliverable base (runs/<trip-id>/)
  order     FAIL  picks (.card) appear BEFORE the supporting "why" sections
  cards     FAIL  every .card has .prop-h + .hsplit + .story + .scorebox
  gallery   FAIL  every .scorebox contains a .gallery[data-gallery] placeholder,
                  and a <script id="gallery-data"> block exists
  hotlink   FAIL  no <img src="http…"> — images must be base64 data URIs
  boiler    FAIL  the shared boilerplate is present (:root palette, lightbox CSS)
  toc       WARN  a jump-nav/TOC (in-page anchors) exists near the top
  evidence  WARN  an evidence/sources section exists
Scope: the FULL-PICTURE page only. The Phase-2 arc-board is exempt (validated
by eye — it has no pick cards); skip it or pass --arc-board to no-op.
"""
import os
import re
import sys
from html.parser import HTMLParser

PINNED_BASE = os.path.expanduser("~/Engineering/projects/best-options-research/runs")


class Structure(HTMLParser):
    """Track div class nesting to verify .gallery lives INSIDE .scorebox."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []          # class-list per open div
        self.cards = 0           # PICK cards (a .card containing .prop-h);
        #                          bare .card prose boxes are legal and ignored
        self.card_missing = []   # (card#, missing-class)
        self.scoreboxes = 0
        self.galleries_in_scorebox = 0
        self.galleries_total = 0
        self.first_card_pos = None
        self._card_depth = None
        self._card_pos = None
        self._card_classes = set()
        self._pos = 0

    def feed_with_pos(self, html):
        # crude char-position tracking: feed line by line
        for line in html.splitlines(keepends=True):
            self.feed(line)
            self._pos += len(line)

    def handle_starttag(self, tag, attrs):
        if tag != "div":
            return
        cls = set((dict(attrs).get("class") or "").split())
        self.stack.append(cls)
        if "card" in cls:
            self._card_depth = len(self.stack)
            self._card_pos = self._pos
            self._card_classes = set()
        if self._card_depth is not None and len(self.stack) > self._card_depth:
            self._card_classes |= cls
        if "scorebox" in cls:
            self.scoreboxes += 1
        if "gallery" in cls and "data-gallery" in dict(attrs):
            self.galleries_total += 1
            if any("scorebox" in c for c in self.stack[:-1]):
                self.galleries_in_scorebox += 1

    def handle_endtag(self, tag):
        if tag != "div" or not self.stack:
            return
        self.stack.pop()
        if self._card_depth is not None and len(self.stack) < self._card_depth:
            # the card just closed. Only a card carrying .prop-h is a PICK card
            # (prose/info boxes legitimately reuse .card without the skeleton).
            if "prop-h" in self._card_classes:
                self.cards += 1
                if self.first_card_pos is None:
                    self.first_card_pos = self._card_pos
                for req in ("hsplit", "story", "scorebox"):
                    if req not in self._card_classes:
                        self.card_missing.append((self.cards, req))
            self._card_depth = None


def validate(path, html=None):
    findings = []  # (level, code, message)

    def fail(code, msg):
        findings.append(("FAIL", code, msg))

    def warn(code, msg):
        findings.append(("WARN", code, msg))

    if html is None:
        real = os.path.realpath(os.path.expanduser(path))
        if not real.startswith(os.path.realpath(PINNED_BASE) + os.sep):
            fail("path", f"page is NOT under the pinned base {PINNED_BASE}/<trip-id>/ — got {real}")
        try:
            html = open(real, encoding="utf-8").read()
        except OSError as e:
            fail("path", f"cannot read {path}: {e}")
            return findings

    s = Structure()
    s.feed_with_pos(html)

    # cards + skeleton
    if s.cards == 0:
        fail("cards", "no pick cards found (a pick card = .card containing .prop-h) — "
             "not a full-picture page, or wrong skeleton")
    for n, req in s.card_missing:
        fail("cards", f"pick card #{n} is missing required .{req}")

    # gallery placement + data block
    if s.scoreboxes and s.galleries_in_scorebox < s.scoreboxes:
        fail("gallery", f"only {s.galleries_in_scorebox}/{s.scoreboxes} scoreboxes contain a "
             ".gallery[data-gallery] placeholder (required on EVERY pick card)")
    if s.cards and 'id="gallery-data"' not in html:
        fail("gallery", 'missing <script id="gallery-data"> block (galleries will render empty)')

    # ordering: answer first — first pick card must precede the supporting "why"
    why_markers = ["how i scored", "evidence base", "how it all came together",
                   "what you should be looking for"]
    low = html.lower()
    for m in why_markers:
        i = low.find(m)
        if i != -1 and s.first_card_pos is not None and i < s.first_card_pos:
            fail("order", f'supporting section "{m}" appears BEFORE the first pick card — '
                 "the answer must lead the page")

    # hotlinked images (never hot-link; broken images cheapen it)
    hot = re.findall(r'<img[^>]+src="(https?://[^"]{0,80})', html)
    if hot:
        fail("hotlink", f"{len(hot)} <img> hotlink(s) found (must be base64 data URIs), "
             f"e.g. {hot[0]}…")

    # shared boilerplate
    if ":root{" not in html.replace(" ", "") and ":root {" not in html:
        fail("boiler", "missing :root palette vars (shared boilerplate not included)")
    if s.cards and ".lb{" not in html.replace(" ", ""):
        fail("boiler", "missing lightbox CSS (.lb) — the shared lightbox boilerplate is required")

    # softer checks
    if not re.search(r'href="#[^"]+"', html[:6000]):
        warn("toc", "no jump-nav/TOC anchors found near the top of the page")
    if "evidence" not in low:
        warn("evidence", "no evidence/sources section found — sourcing is the thesis")

    return findings


GOOD = """<!doctype html><html><head><style>:root{--terra:#a55;--line:#eee;--muted:#888}
.lb{position:fixed}</style></head><body>
<nav><a href="#picks">Picks</a></nav>
<div class="card"><div class="rank">★ lead</div><div class="prop-h"><h3>Casa Test</h3></div>
<div class="meta">town · 10 min</div><div class="hsplit"><div class="story">vibe…</div>
<div><div class="scorebox"><h4>Calibrated signal</h4>
<div class="gallery" data-gallery="casatest"></div></div></div></div></div>
<h2>Evidence base</h2><p>sources…</p>
<script id="gallery-data">window.GALLERY={"casatest":[{"src":"data:image/jpeg;base64,xx"}]}</script>
</body></html>"""


def selftest():
    ok = True

    def expect(name, html, code, should_fail):
        nonlocal ok
        f = validate("<mem>", html=html)
        hit = any(c == code and lvl == "FAIL" for lvl, c, _ in f)
        good = hit if should_fail else not hit
        print(f"  {'PASS' if good else 'FAIL'}  {name}")
        ok &= good

    expect("good page passes gallery/cards/order/hotlink", GOOD, "gallery", False)
    expect("good page passes cards", GOOD, "cards", False)
    expect("missing gallery placeholder is caught",
           GOOD.replace('<div class="gallery" data-gallery="casatest"></div>', ""),
           "gallery", True)
    expect("hotlinked img is caught",
           GOOD.replace("vibe…", '<img src="https://example.com/x.jpg">'), "hotlink", True)
    expect("why-before-picks ordering is caught",
           GOOD.replace('<nav>', '<h2>How I scored</h2><nav>'), "order", True)
    expect("missing card skeleton is caught",
           GOOD.replace('class="hsplit"', 'class="x"'), "cards", True)
    expect("missing lightbox boilerplate is caught",
           GOOD.replace(".lb{position:fixed}", ""), "boiler", True)
    print("selftest:", "ALL PASS" if ok else "FAILURES")
    sys.exit(0 if ok else 1)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(2)
    if sys.argv[1] == "--selftest":
        selftest()
    if sys.argv[1] == "--arc-board":
        print("arc-board is exempt from this gate")
        sys.exit(0)
    findings = validate(sys.argv[1])
    fails = [f for f in findings if f[0] == "FAIL"]
    for lvl, code, msg in findings:
        print(f"  {lvl}  [{code}] {msg}")
    if fails:
        print(f"\n{len(fails)} ship-blocking failure(s) — fix before SendUserFile.")
        sys.exit(1)
    print("\nPASS — structural gate satisfied.")
    sys.exit(0)


if __name__ == "__main__":
    main()
