#!/usr/bin/env python3
"""Compress static images and build Hugo data/image_manifest.json."""

from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STATIC = ROOT / "static"
MANIFEST_PATH = ROOT / "data" / "image_manifest.json"
FOLDERS = ("pinterest-images", "generic-post-images", "images")
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp"}
MAX_EDGE = 1200
WEBP_QUALITY = 82
JPEG_QUALITY = 75


def run(cmd: list[str]) -> None:
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def dimensions(path: Path) -> tuple[int, int]:
    out = subprocess.check_output(
        ["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)],
        text=True,
    )
    width = height = 0
    for line in out.splitlines():
        if "pixelWidth" in line:
            width = int(line.split()[-1])
        if "pixelHeight" in line:
            height = int(line.split()[-1])
    return width, height


def optimize_raster(path: Path) -> None:
    ext = path.suffix.lower()
    if ext in {".jpg", ".jpeg"}:
        run(["sips", "-Z", str(MAX_EDGE), "-s", "formatOptions", str(JPEG_QUALITY), str(path)])
    elif ext == ".png":
        run(["sips", "-Z", str(MAX_EDGE), str(path)])


def webp_path(path: Path) -> Path:
    return path.with_suffix(".webp")


def ensure_webp(path: Path) -> Path | None:
    target = webp_path(path)
    if path.suffix.lower() == ".webp":
        return path
    run(["cwebp", "-q", str(WEBP_QUALITY), str(path), "-o", str(target)])
    return target


def public_path(path: Path) -> str:
    rel = path.relative_to(STATIC).as_posix()
    return f"/{rel}"


def main() -> int:
    if not shutil_which("cwebp") or not shutil_which("sips"):
        print("Requires cwebp and sips on PATH", file=sys.stderr)
        return 1

    manifest: dict[str, dict[str, int | str]] = {}

    for folder in FOLDERS:
        base = STATIC / folder
        if not base.is_dir():
            continue
        for path in sorted(base.iterdir()):
            if not path.is_file() or path.suffix.lower() not in IMAGE_EXTS:
                continue
            if path.suffix.lower() == ".webp" and path.with_suffix(".png").exists():
                continue
            if path.suffix.lower() == ".webp" and path.with_suffix(".jpg").exists():
                continue

            print(f"Optimizing {path.relative_to(ROOT)}")
            if path.suffix.lower() != ".webp":
                optimize_raster(path)
            webp = ensure_webp(path if path.suffix.lower() != ".webp" else path)
            width, height = dimensions(path if path.suffix.lower() != ".webp" else path)
            key = public_path(path if path.suffix.lower() != ".webp" else path)
            entry: dict[str, int | str] = {"width": width, "height": height}
            if webp and webp.exists() and webp != path:
                entry["webp"] = public_path(webp)
            manifest[key] = entry

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"Wrote {len(manifest)} entries to {MANIFEST_PATH.relative_to(ROOT)}")
    return 0


def shutil_which(cmd: str) -> str | None:
    from shutil import which

    return which(cmd)


if __name__ == "__main__":
    raise SystemExit(main())
