#!/usr/bin/env python3
"""Run before git push: optimize images + stage manifest/webp files."""

from __future__ import annotations

import subprocess
import sys
from pathlib import Path

HUGO_DIR = Path(__file__).resolve().parents[1]
OPTIMIZE = HUGO_DIR / "scripts" / "optimize_site_images.py"


def run_before_publish() -> bool:
    if not OPTIMIZE.is_file():
        print(f"⚠️ Missing {OPTIMIZE}", file=sys.stderr)
        return False
    result = subprocess.run(
        [sys.executable, str(OPTIMIZE)],
        cwd=HUGO_DIR,
        capture_output=True,
        text=True,
    )
    if result.stdout:
        print(result.stdout.rstrip())
    if result.returncode != 0:
        print(result.stderr or "Image optimization failed", file=sys.stderr)
        return False
    return True


if __name__ == "__main__":
    raise SystemExit(0 if run_before_publish() else 1)
