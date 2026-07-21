---
name: update-landing-steps
description: >-
  Regenerate TinyTale landing “steps” imagery from two app screenshots: iPhone
  mockups, two-phone composite, and radial-gradient final asset under steps/.
  Use when the user asks to update steps phones, refresh steps composite,
  replace steps screenshots, or rerun the steps image pipeline.
---

# Update Landing Steps

Three-step pipeline for `tinytale-landing`. All assets live under [`steps/`](../../../steps/). **Pause for user approval after each step** unless they ask to run the full pipeline.

## Prerequisites

- New screenshots in [`steps/screenshots/`](../../../steps/screenshots/) as `1.png`, `2.png` (order matters — see layout below)
- Python 3 with Pillow: `python3 -c "from PIL import Image"`

## Quick run

```bash
python3 .cursor/skills/update-landing-steps/scripts/generate_steps.py mockups
python3 .cursor/skills/update-landing-steps/scripts/generate_steps.py composite
python3 .cursor/skills/update-landing-steps/scripts/generate_steps.py final
```

Or all at once (only when user explicitly wants no pauses):

```bash
python3 .cursor/skills/update-landing-steps/scripts/generate_steps.py all
```

## Workflow

### Step 1 — iPhone mockups

**Input:** `steps/screenshots/{1,2}.png`  
**Output:** `steps/iphone-mockups/iphone-{1,2}.png`

- No Dynamic Island, no shadow
- 6px border `#2A2A2C`, 52px corner radius
- Transparent background outside the phone

Show both mockups and wait for approval.

### Step 2 — Composite

**Output:** [`steps/steps-composite.png`](../../../steps/steps-composite.png)

Phone order left → right:

| Position | Mockup file | Typical screen |
|----------|-------------|----------------|
| Left (front) | `iphone-2.png` | Second step |
| Right (back) | `iphone-1.png` | First step |

Default layout:

- Horizontal overlap: **95px**
- Vertical step: **65px** (right y=0, left y=65)
- Z-order back→front: right → left

If user wants tweaks, adjust `OVERLAP` and `VERTICAL_STEP` in the script, regenerate, and wait for approval.

### Step 3 — Final image

**Output:** next `steps/final-stepsN.png` (auto-incremented)

Approved gradient settings:

| Parameter | Value |
|-----------|-------|
| Canvas (pre-crop) | 3020 × 3294 |
| Crop each side | 15% × 2 → 1480 × 1614 |
| Final crop | −5%×2 width, −15% height → **1336 × 1372** |
| Hero scale | 120% |
| Gradient center | `#504DF2` |
| Gradient radius | 620px |
| Falloff exponent | 1.1 |
| Outside radius | white |

To tweak gradient dominance, edit `GRADIENT_RADIUS` (wider = more purple) and `GRADIENT_FALLOFF` (lower = slower fade).

This step does **not** update `index.html` — wire the asset into the page separately when ready.

## Script reference

[`scripts/generate_steps.py`](scripts/generate_steps.py)

```bash
# Custom final filename (relative to steps/ or absolute)
python3 .cursor/skills/update-landing-steps/scripts/generate_steps.py final --output final-steps2.png
```

## Checklist

```
- [ ] Step 1: mockups from steps/screenshots/ → steps/iphone-mockups/
- [ ] User approved mockups
- [ ] Step 2: composite → steps/steps-composite.png
- [ ] User approved composite layout
- [ ] Step 3: steps/final-stepsN.png
```

## Notes

- Screenshot order maps by index: `steps/screenshots/1.png` → `iphone-1.png` (right), `2` → left.
- Replacing screenshots requires rerunning from Step 1.
- Layout-only changes: rerun from Step 2.
- Gradient-only changes: rerun Step 3 with existing `steps-composite.png`.
- Keep hero assets (`screenshots/`, `iphone-mockups/`, `final-hero*`) separate — this pipeline only touches `steps/`.
