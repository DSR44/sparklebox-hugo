#!/usr/bin/env python3
"""Archive off-brand posts and obsolete pages outside Hugo content/."""

import glob
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "content" / "posts"
PAGES = ROOT / "content" / "pages"
ARCHIVE_POSTS = ROOT / "_archive" / "legacy-posts"
ARCHIVE_PAGES = ROOT / "_archive" / "legacy-pages"

PAGES_TO_ARCHIVE = {
    "2025-10-04-checkout.md",
    "2025-10-04-receipt.md",
    "2025-10-04-order-history.md",
    "2025-10-04-transaction-failed.md",
    "2025-10-04-products.md",
    "2025-10-04-confirmation.md",
    "2025-02-04-disable-ads.md",
    "2025-01-11-search-post.md",
    "2025-04-14-dreamscapes-daily-affirmations-2.md",
    "2025-04-15-e29ca8-the-dreamtoolkit-e29ca8.md",
    "2025-06-16-e29ca8-the-dreambox-archive.md",
    "2025-02-04-contact.md",
    "privacy-policy.md",
    "2025-10-09-sparklebox-tarot.md",
    "2025-09-14-community.md",
    "2025-10-11-chalice-of-flow-water-air-portal-c2b7-sparklebox-realm.md",
    "2025-10-11-chamber-of-resonance-earth-portal-c2b7-sparklebox-realm.md",
    "2025-10-11-rose-veil-water-portal-c2b7-sparklebox-realm.md",
    "2025-10-11-lunar-haven-quiet-sky-sanctuary-c2b7-sparklebox-realm.md",
    "2025-10-11-ember-gate-fire-portal-c2b7-sparklebox-realm.md",
    "2025-10-12-shadow-vault-reclaim-your-fragments-c2b7-sparklebox-realm.md",
    "2025-10-12-celestium-beyond-the-veil-c2b7-sparklebox-realm.md",
    "2025-10-12-auric-bloom-inner-dawn-illumination-c2b7-sparklebox-realm.md",
}


def strip_aliases(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---") or "aliases:" not in text:
        return False
    parts = text.split("---", 2)
    if len(parts) < 3:
        return False
    fm = parts[1]
    new_fm = re.sub(r"\naliases:\n(?:\s+- \"[^\"]+\"\n)+", "\n", fm)
    if new_fm == fm:
        return False
    path.write_text(f"---{new_fm}---{parts[2]}", encoding="utf-8")
    return True


def main():
    ARCHIVE_POSTS.mkdir(parents=True, exist_ok=True)
    ARCHIVE_PAGES.mkdir(parents=True, exist_ok=True)

    moved_posts = 0
    for path in sorted(POSTS.glob("*.md")):
        if path.name == "_index.md":
            continue
        text = path.read_text(encoding="utf-8")
        if "robotsNoIndex: true" not in text:
            continue
        dest = ARCHIVE_POSTS / path.name
        shutil.move(str(path), str(dest))
        moved_posts += 1

    moved_pages = 0
    for name in PAGES_TO_ARCHIVE:
        src = PAGES / name
        if src.exists():
            shutil.move(str(src), str(ARCHIVE_PAGES / name))
            moved_pages += 1

    alias_stripped = 0
    for path in sorted(POSTS.glob("*.md")):
        if strip_aliases(path):
            alias_stripped += 1

    print(f"Archived {moved_posts} legacy posts → _archive/legacy-posts/")
    print(f"Archived {moved_pages} obsolete pages → _archive/legacy-pages/")
    print(f"Stripped aliases from {alias_stripped} remaining posts")


if __name__ == "__main__":
    main()
