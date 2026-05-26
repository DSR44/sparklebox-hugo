#!/usr/bin/env python3
"""
Consolidate Sparklebox posts into five SEO pillar categories, noindex off-brand
legacy content, and add Frequency Upgrade hub links where missing.
"""

import glob
import re
from pathlib import Path

POSTS_DIR = Path(__file__).resolve().parents[1] / "content" / "posts"

PILLAR_METHOD = "The Sparklebox Method"
PILLAR_FREQ = "The Frequency Upgrade"
PILLAR_REALM = "Sparklebox Realm"
PILLAR_MYSTICAL = "Mystical Wisdom Series"
PILLAR_DREAM = "Dream and Muse Tools"
PILLARS = {PILLAR_METHOD, PILLAR_FREQ, PILLAR_REALM, PILLAR_MYSTICAL, PILLAR_DREAM}

CATEGORY_MAP = {
    "The Frequency Upgrade": PILLAR_FREQ,
    "The Sparklebox Method": PILLAR_METHOD,
    "The Sparklebox Method™": PILLAR_METHOD,
    "Sparklebox Base Class": PILLAR_METHOD,
    "Sparklebox Realm": PILLAR_REALM,
    "The Perception Engine": PILLAR_REALM,
    "Transmutational Alchemy": PILLAR_REALM,
    "Elle Vidas Mirror Box": PILLAR_METHOD,
    "🜂 ELVIDA'S MIRROR BOX: THE ALCHEMICAL DESCENT": PILLAR_METHOD,
    "Mystical Wisdom Series": PILLAR_MYSTICAL,
    "Ancient Wisdom": PILLAR_MYSTICAL,
    "Neville Goddard": PILLAR_METHOD,
    "Divine Feminine": PILLAR_MYSTICAL,
    "🔮 The Oracle's Grove": PILLAR_MYSTICAL,
    "🔮 The Oracle\u2019s Grove": PILLAR_MYSTICAL,
    "Dreamweaver's Tales": PILLAR_DREAM,
    "Dreamweaver\u2019s Tales": PILLAR_DREAM,
    "Daily Affirmations": PILLAR_DREAM,
    "TheDreamToolkit": PILLAR_DREAM,
    "The Library of Dreams 📜": PILLAR_DREAM,
    "Dream Coded Affirmations": PILLAR_DREAM,
    "7 Days Of Becoming": PILLAR_DREAM,
    "Avatar Oasis": PILLAR_DREAM,
    "Wellness Through Dreamscapes": PILLAR_DREAM,
    "🪞Mirrored Minds: Exploring The Cosmos Within": PILLAR_REALM,
    "🪞 THE MIRROR HALL": PILLAR_REALM,
    "🌀 The Time Labyrinth": PILLAR_DREAM,
    "🗺️ The Cartographer's Wing": PILLAR_DREAM,
    "🗺️ The Cartographer\u2019s Wing": PILLAR_DREAM,
}

NOINDEX_CATEGORIES = {
    "Wellness",
    "Home decor",
    "Uncategorized",
    "Architecture",
    "SnapSpells",
}

NOINDEX_TITLE_KEYWORDS = [
    "fashion", "thrift", "wedding trend", "nail design", "hair color",
    "protein smooth", "ozempic", "weight loss", "makeup", "skincare",
    "interior design", "nesting party", "boho knitwear", "diy energy ball",
    "turkish bridal", "baggy t-shirt", "velvet jumpsuit", "holiday outfit",
    "motivational quotes", "bucket list destination", "soap recipe",
    "face mask", "protein bar", "cafecore", "harajuku", "gothic outfit",
    "christmas nail", "christmas decor", "winter goth makeup", "nye hairstyle",
    "sentimental fashion", "longevity hack", "natural exfoliat", "beauty tool",
    "whimsical fashion", "surreal soiree", "surreil soiree", "dream decor idea",
    "pinterest predict", "stitch fix", "sprinkle sprinkle", "ai jobs no coding",
    "turkish dish", "fusion taco", "romanian castle", "castlecore decor",
    "family dinner idea", "baking soda hack", "minimalist black t",
]

FREQ_HUB_BLOCK = """
---

**⚡ Part of [The Frequency Upgrade](/frequency-upgrade/)** — Elle Vida's series on cognitive frequency bands, perception architecture, and the path from Baseline Beta to Alpha Prime.

→ [Browse the full series](/frequency-upgrade/) · [Start Here](/start-here/) · [FAQ](/faq/)
"""

FREQ_TITLE_KEYWORDS = [
    "frequency upgrade", "baseline beta", "alpha prime", "theta state",
    "cognitive frequency", "frequency band", "frequency shift", "frequency of",
    "brainwave entrainment", "528 hz", "embodying your desired frequency",
]


def parse_frontmatter(text):
    if not text.startswith("---"):
        return {}, text
    parts = text.split("---", 2)
    if len(parts) < 3:
        return {}, text
    fm = parts[1]
    body = parts[2]
    meta = {"categories": [], "tags": []}
    title_match = re.search(r'^title:\s*"(.*)"\s*$', fm, re.MULTILINE)
    if title_match:
        meta["title"] = title_match.group(1)
    for key in ("categories", "tags"):
        block = re.search(rf"^{key}:\n((?:\s+- \"[^\"]+\"\n)+)", fm, re.MULTILINE)
        if block:
            meta[key] = re.findall(r'-\s*"([^"]+)"', block.group(1))
    meta["robotsNoIndex"] = "robotsNoIndex: true" in fm
    return meta, body


def replace_categories(fm_text, new_category):
    if re.search(r"^categories:\n", fm_text, re.MULTILINE):
        fm_text = re.sub(
            r"^categories:\n(?:\s+- \"[^\"]+\"\n)+",
            f'categories:\n  - "{new_category}"\n',
            fm_text,
            count=1,
            flags=re.MULTILINE,
        )
    else:
        fm_text = fm_text.rstrip() + f'\ncategories:\n  - "{new_category}"\n'
    return fm_text


def add_noindex(fm_text):
    if "robotsNoIndex: true" in fm_text:
        return fm_text
    return fm_text.rstrip() + "\nrobotsNoIndex: true\n"


def should_noindex(meta):
    if meta.get("robotsNoIndex"):
        return False
    cats = set(meta.get("categories", []))
    if cats & NOINDEX_CATEGORIES and PILLAR_FREQ not in {CATEGORY_MAP.get(c, c) for c in cats}:
        if not (cats & {PILLAR_FREQ, "The Frequency Upgrade"}):
            return True
    title = meta.get("title", "").lower()
    blob = title + " " + " ".join(meta.get("categories", [])).lower()
    if any(kw in blob for kw in NOINDEX_TITLE_KEYWORDS):
        if PILLAR_FREQ not in cats and "The Frequency Upgrade" not in cats:
            return True
    return False


def classify_pillar(meta):
    scores = {p: 0 for p in PILLARS}
    cats = meta.get("categories", [])
    tags = meta.get("tags", [])
    title = meta.get("title", "")
    blob = " ".join([title] + cats + tags).lower()

    for cat in cats:
        pillar = CATEGORY_MAP.get(cat)
        if pillar:
            scores[pillar] += 12

    if any(k in blob for k in FREQ_TITLE_KEYWORDS) or "frequency" in tags:
        scores[PILLAR_FREQ] += 20
    if any(k in blob for k in ("sparklebox method", "base class", "neville", "hidden work", "linguistic")):
        scores[PILLAR_METHOD] += 15
    if any(k in blob for k in ("ancient", "oracle", "goddess", "kabbal", "sacred feminine", "mystical")):
        scores[PILLAR_MYSTICAL] += 15
    if any(k in blob for k in ("dream", "musebox", "affirmation", "dreamweaver", "portal", "avatar oasis")):
        scores[PILLAR_DREAM] += 12
    if any(k in blob for k in ("perception", "anticipation", "alchemy", "consciousness", "sparklebox realm")):
        scores[PILLAR_REALM] += 10

    best = max(scores, key=scores.get)
    if scores[best] == 0:
        return PILLAR_REALM
    return best


def is_frequency_post(meta):
    cats = meta.get("categories", [])
    if "The Frequency Upgrade" in cats:
        return True
    blob = (meta.get("title", "") + " " + " ".join(cats + meta.get("tags", []))).lower()
    return any(k in blob for k in FREQ_TITLE_KEYWORDS)


def ensure_frequency_hub(body, meta):
    if meta.get("robotsNoIndex"):
        return body
    if not is_frequency_post(meta):
        return body
    if "/frequency-upgrade/" in body:
        return body
    return body.rstrip() + FREQ_HUB_BLOCK + "\n"


def process_file(path):
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---"):
        return None

    parts = text.split("---", 2)
    fm_text = parts[1]
    body = parts[2]
    meta, _ = parse_frontmatter(text)

    changes = []

    if should_noindex(meta):
        new_fm = add_noindex(fm_text)
        if new_fm != fm_text:
            fm_text = new_fm
            meta["robotsNoIndex"] = True
            changes.append("noindex")

    if not meta.get("robotsNoIndex"):
        pillar = classify_pillar(meta)
        new_fm = replace_categories(fm_text, pillar)
        if new_fm != fm_text:
            fm_text = new_fm
            meta["categories"] = [pillar]
            changes.append(f"category→{pillar}")

        new_body = ensure_frequency_hub(body, meta)
        if new_body != body:
            body = new_body
            changes.append("freq-hub-link")
    else:
        body = body

    if changes:
        path.write_text(f"---{fm_text}---{body}", encoding="utf-8")
    return changes


def main():
    stats = {"noindex": 0, "category": 0, "freq_link": 0, "files": 0}
    for path in sorted(POSTS_DIR.glob("*.md")):
        if path.name == "_index.md":
            continue
        result = process_file(path)
        if not result:
            continue
        stats["files"] += 1
        for change in result:
            if change == "noindex":
                stats["noindex"] += 1
            elif change.startswith("category"):
                stats["category"] += 1
            elif change == "freq-hub-link":
                stats["freq_link"] += 1
    print(f"Updated {stats['files']} posts")
    print(f"  noindex added: {stats['noindex']}")
    print(f"  categories consolidated: {stats['category']}")
    print(f"  frequency hub links added: {stats['freq_link']}")


if __name__ == "__main__":
    main()
