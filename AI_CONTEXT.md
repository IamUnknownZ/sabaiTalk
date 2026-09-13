# SabaiTalk — AI Context / Handoff Memory

Last updated: 2026-09-13

This file is a durable handoff for another AI/agent. It summarizes the current product, architecture, rules, recent bugs/fixes, testing workflow, and next plan.

**Authority rule:** this file is context, not the highest source of truth. If anything conflicts, follow:
1. current user instruction,
2. `AGENTS.md`,
3. `SYSTEM.md`,
4. `IMPLEMENTATION_PLAN.md`,
5. current code,
6. visual references under `ref/`.

Project root:
workspace root (`.`)

lnwjud workspace:
`ec7877e2-5c04-4a42-bcf9-6c4e4a3649f0`

---

## 1. Product identity

Thai:
**สบายTalk — แอปค้นหาและพูดคุยกับผู้คนใกล้ตัวตามความสนใจ พร้อมระบบแนะนำสถานที่นัดพบที่เหมาะสมกับทั้งสองฝ่าย**

English:
**Location-Based Social Matching App**

Signature flow:
**Find someone nearby → Match by shared interests → Recommend a fair public place for both people to meet.**

SabaiTalk is social + location based. It is **not** a Tinder clone. Location/discovery is more important than romantic/heart language.

Main product flow:
```text
Welcome
→ Login/Register
→ Profile setup
→ Interests
→ Foreground location
→ Discover nearby people
→ Like / Pass
→ Mutual Match
→ Realtime Chat
→ Find a fair public place
→ Google Places candidates
→ Google Routes travel times
→ Fairness ranking
→ Destination-only meeting map
```

---

## 2. V1 scope

Included:
- Register/Login
- Profile: name/photo/bio
- Interests
- Foreground location via `expo-location`
- Nearby people query
- Distance filter
- Interest matching
- Deterministic match score
- Like/Pass
- Mutual match
- Realtime chat
- Approximate distance/area privacy
- Find Place to Meet
- Smart Meeting Point
- Google Places public venues
- Fair Meeting Score using both travel times
- Google Routes matrix
- Open external Maps
- Block/Report

Explicitly out of V1:
- video call
- voice call
- realtime/live location
- background tracking
- geofencing
- push notifications
- AI recommendations

---

## 3. Non-negotiable privacy and data rules

### Location
Exact GPS is sensitive.

Allowed:
- exact coordinates stored privately for server-side calculations,
- approximate distance,
- broad approximate area,
- server-side meeting midpoint/travel calculations.

Never expose:
- another user's exact latitude/longitude,
- precise user map pins,
- live bearings,
- home/origin points,
- background/live location.

Radar is illustrative only. It may communicate distance bands, but must never imply real direction.

Meeting maps show **public destination only**, never user origins.

### Real database rule
This is a hard user requirement:

**Real Supabase test/staging/production environments must contain tester-created accounts and tester-generated activity only.**

Do not seed into real Supabase:
- fake users/profiles,
- fake likes/passes,
- fake matches,
- fake chats,
- fake user locations,
- fake meeting records.

Allowed seed data:
- static catalog/reference data such as the interest taxonomy.

Local demo/mock profiles may exist only for offline UI development when Supabase is not configured.

Important current behavior:
- if Supabase config is absent → local demo mode may be used.
- if Supabase config is present and a live fetch fails → do **not** silently fall back to fake people/matches.

This was fixed in:
- `src/hooks/use-nearby-profiles.ts`
- `src/hooks/use-my-matches.ts`

---

## 4. Current technology stack

From `package.json`:
- Expo SDK 54
- React Native 0.81.5
- React 19.1
- React DOM 19.1
- TypeScript 5.9
- Expo Router 6
- React Native Web 0.21
- Supabase JS 2.x
- AsyncStorage
- `expo-location`
- `expo-image-picker`
- `react-native-maps` 1.20.1
- `react-native-reanimated` 4.1.1
- React Native Gesture Handler
- React Native Screens

Do not introduce `expo-maps` unless the user explicitly changes that decision.

Do not add Three.js by default. See the radar plan below.

---

## 5. Current route map

Routes were deliberately made unique because Expo Router route groups do not create unique public URL paths.

Current routes:

```text
/                     Welcome
/login                Login
/register             Register

/profile-setup        Onboarding profile setup
/interests            Onboarding interests
/location             Onboarding foreground location

/discover             Discover tab
/matches              Matches tab
/chats                Chat list tab
/profile              Own Profile tab

/profile/[id]         Public profile detail
/chat/[id]            Chat room
/match/[id]           Match-success screen
/meeting/[id]         Fair Meeting flow
```

Important root-cause fix:
- `src/app/(onboarding)/profile.tsx` was renamed to `profile-setup.tsx`.
- `src/app/(tabs)/index.tsx` was renamed to `discover.tsx`.

Why:
- previously both onboarding Profile and tab Profile mapped to `/profile`.
- previously Welcome and tab Discover both mapped to `/`.
- direct web navigation/refresh could resolve the wrong screen.

When adding routes, do not create the same effective URL in two route groups.

---

## 6. Source tree overview

Core app:
```text
src/app/
  index.tsx
  (auth)/
    login.tsx
    register.tsx
  (onboarding)/
    profile-setup.tsx
    interests.tsx
    location.tsx
  (tabs)/
    _layout.tsx
    discover.tsx
    matches.tsx
    chats.tsx
    profile.tsx
  profile/[id].tsx
  chat/[id].tsx
  match/[id].tsx
  meeting/[id].tsx
```

Shared UI:
```text
src/components/
  ProfileCard.tsx
  NearbyRadar.tsx
  ConversationRow.tsx
  MeetingMap.tsx
  MeetingMap.web.tsx
  ui/
    Screen.tsx
    SabaiButton.tsx
    InterestChip.tsx
    LocationBadge.tsx
    MatchScoreBadge.tsx
    IllustratedEmptyState.tsx
```

Hooks:
```text
src/hooks/
  use-current-location.ts
  use-nearby-profiles.ts
  use-my-matches.ts
```

Services:
```text
src/services/
  auth.ts
  avatar.ts
  profile.ts
  social.ts
  matching.ts
  matches.ts
  messages.ts
  meeting.ts
  meeting-api.ts
  safety.ts
```

State/config:
```text
src/lib/
  env.ts
  supabase.ts
  demo-state.ts
```

Backend:
```text
supabase/
  migrations/0001_initial.sql
  functions/meeting-recommendations/index.ts
```

---

## 7. Supabase architecture

Main tables:
- `profiles`
- `profile_locations`
- `interests`
- `user_interests`
- `likes`
- `passes`
- `matches`
- `messages`
- `blocks`
- `reports`

Exact location is separated:
- public-ish profile data → `profiles`
- exact PostGIS point → `profile_locations`

RLS is enabled across private tables.

Important RPCs:
- `set_my_location(lat, lng)`
- `nearby_profiles(radius_meters, result_limit)`
- `like_profile(target_user)`
- `block_profile(target_user)`
- `my_matches()`
- `meeting_origins(target_match)`

`meeting_origins` is service-role only.

Nearby discovery:
- PostGIS `ST_DWithin`
- excludes self
- excludes blocked relationships
- excludes previously passed users
- returns distance but not raw coordinates

Mutual like:
- `like_profile` inserts outgoing like
- checks reciprocal like
- creates/reactivates a sorted unique match pair atomically

Realtime:
- `messages` is added to Supabase Realtime publication
- chat subscription listens for INSERT events

Storage:
- public-read `avatars` bucket
- owner-only insert/update/delete under `<user-id>/...`

---

## 8. Matching formula

Implemented in:
`src/services/matching.ts`

Score:
- 55% shared interests
- 30% distance
- 15% activity

Interest score:
shared / union × 100

Distance:
linear decay inside radius.

Activity:
`100 - lastActiveMinutes * 1.5`, clamped.

Final:
```text
interest * 0.55
+ distance * 0.30
+ activity * 0.15
```

This is deterministic. Do not replace with AI recommendations in V1.

---

## 9. Fair Meeting architecture

Client:
`src/services/meeting-api.ts`

Server:
`supabase/functions/meeting-recommendations/index.ts`

Flow:
```text
authenticated client
→ meeting-recommendations Edge Function
→ validate JWT
→ validate active mutual match + membership
→ service-role fetch exact origins
→ calculate geographic midpoint
→ Google Places Nearby Search
→ Google Routes route matrix
→ score fairness
→ return public destinations + travel metrics
```

The Edge Function never returns the two exact origins.

Candidate categories:
- cafe
- food
- park
- mall
- cinema
- study

Fairness penalizes:
- imbalance between both travel times,
- excessive combined travel burden.

Destination response includes:
- public place name/address,
- destination lat/lng,
- rating/open state,
- your travel minutes,
- friend's travel minutes,
- fairness score,
- total travel minutes.

---

## 10. Maps

Native:
`src/components/MeetingMap.tsx`
uses `react-native-maps`.

Web:
`src/components/MeetingMap.web.tsx`
uses a web-safe destination preview.

Rules:
- map is used only for the recommended public meeting destination,
- never place nearby people on a real map,
- never show either user's origin,
- Radar remains a separate illustrative discovery UI.

---

## 11. Current Discover direction

Discover is now **Radar-first**.

Current behavior:
```text
Open /discover
→ animated illustrative radar
→ non-directional nearby result rows
→ tap a person
→ compact profile preview
→ Like / Pass / open full profile
→ return to scan
```

Cards mode remains available as a secondary mode.

Radar privacy:
- no compass/bearing avatar placements,
- explicit copy says it is illustrative,
- distance only,
- no live pins.

Current animation uses React Native Animated/Reanimated-level concepts only.

### Three.js decision
Do not add Three.js now.

Only prototype Three.js later if a tester/user explicitly says the 2D radar is too weak and the desired design genuinely needs:
- real 3D depth,
- volumetric particles,
- 3D globe/scanner,
- camera movement impossible to reproduce cleanly in 2D.

Before adopting Three.js:
- test Android performance,
- test Expo/build compatibility,
- compare against a lighter Reanimated/SVG/Skia option,
- preserve privacy semantics.

---

## 12. Visual direction / anti-AI-slop rules

Primary visual reference:
`.template-research/repo2-tinder-expo/`

Secondary:
`.template-research/repo1-martstech/expo/`

Repo2 is the main skeleton:
- simple top utility controls,
- image-first content,
- two-column Matches,
- simple Messages rows,
- image hero + overlapping profile detail surface,
- restrained shadows/radii.

Repo1 is secondary support:
- match celebration,
- action buttons,
- chat structure,
- exhausted state,
- simple forms.

Do not drift into generic AI dashboard UI.

Anti-slop rules:
- fewer cards,
- avoid card-inside-card stacks,
- do not center every block,
- use one dominant visual per screen,
- keep hero images compact enough that content/actions remain visible,
- use consistent spacing rhythm,
- use subtle shadows,
- avoid unnecessary pills/badges,
- image/content hierarchy should feel like a real social app, not a generated admin dashboard.

Brand palette is defined in:
`src/constants/theme.ts`
and
`ref/color-palete.md`

Main colors:
- blue `#78B7EE`
- strong blue `#2D8CFF`
- light blue `#A9D7F7`
- mint `#5EE2B8`
- navy `#173A6B`
- background `#F7FAFC`

---

## 13. Asset system

Canonical generated source:
`ref/analyze all these/SabaiTalk-generated-assets/sabaitalk_ready/`

Production:
`assets/`

Major groups:
- 12 WebP avatars
- branding icons/logo/splash
- decorations
- illustrations
- place/category icons

See:
`ASSETS.md`

Do not reintroduce the older Python-generated visual pack or removed `sparkles.png`.

Avatar source images are square. The UI must crop with cover rather than stretch.

---

## 14. Important recent root-cause fixes

### A. Web profile image overflow
Problem:
React Native Web `ImageBackground` could keep the accessibility image at its intrinsic 768px width while the visible hero container was narrower. Negative horizontal margins made it worse.

Fix:
- own profile and public profile detail now use bounded `View` + absolutely filled `Image`
- `resizeMode="cover"`
- no negative hero margin
- compact hero sizing

Verified at 390-wide app root:
- own Profile image: 390×240
- public Profile detail: 390×260

Files:
- `src/app/(tabs)/profile.tsx`
- `src/app/profile/[id].tsx`

Rule for future agents:
**Do not reintroduce ImageBackground for these full-width avatar heroes without verifying web intrinsic sizing.**

### B. Matches odd-row stretch
Problem:
`FlatList numColumns={2}` + card `flex: 1` caused the final odd card to expand to the full row width.

Observed before fix at 390-wide app root:
- first row: ~169×168
- final item: ~350×168

Fix:
- fixed percentage tile width,
- no flex-grow,
- row uses `justifyContent: 'space-between'`.

Expected:
all tiles remain the same two-column width, including an odd final item.

File:
`src/app/(tabs)/matches.tsx`

Rule:
**Do not use unconstrained `flex:1` for an odd final item in a multi-column FlatList.**

### C. Duplicate Expo Router URLs
Problem:
Route groups do not make public URLs unique.

Previously:
- root Welcome `index.tsx` and tab Discover `(tabs)/index.tsx` both mapped to `/`.
- onboarding Profile and tab Profile both mapped to `/profile`.

Symptoms:
- direct browser navigation or refresh could resolve a different screen than expected.

Fix:
- tab Discover → `/discover`
- onboarding profile setup → `/profile-setup`

A route-audit after the rename found no remaining duplicate effective app routes.

### D. Live mode silently showing demo data
Problem:
with Supabase configured, failed nearby/matches requests could switch to fake demo data.

That is unacceptable for acceptance testing because it can hide backend failures and make a real environment look healthy.

Fix:
- configured live mode does not silently fall back to fake nearby people or fake matches.
- demo mode is only selected when Supabase is not configured.

Files:
- `src/hooks/use-nearby-profiles.ts`
- `src/hooks/use-my-matches.ts`

### E. Own Profile was hard-coded even in live mode
Problem:
The Profile tab always showed demo-style values such as `Your profile`, 4 interests, 3 matches, and the demo avatar even when Supabase was configured.

That can make live acceptance testing misleading.

Fix:
- added `fetchMyProfile()` in `src/services/profile.ts`,
- Profile tab loads the authenticated user's real profile when Supabase is configured,
- live interest count/data comes from Supabase,
- live match count comes from `useMyMatches()`,
- demo avatar/profile values are used only when Supabase is absent,
- live loading uses a neutral brand placeholder rather than flashing a fake person.

Files:
- `src/services/profile.ts`
- `src/app/(tabs)/profile.tsx`

### F. Live UI must not substitute fake people/places
Problem:
Several live paths still used demo-person avatars as missing-avatar fallbacks, and Fair Meeting initially rendered a demo recommendation even when a real Supabase match was configured.

Fix:
- live missing-avatar fallback is now the neutral SabaiTalk logo rather than a demo person's avatar,
- Nearby, Matches, Chat, Profile Detail, and Match Success avoid presenting a fake person as a live user fallback,
- live Fair Meeting starts with no demo recommendation and asks the user to search for a public place,
- demo recommendations remain available only when the app is actually in demo/no-Supabase mode.

This follows the same rule as the live-data hooks: a configured backend failure or missing live data must be visible as missing/error/placeholder state, not silently replaced with convincing fake activity.

### G. Tester 2 regressions already addressed
Tester 2 previously found:
- web location permission trap,
- 768px Matches image strips,
- oversized Discover image,
- directional Radar privacy issue,
- bio 161/160 issue.

Current fixes include:
- web location timeout/recovery,
- explicit image sizing,
- radar non-directional privacy semantics,
- bio clamping,
- compact Discover/Profile/Match/Meeting visuals.

Earlier BUG-001..007 were also reported PASS by Tester 2.

---

## 15. Demo mode

Demo data lives locally only:
- `src/data/mock-data.ts`
- `src/lib/demo-state.ts`

AsyncStorage demo state covers:
- acted/pass/like profile IDs,
- demo chat messages,
- clear demo state on exit.

Demo is for:
- local UI development,
- QA when credentials do not exist.

Demo is not acceptance data.

---

## 16. Credential model

Client:
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Server-only:
```text
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_PLACES_API_KEY
GOOGLE_ROUTES_API_KEY
```

Do not expose server keys through `EXPO_PUBLIC_*`.

See:
`API_SETUP.md`

---

## 17. Browser / UI QA workflow

lnwjud managed Chrome works through CDP.

Useful flow:
```text
edit code
→ Expo web on localhost:8083
→ dom_cdp list_tabs
→ select exact SabaiTalk tab id
→ navigate/query/evaluate/screenshot
→ inspect DOM dimensions
→ fix
→ reload
→ measure again
```

Primary mobile reference:
**390×844**

Also regression check:
- 360×800
- 412×915
- desktop ~1440×900

Current managed-Chrome workflow has been validating a **390×844 app root** inside the browser for deterministic layout measurements. This is very useful for spacing/image/card bugs, but it is not a perfect substitute for an actual Android/iOS device.

Physical-device testing is still required for:
- native map rendering,
- actual foreground permission UX,
- keyboard/safe-area behavior,
- platform-specific performance.

---

## 18. Technical verification commands

Use Node through NVM:
```bash
source ~/.nvm/nvm.sh
```

Checks:
```bash
npm run typecheck
npm run lint
npx expo-doctor
CI=1 npx expo export --platform web --output-dir dist
CI=1 npx expo export --platform android --output-dir dist-android
```

Do not automatically run:
`npm audit fix --force`

Known npm audit state from recent work:
- 17 moderate
- 9 high
- total 26 vulnerabilities reported by npm
- one `unrs-resolver` postinstall warning has appeared

Expo Doctor has passed 18/18 in recent verification.

---

## 19. What is not live-verified yet

Unless credentials/testing state changes, mark these as NOT TESTED rather than pretending they pass:
- real Supabase signup/auth end-to-end,
- live RLS enforcement against multiple real accounts,
- PostGIS nearby results using real tester locations,
- live mutual-match creation,
- Realtime chat between two actual devices/accounts,
- block/report behavior against live data,
- Google Places live results,
- Google Routes live matrix,
- physical-device native map rendering,
- physical-device location permissions.

---

## 20. Next development plan

Tester 3 is complete with **PASS WITH ISSUES** and no blocker. Development now follows a repeatable **Step 0–7 loop**. Run the loop in order, verify regressions at each step, and repeat from Step 0 when a later change affects an earlier area.

**Expo constraint:** stay on Expo SDK 54. Do not upgrade to SDK 55+ and do not use `npm audit fix --force`. Security/dependency fixes must remain compatible with Expo 54.

### Step 0. Professional Auth/Login UI
Login and registration are the first product-quality gate.

Goals:
- professional alignment and spacing,
- clear visual hierarchy,
- left-aligned form labels and inputs,
- consistent input containers and action placement,
- good keyboard/mobile behavior,
- matching Login/Register composition,
- preserve SabaiTalk branding without oversized decoration,
- keep demo/live behavior unchanged.

Verify:
- `/login`
- `/register`
- 360×800 / 390×844 / 412×915 / desktop
- direct open + refresh
- keyboard submit and validation/error states

### Step 1. Regression and open-issue gate
Fix root-cause regressions before visual or feature expansion.

Current Tester 3 issues:
- BUG-013: dependency audit reports 9 high advisories. With Expo 54 locked, treat upstream Expo/Metro findings as accepted/deferred unless an Expo-54-compatible fix exists. Never use `npm audit fix --force`.
- BUG-014: investigate the Expo Web `props.pointerEvents is deprecated. Use style.pointerEvents` warning. Fix only through app code or Expo-54-compatible dependency updates; do not destabilize the SDK baseline.

Always rerun:
- typecheck
- lint
- Expo Doctor
- relevant route/viewport checks

### Step 2. Focused anti-AI-slop pass
Do a deliberate visual-composition pass.

Priority:
1. Fair Meeting
2. Profile / Profile Detail
3. Discover compact profile preview
4. Match success
5. Matches typography/overlay only if still too generic

Rules:
- reduce card-on-card stacking,
- avoid centering every section,
- reduce oversized illustrations/heroes,
- keep one dominant visual per screen,
- use Repo2 structure/measurements instead of inventing dashboard-style layouts,
- preserve SabaiTalk blue/mint/location identity.

### Step 3. Motion + smooth gesture interaction
After visual structure is stable, improve interaction quality with Reanimated and Gesture Handler while preserving privacy and Expo SDK 54 compatibility.

Use Reanimated / Gesture Handler for:
- radar pulse/sweep,
- nearby result staggered entrance,
- compact profile-preview entrance/exit,
- Cards-mode drag following the finger,
- swipe right = Like,
- swipe left = Pass,
- velocity + distance thresholds,
- spring snap-back below threshold,
- Like/Pass button dismissal through the same decision engine,
- subtle LIKE/PASS drag cues,
- Match-success entrance motion,
- Chat message entrance, auto-scroll, and keyboard avoidance,
- consistent route transitions.

Hard privacy rule:
- Radar remains illustrative and non-directional.
- Never map another user's coordinates, bearing, or real direction into radar position/animation.

Do not add Three.js here.

### Step 4. Real Supabase acceptance
When credentials are configured, use 3–5 real tester-created accounts only.

Test:
- Register/Login
- real profile/avatar/interests
- foreground location
- PostGIS nearby results
- Like/Pass
- mutual match creation
- Realtime chat
- Block/Report
- RLS/privacy behavior
- live/mock separation
- live own-profile data

Hard rule:
**No fake users, fake matches, fake chat, fake locations, or fake activity in the real test database.**

If a live request fails, show an error/empty state. Never silently replace it with demo activity.

### Step 5. Google Places + Routes
After live Supabase matching/chat is stable, connect and test real Fair Meeting integrations.

Verify:
- real category search
- route matrix
- fairness ranking
- useful alternatives
- external Maps handoff
- exact origins never returned to client

### Step 6. react-native-maps + physical Android/native validation
The native Fair Meeting map lives only in `src/components/MeetingMap.tsx` and is used by `src/app/meeting/[id].tsx`. Discover/Radar never uses a real people map.

Before a real Maps key exists:
- `app.config.js` conditionally injects `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` only when non-empty,
- `MeetingMap.tsx` shows a safe destination placeholder when the key is absent,
- no fake key is committed.

With a real key/device, verify:
- foreground location permissions,
- denial/timeout/recovery,
- safe-area/keyboard behavior,
- `react-native-maps` render,
- destination-only map marker,
- `showsUserLocation={false}`,
- `showsMyLocationButton={false}`,
- external Maps handoff contains destination only,
- Radar/card gesture performance,
- no platform-specific layout regression.

Browser/export QA is not enough for these native behaviors.

### Step 7. Final regression and release gate
Run a complete release-quality sweep after Steps 0–6.

Required checks:
- all direct routes + refresh,
- 360×800 / 390×844 / 412×915 / desktop,
- auth/onboarding/discover/matches/chat/profile/meeting flows,
- privacy rules,
- demo/live separation,
- typecheck/lint/Expo Doctor,
- web + Android export,
- no new runtime exceptions.

If Step 7 finds a regression, return to the earliest affected step and run the loop again.

### Optional after Step 7: Three.js
Three.js is not part of the 0–7 loop. Consider it only if 2D Reanimated remains insufficient after all release gates pass.

### Short priority summary

```text
0 Auth/Login professional UI
→ 1 regression/open issues
→ 2 anti-AI-slop polish
→ 3 motion + smooth gestures
→ 4 real Supabase acceptance
→ 5 Google Places + Routes
→ 6 react-native-maps + physical Android/native validation
→ 7 final regression/release gate
→ repeat from earliest affected step when needed
```

### Current loop status — 2026-09-13

- Step 0: IMPLEMENTED. Login/Register were changed from centered underline fields to a professional left-aligned auth layout with bounded fields, focus states, password visibility control, keyboard next/done flow, and simpler account-switch actions. Demo/live auth behavior was preserved.
- Step 1: REVIEWED. BUG-013 remains an upstream Expo/Metro dependency risk under the Expo SDK 54 lock. No `npm audit fix --force`. BUG-014 was traced to React Navigation / React Native Web dependency code using the deprecated `pointerEvents` prop, not SabaiTalk source. Do not patch `node_modules` for this warning.
- Step 2: IMPLEMENTED first anti-slop pass. Fair Meeting now makes destination/map the main visual and removes the large category hero/floating fairness-card composition. Own Profile and public Profile Detail remove the overlapping hero-card pattern and use left-aligned content. Match Success uses the two matched avatars as the main visual instead of the generic matching illustration. Radar compact profile preview is now horizontal and lighter.
- Step 3: IMPLEMENTED motion + gesture pass. Root is wrapped in `GestureHandlerRootView`. Cards mode supports finger-follow drag, slight rotation, swipe-right Like, swipe-left Pass, distance/velocity thresholds, spring snap-back, and LIKE/PASS drag cues. Like/Pass buttons use the same dismissal engine. Radar uses Reanimated pulse/sweep and staggered nearby rows; Discover previews animate in/out; Match Success and Chat have motion polish. Button-driven dismissal was runtime-tested successfully. Real touch drag still requires physical-device validation.
- Step 4: IMPLEMENTATION/PREPARATION READY, LIVE TEST BLOCKED. Added `supabase/migrations/0002_matching_privacy_hardening.sql`: coordinate validation, `pass_profile()` RPC, Like/Pass conflict protection, outgoing Like cleanup on Pass, and nearby filtering for liked/passed/matched/blocked relationships. Client `passProfile()` now uses the RPC. Real Supabase acceptance with tester-created accounts is NOT TESTED because credentials are not configured.
- Step 5: IMPLEMENTATION/PREPARATION READY, LIVE TEST BLOCKED. Fair Meeting Edge Function validates JWT/match membership, fetches exact origins server-side, computes midpoint, calls Google Places and Routes, ranks fairness, and returns public destination data only. `supabase/.env.example` documents server-only placeholders. Live Places/Routes behavior is NOT TESTED because Google/Supabase server credentials are not configured.
- Step 6: IMPLEMENTATION READY, DEVICE TEST BLOCKED. `app.config.js` conditionally injects the Android Maps key only when non-empty; prebuild config injection was verified with a non-secret QA placeholder while SDK stayed 54.0.0. `MeetingMap.tsx` shows a safe placeholder without a key and otherwise renders destination-only `react-native-maps` with user-location UI disabled. `adb` is installed but no Android device was connected, so real permission/map/gesture/performance testing is still NOT TESTED.
- Step 7: AUTOMATED NON-LIVE GATE PASS. Final typecheck PASS, lint PASS, Expo Doctor 18/18 PASS. `npm run qa:web` performs 112 checks (14 routes × 4 viewports × direct+refresh) at 360×800, 390×844, 412×915, and 1440×900; final result 112/112 PASS, 0 failures. A first-run false positive on animated Match refresh led to replacing fixed waits with render-ready polling, then the full suite passed. Screenshots are stored under ignored `.qa-artifacts/`. Login, Discover, and Fair Meeting app spot-checks reported ready. Final web export PASS with 25 static routes; final Android export PASS with 66 assets. Host-native visual capture is unavailable under current Wayland ScreenCast permission, so manual host screenshot inspection is not claimed.

Release status: code/config/browser/export gates are green under Expo SDK 54, but this is not a fully validated live release until Step 4 real Supabase acceptance, Step 5 live Google Places/Routes acceptance, and Step 6 physical Android/native testing are completed.

When credentials/device access become available, resume at Step 4. Do not redo completed UI/QA work unless a new regression points back to an earlier step.

---

## 21. Open-source/license context

See:
`LICENSES.md`

Current references:
- MartsTech/tinder-clone — MIT, secondary behavior/UI reference
- stevenpersia/tinder-expo — MIT, primary visual reference
- aman40399/cufy_application — no license found, visual inspiration only, no source copying

Required MIT notices are kept under `third_party/`.

Do not remove them.

---

## 22. Rules for the next AI

Before editing:
1. read `AGENTS.md`,
2. read this file,
3. read the exact affected source,
4. reproduce the bug in managed Chrome when it is a web/UI issue,
5. fix root causes, not screenshots only.

Do:
- preserve privacy,
- keep real database free of fake user activity,
- use the lightest implementation that works,
- verify typecheck/lint/build,
- use browser measurements for visual bugs,
- preserve working backend contracts.

Do not:
- invent new apps/screens instead of modifying SabaiTalk,
- rebuild the project from scratch,
- silently replace live backend errors with demo data,
- expose exact coordinates,
- put people on a real discovery map,
- add Three.js just because it sounds visually impressive,
- reintroduce duplicate route URLs,
- use oversized intrinsic avatar images without container verification,
- remove third-party license notices.

The current strategy is:
**Step 0 Auth/Login quality → Step 1 regression gate → Step 2 anti-slop polish → Step 3 Radar motion → Step 4 real Supabase acceptance → Step 5 live Places/Routes → Step 6 physical Android/native validation → Step 7 final release regression → repeat from the earliest affected step when needed. Three.js remains optional after Step 7 only.**
