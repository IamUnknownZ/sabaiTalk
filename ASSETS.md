# SabaiTalk Asset Manifest

The runtime app is **real-data-only**. Local assets are branding, UI illustrations, decorations, and place-category artwork only. User profile photos are real uploads stored in Supabase Storage; there are no bundled demo/profile-person avatars in production source.

## Branding
- `assets/branding/adaptive-icon.png`
- `assets/branding/app-icon.png`
- `assets/branding/logo-horizontal.png`
- `assets/branding/logo-mark.png`
- `assets/branding/splash-logo.png`

`assets/branding/logo-mark.png` is also the privacy-safe neutral fallback when a real user has not uploaded an avatar.

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

## Place categories
- `assets/places/cafe.png`
- `assets/places/cinema.png`
- `assets/places/food.png`
- `assets/places/mall.png`
- `assets/places/park.png`
- `assets/places/study.png`

## Runtime avatar policy
- Real profile photos: Supabase Storage bucket `avatars`.
- Profile row stores the resulting `avatar_url`.
- No local fictional-person avatar is used as user data.
- If a real user has no avatar, the app shows the SabaiTalk logo mark.
