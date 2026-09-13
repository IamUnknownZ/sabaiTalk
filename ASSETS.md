# SabaiTalk Asset Manifest

Primary generated asset source:

`ref/analyze all these/SabaiTalk-generated-assets/sabaitalk_ready/`

The production app consumes copies from `assets/`. Branding, illustrations, places, and decorations are PNG files. Demo/fallback avatars use WebP.

## Avatars
- `assets/avatars/avatar-01.webp`
- `assets/avatars/avatar-02.webp`
- `assets/avatars/avatar-03.webp`
- `assets/avatars/avatar-04.webp`
- `assets/avatars/avatar-05.webp`
- `assets/avatars/avatar-06.webp`
- `assets/avatars/avatar-07.webp`
- `assets/avatars/avatar-08.webp`
- `assets/avatars/avatar-09.webp`
- `assets/avatars/avatar-10.webp`
- `assets/avatars/avatar-11.webp`
- `assets/avatars/avatar-12.webp`

## Branding
- `assets/branding/adaptive-icon.png`
- `assets/branding/app-icon.png`
- `assets/branding/logo-horizontal.png`
- `assets/branding/logo-mark.png`
- `assets/branding/splash-logo.png`

## Decorations
- `assets/decorations/city.png`
- `assets/decorations/clouds.png`
- `assets/decorations/scribbles.png`
- `assets/decorations/trees.png`

## Illustrations
- `assets/illustrations/empty-chat.png`
- `assets/illustrations/empty-matches.png`
- `assets/illustrations/empty-nearby.png`
- `assets/illustrations/fair-meeting.png`
- `assets/illustrations/location-denied.png`
- `assets/illustrations/location-permission.png`
- `assets/illustrations/matching.png`
- `assets/illustrations/meeting.png`
- `assets/illustrations/nearby.png`
- `assets/illustrations/no-place-found.png`
- `assets/illustrations/welcome.png`

## Places
- `assets/places/cafe.png`
- `assets/places/cinema.png`
- `assets/places/food.png`
- `assets/places/mall.png`
- `assets/places/park.png`
- `assets/places/study.png`

## Integration notes
- Expo app icon, adaptive icon, splash image, and in-app logo references already point at `assets/branding/`.
- Existing illustration/place references keep the same filenames, so replacing the production files automatically updates those screens.
- Avatar references were migrated from the old PNG set to the generated WebP files.
- The previous generated `sparkles.png` decoration and old PNG avatars were removed from the production asset tree because they are not part of the new `sabaitalk_ready` pack.
