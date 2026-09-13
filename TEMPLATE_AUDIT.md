# SabaiTalk Template Audit

Audit date: 2026-09-13 (Asia/Bangkok)

## Repository 1 — MartsTech/tinder-clone
- Commit inspected: `64702cd`
- License: MIT
- Original stack: Expo 43, React Native 0.64, Firebase, MobX, React Navigation
- Useful ideas: reciprocal-like match flow, match list, realtime chat flow, profile update flow
- Decision: **reference/logic source only**. Firebase/MobX and the old Expo stack are not carried into SabaiTalk.
- SabaiTalk adaptation: matching/chat service boundaries are reimplemented for Supabase and Postgres.

## Repository 2 — stevenpersia/tinder-expo
- Commit inspected: `c777c09`
- License: MIT
- Original stack: Expo 45, React Native 0.68, TypeScript, React Navigation
- Useful ideas: profile card composition, matches grid, conversation row, profile-detail information hierarchy
- Decision: **primary UI/component base**.
- SabaiTalk adaptation: useful patterns were rewritten into modern Expo Router components and restyled to SabaiTalk. Old Tinder assets/colors/swiper dependency were not imported.

## Repository 3 — aman40399/cufy_application
- Commit inspected: `972b6285`
- License: **no LICENSE file found**
- Original stack: Expo 54, React Navigation, Reanimated
- Useful ideas: onboarding pacing, interest chips, modern discover/profile/chat visual hierarchy
- Decision: **visual/UX inspiration only**. No source code is copied from this repository.

## Technical base decision
SabaiTalk uses a **fresh Expo Router foundation now aligned to Expo SDK 54**, with Repo 2 treated as the primary permissively licensed UI reference and Repo 1 as a permissively licensed behavior/reference source. The project was initially bootstrapped on SDK 57 and intentionally migrated to SDK 54 before final V1 verification.

This avoids inheriting Expo 43/45, Firebase, MobX, Tinder branding, or stale navigation packages while preserving the useful open-source ideas.

## Current SabaiTalk foundation
- Expo SDK 54
- React Native 0.81.5
- TypeScript 5.9
- Expo Router 6
- `expo-location`
- `react-native-maps`
- Supabase JS
- PostGIS migration
- custom SabaiTalk design system and assets
