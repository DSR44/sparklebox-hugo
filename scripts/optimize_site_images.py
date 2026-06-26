#!/usr/bin/env python3
"""Compress static images, build manifest, patch portal HTML dimensions."""

from __future__ import annotations

import json
import re
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
PORTAL_IMG_RE = re.compile(
    r'(<img\s+[^>]*src="([^"]+)"[^>]*class="archetype-image"[^>]*)(/?>)',
    re.IGNORECASE,
)


def which(cmd: str) -> str | None:
    from shutil import which as _which

    return _which(cmd)


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


def ensure_webp(path: Path) -> Path | None:
    if path.suffix.lower() == ".webp":
        return path
    target = path.with_suffix(".webp")
    run(["cwebp", "-q", str(WEBP_QUALITY), str(path), "-o", str(target)])
    return target


def public_path(path: Path) -> str:
    return f"/{path.relative_to(STATIC).as_posix()}"


def portal_image_files() -> list[Path]:
    found: list[Path] = []
    for html in sorted(STATIC.glob("*_portal.html")):
        text = html.read_text(encoding="utf-8")
        for match in PORTAL_IMG_RE.finditer(text):
            src = match.group(2)
            if src.startswith("http"):
                continue
            candidate = STATIC / src
            if candidate.is_file():
                found.append(candidate)
    return found


def patch_portal_html(manifest: dict[str, dict]) -> int:
    patched = 0
    for html in sorted(STATIC.glob("*_portal.html")):
        text = html.read_text(encoding="utf-8")

        def repl(match: re.Match[str]) -> str:
            prefix, src, closing = match.group(1), match.group(2), match.group(3)
            key = f"/{src}" if not src.startswith("/") else src
            meta = manifest.get(key, {})
            width = meta.get("width")
            height = meta.get("height")
            tag = prefix
            if width and height:
                tag = re.sub(r'\swidth="[^"]*"', "", tag)
                tag = re.sub(r'\sheight="[^"]*"', "", tag)
                tag = re.sub(r'\sloading="[^"]*"', "", tag)
                tag += f' width="{width}" height="{height}" loading="lazy"'
            return tag + closing

        new_text = PORTAL_IMG_RE.sub(repl, text)
        if new_text != text:
            html.write_text(new_text, encoding="utf-8")
            patched += 1
    return patched


def process_image(path: Path, manifest: dict[str, dict]) -> None:
    if path.suffix.lower() == ".webp":
        if path.with_suffix(".png").exists() or path.with_suffix(".jpg").exists():
            return
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


def build_manifest() -> dict[str, dict]:
    if not which("cwebp") or not which("sips"):
        raise RuntimeError("Requires cwebp and sips on PATH")

    manifest: dict[str, dict] = {}

    for folder in FOLDERS:
        base = STATIC / folder
        if not base.is_dir():
            continue
        for path in sorted(base.iterdir()):
            if not path.is_file() or path.suffix.lower() not in IMAGE_EXTS:
                continue
            if path.suffix.lower() == ".webp" and (
                path.with_suffix(".png").exists() or path.with_suffix(".jpg").exists()
            ):
                continue
            process_image(path, manifest)

    for path in portal_image_files():
        if path.suffix.lower() in IMAGE_EXTS:
            process_image(path, manifest)

    return manifest


def run_optimization() -> bool:
    try:
        manifest = build_manifest()
    except RuntimeError as exc:
        print(f"⚠️ Image optimization skipped: {exc}", file=sys.stderr)
        return False

    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_PATH.write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    portals = patch_portal_html(manifest)
    print(f"✅ Image manifest: {len(manifest)} entries → {MANIFEST_PATH.relative_to(ROOT)}")
    if portals:
        print(f"✅ Patched {portals} portal HTML file(s) with image dimensions")
    return True


def main() -> int:
    return 0 if run_optimization() else 1


if __name__ == "__main__":
    raise SystemExit(main())
