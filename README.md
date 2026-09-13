# SabaiTalk

SabaiTalk is a location-based social matching app focused on discovering compatible people nearby and recommending a fair public meeting place after a mutual match.

## Core flow

```text
Login / Register
→ Profile + Interests
→ Foreground Location
→ Nearby Discovery
→ Like / Pass
→ Mutual Match
→ Realtime Chat
→ Find a Place to Meet
→ Google Places + Routes
→ Fair Meeting Recommendation
→ Destination-only Map
```

## Current stack

- Expo SDK 54
- React Native 0.81.5
- React 19.1
- TypeScript 5.9
- Expo Router 6
- Supabase Auth / Postgres / PostGIS / Storage / Realtime
- `expo-location`
- `react-native-maps`
- Google Places API (New)
- Google Routes API

## Runtime data policy: real-data-only

The application runtime does **not** fabricate profiles, conversations, chat messages, likes, passes, matches, locations, or meeting recommendations.

- Missing Supabase configuration produces an explicit setup/error state.
- Failed backend requests do not silently fall back to fake users.
- Discover uses only rows returned by the protected Supabase/PostGIS flow.
- Matches and chats use only real match/message rows.
- Fair Meeting uses only real recommendations returned by the deployed Edge Function.
- User avatars come from Supabase Storage; the local SabaiTalk logo mark is only a neutral visual fallback.
- The `interests` rows inserted by the migration are a static application catalog, not fake user/activity data.

## First-time setup

```bash
npm ci
cp .env.example .env.local
```

Then configure the real client values in `.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Server-only Google Places/Routes keys belong in Supabase Edge Function Secrets, never in `EXPO_PUBLIC_*`.

Read `REAL_API_HANDOFF.md` for the complete key/deployment checklist.

## Android identity

Permanent Android package:

```text
com.iamunknownz.sabaitalk
```

Use this exact package when restricting the Android Maps API key. The signing certificate SHA-1 must also match the build being installed.

## Backend deployment required

For a new Supabase project:

1. Configure/link the Supabase project.
2. Apply `supabase/migrations/0001_initial.sql`.
3. Apply `supabase/migrations/0002_matching_privacy_hardening.sql`.
4. Apply `supabase/migrations/0003_security_hardening.sql`.
5. Configure `GOOGLE_PLACES_API_KEY`, `GOOGLE_ROUTES_API_KEY`, and production `ALLOWED_ORIGINS` as Edge Function secrets.
6. Deploy `supabase/functions/meeting-recommendations/index.ts`.
7. Configure production Supabase Auth rate limits / CAPTCHA / email policy.
8. Create real tester accounts and verify Auth Guard → Onboarding Guard → Location → Discover → Match → Chat → Fair Meeting.

Do not seed fake user activity into production.

## Validation

Before handing over or committing:

```bash
npm run typecheck
npm run lint
npm run qa:backend
npx expo-doctor
```

For UI/routing work also run the web QA flow and exports.

A code/config pass does not replace live acceptance: Supabase RLS/RPCs, Realtime, Google Places/Routes, signing restrictions, and native Maps must still be verified with the actual project credentials and an Android build/device.

## Project documents

Recommended reading order:

1. `README.md` — current project status and setup
2. `AI_CONTEXT.md` — architecture/history context
3. `REAL_API_HANDOFF.md` — real API and deployment handoff
4. `API_SETUP.md` — integration details
5. `SECURITY.md` — privacy/security requirements
6. `AGENTS.md` / `SYSTEM.md` — implementation constraints

Additional planning/reference documents remain in the repository for design history.
