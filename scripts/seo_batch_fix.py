#!/usr/bin/env python3
"""
Batch SEO frontmatter fix for Sparklebox Hugo posts.

Usage:
  python3 scripts/seo_batch_fix.py --descriptions          # fix missing/bad meta descriptions
  python3 scripts/seo_batch_fix.py --keywords             # add keywords from tags
  python3 scripts/seo_batch_fix.py --covers               # assign cover.image from static pools
  python3 scripts/seo_batch_fix.py --all                  # all of the above
  python3 scripts/seo_batch_fix.py --all --dry-run        # preview only

Descriptions: first substantive paragraph → truncate to 155 chars (Okara/SEO standard).
Covers: deterministic pick from static/generic-post-images + static/pinterest-images.
"""

from __future__ import annotations

import argparse
import hashlib
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POSTS_DIR = ROOT / "content" / "posts"
MAX_DESC = 155


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
    s = s.replace('"', "'").replace("\n", " ").strip()
    return f'"{s}"'


def set_scalar(fm: str, key: str, value: str) -> str:
    line = f"{key}: {yaml_quote(value)}"
    pattern = rf"^{re.escape(key)}:.*$"
    if re.search(pattern, fm, re.M):
        return re.sub(pattern, line, fm, count=1, flags=re.M)
    return fm.rstrip() + "\n" + line


def has_cover(fm: str) -> bool:
    return bool(re.search(r"^cover:", fm, re.M))


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


def parse_tags(fm: str) -> list[str]:
    return parse_list_field(fm, "tags")


def parse_categories(fm: str) -> list[str]:
    return parse_list_field(fm, "categories")


def clean_tag(tag: str) -> str | None:
    tag = re.sub(r"[^\w\s\-]", "", tag).strip().lower()
    tag = re.sub(r"\s+", " ", tag)
    return tag[:45] if len(tag) >= 2 else None


def extract_paragraphs(body: str) -> list[str]:
    body = re.sub(r"<[^>]+>", " ", body)
    paragraphs: list[str] = []
    for raw in body.splitlines():
        line = raw.strip()
        if not line:
            continue
        if line.startswith("#"):
            continue
        if line.startswith("!["):
            continue
        if "Your browser does not support" in line:
            continue
        if line.startswith("---"):
            continue
        if re.match(r"^[✨🫧🗝️🔮]", line) and len(line) < 120:
            continue
        if line.startswith(">"):
            line = line.lstrip("> ").strip()
        clean = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", line)
        clean = re.sub(r"[*_`#]", "", clean).strip()
        clean = re.sub(r"\s+", " ", clean)
        if len(clean) < 35:
            continue
        paragraphs.append(clean)
        if len(clean) >= 80:
            break
    return paragraphs


def first_sentence(text: str) -> str:
    parts = re.split(r"(?<=[.!?])\s+", text, maxsplit=1)
    return parts[0].strip()


def truncate_words(text: str, maxlen: int = MAX_DESC) -> str:
    text = re.sub(r"\s+", " ", text).strip()
    if len(text) <= maxlen:
        return text
    cut = text[:maxlen]
    if " " in cut:
        cut = cut[: cut.rfind(" ")]
    return cut.rstrip(".,;:") + "…"


def needs_description_fix(fm: str, title: str) -> bool:
    desc = get_scalar(fm, "description")
    if not desc:
        return True
    if desc.strip() == title.strip():
        return True
    if len(desc) < 50:
        return True
    if desc.endswith("...") or desc.endswith("…"):
        return True
    return False


def make_description(title: str, body: str) -> str:
    title_clean = re.sub(r"\s+", " ", re.sub(r"[^\w\s\-—|:']", "", title)).strip()
    paras = extract_paragraphs(body)

    if paras:
        base = first_sentence(paras[0])
        if len(base) < 70 and len(paras) > 1:
            base = first_sentence(paras[0] + " " + paras[1])
        desc = truncate_words(base)
    else:
        desc = truncate_words(title_clean)

    if len(desc) < 55 and title_clean:
        desc = truncate_words(f"{title_clean}. {desc}" if desc != title_clean else title_clean)

    return desc.replace('"', "'")


def load_cover_images() -> list[str]:
    images: list[str] = []
    for sub, prefix in (
        ("static/generic-post-images", "/generic-post-images/"),
        ("static/pinterest-images", "/pinterest-images/"),
    ):
        d = ROOT / sub
        if not d.is_dir():
            continue
        for name in sorted(os.listdir(d)):
            if name.lower().endswith((".jpg", ".jpeg", ".png", ".webp")):
                images.append(prefix + name)
    return images


def pick_cover(slug: str, images: list[str]) -> str:
    h = int(hashlib.md5(slug.encode()).hexdigest(), 16)
    return images[h % len(images)]


def add_cover_block(fm: str, title: str, slug: str, images: list[str]) -> str:
    img = pick_cover(slug, images)
    alt = title.replace('"', "'")[:120]
    block = (
        f'\ncover:\n  image: "{img}"\n'
        f'  alt: "{alt}"\n'
        f'  caption: "Elle Vida | Sparklebox"\n'
    )
    return fm.rstrip() + block


def add_keywords_block(fm: str, tags: list[str], categories: list[str]) -> str | None:
    kws: list[str] = []
    skip_cats = {"uncategorized", "blog", "posts"}
    for source in tags + categories:
        c = clean_tag(source)
        if not c or c in skip_cats:
            continue
        if c not in kws:
            kws.append(c)
        if len(kws) >= 5:
            break
    if len(kws) < 1:
        return None
    block = "keywords:\n" + "".join(f'  - "{k}"\n' for k in kws)
    return fm.rstrip() + "\n" + block


def process_post(path: Path, args: argparse.Namespace, images: list[str]) -> list[str]:
    text = path.read_text(encoding="utf-8")
    fm, body = split_frontmatter(text)
    if fm is None:
        return [f"SKIP (no frontmatter): {path.name}"]

    title = get_scalar(fm, "title") or path.stem
    slug = get_scalar(fm, "slug") or path.stem
    changes: list[str] = []
    modified = False

    if args.descriptions and needs_description_fix(fm, title):
        new_desc = make_description(title, body)
        old = get_scalar(fm, "description") or "MISSING"
        fm = set_scalar(fm, "description", new_desc)
        changes.append(f"  description: {old[:45]}… → {new_desc[:60]}…")
        modified = True

    if args.keywords and not has_keywords(fm):
        new_fm = add_keywords_block(fm, parse_tags(fm), parse_categories(fm))
        if new_fm:
            fm = new_fm
            changes.append("  keywords: added from tags")
            modified = True

    if args.covers and not has_cover(fm):
        if not images:
            changes.append("  cover: SKIPPED (no images in static/)")
        else:
            fm = add_cover_block(fm, title, slug, images)
            changes.append(f"  cover: {pick_cover(slug, images)}")
            modified = True

    if modified and not args.dry_run:
        path.write_text("---\n" + fm.strip("\n") + "\n---" + body, encoding="utf-8")

    if changes:
        return [path.name] + changes
    return []


def main() -> int:
    parser = argparse.ArgumentParser(description="Batch SEO frontmatter for Sparklebox posts")
    parser.add_argument("--descriptions", action="store_true", help="Fix missing/bad meta descriptions")
    parser.add_argument("--keywords", action="store_true", help="Add keywords from tags")
    parser.add_argument("--covers", action="store_true", help="Assign cover.image from static pools")
    parser.add_argument("--all", action="store_true", help="Run descriptions + keywords + covers")
    parser.add_argument("--dry-run", action="store_true", help="Preview changes without writing")
    args = parser.parse_args()

    if args.all:
        args.descriptions = args.keywords = args.covers = True

    if not (args.descriptions or args.keywords or args.covers):
        parser.print_help()
        return 1

    posts = sorted(p for p in POSTS_DIR.glob("*.md") if p.name != "_index.md")
    images = load_cover_images()
    print(f"Posts: {len(posts)} | Cover pool: {len(images)} images")
    if args.covers and not images:
        print("WARNING: no cover images found under static/", file=sys.stderr)

    updated = 0
    for path in posts:
        result = process_post(path, args, images)
        if result:
            print("\n".join(result))
            updated += 1

    mode = "DRY RUN — no files written" if args.dry_run else "DONE"
    print(f"\n{mode}: {updated} posts affected")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
