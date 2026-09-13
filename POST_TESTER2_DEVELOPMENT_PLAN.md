# SabaiTalk — Post Tester 2 Development Plan

## Current gate
Tester 2 verdict: **FAIL**, but BUG-001 through BUG-007 now pass.

The current blocking work is:
- privacy-safe Radar semantics,
- web location timeout/fallback,
- compact image/card sizing on Discover and Matches,
- bio hard limit,
- one more anti-slop composition pass.

## Non-negotiable data rule
The real Supabase environment must contain **real tester-created accounts and real tester activity only**.

Allowed to seed:
- static catalog/reference rows such as interests.

Not allowed to seed into real Supabase:
- fake users,
- fake profiles,
- fake likes/passes,
- fake matches,
- fake chats,
- fake locations,
- fake meeting records.

Local mock/demo data may remain only as an offline UI-development fallback and must not be used as acceptance-test data.

## Phase A — Stabilize Tester 2 failures (now)
1. BUG-008: timeout web location requests and return UI control.
2. BUG-009: give Matches explicit compact image heights so web cannot expand images to intrinsic 768px height.
3. BUG-010: make Discover card compact enough that identity + Like/Pass remain visible on a normal phone viewport.
4. BUG-011: replace directional avatar pins with a privacy-safe radar animation plus a non-directional nearby list.
5. BUG-012: clamp bio input to 160 characters even if web maxLength behavior is inconsistent.
6. Re-run typecheck, lint, Expo Doctor, web export, Android export.

## Phase B — Radar-first Discover
After the current fixes are stable, make Radar the signature entry experience instead of opening directly on a giant profile card.

Target flow:
```text
Discover opens
→ animated privacy-safe scan
→ nearby people appear as non-directional results
→ tap one result
→ compact profile preview rises from bottom
→ Like / Pass
→ preview closes
→ return to scan
```

Rules:
- Radar may communicate approximate distance bands.
- Radar must never imply real bearing/direction.
- No live pins, no compass placement, no exact coordinates.
- Cards mode remains available as a secondary view.

### Animation technology
Use the lightest option first:
1. React Native Animated / Reanimated (already installed) for pulse, scale, fade, and bottom-sheet transitions.
2. Consider SVG/Skia only if the visual result genuinely needs it.
3. **Do not add Three.js to the main app yet.**

### Three.js decision gate
A Three.js prototype is only justified if we specifically want:
- real 3D depth,
- volumetric particles,
- a 3D globe/scanner,
- camera movement that cannot be reproduced cleanly in 2D.

Before adding it:
- Tester review must say the 2D radar still feels weak.
- Physical Android performance must be measured.
- Expo Go / build compatibility must be checked.
- The prototype must still preserve privacy semantics.

## Phase C — Anti-AI-slop composition pass
Use Repo 2 measurements/patterns instead of inventing new layout blocks.

Rules:
- fewer cards,
- no “card inside card inside card” layouts,
- no giant illustrations where content should be visible,
- one dominant visual per screen,
- tighter image heights,
- fewer centered text blocks,
- left-align profile identity/content where it improves scanning,
- consistent 8/12/16/24 spacing rhythm,
- one radius family per screen,
- subtle shadow only where Repo 2 uses it,
- avoid explanatory banners unless the user needs them to make a decision.

Priority screens:
1. Discover
2. Matches
3. Radar
4. Fair Meeting
5. Own Profile / Profile Detail

## Phase D — Real-backend tester cutover
When Supabase credentials are configured:
- disable demo fallback for the acceptance-test build,
- create real tester accounts through normal Register flow,
- upload real tester-selected profile photos,
- choose real interests,
- save real foreground locations,
- test nearby PostGIS results,
- test mutual Like/Match,
- test Realtime chat,
- test Block/Report/RLS,
- never seed fake user activity into the live test database.

Suggested minimum acceptance set: 3–5 tester accounts in physically different approximate areas.

## Phase E — Meeting / maps
Keep `react-native-maps` only for public meeting destinations.

Next live checks:
- Google Places category results,
- Google Routes travel time,
- fair meeting ranking,
- selected destination marker,
- external Maps handoff,
- no user origin pins in UI.

Do not put nearby people on a real map.

## Phase F — Responsive visual regression
Capture and compare:
- 360×800,
- 390×844,
- 412×915,
- 1440×900 web preview.

Specifically measure:
- Discover image height,
- Matches image height,
- bottom tab overlap,
- identity/action visibility without excessive scrolling,
- profile hero height,
- Radar disclaimer visibility,
- location timeout recovery.

## Review gate
After these current fixes, stop major visual feature expansion and wait for the next tester review.

While waiting:
- keep code/build clean,
- prepare the Radar-first interaction structure,
- do not add Three.js/Skia/new native dependencies,
- do not redesign unrelated screens,
- do not change backend contracts unless the next review exposes a real need.
