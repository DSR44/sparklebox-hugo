#!/usr/bin/env python3
"""Replace legacy WordPress URLs in Hugo content with canonical Sparklebox paths."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONTENT_DIRS = [ROOT / "content" / "posts", ROOT / "content" / "pages"]

REPLACEMENTS = [
    ("/dreamtoolkit/", "/the-dreamtoolkit/"),
    ("/the-hidddenwork/", "/the-hidden-work-a-modern-initiation-into-mental-alchemy/"),
    ("/library-of-dreams/", "/posts/"),
    ("/library-of-dreams", "/posts/"),
    ("/tarot/", "https://sparklebox-tarot.streamlit.app/"),
    ("https://sparklebox.blog/dreamtoolkit/", "https://www.sparklebox.blog/the-dreamtoolkit/"),
    ("http://sparklebox.blog/dreamtoolkit/", "https://www.sparklebox.blog/the-dreamtoolkit/"),
    ("https://sparklebox.blog/the-hidddenwork/", "https://www.sparklebox.blog/the-hidden-work-a-modern-initiation-into-mental-alchemy/"),
    ("https://sparklebox.blog/library-of-dreams/", "https://www.sparklebox.blog/posts/"),
    ("https://sparklebox.blog/library-of-dreams", "https://www.sparklebox.blog/posts/"),
    ("https://sparklebox.blog/tarot/", "https://sparklebox-tarot.streamlit.app/"),
    ("%E2%9C%A8-the-dreamtoolkit-%E2%9C%A8/", "/the-dreamtoolkit/"),
    ("%e2%9c%a8-the-dreamtoolkit-%e2%9c%a8/", "/the-dreamtoolkit/"),
    ("https://sparklebox.blog/%E2%9C%A8-the-dreamtoolkit-%E2%9C%A8/", "https://www.sparklebox.blog/the-dreamtoolkit/"),
    ("https://sparklebox.blog/✨-the-dreamtoolkit-✨/", "https://www.sparklebox.blog/the-dreamtoolkit/"),
    ("https://sparklebox.blog/✨-the-musebox/", "https://www.sparklebox.blog/musebox-dreams/"),
    ("https://sparklebox.blog/musebox-dreams/", "https://www.sparklebox.blog/musebox-dreams/"),
]

TAG_URL_RE = re.compile(r"https?://(?:www\.)?sparklebox\.blog/tag/[^)\]\s\"']+", re.I)


def fix_text(text: str) -> str:
    for old, new in REPLACEMENTS:
        text = text.replace(old, new)
    text = TAG_URL_RE.sub("https://www.sparklebox.blog/posts/", text)
    text = text.replace("http://sparklebox.blog/", "https://www.sparklebox.blog/")
    text = text.replace("https://sparklebox.blog/", "https://www.sparklebox.blog/")
    return text


def main() -> int:
    changed = 0
    for directory in CONTENT_DIRS:
        if not directory.is_dir():
            continue
        for path in sorted(directory.rglob("*.md")):
            original = path.read_text(encoding="utf-8")
            updated = fix_text(original)
            if updated != original:
                path.write_text(updated, encoding="utf-8")
                changed += 1
                print(f"Updated {path.relative_to(ROOT)}")
    print(f"Done — {changed} file(s) updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
