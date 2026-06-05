# Pick-card photo gallery + shared lightbox (reusable recipe)

Drop-in for the best-finder HTML deliverable. Puts a **single hero thumbnail** (with a "▦ N" count badge)
in each pick card's right rail (inside the calibrated-signal scorebox — the dead white space); clicking it
opens one shared, click-through, keyboard-navigable lightbox holding all N photos. The in-card footprint
is deliberately just the hero so the gallery never balloons the card past its story — all photos live in
the lightbox. Self-contained: images are base64 data URIs, JS is vanilla, no external deps. First verified
live on `runs/italy-2026/tuscany-castles-rerun.html` (2026-06).

**This is a DEFAULT, required part of every full-picture deliverable** (output-style.md §11), not an
opt-in. To keep pages structurally consistent, every pick card uses the canonical skeleton below and
every page ships the same boilerplate (palette + base CSS + gallery CSS + lightbox JS).

## Canonical pick-card skeleton (every pick card — lead and alternatives — uses THIS shape)
The `.scorebox` is always inside a right-rail wrapper `<div>`, and the `.gallery` placeholder is always
the **last child inside `.scorebox`**. This makes the gallery land in the right rail identically on every
card regardless of how tall the story column is.
```html
<div class="card">                              <!-- add class "win" for the lead pick -->
  <div class="rank">★ …the job this pick does…</div>
  <div class="prop-h"><h3>PROPERTY NAME</h3>
    <span><span class="badge b-high">VERIFIED</span> …caveat badges…</span></div>
  <div class="meta">area · distance · type · ~price — one line of orienting facts</div>
  <div class="hsplit">
    <div class="story">
      …painted picture (vibe + day-to-day incl. food/logistics) · .flag boxes · .galbtns links…
    </div>
    <div>                                        <!-- right-rail wrapper (ALWAYS present) -->
      <div class="scorebox">
        <h4>Calibrated signal</h4>
        …score .bar rows · .stat lines · .pill provenance chips…
        <div class="gallery" data-gallery="PROPKEY"></div>   <!-- REQUIRED · last child of .scorebox -->
      </div>
    </div>
  </div>
</div>
```
`.hsplit` is `grid-template-columns:1.45fr 1fr` (collapses to one column ≤700px). `PROPKEY` is a short
slug (e.g. `laleccia`) shared with `window.GALLERY` / `window.GALLERY_TITLES`.

## Fastest path: the two scripts in `scripts/`
You don't have to hand-wire any of this. After the page HTML exists with each pick card following the
canonical skeleton above (gallery placeholder optional — the injector adds/repairs it):
1. **Fetch** photos: map each pick's image URLs to `{propkey:[urls]}` (e.g. from Apify Google Places —
   see recipe below) and run `python3 scripts/gallery_fetch.py <photos_dir> 10 < urls.json`.
2. **Inject** galleries + lightbox: write a `config.json` of
   `{ "<page.html>": [{key,title,anchor,placeUrl}, …] }` and run
   `python3 scripts/gallery_inject.py config.json <photos_dir> 10`.
   - `anchor` = a unique substring of the pick's card, e.g. `"<h3>Castello La Leccia</h3>"`.
   - `placeUrl` (optional but recommended) = a link to the place so the user can **verify the photos are
     the right place** — e.g. the Apify item's `url` (a `google.com/maps/...&query_place_id=…` link). It
     becomes the clickable "Google Maps ↗" chip in the lightbox caption. Per-photo "this photo ↗" links
     come automatically from each key's `sources.json` (written by `gallery_fetch.py`).

`gallery_inject.py` is idempotent (safe to re-run): it ensures the CSS once, inserts each gallery
placeholder as the last child inside the matching `.scorebox`, and rebuilds the `<script id="gallery-data">`
data block — keeping the base64 out of your context. The sections below document what those scripts embed,
for hand-wiring or customization.

## How it wires together (what the scripts produce)
1. **CSS** → add the block below before `</style>`.
2. **Placeholder per pick** → add `<div class="gallery" data-gallery="<propkey>"></div>` (e.g.
   `laleccia`) as the **last child INSIDE the `.scorebox`** (right before its closing `</div>`). Insert
   it *inside* the scorebox rather than as a sibling after it — deliverables vary in whether the scorebox
   has a wrapping right-column `<div>`, and inside-scorebox lands in the right rail consistently either
   way. (A sibling-after-scorebox only renders in the rail when a wrapper exists.)
3. **Data + behavior** → a single `<script id="gallery-data">` before `</body>` defines
   `window.GALLERY` (per-propkey array of `{src,alt,source}` data-URIs) + `window.GALLERY_TITLES`
   (propkey → display name), then renders thumbnails into every `.gallery[data-gallery]` and wires the
   shared lightbox. Build this script with a small Python step so the ~1.5 MB of base64 never enters the
   agent's context (see "Fetch + embed recipe").

## CSS
```css
/* ===== in-card photo gallery ===== */
.gallery{margin-top:14px}
.gallery .gtitle{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);
  margin:0 0 7px;display:flex;align-items:baseline;gap:7px}
.gallery .gmore{font-size:11.5px;color:var(--terra);letter-spacing:0;text-transform:none}
.gallery .ggrid{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.gallery button.gthumb{grid-column:span 1;padding:0;border:1px solid var(--line);border-radius:9px;
  overflow:hidden;cursor:pointer;background:#1c1712;aspect-ratio:3/2;display:block;width:100%;
  box-shadow:0 1px 2px rgba(43,36,32,.08)}
.gallery button.gthumb.hero{grid-column:1 / -1;aspect-ratio:16/9;position:relative}
.gallery button.gthumb img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .4s ease}
.gallery button.gthumb:hover img{transform:scale(1.04)}
.gallery button.gthumb:focus-visible{outline:2px solid var(--terra);outline-offset:2px}
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
```
(Relies on the deliverable's existing `--terra`, `--line`, `--muted` palette vars.)

## Behavior JS (template — Python fills `__GALLERY__` / `__TITLES__`)
```html
<script id="gallery-data">
window.GALLERY = __GALLERY__;        /* {propkey:[{src:"data:image/jpeg;base64,...",alt,source,link},...]} */
window.GALLERY_TITLES = __TITLES__;  /* {propkey:"Castello La Leccia", ...} */
window.GALLERY_PLACES = __PLACES__;  /* {propkey:"https://www.google.com/maps/...place_id...", ...} — verify link */
(function () {
  var G = window.GALLERY, T = window.GALLERY_TITLES, P = window.GALLERY_PLACES || {};
  document.querySelectorAll('.gallery[data-gallery]').forEach(function (g) {
    var key = g.getAttribute('data-gallery'), photos = G[key];
    if (!photos || !photos.length) return;
    var p0 = photos[0];   // only the hero shows in-card; all N live in the lightbox
    var h = '<div class="gtitle">\u{1F4F7} Photos <span class="gmore">' + photos.length +
            ' · click to expand</span></div>' +
            '<button type="button" class="gthumb hero" data-key="' + key + '" data-i="0" ' +
            'aria-label="Open photo gallery, ' + photos.length + ' photos">' +
            '<img loading="lazy" src="' + p0.src + '" alt="' + (p0.alt || '').replace(/"/g, '&quot;') + '">' +
            (photos.length > 1 ? '<span class="gcount">▦ ' + photos.length + '</span>' : '') +
            '</button>';
    g.innerHTML = h;
  });
  var lb = document.createElement('div');
  lb.className = 'lb'; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-modal', 'true');
  lb.innerHTML =
    '<button type="button" class="lbx" aria-label="Close (Esc)">✕</button>' +
    '<button type="button" class="lbnav prev" aria-label="Previous">‹</button>' +
    '<div class="lbstage"><img alt=""></div>' +
    '<button type="button" class="lbnav next" aria-label="Next">›</button>' +
    '<div class="lbcap"></div>';
  document.body.appendChild(lb);
  var img = lb.querySelector('img'), cap = lb.querySelector('.lbcap');
  var cur = [], title = '', place = '', idx = 0;
  function show() {
    var p = cur[idx];
    img.src = p.src; img.alt = p.alt || '';
    var srcChip = place
      ? '<a class="lbsrc" href="' + place + '" target="_blank" rel="noopener">' + p.source + ' Maps ↗</a>'
      : '<span class="lbsrc">' + p.source + '</span>';
    var photoChip = p.link
      ? '<a class="lbsrc" href="' + p.link + '" target="_blank" rel="noopener">this photo ↗</a>' : '';
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
```

## Fetch + embed recipe (keeps base64 out of the agent's context)
1. **Find + verify URLs.** For Google places use Apify `compass/crawler-google-places` — one batched run
   with all picks in `searchStringsArray` (bake the city/area into each query so it disambiguates),
   `maxCrawledPlacesPerSearch:1`, `scrapePlaceDetailPage:true`, `maxImages:10` (up to ~10 photos/place
   for a few cents total). Each item returns `title` (verify it matches the pick) + `imageUrls` (direct
   `lh3.googleusercontent.com` URLs). The run's dataset needs the Apify token to fetch by API, but the
   MCP `get-dataset-items` returns the URLs to you directly — write them to a `{key:[urls]}` file and
   download with a UA header. Otherwise harvest from the property's official gallery via the connected
   browser (`document.querySelectorAll('img,source,[style*=background]')`, read `src`/`data-src`/`srcset`,
   strip query strings to `origin+pathname`); **confirm each image is the right property** — a contact
   sheet helps (thumbnail each candidate into one labeled PNG, eyeball it, pick hero/room/pool/food).
2. **Download** with `scripts/gallery_fetch.py <photos_dir> 10 < urls.json` (UA header, skips tiny/broken
   images, clears the per-key dir first so re-runs are clean). For official-site fallback URLs the same
   script works; note AVIF-derivative sites like `…/smush-avif/…/x.jpg.avif` keep the original JPEG under
   `…/uploads/…/x.jpg`.
3. **Resize + encode + inject** with `scripts/gallery_inject.py config.json <photos_dir> 10` — it
   `ImageOps.exif_transpose` + `.thumbnail((1100,1100))` + JPEG q72 progressive + base64, then rebuilds the
   `<script id="gallery-data">` and re-inserts placeholders. Idempotent; safe to re-run after editing the
   HTML or swapping photos. (Hand-wiring equivalent: build the script from the template above and
   `html.replace("</body>", script + "\n</body>", 1)`, guarding against double-inject.)

## Verify before claiming done (render proof, not markup presence)
Serve the file and open it in a *Tailscale-reachable* browser (the Mac, per `~/.claude/WSL.md`; bind the
server to the Tailscale IP, not `localhost`). Confirm via JS that `GALLERY` is an object, thumbnail count
== total photos, and `.gallery[data-gallery]` count == #picks; then click a hero thumb and screenshot to
confirm the lightbox opens, the caption shows "i / N" + source, next/prev advances, and Esc closes.
