# SabaiTalk — Detailed Implementation Plan

This is the execution plan for building SabaiTalk from the current near-empty workspace to the complete V1 mini-project.

## Global execution policy
- Complete phases in dependency order.
- A missing external credential blocks only the integration that needs it.
- Add placeholders first, continue independent work, and request the real credential only when verification becomes necessary.
- Every phase ends with an acceptance check.
- Preserve Expo Go compatibility unless a later requirement truly needs a development build.
- Read `AGENTS.md`, `SYSTEM.md`, and `ref/` before visual or architectural changes.

---

## Phase 0 — Repository baseline and references

### Tasks
- Verify workspace tree.
- Preserve `ref/` untouched unless the user explicitly asks to change it.
- Initialize Git if needed.
- Add standard ignore rules.
- Add documentation and environment examples.
- Establish license tracking.

### Deliverables
- `AGENTS.md`
- `SYSTEM.md`
- `IMPLEMENTATION_PLAN.md`
- `API_SETUP.md`
- `SECURITY.md`
- `LICENSES.md`
- `.env.example`

### Acceptance
- No real secret exists in tracked files.
- Visual reference values are documented.

---

## Phase 1 — Template research and license audit

### Goal
Use multiple repositories for ideas without creating a dependency/architecture mess.

### Tasks
- Evaluate candidate free templates.
- Record repository URL, license, framework version, useful screens/components, and risky dependencies.
- Select one technical base.
- Mark other repositories as reference/component sources only.
- Confirm rights for any copied code/assets.
- Reject unknown-license code reuse.

### Decision criteria
- Explicit permissive license.
- Recent enough Expo/React Native compatibility.
- TypeScript preferred.
- Clean navigation architecture.
- Minimal custom native dependencies.
- Easy to normalize into SabaiTalk design language.

### Acceptance
- One base repo is selected.
- Every reused source is listed in `LICENSES.md`.
- No unclear asset is carried over.

---

## Phase 2 — Expo foundation

### Tasks
- Create/import Expo TypeScript project.
- Install/configure Expo Router.
- Normalize dependency versions.
- Create baseline directory structure.
- Configure aliases only if they improve clarity.
- Add lint/typecheck scripts.
- Add app metadata and placeholder branding.

### Target structure
```text
app/
components/
features/
hooks/
lib/
services/
constants/
types/
assets/
supabase/
ref/
```

### Acceptance
- `npx expo start` launches.
- App opens in Expo Go.
- No startup red screen.
- TypeScript baseline is clean.

---

## Phase 3 — SabaiTalk design system

### Tasks
- Convert palette in `ref/color-palete.md` into theme tokens.
- Define spacing, radius, typography, shadows/elevation, icon sizing.
- Build reusable components:
  - Button
  - Card
  - Avatar
  - Chip
  - Input
  - Header
  - EmptyState
  - LoadingState
  - LocationBadge
  - InterestChip
  - MatchScoreBadge
- Replace template-specific color constants and branding.

### Acceptance
- Main screens consume shared tokens.
- No obvious Tinder branding/colors remain.
- Components render consistently on common phone sizes.

---

## Phase 4 — Navigation and shell screens

### User flow
```text
Splash
→ Auth
→ Onboarding/Profile setup
→ Interests
→ Location permission
→ Main tabs
```

### Main tabs
- Discover
- Matches
- Chat
- Profile

### Tasks
- Route groups.
- Protected/authenticated routing.
- Placeholder screens for every V1 destination.
- 404/fallback route.

### Acceptance
- Every planned screen is reachable.
- Back navigation works predictably.

---

## Phase 5 — Supabase project boundary

### Agent work before credentials
- Create Supabase client wrapper using placeholders.
- Add typed environment validation.
- Prepare SQL migrations.
- Prepare seed interests.
- Local mock/fallback data may be used only for offline UI work before backend cutover; never seed fake users, likes, matches, chats, locations, or meeting records into Supabase. Live integration and acceptance testing must use real tester-created accounts/data.

### User action later
Create Supabase project and provide/configure:
- project URL,
- anon/publishable key.

See `API_SETUP.md`.

### Acceptance
Before credentials:
- app fails gracefully with a clear configuration message.

After credentials:
- connectivity test succeeds.

---

## Phase 6 — Database schema, PostGIS and RLS

### Tasks
- Enable required extensions including PostGIS.
- Create tables from `SYSTEM.md`.
- Add indexes and uniqueness constraints.
- Add timestamp helpers/triggers if needed.
- Add RLS policies.
- Add RPC/functions for nearby discovery and reciprocal-match creation if appropriate.
- Seed interest categories.

### Security acceptance
- Users cannot edit another user's profile.
- Users cannot read/write arbitrary private chat.
- Exact location is not exposed by ordinary profile/discovery queries.
- Match creation is idempotent.

---

## Phase 7 — Email/password authentication

### Tasks
- Register.
- Login.
- Logout.
- Session persistence.
- Auth loading state.
- Password validation.
- Friendly backend error mapping.
- Redirect users without profile setup to onboarding.

### Acceptance
Two separate accounts can register/login/logout independently.

---

## Phase 8 — Optional Google authentication

### Agent work first
- Add provider button and auth abstraction.
- Add placeholders for OAuth client IDs/redirect configuration.
- Keep feature disabled or in configuration-error state until credentials exist.

### User action later
Create/configure Google OAuth credentials and Supabase Google provider.

### Acceptance
When configured:
- Google login returns a valid Supabase session.
- First-time Google user enters profile setup.

---

## Phase 9 — Profile and avatar

### Tasks
- Profile form.
- Display name.
- Bio.
- Avatar selection/upload.
- Edit profile.
- Supabase Storage bucket/policies.
- Default avatar state.

### Acceptance
Profile survives restart/login.
One user cannot overwrite another user's avatar/profile row.

---

## Phase 10 — Interests

### Tasks
- Render seed interest list.
- Multi-select UX.
- Save `user_interests`.
- Edit later from Profile.
- Shared-interest helper functions.

### Acceptance
Interests persist and shared-interest count can be calculated for two users.

---

## Phase 11 — Location permission and update flow

### Tasks
- Use `expo-location`.
- Explain why location is required.
- Request foreground permission only.
- Handle deny/retry.
- Obtain current coordinate.
- Save through a safe backend path.
- Add location timestamp.
- Add stale-location behavior.

### Acceptance
- Foreground GPS works in Expo Go.
- Denied permission produces a usable screen.
- Exact coordinate is not shown in ordinary profile UI.

---

## Phase 12 — Nearby PostGIS query

### Tasks
- Implement radius options: 1/3/5/10 km or equivalent.
- Query only candidates inside radius.
- Exclude self.
- Exclude blocks.
- Exclude ineligible passed/matched users per product rules.
- Return derived distance rather than raw coordinate.
- Add pagination/limit if needed.

### Acceptance
Two test users at known locations return expected near/far behavior.

---

## Phase 13 — Discover card UI

### Tasks
- Adapt best permissively licensed template patterns.
- Profile image/card.
- Name/basic profile.
- Interests.
- Approximate distance.
- Match score placeholder.
- Like/Pass controls.
- Loading/empty states.

### Acceptance
UI uses SabaiTalk theme and no template branding remains.

---

## Phase 14 — Nearby radar visualization

### Tasks
- Custom concentric distance bands.
- Place candidate avatars using privacy-safe pseudo-positions.
- Radius selector.
- Animate changes lightly.
- Do not use real-world exact bearing.
- Navigate from avatar to profile preview.

### Acceptance
Radar communicates proximity without revealing a precise map location.

---

## Phase 15 — Deterministic matching score

### Initial weighting
- Interest similarity: 55%
- Distance: 30%
- Recent activity: 15%

### Tasks
- Define normalization functions.
- Clamp score to 0–100.
- Make scoring deterministic/testable.
- Document formulas.
- Handle missing activity/location data.

### Acceptance
Fixture tests produce stable expected scores.

---

## Phase 16 — Like, Pass and mutual Match

### Tasks
- Persist Like.
- Persist Pass.
- Prevent duplicate actions.
- Reciprocal like check.
- Atomic/idempotent Match creation.
- Match celebration modal/screen.

### Acceptance
```text
A likes B
B likes A
→ exactly one match is created
```

---

## Phase 17 — Match list

### Tasks
- List current matches.
- Show avatar/name/latest message summary later.
- Empty state.
- Open chat.

### Acceptance
A user sees only their own matches.

---

## Phase 18 — Realtime chat

### Tasks
- Message table integration.
- Initial history query.
- Realtime subscription.
- Send message.
- Timestamp.
- Read state if feasible.
- Empty and reconnect states.

### Acceptance
Two devices/accounts exchange text messages without manual refresh.

---

## Phase 19 — Block and Report

### Tasks
- Block user.
- Remove/disable discovery and conversation access according to policy.
- Report categories.
- Store report.
- Confirmation UI.

### Acceptance
A blocked relationship no longer appears in nearby discovery and cannot continue normal interaction.

---

## Phase 20 — Meeting entry and category selection

### Tasks
- Add "Find somewhere to meet" from match/chat.
- Category selection:
  - Cafe
  - Food
  - Mall
  - Park
  - Cinema
  - Study
- Suggest categories from shared interests where useful.
- Build loading/result skeletons before Google API is configured.

### Acceptance
Meeting flow works with mock candidate data before external API activation.

---

## Phase 21 — Google Places integration

### Preferred architecture
Mobile app → Supabase Edge Function → Google Places.

### Tasks
- Create Edge Function request/response contract.
- Validate authenticated match membership.
- Resolve both users' exact locations server-side.
- Compute approximate search center.
- Query public candidate places.
- Return only necessary destination data.
- Cache/limit requests where reasonable.

### Credential boundary
Requires server-side Google Places key.
Keep placeholder until user configures it.

### Acceptance
Configured environment returns suitable public places for selected category.

---

## Phase 22 — Google Routes integration

### Preferred architecture
Mobile app → Supabase Edge Function → Google Routes.

### Tasks
- Calculate A→candidate and B→candidate travel metrics.
- Support selected travel mode if V1 defines one.
- Normalize route responses.
- Gracefully handle unavailable routes.

### Credential boundary
Requires server-side Google Routes key.

### Acceptance
Each candidate contains comparable travel-time data for both users.

---

## Phase 23 — Fair Meeting scoring

### Tasks
Define and document a ranking function using:
- travel-time difference,
- total travel time,
- place relevance,
- optional rating/open status.

Example conceptual penalties:
```text
imbalance = abs(timeA - timeB)
total = timeA + timeB
```

Normalize into an explainable user-facing fairness percentage.

### UI
- You: 14 min
- Friend: 16 min
- Fairness: 94%

### Acceptance
A highly one-sided place ranks below a similarly good balanced place.

---

## Phase 24 — Meeting map

### Tasks
- Use `react-native-maps`.
- Show candidate public places.
- Highlight recommended destination.
- Show destination details.
- Add "Open in Maps".
- Avoid exact other-user origin pin.

### Credential boundary
Platform Google Maps configuration may require a Maps key for standalone builds; placeholder exists.

### Acceptance
Meeting destination renders and can open external navigation/map app.

---

## Phase 25 — Robust state handling

### Required states
- location permission denied,
- GPS unavailable,
- offline,
- Supabase unavailable,
- missing dev credential,
- no nearby users,
- no matches,
- no messages,
- Places no result/error,
- Routes no route/error,
- expired auth.

### Acceptance
No core screen silently fails or stays blank.

---

## Phase 26 — Two-device end-to-end test

### Scenario
```text
A registers
B registers
A/B create profiles and interests
A/B grant location
A sees B nearby
A likes B
B likes A
Match created
A/B chat in realtime
A starts meeting flow
Places load
Routes load
Fair place selected
Map shows destination
```

### Acceptance
Full scenario succeeds on two accounts/devices.

---

## Phase 27 — Visual polish

Only after core behavior is stable.

### Tasks
- Motion/transition polish.
- Radar animation.
- Skeletons.
- Match celebration.
- Consistent spacing.
- Accessibility labels.
- Tap target review.
- Replace every leftover template asset/text.

### Acceptance
Screens feel like one SabaiTalk product, not several templates stitched together.

---

## Phase 28 — Final quality gates

Run:
- TypeScript check.
- Lint.
- Relevant unit tests.
- Expo diagnostics.
- Secret scan/manual environment review.
- Navigation smoke test.
- Database/RLS review.
- License attribution review.

### Acceptance
No known high-severity functional/privacy issue remains.

---

## Phase 29 — Documentation and presentation assets

### Deliverables
- README setup.
- Architecture explanation.
- Database diagram/source.
- Algorithm explanation.
- API setup instructions.
- License acknowledgements.
- Demo accounts/seed strategy.
- Presentation-ready feature flow.

### Final demo target
```text
Login
→ Profile
→ Location
→ Nearby
→ Match Score
→ Like
→ Mutual Match
→ Chat
→ Meeting category
→ Places
→ Routes
→ Fair recommendation
→ Map
```
