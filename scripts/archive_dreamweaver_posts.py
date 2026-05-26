#!/usr/bin/env python3
"""Archive legacy Dreamweaver Tales / Avatar Oasis era posts from the live site."""

import glob
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POSTS = ROOT / "content" / "posts"
ARCHIVE = ROOT / "_archive" / "legacy-posts"

LEGACY = re.compile(
    r"dreamweaver|avatar oasis|7 days of becoming|mirrored minds|"
    r"the oracle.?s grove|time labyrinth|cartographer.?s wing|"
    r"dreamscape daily|lupita and the mirror|weaver of shadows|"
    r"within yourself|whispering oracle|boomerang wisdom|"
    r"reflection of reality|elvidas mirror box|alchemical descent|"
    r"mirror hall|library of dreams",
    re.I,
)


def main():
    ARCHIVE.mkdir(parents=True, exist_ok=True)
    moved = 0
    for path in sorted(POSTS.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        if "robotsNoIndex: true" in text:
            continue
        title_m = re.search(r'^title:\s*"(.*)"', text, re.M)
        title = title_m.group(1) if title_m else ""
        if not LEGACY.search(title) and not LEGACY.search(text[:1200]):
            continue
        shutil.move(str(path), str(ARCHIVE / path.name))
        moved += 1
    print(f"Archived {moved} Dreamweaver-era posts → _archive/legacy-posts/")


if __name__ == "__main__":
    main()
