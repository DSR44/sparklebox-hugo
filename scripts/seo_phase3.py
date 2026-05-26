#!/usr/bin/env python3
"""
Phase 3 SEO polish for Sparklebox:
  - Keywords from title (remaining gaps)
  - Frequency Upgrade series descriptions (workbook CTA)
  - Legacy perception-is-creation post descriptions

Usage:
  python3 scripts/seo_phase3.py --keywords-title
  python3 scripts/seo_phase3.py --polish-frequency
  python3 scripts/seo_phase3.py --polish-legacy
  python3 scripts/seo_phase3.py --all
  python3 scripts/seo_phase3.py --all --dry-run
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "content" / "posts"
MAX_DESC = 155

STOPWORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for", "of",
    "with", "by", "from", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "will", "would", "could", "should",
    "may", "might", "must", "shall", "can", "need", "your", "you", "we", "they",
    "it", "its", "this", "that", "these", "those", "i", "my", "me", "our", "how",
    "what", "when", "where", "why", "who", "which", "while", "if", "not", "no",
    "yes", "all", "just", "more", "most", "some", "any", "each", "every", "both",
    "few", "much", "many", "very", "too", "so", "as", "than", "then", "there",
    "here", "into", "through", "during", "before", "after", "above", "below",
    "up", "down", "out", "off", "over", "under", "again", "further", "once",
    "about", "against", "between", "because", "until", "without", "within",
    "sparklebox", "elle", "vida", "blog", "post", "part", "chapter", "vol",
}

LEGACY_CATEGORIES = {
    "the sparklebox method",
    "sparklebox realm",
    "sparklebox base class",
    "transmutational alchemy",
    "elle vidas mirror box",
    "the hidden work",
    "perception engine",
    "mystical wisdom series",
    "dreamweaver's tales",
    "thedreamtoolkit",
}

FREQUENCY_MARKERS = {
    "the frequency upgrade",
    "frequency upgrade",
    "frequency",
    "cognitive upgrade",
    "theta state",
    "alpha prime",
    "baseline beta",
}


def split_frontmatter(text: str) -> tuple[str | None, str]:
    if not text.startswith("---\n"):
        return None, text
    end = text.find("\n---\n", 4)
    if end == -1:
        end = text.rfind("\n---")
        if end <= 4:
            return None, text
        return text[4:end], text[end + 4 :].lstrip("\n")
    return text[4:end], text[end + 5 :]


def get_scalar(fm: str, key: str) -> str | None:
    m = re.search(rf"^{re.escape(key)}:\s*(.+)$", fm, re.M)
    if not m:
        return None
    val = m.group(1).strip()
    if val.startswith('"') and val.endswith('"'):
        return val[1:-1]
    if val.startswith("'") and val.endswith("'"):
        return val[1:-1]
    return val


def yaml_quote(s: str) -> str:
    return f'"{s.replace(chr(34), chr(39))}"'


def set_scalar(fm: str, key: str, value: str) -> str:
    line = f"{key}: {yaml_quote(value)}"
    pattern = rf"^{re.escape(key)}:.*$"
    if re.search(pattern, fm, re.M):
        return re.sub(pattern, line, fm, count=1, flags=re.M)
    return fm.rstrip() + "\n" + line


def has_keywords(fm: str) -> bool:
    return bool(re.search(r"^keywords:", fm, re.M))


def parse_list_field(fm: str, key: str) -> list[str]:
    items: list[str] = []
    in_field = False
    for line in fm.splitlines():
        if line.startswith(f"{key}:"):
            in_field = True
            if "[" in line:
                items.extend(re.findall(r'["\']([^"\']+)["\']', line))
                in_field = "]" not in line
            continue
        if in_field:
            if line.startswith(("  -", "- ", "  ")):
                m = re.search(r'["\']([^"\']+)["\']', line)
                if m:
                    items.append(m.group(1))
            else:
                in_field = False
    return items


def truncate_words(text: str, maxlen: int = MAX_DESC) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= maxlen:
        return text
    cut = text[:maxlen]
    if " " in cut:
        cut = cut[: cut.rfind(" ")]
    return cut.rstrip(".,;:") + "…"


def keywords_from_title(title: str) -> list[str]:
    words = re.findall(r"[a-zA-Z0-9]+", title.lower())
    kws: list[str] = []
    for w in words:
        if len(w) < 3 or w in STOPWORDS:
            continue
        if w not in kws:
            kws.append(w)
        if len(kws) >= 5:
            break
    if "sparklebox" not in kws and len(kws) < 5:
        kws.append("sparklebox")
    if "elle vida" not in " ".join(kws) and len(kws) < 5:
        kws.append("elle vida")
    return kws[:5]


def add_keywords_block(fm: str, kws: list[str]) -> str:
    block = "keywords:\n" + "".join(f'  - "{k}"\n' for k in kws)
    return fm.rstrip() + "\n" + block


def is_frequency_post(fm: str, title: str) -> bool:
    blob = " ".join(parse_list_field(fm, "categories") + parse_list_field(fm, "tags")).lower()
    blob += " " + title.lower()
    return any(m in blob for m in FREQUENCY_MARKERS)


def is_legacy_post(fm: str) -> bool:
    cats = [c.lower() for c in parse_list_field(fm, "categories")]
    tags = [t.lower() for t in parse_list_field(fm, "tags")]
    blob = " ".join(cats + tags)
    if any(m in blob for m in LEGACY_CATEGORIES):
        return True
    if "perception" in blob or "perceptive creation" in blob:
        return True
    return False


def polish_frequency_description(title: str, body: str) -> str:
    title_clean = re.sub(r"\s+", " ", title).strip()
    hooks = [
        f"{title_clean}. Part of The Frequency Upgrade — Elle Vida on cognitive frequency bands and the $19 Frequency Field Test workbook.",
        f"Elle Vida | Frequency Upgrade: {title_clean}. Body-based field tests for clarity — workbook at sparklebox.blog/frequency-upgrade.",
        f"{title_clean} — nervous system frequency, perception architecture, and The Frequency Field Test ($19). By Elle Vida.",
    ]
    for h in hooks:
        if len(h) <= MAX_DESC:
            return h
    return truncate_words(hooks[0])


def polish_legacy_description(title: str, body: str) -> str:
    title_clean = re.sub(r"\s+", " ", title).strip()
    hooks = [
        f"{title_clean}. Perception is Creation — Elle Vida on perceptive authorship, not manifestation. Sparklebox philosophy essay.",
        f"Elle Vida | Sparklebox: {title_clean}. How perception shapes reality — legacy essay from the Perception is Creation archive.",
        f"{title_clean} — mental alchemy and perception architecture by Elle Vida. Perception precedes reality.",
    ]
    for h in hooks:
        if len(h) <= MAX_DESC:
            return h
    return truncate_words(hooks[0])


def write_post(path: Path, fm: str, body: str, dry_run: bool) -> None:
    if not dry_run:
        path.write_text("---\n" + fm.strip("\n") + "\n---" + body, encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--keywords-title", action="store_true")
    parser.add_argument("--polish-frequency", action="store_true")
    parser.add_argument("--polish-legacy", action="store_true")
    parser.add_argument("--all", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if args.all:
        args.keywords_title = args.polish_frequency = args.polish_legacy = True

    if not (args.keywords_title or args.polish_frequency or args.polish_legacy):
        parser.print_help()
        return 1

    posts = sorted(p for p in POSTS_DIR.glob("*.md") if p.name != "_index.md")
    stats = {"keywords": 0, "frequency": 0, "legacy": 0}

    for path in posts:
        text = path.read_text(encoding="utf-8")
        fm, body = split_frontmatter(text)
        if fm is None:
            continue
        title = get_scalar(fm, "title") or path.stem
        changed = False

        if args.keywords_title and not has_keywords(fm):
            kws = keywords_from_title(title)
            fm = add_keywords_block(fm, kws)
            stats["keywords"] += 1
            print(f"{path.name}: keywords from title → {kws}")
            changed = True

        if args.polish_frequency and is_frequency_post(fm, title):
            new_desc = polish_frequency_description(title, body)
            fm = set_scalar(fm, "description", new_desc)
            stats["frequency"] += 1
            print(f"{path.name}: frequency desc → {new_desc[:70]}…")
            changed = True

        elif args.polish_legacy and is_legacy_post(fm):
            new_desc = polish_legacy_description(title, body)
            fm = set_scalar(fm, "description", new_desc)
            stats["legacy"] += 1
            print(f"{path.name}: legacy desc → {new_desc[:70]}…")
            changed = True

        if changed:
            write_post(path, fm, body, args.dry_run)

    mode = "DRY RUN" if args.dry_run else "DONE"
    print(f"\n{mode}: keywords={stats['keywords']} frequency={stats['frequency']} legacy={stats['legacy']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
