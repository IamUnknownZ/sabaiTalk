# SabaiTalk

SabaiTalk is a location-based social matching app focused on discovering compatible people nearby and recommending a fair public meeting place after a mutual match.

## Core flow
```text
Login
→ Profile + Interests
→ Location
→ Nearby Discovery
→ Match Score
→ Like / Pass
→ Mutual Match
→ Realtime Chat
→ Find a Place to Meet
→ Places + Routes
→ Fair Meeting Recommendation
→ Meeting Map
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
- Google Places
- Google Routes

## Current implementation status
The V1 foundation is implemented: auth/onboarding, privacy-safe nearby discovery, match scoring, like/pass and mutual matches, realtime chat services, avatar upload, block/report flows, and fair public meeting-place recommendations.

The app can also run in demo mode before external credentials are configured.

SDK 54 migration verification:
- `expo install --check` — dependencies up to date
- `npm run typecheck` — passes
- `npm run lint` — passes
- `npx expo-doctor` — 18/18 checks pass
- Metro startup smoke test — passes

Live end-to-end verification still requires the real Supabase project credentials and Google Places/Routes server keys.

## Project documents
Read these before implementation:
- `AGENTS.md` — rules for coding agents
- `AI_CONTEXT.md` — durable system memory/handoff for the next AI (summary only; does not override AGENTS/SYSTEM)
- `SYSTEM.md` — product/system specification
- `IMPLEMENTATION_PLAN.md` — detailed build sequence
- `API_SETUP.md` — credential placeholders and setup boundaries
- `SECURITY.md` — location, auth, API-key and privacy requirements
- `LICENSES.md` — open-source/template tracking
- `TESTER_PROMPT.md` — reusable browser/computer-control QA prompt for an AI tester
- `ref/` — visual references and palette

## Environment
Copy:
```text
.env.example
→ .env.local
```

Do not commit real secrets.

Credentials are configured progressively when each integration reaches its verification stage; development should not be blocked globally just because a later API key is not yet available.
