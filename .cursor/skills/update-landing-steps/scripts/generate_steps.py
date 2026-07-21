#!/usr/bin/env python3
"""Generate TinyTale landing steps assets (2 mockups → composite → final gradient image)."""

from __future__ import annotations

import argparse
import math
import re
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[4]
STEPS_DIR = ROOT / "steps"
SCREENSHOTS_DIR = STEPS_DIR / "screenshots"
MOCKUPS_DIR = STEPS_DIR / "iphone-mockups"
COMPOSITE_PATH = STEPS_DIR / "steps-composite.png"

# iPhone mockup (no island) — matches update-landing-hero
BORDER = 6
BORDER_COLOR = (42, 42, 44, 255)
CORNER_RADIUS = 52
TARGET_PHONE_SIZE = (425, 904)

# Two-phone composite: left=2 (front), right=1 (back)
OVERLAP = 95
VERTICAL_STEP = 65

# Final image (same gradient as hero v4)
CANVAS_SIZE = (3020, 3294)
HERO_SCALE = 1.2
GRADIENT_RADIUS = 620
GRADIENT_FALLOFF = 1.1
GRADIENT_CENTER = (0x50, 0x4D, 0xF2)
# Trim whitespace after compose (fraction removed from each edge, applied N times)
CROP_EACH_SIDE = 0.15
CROP_PASSES = 2
# Final tighten: reduce total width/height (centered crop, no content resize)
FINAL_WIDTH_REDUCE = 0.0975  # 5% then another 5% of remaining
FINAL_HEIGHT_REDUCE = 0.15

EXPECTED_SCREENSHOTS = ("1.png", "2.png")


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
    left = load_mockup(MOCKUPS_DIR / "iphone-2.png")
    right = load_mockup(MOCKUPS_DIR / "iphone-1.png")

    w, _ = left.size
    positions = [
        ("right", right, (w - OVERLAP, 0)),
        ("left", left, (0, VERTICAL_STEP)),
    ]

    max_x = max(x + img.size[0] for _, img, (x, _) in positions)
    max_y = max(y + img.size[1] for _, img, (_, y) in positions)
    canvas = Image.new("RGBA", (max_x, max_y), (0, 0, 0, 0))

    for name, img, (x, y) in positions:
        canvas.alpha_composite(img, (x, y))
        print(f"  {name}: ({x}, {y})")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output_path, "PNG")
    print(f"Saved {output_path} ({canvas.size[0]}x{canvas.size[1]})")


def create_final_image(composite_path: Path, output_path: Path) -> None:
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

    phones = Image.open(composite_path).convert("RGBA")
    phones = phones.resize(
        (round(phones.width * HERO_SCALE), round(phones.height * HERO_SCALE)),
        Image.Resampling.LANCZOS,
    )
    x = (width - phones.width) // 2
    y = (height - phones.height) // 2

    result = canvas.convert("RGBA")
    result.paste(phones, (x, y), phones)

    if CROP_EACH_SIDE > 0:
        for _ in range(CROP_PASSES):
            w, h = result.size
            left = round(w * CROP_EACH_SIDE)
            top = round(h * CROP_EACH_SIDE)
            right = w - left
            bottom = h - top
            result = result.crop((left, top, right, bottom))

    if FINAL_WIDTH_REDUCE > 0 or FINAL_HEIGHT_REDUCE > 0:
        w, h = result.size
        new_w = round(w * (1 - FINAL_WIDTH_REDUCE))
        new_h = round(h * (1 - FINAL_HEIGHT_REDUCE))
        left = (w - new_w) // 2
        top = (h - new_h) // 2
        result = result.crop((left, top, left + new_w, top + new_h))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.save(output_path, "PNG", optimize=True)
    print(f"Saved {output_path} ({result.size[0]}x{result.size[1]})")


def next_final_steps_path() -> Path:
    existing = sorted(STEPS_DIR.glob("final-steps*.png"))
    numbers = []
    for path in existing:
        match = re.search(r"final-steps(\d+)\.png$", path.name)
        if match:
            numbers.append(int(match.group(1)))
    next_num = max(numbers, default=0) + 1
    return STEPS_DIR / f"final-steps{next_num}.png"


def step_mockups(screenshots: tuple[str, ...] = EXPECTED_SCREENSHOTS) -> None:
    if len(screenshots) != 2:
        raise ValueError(f"Expected exactly 2 screenshots, got {len(screenshots)}")
    missing = [name for name in screenshots if not (SCREENSHOTS_DIR / name).exists()]
    if missing:
        raise FileNotFoundError(
            f"Missing screenshots in {SCREENSHOTS_DIR}: {', '.join(missing)}"
        )
    # Always write iphone-1 / iphone-2 regardless of source filenames
    for i, name in enumerate(screenshots, start=1):
        create_iphone_mockup(SCREENSHOTS_DIR / name, MOCKUPS_DIR / f"iphone-{i}.png")


def resolve_final_output(output: Path | None) -> Path:
    if output is None:
        return next_final_steps_path()
    if output.is_absolute():
        return output
    return STEPS_DIR / output


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate TinyTale landing steps assets")
    parser.add_argument(
        "step",
        choices=["mockups", "composite", "final", "all"],
        help="Pipeline step to run",
    )
    parser.add_argument(
        "--screenshots",
        nargs=2,
        metavar=("A", "B"),
        default=list(EXPECTED_SCREENSHOTS),
        help="Screenshot filenames in steps/screenshots/ (order: right/back, left/front)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        help="Final output path (default: next steps/final-stepsN.png)",
    )
    args = parser.parse_args()

    STEPS_DIR.mkdir(parents=True, exist_ok=True)
    screenshots = tuple(args.screenshots)

    if args.step in ("mockups", "all"):
        print(f"Step 1: iPhone mockups ({screenshots[0]}, {screenshots[1]})")
        step_mockups(screenshots)

    if args.step in ("composite", "all"):
        print("Step 2: Composite")
        create_composite()

    if args.step in ("final", "all"):
        print("Step 3: Final image")
        output = resolve_final_output(args.output)
        create_final_image(COMPOSITE_PATH, output)


if __name__ == "__main__":
    main()
