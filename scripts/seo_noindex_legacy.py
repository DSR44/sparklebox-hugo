#!/usr/bin/env python3
"""Mark legacy Pinterest-era posts as noindex so Google sees a clear brand line."""

import glob
import re
from pathlib import Path

POSTS_DIR = Path(__file__).resolve().parents[1] / "content" / "posts"

LEGACY_CATEGORIES = {
    "Fashion",
    "Food",
    "Beauty",
    "DIY",
    "Home Decor",
    "Wedding",
    "Health",
    "Organization Hacks",
    "2025 Discoveries/Trends",
    "SnapSpells",
    "AI/Tech",
}

UNCategorized_ONLY_BEFORE = "2025-06-01"


def parse_categories(text):
    cats = []
    in_cat = False
    for line in text.splitlines():
        if line.startswith("categories:"):
            in_cat = True
            continue
        if in_cat:
            if line.startswith("tags:") or line.startswith("description:"):
                break
            match = re.match(r'\s+-\s*"(.*)"', line)
            if match:
                cats.append(match.group(1))
    return cats


def parse_date(text):
    match = re.search(r'^date:\s*(.+)$', text, re.MULTILINE)
    return match.group(1).strip() if match else ""


def add_noindex(text):
    if "robotsNoIndex: true" in text:
        return text, False
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 3:
            frontmatter = parts[1].rstrip() + "\nrobotsNoIndex: true\n"
            return f"---{frontmatter}---{parts[2]}", True
    return text, False


def should_noindex(path, text):
    if "robotsNoIndex: true" in text:
        return False

    cats = parse_categories(text)
    if set(cats) & LEGACY_CATEGORIES:
        return True

    if cats == ["Uncategorized"]:
        date = parse_date(text)
        if date and date[:10] < UNCategorized_ONLY_BEFORE:
            return True

    return False


def main():
    updated = []
    for path in sorted(POSTS_DIR.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        if not should_noindex(path, text):
            continue
        new_text, changed = add_noindex(text)
        if changed:
            path.write_text(new_text, encoding="utf-8")
            updated.append(path.name)

    print(f"Added robotsNoIndex to {len(updated)} posts")
    for name in updated[:10]:
        print(f"  - {name}")
    if len(updated) > 10:
        print(f"  ... and {len(updated) - 10} more")


if __name__ == "__main__":
    main()
