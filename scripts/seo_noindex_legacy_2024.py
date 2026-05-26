#!/usr/bin/env python3
"""
Mark legacy off-brand 2024 lifestyle/decor posts as noindex.

Usage:
  python3 scripts/seo_noindex_legacy_2024.py --dry-run
  python3 scripts/seo_noindex_legacy_2024.py
"""

from __future__ import annotations

import argparse
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "content" / "posts"

# Keep indexed — on-brand or placeholder worth revisiting later
WHITELIST_SLUGS = {
    "the-art-of-connection",
    "growth-unlocked",
    "collaboration-magic",
    "beyond-the-obstacle",
}

OFF_BRAND = re.compile(
    r"(decor|nail|makeup|outfit|fashion|recipe|holiday|christmas|diy-|"
    r"food|hairstyle|castle|gothic|velvet|jumpsuit|protein|soap|baking|"
    r"dinner|gift|wallpaper|table-setup|cafecore|japandi|harajuku|"
    r"minimalist|motivational-quote|bucket-list|romanian|tacos|drinks|"
    r"remedies|knits|winter-goth|winter-table|festive|cozy-winter|"
    r"coffin-nail|geometric-french|red-nail|dark-cherry|nye-|fusion-tacos|"
    r"castlecore|christmas-wallpaper|christmas-decor|vintage-christmas|"
    r"minimalistic-home-decor|holiday-outfit|velvet-jumpsuit|diy-face|"
    r"diy-protein|diy-soap|family-dinner|baking-soda|harajuku-fashion|"
    r"fashion-styles-jazz|minimalist-black-t)",
    re.I,
)


def split_frontmatter(text: str) -> tuple[str | None, str]:
    if not text.startswith("---"):
        return None, text
    end = text.find("\n---", 3)
    if end == -1:
        return None, text
    return text[3:end].strip(), text[end + 4 :].lstrip("\n")


def get_slug(fm: str) -> str:
    m = re.search(r'^slug:\s*["\']?([^"\'\n]+)["\']?', fm, re.M)
    if m:
        return m.group(1).strip()
    m = re.search(r"^title:\s*[\"']?(.+?)[\"']?\s*$", fm, re.M)
    return re.sub(r"[^a-z0-9]+", "-", (m.group(1) if m else "").lower()).strip("-")[:80]


def has_noindex(fm: str) -> bool:
    return bool(re.search(r"^robotsNoIndex:\s*true\s*$", fm, re.M))


def add_noindex(fm: str) -> str:
    if has_noindex(fm):
        return fm
    return fm.rstrip() + "\nrobotsNoIndex: true\n"


def should_noindex(path: Path, fm: str, body: str) -> tuple[bool, str]:
    if not re.search(r"^date:\s*2024-", fm, re.M):
        return False, "not 2024"
    slug = get_slug(fm)
    if slug in WHITELIST_SLUGS:
        return False, "whitelisted"
    haystack = f"{path.name} {slug} {fm} {body[:500]}"
    if OFF_BRAND.search(haystack):
        return True, "off-brand keyword"
    # Default: December 2024 batch posts are legacy Pinterest SEO — noindex unless whitelisted
    if re.search(r"^date:\s*2024-12-", fm, re.M):
        return True, "2024-12 legacy batch"
    return False, "skipped"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    updated = 0
    skipped = 0

    for path in sorted(POSTS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        fm, body = split_frontmatter(text)
        if fm is None:
            continue
        ok, reason = should_noindex(path, fm, body)
        if not ok:
            skipped += 1
            continue
        if has_noindex(fm):
            skipped += 1
            continue
        new_fm = add_noindex(fm)
        print(f"{'[dry-run] ' if args.dry_run else ''}noindex: {path.name} ({reason})")
        if not args.dry_run:
            path.write_text(f"---\n{new_fm}---\n{body}", encoding="utf-8")
        updated += 1

    print(f"\nDone: {updated} marked noindex, {skipped} skipped.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
