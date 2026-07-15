#!/usr/bin/env python3
"""Generate TinyTale landing hero assets (mockups → composite → final gradient image)."""

from __future__ import annotations

import argparse
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
SCREENSHOTS_DIR = ROOT / "screenshots"
MOCKUPS_DIR = ROOT / "iphone-mockups"
COMPOSITE_PATH = ROOT / "hero3.png"
INDEX_HTML = ROOT / "index.html"

# iPhone mockup (no island)
BORDER = 6
BORDER_COLOR = (42, 42, 44, 255)
CORNER_RADIUS = 52
TARGET_PHONE_SIZE = (425, 904)

# Composite layout: left=3, center=2, right=1
OVERLAP = 95
VERTICAL_STEP = 65

# Final hero (approved v4 settings)
CANVAS_SIZE = (3020, 3294)
HERO_SCALE = 1.2
GRADIENT_RADIUS = 920
GRADIENT_FALLOFF = 0.85
GRADIENT_CENTER = (0x50, 0x4D, 0xF2)


def rounded_rect_mask(size: tuple[int, int], radius: int, rect: list[int] | None = None) -> Image.Image:
    w, h = size
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    if rect is None:
        rect = [0, 0, w - 1, h - 1]
    draw.rounded_rectangle(rect, radius=radius, fill=255)
    return mask


def create_iphone_mockup(screenshot_path: Path, output_path: Path) -> None:
    screenshot = Image.open(screenshot_path).convert("RGBA")
    sw, sh = screenshot.size
    screen_radius = CORNER_RADIUS - BORDER
    total_w = sw + 2 * BORDER
    total_h = sh + 2 * BORDER

    canvas = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    outer_mask = rounded_rect_mask((total_w, total_h), CORNER_RADIUS)
    body = Image.new("RGBA", (total_w, total_h), BORDER_COLOR)
    canvas.paste(body, mask=outer_mask)

    screen_box = [BORDER, BORDER, total_w - BORDER - 1, total_h - BORDER - 1]
    screen_mask = rounded_rect_mask((total_w, total_h), screen_radius, screen_box)
    screen_layer = Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0))
    screen_layer.paste(screenshot, (BORDER, BORDER))
    canvas = Image.alpha_composite(
        canvas,
        Image.composite(
            screen_layer,
            Image.new("RGBA", (total_w, total_h), (0, 0, 0, 0)),
            screen_mask,
        ),
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, "PNG")
    print(f"Saved {output_path} ({canvas.size[0]}x{canvas.size[1]})")


def load_mockup(path: Path) -> Image.Image:
    img = Image.open(path).convert("RGBA")
    if img.size != TARGET_PHONE_SIZE:
        img = img.resize(TARGET_PHONE_SIZE, Image.Resampling.LANCZOS)
    return img


def create_composite(output_path: Path = COMPOSITE_PATH) -> None:
    left = load_mockup(MOCKUPS_DIR / "iphone-3.png")
    center = load_mockup(MOCKUPS_DIR / "iphone-2.png")
    right = load_mockup(MOCKUPS_DIR / "iphone-1.png")

    w, _ = left.size
    positions = [
        ("right", right, (2 * (w - OVERLAP), 0)),
        ("center", center, (w - OVERLAP, VERTICAL_STEP)),
        ("left", left, (0, 2 * VERTICAL_STEP)),
    ]

    max_x = max(x + img.size[0] for _, img, (x, _) in positions)
    max_y = max(y + img.size[1] for _, img, (_, y) in positions)
    canvas = Image.new("RGBA", (max_x, max_y), (0, 0, 0, 0))

    for name, img, (x, y) in positions:
        canvas.alpha_composite(img, (x, y))
        print(f"  {name}: ({x}, {y})")

    canvas.save(output_path, "PNG")
    print(f"Saved {output_path} ({canvas.size[0]}x{canvas.size[1]})")


def create_final_hero(composite_path: Path, output_path: Path) -> None:
    width, height = CANVAS_SIZE
    cx, cy = width / 2, height / 2
    r1, g1, b1 = GRADIENT_CENTER
    r2, g2, b2 = 255, 255, 255

    canvas = Image.new("RGB", (width, height), (255, 255, 255))
    pixels = canvas.load()
    for y in range(height):
        for x in range(width):
            dist = math.hypot(x - cx, y - cy)
            if dist >= GRADIENT_RADIUS:
                continue
            t = (dist / GRADIENT_RADIUS) ** GRADIENT_FALLOFF
            pixels[x, y] = (
                int(r1 + (r2 - r1) * t),
                int(g1 + (g2 - g1) * t),
                int(b1 + (b2 - b1) * t),
            )

    hero = Image.open(composite_path).convert("RGBA")
    hero = hero.resize(
        (round(hero.width * HERO_SCALE), round(hero.height * HERO_SCALE)),
        Image.Resampling.LANCZOS,
    )
    x = (width - hero.width) // 2
    y = (height - hero.height) // 2

    result = canvas.convert("RGBA")
    result.paste(hero, (x, y), hero)
    result.save(output_path, "PNG", optimize=True)
    print(f"Saved {output_path} ({width}x{height})")


def next_final_hero_path() -> Path:
    existing = sorted(ROOT.glob("final-hero*.png"))
    numbers = []
    for path in existing:
        match = re.search(r"final-hero(\d+)\.png$", path.name)
        if match:
            numbers.append(int(match.group(1)))
    next_num = max(numbers, default=2) + 1
    return ROOT / f"final-hero{next_num}.png"


def update_index_html(hero_filename: str) -> None:
    html = INDEX_HTML.read_text()
    updated = re.sub(
        r'(<img class="hero-image" src=")final-hero\d+\.png(")',
        rf"\g<1>{hero_filename}\g<2>",
        html,
        count=1,
    )
    if updated == html:
        raise RuntimeError("Could not find hero-image src in index.html")
    INDEX_HTML.write_text(updated)
    print(f"Updated {INDEX_HTML} → {hero_filename}")


def step_mockups() -> None:
    screenshots = sorted(SCREENSHOTS_DIR.glob("*.png"))
    if not screenshots:
        raise FileNotFoundError(f"No PNG files in {SCREENSHOTS_DIR}")
    for i, src in enumerate(screenshots, start=1):
        create_iphone_mockup(src, MOCKUPS_DIR / f"iphone-{i}.png")


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate TinyTale landing hero assets")
    parser.add_argument(
        "step",
        choices=["mockups", "composite", "final", "all"],
        help="Pipeline step to run",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Final hero output path (default: next final-heroN.png)",
    )
    parser.add_argument(
        "--no-html",
        action="store_true",
        help="Skip updating index.html (final step only)",
    )
    args = parser.parse_args()

    if args.step in ("mockups", "all"):
        print("Step 1: iPhone mockups")
        step_mockups()

    if args.step in ("composite", "all"):
        print("Step 2: Composite")
        create_composite()

    if args.step in ("final", "all"):
        print("Step 3: Final hero + HTML")
        output = args.output or next_final_hero_path()
        create_final_hero(COMPOSITE_PATH, output)
        if not args.no_html:
            update_index_html(output.name)


if __name__ == "__main__":
    main()
