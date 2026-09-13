# SabaiTalk — System Specification

## Product statement
**SabaiTalk is a location-based social matching app that helps users discover compatible people nearby, chat after a mutual match, and recommend a fair public place for both people to meet.**

Signature flow:

```text
Discover someone nearby
→ compare shared interests
→ Like / Pass
→ mutual Match
→ Chat
→ Find somewhere to meet
→ rank public places by travel fairness
```

## V1 scope

### Included
- Register / Login
- Optional Google sign-in
- User profile
- Profile photo
- Bio
- Interest selection
- Foreground current location
- Nearby people search
- Distance radius filter
- Approximate distance/area display
- Custom Nearby/Radar visualization
- Matching score
- Like / Pass
- Mutual Match
- Realtime text chat
- Find a Place to Meet
- Meeting category selection
- Google Places candidate search
- Google Routes travel-time calculation
- Fair Meeting score
- Meeting map
- Open selected place in maps
- Block
- Report
- Loading, empty, permission-denied and error states

### Explicitly out of V1
- Video calls
- Voice calls
- Live location sharing
- Background location tracking
- Geofencing
- AI/ML recommendation models
- Search-along-route
- Push notifications
- Production-scale moderation tooling

## Client technology
- Expo
- React Native
- TypeScript
- Expo Router
- `expo-location`
- `react-native-maps`

Development should remain compatible with Expo Go for the core V1 flow for as long as practical.

## Live test data policy
- The real Supabase environment contains only real tester-created accounts and their actual test activity.
- Do not seed mock/fake people, likes, matches, chats, locations, or meeting records into the live test database.
- Static catalog/reference rows such as the interest taxonomy are allowed to be seeded.
- Local mock/demo data is an offline UI-development fallback only and is not an acceptance-test data source.

## Backend technology
Supabase:
- Auth
- PostgreSQL
- PostGIS
- Storage
- Realtime
- Row Level Security
- Edge Functions when server-side API mediation is required

## External Google services
Planned services:
- Google OAuth credentials for optional Google sign-in
- Google Maps SDK/key for interactive meeting-map rendering when required by platform configuration
- Google Places API for candidate public places
- Google Routes API for travel time/distance

Places and Routes requests should be mediated by a trusted server layer (preferably Supabase Edge Functions) when this materially improves key security.

## Data model

### profiles
Suggested fields:
- id UUID, references auth user
- display_name
- bio
- avatar_url
- approximate_area
- location geography(Point, 4326)
- location_updated_at
- last_active_at
- created_at
- updated_at

### interests
- id
- slug
- label
- icon/category metadata

### user_interests
- user_id
- interest_id

### likes
- id
- from_user_id
- to_user_id
- created_at

Unique constraint should prevent duplicate active likes from the same source to target.

### passes
- id
- from_user_id
- to_user_id
- created_at

### matches
- id
- user_a
- user_b
- created_at
- status

A pair must not have duplicate active matches.

### messages
- id
- match_id
- sender_id
- content
- created_at
- read_at

### blocks
- blocker_id
- blocked_id
- created_at

### reports
- id
- reporter_id
- reported_id
- reason
- details
- created_at
- status

## Location model

### Device
`expo-location` obtains foreground GPS coordinates after explicit permission.

### Storage
Store the exact coordinate only where required for calculations.

### Discovery output
Another user must receive only safe derived information, for example:
- `~1.8 km away`
- `Around Bang Sue`

Do not return exact coordinates in ordinary nearby-user payloads.

### Nearby query
Use PostGIS `ST_DWithin` to filter candidates within the selected radius and `ST_Distance` or equivalent safe server-side calculation for distance.

Candidate filters include:
- not self,
- not blocked in either direction,
- not already passed where product rules exclude them,
- not already matched where discovery rules exclude them,
- sufficiently recent/valid location.

## Nearby/Radar visualization
Radar is a privacy-preserving visual abstraction.

It may encode distance bands but should not communicate a precise real-world bearing. Exact map pins for nearby strangers are not part of V1.

## Matching score
V1 uses deterministic weighted scoring rather than AI.

Initial target weighting:
- Shared-interest similarity: 55%
- Distance: 30%
- Recent activity: 15%

Weights may be tuned after testing, but any change should be documented.

The score should be reproducible from stored/derived data and bounded to a user-facing percentage.

## Like and mutual match logic
1. User A likes User B.
2. Store A→B like.
3. Check for B→A like.
4. If reciprocal, create one match atomically/idempotently.
5. Unlock chat for that match.

Passes, blocks, and existing matches must be respected.

## Realtime chat
Use Supabase Realtime subscriptions for new messages.

Authorization:
- only members of a match may read/send messages in that match,
- blocked relationships should prevent continued communication according to product policy.

## Meeting feature

### Entry
Available from an existing match/chat.

### User intent
User selects a public-place category such as:
- Cafe
- Food
- Mall
- Park
- Cinema
- Study

Shared interests can influence category suggestions, but V1 does not need ML.

### Candidate generation
1. Obtain both users' exact coordinates server-side.
2. Compute a search region around an approximate midpoint.
3. Use Google Places to fetch suitable public candidate places.
4. Do not expose either user's exact origin coordinate to the other user.

### Route evaluation
For each candidate place, obtain travel time/distance from both origins using Google Routes.

### Fairness ranking
A place should be ranked by a combination of:
- travel-time imbalance,
- total travel time,
- place relevance/category,
- optional quality/rating/open status when available.

A conceptual score can penalize:
- high absolute difference `|timeA - timeB|`,
- high `timeA + timeB`.

The final user-facing UI should explain results simply, e.g.:
- You: 14 min
- Friend: 16 min
- Fairness: 94%

## Map behavior
The real interactive map is primarily for the meeting feature.

Map may show:
- recommended public places,
- selected meeting destination,
- destination details.

It should not expose a live or exact pin for the other user.

## Error-state requirements
Handle at minimum:
- location permission denied,
- GPS/location unavailable,
- no network,
- expired auth session,
- no nearby users,
- no matches,
- no chat messages,
- Google Places unavailable/no results,
- Routes unavailable,
- backend error.

No core screen should fail into an unexplained blank state.

## Non-functional goals
- Privacy-first location handling
- Reusable design system
- Consistent SabaiTalk branding
- Type-safe data boundaries
- Idempotent match creation
- RLS-backed authorization
- Graceful missing-API-key behavior during development
- Testable with two physical devices/accounts
