#!/usr/bin/env python3
"""Deterministic screenshot gate compatible with the doc-screenshots skill.

Run on a remote runner with Pillow. Dimension heuristics cannot establish image
semantics: capture callers must still use a single Playwright element.
"""
import argparse
import io
import json
import re
from pathlib import Path
from PIL import Image, ImageOps

BUDGET = 4_500_000
SCREEN_SIZES = {(1920, 1080), (2560, 1440), (3840, 2160), (1440, 900),
                (1366, 768), (1280, 720), (1536, 864), (2880, 1800),
                (3024, 1964), (3456, 2234)}


def normalize(path, args):
    result = {"input": str(path), "ok": False, "warnings": []}
    try:
        with Image.open(path) as opened:
            opened.load()
            original = opened.size
            result["original_size"] = list(original)
            if max(original) >= 8000:
                return dict(result, severity=3, error="Image exceeds hard 8000px input limit; crop to an element")
            suspected = (original[0] > args.max_element_width or
                         original[1] > args.max_element_height or original in SCREEN_SIZES)
            if suspected and not args.allow_fullscreen:
                return dict(result, severity=3, error="Suspected full-screen or oversized capture; crop to one element")
            if suspected:
                result["warnings"].append("Intentional full-window override used")
            # Fresh image drops EXIF, ICC and text metadata; apply orientation first.
            oriented = ImageOps.exif_transpose(opened)
            mode = "RGBA" if "A" in oriented.getbands() and args.format == "png" else "RGB"
            image = Image.new(mode, oriented.size)
            image.paste(oriented.convert(mode))
        if args.check_only:
            if path.suffix.lower() not in {".png", ".jpg", ".jpeg"} or max(image.size) > args.max_edge or path.stat().st_size >= BUDGET:
                return dict(result, severity=2, error="Existing image fails normalized format/dimension/byte limits")
            return dict(result, ok=True, output=str(path.resolve()), final_size=list(image.size),
                        bytes=path.stat().st_size, downscaled=False)
        image.thumbnail((args.max_edge, args.max_edge), Image.Resampling.LANCZOS)
        while True:
            buffer = io.BytesIO()
            options = {"optimize": True} if args.format == "png" else {"quality": 90, "optimize": True}
            image.save(buffer, format=args.format.upper(), **options)
            content = buffer.getvalue()
            if len(content) < BUDGET:
                break
            if min(image.size) < 32:
                return dict(result, severity=2, error="Cannot satisfy byte budget")
            image = image.resize((max(1, int(image.width * .85)), max(1, int(image.height * .85))), Image.Resampling.LANCZOS)
        name = args.name or path.stem.removesuffix('-raw')
        name = re.sub(r'[^A-Za-z0-9._-]', '-', name)
        if not name or name in {'.', '..'}:
            return dict(result, severity=2, error="Invalid output name")
        output = args.out_dir / (name + ('.png' if args.format == 'png' else '.jpg'))
        if output.resolve() == path.resolve():
            return dict(result, severity=2, error="Refusing to overwrite original capture")
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_bytes(content)
        return dict(result, ok=True, output=str(output.resolve()), final_size=list(image.size),
                    bytes=len(content), downscaled=image.size != original)
    except Exception as error:
        return dict(result, severity=2, error=str(error))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('images', nargs='+', type=Path)
    parser.add_argument('--name')
    parser.add_argument('--out-dir', type=Path, default=Path('docs/assets/img'))
    parser.add_argument('--max-edge', type=int, default=1568)
    parser.add_argument('--max-element-width', type=int, default=2000)
    parser.add_argument('--max-element-height', type=int, default=1400)
    parser.add_argument('--format', choices=['png', 'jpeg'], default='png')
    parser.add_argument('--allow-fullscreen', action='store_true')
    parser.add_argument('--check-only', action='store_true')
    args = parser.parse_args()
    if not 1 <= args.max_edge <= 1568:
        parser.error('--max-edge must be within 1..1568')
    if args.name and len(args.images) > 1:
        parser.error('--name requires one input')
    success = True
    for path in args.images:
        result = normalize(path, args)
        print(json.dumps(result), flush=True)
        success = success and result['ok']
    return 0 if success else 1


if __name__ == '__main__':
    raise SystemExit(main())
