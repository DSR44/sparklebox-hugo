#!/usr/bin/env python3
"""Refactor static dream portal HTML files to use shared sb-portal.css (v3)."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
STATIC = ROOT / "static"

THEMES = {
    "ember_gate_portal.html": "ember",
    "rose_veil_portal.html": "rose",
    "chalice_of_flow_portal.html": "flow",
    "chamber_of_resonance_portal.html": "resonance",
    "lunar_haven_portal.html": "lunar",
    "auric_bloom_portal.html": "auric",
    "celestium_portal.html": "celestium",
    "shadow_vault_portal.html": "shadow",
}

HEAD_LINKS = """<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="stylesheet" href="/css/sb-portal.css">"""

TOPBAR = """<nav class="sb-portal-topbar">
  <a href="/the-dreamtoolkit/">← Dream Toolkit</a>
  <a href="/" class="sb-portal-topbar__brand">Sp<span>△</span>rklebox</a>
  <a href="https://www.sparklebox.blog/musebox-dreams/">Musebox</a>
</nav>"""


def refactor(path: Path, theme: str) -> None:
    text = path.read_text(encoding="utf-8")

    # Remove inline stylesheet
    text = re.sub(r"<style>.*?</style>\s*", "", text, count=1, flags=re.DOTALL)

    # Inject shared CSS after viewport meta
    if "/css/sb-portal.css" not in text:
        text = text.replace("</title>", f"</title>\n{HEAD_LINKS}", 1)

    # Body class
    text = re.sub(r"<body>", f'<body class="sb-portal sb-portal--{theme}">', text, count=1)

    # Top nav
    if "sb-portal-topbar" not in text:
        text = text.replace(
            '<div class="content-container">',
            f"{TOPBAR}\n<div class=\"content-container\">",
            1,
        )

    # Gate intro inline styles
    text = re.sub(
        r'<h2 style="[^"]*">',
        '<h2 class="gate-section-title">',
        text,
    )
    text = re.sub(
        r'<p style="color: #[^"]*; font-size:[^"]*; line-height:[^"]*; margin:[^"]*">',
        '<p class="gate-section-text">',
        text,
    )

    # Return link
    text = re.sub(
        r'<div style="text-align: center; margin: 3rem auto;">\s*'
        r'<a href="[^"]*" style="[^"]*">\s*← Return to DreamToolkit\s*</a>\s*</div>',
        '<div class="sb-portal-back-wrap"><a href="/the-dreamtoolkit/" class="sb-portal-back">← Return to Dream Toolkit</a></div>',
        text,
        flags=re.DOTALL,
    )

    # Replace inline embody script with shared JS
    text = re.sub(r"<script>\s*function embodyArchetype.*?</script>\s*", "", text, flags=re.DOTALL)
    if "sb-portal.js" not in text:
        text = text.replace("</body>", '<script src="/js/sb-portal.js"></script>\n</body>', 1)

    path.write_text(text, encoding="utf-8")
    print(f"Refactored {path.name} → theme {theme}")


def main() -> int:
    for filename, theme in THEMES.items():
        refactor(STATIC / filename, theme)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
