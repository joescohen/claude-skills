#!/usr/bin/env python3
"""Inject per-pick photo galleries + the shared lightbox into a best-finder HTML deliverable.

Idempotent: ensures the gallery CSS once, (re)inserts each pick's placeholder as the last child INSIDE
its .scorebox, and (re)builds the <script id="gallery-data"> data block. Reads photos from
<photos_dir>/<key>/*.jpg, downscales + base64-embeds (<=maxN/pick) so the base64 never enters the
calling agent's context.

Usage:  python3 gallery_inject.py <config.json> <photos_dir> [maxN]
config.json: { "<abs-or-rel path to .html>": [ {"key","title","anchor"}, ... ], ... }
  - key:    propkey slug, also the photos subdir name (e.g. "laleccia")
  - title:  display name shown in the lightbox caption (e.g. "Castello La Leccia")
  - anchor: a unique substring in that pick's card, used to locate its scorebox
            (e.g. "<h3>Castello La Leccia</h3>")
  - source (optional): caption source tag for that pick's photos (default "Google")
"""
import os, io, re, json, base64, sys
from PIL import Image, ImageOps

MAXEDGE, QUALITY = 1100, 72

CSS = """
  /* ===== in-card photo gallery ===== */
  .gallery{margin-top:14px}
  .gallery .gtitle{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted,#7a6f63);
    margin:0 0 7px;display:flex;align-items:baseline;gap:7px}
  .gallery .gmore{font-size:11.5px;color:var(--terra,#b5532a);letter-spacing:0;text-transform:none}
  .gallery .ggrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
  .gallery button.gthumb{grid-column:span 1;padding:0;border:1px solid var(--line,#e7ddcd);border-radius:9px;
    overflow:hidden;cursor:pointer;background:#1c1712;aspect-ratio:3/2;display:block;width:100%;
    box-shadow:0 1px 2px rgba(43,36,32,.08)}
  .gallery button.gthumb.hero{grid-column:1 / -1;aspect-ratio:16/9;position:relative}
  .gallery button.gthumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
  .gallery button.gthumb:hover img{transform:scale(1.04)}
  .gallery button.gthumb:focus-visible{outline:2px solid var(--terra,#b5532a);outline-offset:2px}
  .gallery .gcount{position:absolute;bottom:8px;right:8px;background:rgba(20,16,12,.72);color:#fff;
    font-size:12px;letter-spacing:.02em;padding:3px 10px;border-radius:999px;pointer-events:none}
  /* ===== shared lightbox ===== */
  .lb{position:fixed;inset:0;background:rgba(22,17,12,.93);z-index:9999;display:none;
    align-items:center;justify-content:center;flex-direction:column;padding:20px}
  .lb.open{display:flex}
  .lb .lbstage{max-width:94vw;max-height:80vh;display:flex;align-items:center;justify-content:center}
  .lb img{max-width:94vw;max-height:80vh;border-radius:6px;box-shadow:0 12px 48px rgba(0,0,0,.55)}
  .lb .lbcap{color:#efe5d6;margin-top:16px;font-size:14px;line-height:1.5;text-align:center;max-width:760px}
  .lb .lbcap .t{font-family:Georgia,serif;color:#fff;font-size:16px}
  .lb .lbcount{color:#c9bdab;font-variant-numeric:tabular-nums;margin-left:8px}
  .lb .lbsrc{display:inline-block;margin-left:8px;font-size:11.5px;border:1px solid rgba(255,255,255,.3);
    border-radius:999px;padding:1px 9px;color:#ece1cd;vertical-align:middle}
  .lb a.lbsrc{text-decoration:none;cursor:pointer;transition:background .15s}
  .lb a.lbsrc:hover{background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.5)}
  .lb button.lbx,.lb button.lbnav{position:absolute;background:rgba(255,255,255,.1);
    border:1px solid rgba(255,255,255,.28);color:#fff;cursor:pointer;border-radius:999px;line-height:1;
    display:flex;align-items:center;justify-content:center}
  .lb button.lbx{top:18px;right:20px;width:44px;height:44px;font-size:19px}
  .lb button.lbnav{top:50%;transform:translateY(-50%);width:52px;height:52px;font-size:30px;padding-bottom:4px}
  .lb button.prev{left:max(14px,2vw)} .lb button.next{right:max(14px,2vw)}
  .lb button:hover{background:rgba(255,255,255,.22)}
  @media(max-width:700px){.lb button.lbnav{width:44px;height:44px;font-size:24px}.lb img{max-height:68vh}}
"""

JS_TMPL = """
<script id="gallery-data">
window.GALLERY = __GALLERY__;
window.GALLERY_TITLES = __TITLES__;
window.GALLERY_PLACES = __PLACES__;
(function () {
  var G = window.GALLERY, T = window.GALLERY_TITLES, P = window.GALLERY_PLACES || {};
  document.querySelectorAll('.gallery[data-gallery]').forEach(function (g) {
    var key = g.getAttribute('data-gallery'), photos = G[key];
    if (!photos || !photos.length) return;
    var p0 = photos[0];
    var h = '<div class="gtitle">\\u{1F4F7} Photos <span class="gmore">' + photos.length +
            ' \\u00b7 click to expand</span></div>' +
            '<button type="button" class="gthumb hero" data-key="' + key + '" data-i="0" ' +
            'aria-label="Open photo gallery, ' + photos.length + ' photos">' +
            '<img loading="lazy" src="' + p0.src + '" alt="' + (p0.alt || '').replace(/"/g, '&quot;') + '">' +
            (photos.length > 1 ? '<span class="gcount">\\u25A6 ' + photos.length + '</span>' : '') +
            '</button>';
    g.innerHTML = h;
  });
  var lb = document.createElement('div');
  lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  lb.innerHTML =
    '<button type="button" class="lbx" aria-label="Close (Esc)">\\u2715</button>' +
    '<button type="button" class="lbnav prev" aria-label="Previous">\\u2039</button>' +
    '<div class="lbstage"><img alt=""></div>' +
    '<button type="button" class="lbnav next" aria-label="Next">\\u203a</button>' +
    '<div class="lbcap"></div>';
  document.body.appendChild(lb);
  var img = lb.querySelector('img'), cap = lb.querySelector('.lbcap');
  var cur = [], title = '', place = '', idx = 0;
  function show() {
    var p = cur[idx];
    img.src = p.src; img.alt = p.alt || '';
    var srcChip = place
      ? '<a class="lbsrc" href="' + place + '" target="_blank" rel="noopener">' + p.source + ' Maps \\u2197</a>'
      : '<span class="lbsrc">' + p.source + '</span>';
    var photoChip = p.link
      ? '<a class="lbsrc" href="' + p.link + '" target="_blank" rel="noopener">this photo \\u2197</a>' : '';
    cap.innerHTML = '<span class="t">' + title + '</span>' +
      '<span class="lbcount">' + (idx + 1) + ' / ' + cur.length + '</span>' +
      srcChip + photoChip + (p.alt ? '<br>' + p.alt : '');
  }
  function open(key, i) { cur = G[key]; title = T[key] || ''; place = P[key] || ''; idx = i; lb.classList.add('open'); show(); }
  function close() { lb.classList.remove('open'); img.removeAttribute('src'); }
  function nav(d) { idx = (idx + d + cur.length) % cur.length; show(); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.gthumb');
    if (b) { open(b.getAttribute('data-key'), +b.getAttribute('data-i')); }
  });
  lb.querySelector('.lbx').addEventListener('click', close);
  lb.querySelector('.prev').addEventListener('click', function () { nav(-1); });
  lb.querySelector('.next').addEventListener('click', function () { nav(1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.className === 'lbstage') close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') nav(-1);
    else if (e.key === 'ArrowRight') nav(1);
  });
})();
</script>
"""

def encode(path):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    im.thumbnail((MAXEDGE, MAXEDGE), Image.LANCZOS)
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    return "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode(), len(buf.getvalue())

def matching_div_end(html, start):
    """Index just past the </div> that closes the <div> beginning at `start`."""
    depth = 0
    for m in re.finditer(r"<div\b|</div>", html[start:]):
        if m.group() == "</div>":
            depth -= 1
            if depth == 0:
                return start + m.end()
        else:
            depth += 1
    raise ValueError("unbalanced divs")

def process(path, picks, photos_base, maxn):
    with open(path, encoding="utf-8") as f:
        html = f.read()

    # 0) cleanup prior runs (idempotent regardless of earlier placement)
    html = re.sub(r'\s*<div class="gallery" data-gallery="[^"]*"></div>', "", html)
    html = re.sub(r'\n?<script id="gallery-data">.*?</script>\n?', "\n", html, flags=re.DOTALL)

    # 1) CSS once
    if "in-card photo gallery" not in html:
        html = html.replace("</style>", CSS + "</style>", 1)

    # 2) placeholder per pick — last child INSIDE the scorebox (right rail, structure-independent)
    for pk in picks:
        key, anchor = pk["key"], pk["anchor"]
        ai = html.find(anchor)
        if ai < 0:
            print(f"  !! anchor not found for {key}: {anchor}"); continue
        sb = html.find('<div class="scorebox"', ai)
        if sb < 0:
            print(f"  !! scorebox not found after {key}"); continue
        close = matching_div_end(html, sb) - len("</div>")
        ins = f'\n            <div class="gallery" data-gallery="{key}"></div>\n          '
        html = html[:close] + ins + html[close:]

    # 3) (re)build data script from photos on disk
    gallery, titles, places, tot = {}, {}, {}, 0
    for pk in picks:
        key = pk["key"]
        d = os.path.join(photos_base, key)
        files = sorted(f for f in os.listdir(d) if f.endswith(".jpg")) if os.path.isdir(d) else []
        files = files[:maxn]
        if not files:
            print(f"  !! no photos for {key}"); continue
        titles[key] = pk.get("title", key)
        places[key] = pk.get("placeUrl", "")          # place listing link for "verify correct place"
        src = pk.get("source", "Google")
        srcmap = {}
        sj = os.path.join(d, "sources.json")
        if os.path.exists(sj):
            srcmap = json.load(open(sj))              # {filename: source-image-url}
        arr = []
        for fn in files:
            uri, n = encode(os.path.join(d, fn))
            arr.append({"src": uri, "alt": pk.get("alt", ""), "source": src, "link": srcmap.get(fn, "")})
            tot += n
        gallery[key] = arr
        print(f"  {key:16s} {len(arr)} photos" + ("" if places[key] else "  (no placeUrl)"))
    script = (JS_TMPL.replace("__GALLERY__", json.dumps(gallery))
                     .replace("__TITLES__", json.dumps(titles))
                     .replace("__PLACES__", json.dumps(places)))
    html = html.replace("</body>", script + "\n</body>", 1)

    with open(path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"  -> {os.path.basename(path)}: {sum(len(v) for v in gallery.values())} photos, "
          f"{tot//1024} KB embedded, file {os.path.getsize(path)//1024} KB")

def main():
    cfg = json.load(open(sys.argv[1]))
    photos_base = os.path.abspath(sys.argv[2])
    maxn = int(sys.argv[3]) if len(sys.argv) > 3 else 10
    for path, picks in cfg.items():
        print(f"### {path}")
        process(os.path.abspath(path), picks, photos_base, maxn)

if __name__ == "__main__":
    main()
