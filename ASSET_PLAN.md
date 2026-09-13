# SabaiTalk V1 — Asset Creation Plan

> Production asset source is now `ref/analyze all these/SabaiTalk-generated-assets/sabaitalk_ready/`. The older Python-generated pack has been superseded; app-ready copies live under `assets/` and are documented in `ASSETS.md`.

## Goal
Create a complete, cohesive, app-ready visual asset pack for SabaiTalk before UI implementation begins.

The asset pack must follow:
- `ref/color-palete.md`
- all visual references in `ref/`
- SabaiTalk identity: **people + location + fair midpoint + public activities**
- friendly, calm, modern, soft blue/green visual language
- no Tinder-style red/pink dating identity
- no embedded UI copy unless the asset is specifically a brand lockup
- fictional adults only for demo profile portraits

## Core palette
- Primary: `#78B7EE`
- Primary Light: `#A9D7F7`
- Background: `#F5FAFD`
- Surface: `#FFFFFF`
- Accent Green: `#9BCB9A`

Supporting colors from reference may be used for hair, skin, nature, water, benches and city details.

## Style
- clean modern illustration
- soft 2D/2.5D finish
- rounded forms
- soft natural lighting
- subtle depth, not photorealistic
- blue/green location motifs
- optimistic public-space imagery
- transparent backgrounds where useful for compositing
- avoid text baked into non-brand artwork
- avoid third-party logos and trademarks

---

## Production Manifest

### 1. Branding
Destination: `assets/branding/`

| File | Target | Background | Use |
|---|---:|---|---|
| `app-icon.png` | 1024×1024 | opaque | Expo/app icon |
| `logo-mark.png` | 1024×1024 | transparent | symbol-only branding |
| `logo-horizontal.png` | 1600×600 | transparent | headers/login/docs |
| `splash-logo.png` | 1200×1200 | transparent | splash screen |

Brand mark concept: two friendly person/location-pin forms meeting at one shared midpoint. Keep it simple enough to read at app-icon size.

### 2. Core / onboarding illustrations
Destination: `assets/illustrations/`

| File | Target use |
|---|---|
| `welcome.png` | welcome/login hero |
| `nearby.png` | nearby discovery onboarding |
| `meeting.png` | public meeting-place onboarding |
| `fair-meeting.png` | fair travel-time/midpoint concept |

Composition should leave breathing room for UI text around the artwork.

### 3. Empty / permission / state illustrations
Destination: `assets/states/`

| File | State |
|---|---|
| `location-permission.png` | request foreground location |
| `empty-nearby.png` | nobody in radius |
| `empty-matches.png` | no matches yet |
| `empty-chat.png` | no messages yet |
| `no-place-found.png` | no meeting candidate |
| `meeting-loading.png` | searching/fair-place calculation |

Do not bake error text into images; UI supplies localized copy.

### 4. Demo avatars
Destination: `assets/avatars/`

Create 12 fictional adult portraits:
- `demo-01.png` … `demo-12.png`
- diverse appearances and hairstyles
- all clearly adult
- friendly casual/student/young-professional styling
- consistent illustration style
- square/circular-safe framing
- no real people / celebrities

### 5. Place category assets
Destination: `assets/places/`

| File |
|---|
| `cafe.png` |
| `food.png` |
| `park.png` |
| `mall.png` |
| `cinema.png` |
| `study.png` |

Simple recognisable mini-illustrations/icons in the SabaiTalk palette.

### 6. Decorative reusable elements
Destination: `assets/decor/`

| File | Purpose |
|---|---|
| `location-pin.png` | generic SabaiTalk pin |
| `midpoint-pin.png` | recommended/fair midpoint |
| `route-dots.png` | dotted route ornament |
| `clouds.png` | background accent |
| `city-silhouette.png` | urban background |
| `park-elements.png` | trees/grass/public-space accent |

These should support compositing without forcing a fixed screen composition.

---

## Total expected V1 production assets
- Branding: 4
- Core illustrations: 4
- State illustrations: 6
- Demo avatars: 12
- Place assets: 6
- Decor: 6

**Total: 38 production PNG assets**

---

## Generation workflow
1. Generate coherent master assets using image generation.
2. Prefer individual production assets for branding.
3. Batch highly repeatable sets (avatars/categories/states) into clean equal-cell sheets only when necessary.
4. Split/crop sheets into individual PNG files.
5. Give files stable manifest names.
6. Validate dimensions, alpha/background, readability and style consistency.
7. Create a package/manifest usable by the Expo project.
8. Do not mark the durable asset goal complete until all 38 manifest entries exist or a specific asset is explicitly replaced by a documented vector/UI implementation.

## Acceptance criteria
- all 38 manifest entries accounted for
- no accidental text in non-brand images
- no copyrighted/trademark branding
- no exact third-party template artwork copied
- cohesive palette/style
- adult fictional demo profiles only
- app icon remains readable at small size
- transparent assets have clean edges
- generated output is organised and ready for later import into the Expo project
