#!/usr/bin/env python3
"""Download per-pick image URLs into <photos_dir>/<key>/NN.jpg. Idempotent per key.

Usage:  python3 gallery_fetch.py <photos_dir> [maxN]   < urls.json
where urls.json is {"<propkey>": ["https://...", ...], ...}
(e.g. the imageUrls returned by Apify compass/crawler-google-places, mapped per pick).
Tolerates failures: bad/oversmall images are skipped; each key reports how many it saved.
"""
import sys, os, json, urllib.request
from PIL import Image

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

def dl(url, path):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as r, open(path, "wb") as f:
        f.write(r.read())

def main():
    base = os.path.abspath(sys.argv[1])
    maxn = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    data = json.load(sys.stdin)
    for key, urls in data.items():
        d = os.path.join(base, key)
        os.makedirs(d, exist_ok=True)
        for old in os.listdir(d):
            if old.endswith((".jpg", ".json")):
                os.remove(os.path.join(d, old))
        saved, sources = 0, {}
        for u in urls:
            if saved >= maxn:
                break
            fn = f"{saved:02d}.jpg"
            p = os.path.join(d, fn)
            try:
                dl(u, p)
                Image.open(p).verify()
                if min(Image.open(p).size) < 400:   # skip tiny thumbs
                    os.remove(p); continue
                sources[fn] = u                      # record source URL per saved file
                saved += 1
            except Exception as e:
                if os.path.exists(p):
                    os.remove(p)
                print(f"  {key}: skip ({str(e)[:50]})")
        with open(os.path.join(d, "sources.json"), "w") as f:
            json.dump(sources, f)                    # {filename: source-image-url} for per-photo verify links
        print(f"{key}: {saved} images saved")

if __name__ == "__main__":
    main()
