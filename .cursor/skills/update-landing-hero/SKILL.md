---
name: update-landing-hero
description: >-
  Regenerate the TinyTale landing page hero image from app screenshots: iPhone
  mockups, three-phone composite, and radial-gradient final asset. Use when the
  user asks to update the hero, refresh final-hero, replace hero screenshots,
  or rerun the hero image pipeline.
---

# Update Landing Hero

Three-step pipeline for `tinytale-landing`. **Pause for user approval after each step** unless they ask to run the full pipeline.

## Prerequisites

- New screenshots in [`screenshots/`](../../../screenshots/) as `1.png`, `2.png`, `3.png` (order matters — see layout below)
- Python 3 with Pillow: `python3 -c "from PIL import Image"`

## Quick run

```bash
python3 .cursor/skills/update-landing-hero/scripts/generate_hero.py mockups
python3 .cursor/skills/update-landing-hero/scripts/generate_hero.py composite
python3 .cursor/skills/update-landing-hero/scripts/generate_hero.py final
```

Or all at once (only when user explicitly wants no pauses):

```bash
python3 .cursor/skills/update-landing-hero/scripts/generate_hero.py all
```

## Workflow

### Step 1 — iPhone mockups

**Input:** `screenshots/{1,2,3}.png`  
**Output:** `iphone-mockups/iphone-{1,2,3}.png`

- No Dynamic Island, no shadow
- 6px border `#2A2A2C`, 52px corner radius
- Transparent background outside the phone

Show all three mockups and wait for approval.

### Step 2 — Composite

**Output:** [`hero3.png`](../../../hero3.png)

Phone order left → right:

| Position | Mockup file | Typical screen |
|----------|-------------|----------------|
| Left (front) | `iphone-3.png` | Book reader |
| Center | `iphone-2.png` | Story library |
| Right (back) | `iphone-1.png` | Upload hero |

Default layout (approved):

- Horizontal overlap: **95px**
- Vertical step: **65px** (right y=0, center y=65, left y=130)
- Z-order back→front: right → center → left

If user wants tweaks, adjust `OVERLAP` and `VERTICAL_STEP` in the script, regenerate, and wait for approval.

### Step 3 — Final hero + HTML

**Output:** next `final-heroN.png` (auto-incremented)  
**Update:** [`index.html`](../../../index.html) `hero-image` src

Approved gradient settings (v4):

| Parameter | Value |
|-----------|-------|
| Canvas | 3020 × 3294 |
| Hero scale | 120% |
| Gradient center | `#504DF2` |
| Gradient radius | 920px |
| Falloff exponent | 0.85 |
| Outside radius | white |

To tweak gradient dominance, edit `GRADIENT_RADIUS` (wider = more purple) and `GRADIENT_FALLOFF` (lower = slower fade).

## Script reference

[`scripts/generate_hero.py`](scripts/generate_hero.py)

```bash
# Custom final filename
python3 .cursor/skills/update-landing-hero/scripts/generate_hero.py final --output final-hero4.png

# Generate image without touching HTML
python3 .cursor/skills/update-landing-hero/scripts/generate_hero.py final --no-html
```

## Checklist

```
- [ ] Step 1: mockups from screenshots/ → iphone-mockups/
- [ ] User approved mockups
- [ ] Step 2: composite → hero3.png
- [ ] User approved composite layout
- [ ] Step 3: final-heroN.png + index.html update
```

## Notes

- Screenshot order maps by index: `screenshots/1.png` → `iphone-1.png` (right), `2` → center, `3` → left.
- Replacing screenshots requires rerunning from Step 1.
- Layout-only changes: rerun from Step 2.
- Gradient-only changes: rerun Step 3 with existing `hero3.png`.
