#!/usr/bin/env python3
"""
Unify every post cover.image to a consistent square (1:1) for reading UX + SEO.

- Center-crops unique cover rasters referenced by content/posts
- Resizes to COVER_SIZE×COVER_SIZE
- Regenerates sibling .webp
- Updates data/image_manifest.json entries for those paths

Skips video covers. Does not touch architecture-series / non-cover assets.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "content" / "posts"
STATIC = ROOT / "static"
MANIFEST_PATH = ROOT / "data" / "image_manifest.json"
COVER_SIZE = 1080  # square edge — compact on-page, sharp on retina
WEBP_QUALITY = 82
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}


def cover_paths() -> list[str]:
    found: list[str] = []
    for path in sorted(POSTS.glob("*.md")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        m = re.search(
            r"cover:\s*\n(?:[ \t]+[^\n]*\n)*?[ \t]+image:\s*[\"']?([^\"'\n]+)",
            text,
        )
        if m:
            found.append(m.group(1).strip())
    return found


def public_path(path: Path) -> str:
    return f"/{path.relative_to(STATIC).as_posix()}"


def ensure_webp(src: Path) -> Path | None:
    if src.suffix.lower() == ".webp":
        return src
    target = src.with_suffix(".webp")
    subprocess.run(
        ["cwebp", "-q", str(WEBP_QUALITY), str(src), "-o", str(target)],
        check=True,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.PIPE,
    )
    return target


def to_square(path: Path) -> tuple[int, int]:
    with Image.open(path) as im:
        im = im.convert("RGB") if im.mode not in ("RGB", "RGBA") else im
        w, h = im.size
        side = min(w, h)
        left = (w - side) // 2
        top = (h - side) // 2
        im = im.crop((left, top, left + side, top + side))
        if side != COVER_SIZE:
            im = im.resize((COVER_SIZE, COVER_SIZE), Image.Resampling.LANCZOS)
        # Preserve format family
        ext = path.suffix.lower()
        save_kw: dict = {}
        if ext in {".jpg", ".jpeg"}:
            save_kw = {"quality": 85, "optimize": True}
            if im.mode == "RGBA":
                im = im.convert("RGB")
        elif ext == ".png":
            save_kw = {"optimize": True}
        elif ext == ".webp":
            save_kw = {"quality": WEBP_QUALITY, "method": 4}
        im.save(path, **save_kw)
        return im.size


def main() -> int:
    covers = cover_paths()
    unique = sorted(set(covers))
    print(f"Post covers: {len(covers)} refs → {len(unique)} unique files")

    manifest: dict = {}
    if MANIFEST_PATH.is_file():
        manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))

    ok = skipped = failed = 0
    buckets_before: dict[str, int] = {}
    for rel in unique:
        if rel.lower().endswith(".mp4"):
            print(f"  skip video: {rel}")
            skipped += 1
            continue
        path = STATIC / rel.lstrip("/")
        if not path.is_file():
            print(f"  missing: {rel}", file=sys.stderr)
            failed += 1
            continue
        if path.suffix.lower() not in IMAGE_EXTS:
            skipped += 1
            continue

        with Image.open(path) as probe:
            bw, bh = probe.size
        ratio = round(bw / bh, 2) if bh else 0
        key_b = f"{bw}x{bh}"
        buckets_before[key_b] = buckets_before.get(key_b, 0) + 1

        already = bw == COVER_SIZE and bh == COVER_SIZE
        try:
            if not already:
                w, h = to_square(path)
            else:
                w, h = bw, bh
            webp = ensure_webp(path)
            entry: dict = {"width": w, "height": h}
            if webp and webp.exists() and webp != path:
                entry["webp"] = public_path(webp)
            manifest[public_path(path)] = entry
            # If source was webp-only, also record itself
            if path.suffix.lower() == ".webp":
                manifest[public_path(path)] = {"width": w, "height": h}
            status = "ok" if not already else "already-square"
            print(f"  {status}: {rel}  ({bw}x{bh} → {w}x{h})")
            ok += 1
        except Exception as exc:
            print(f"  FAIL {rel}: {exc}", file=sys.stderr)
            failed += 1

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(
        json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8"
    )

    print("\nTop sizes before unify:")
    for k, v in sorted(buckets_before.items(), key=lambda kv: -kv[1])[:12]:
        print(f"  {k}: {v}")
    print(f"\nDone: {ok} unified, {skipped} skipped, {failed} failed")
    print(f"Manifest updated: {MANIFEST_PATH.relative_to(ROOT)}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
