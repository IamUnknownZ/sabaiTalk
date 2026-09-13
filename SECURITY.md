# SabaiTalk — Security and Privacy Rules

## Location is sensitive
SabaiTalk's core value depends on location, so location must be handled more carefully than ordinary profile data.

### Allowed
- Store exact coordinates where necessary for server-side calculations.
- Derive approximate distance.
- Derive broad area labels.
- Use both users' coordinates server-side to find fair meeting places.

### Not allowed in V1
- Show another user's exact latitude/longitude.
- Show another user's precise live map pin.
- Expose exact coordinates in ordinary discovery/profile payloads.
- Background tracking.
- Continuous live location sharing.
- Reveal home-address-level information.

## Discovery privacy
Nearby discovery should return the minimum necessary data.

Prefer:
- profile ID,
- public profile fields,
- shared interests,
- approximate/bucketed distance or safe numeric distance,
- approximate area,
- match score.

Avoid returning raw location geometry to the mobile client.

## Radar privacy
Radar must not claim to show exact heading/bearing.
Avatar placement should be illustrative within distance bands.

## Meeting privacy
Meeting flow can use exact origins internally, but results should focus on public destinations and travel metrics.

The other user's exact origin should not be displayed.

## Authentication and authorization
- Supabase RLS is mandatory for user-owned/private tables.
- Chat access requires match membership.
- Storage policies must restrict profile uploads appropriately.
- Match creation should be server-validated/idempotent.
- Block relationships must be enforced server-side, not only hidden in UI.

## API keys
- Never commit secrets.
- Never ship service-role keys.
- Avoid unrestricted Google API keys.
- Client Google Maps keys should be platform/API restricted.
- Places/Routes keys should preferably be server-only.
- Do not log secrets.

## Reports and blocks
V1 must contain:
- block,
- report,
- report reason.

Blocking must affect discovery and communication behavior, not merely hide a button.

## Input/data handling
- Validate message length and required profile fields.
- Validate UUID/resource ownership server-side.
- Treat client-provided IDs, scores, coordinates, and match claims as untrusted.
- Do not let the client directly decide that a reciprocal match exists without server verification.

## Development/test data
Local demo/offline UI work may use fictional profiles, but real Supabase test/staging/production environments must use tester-created accounts and tester-generated activity only. Do not seed fake users, likes, matches, chats, locations, or meeting records into the real database.
Do not seed the repository with real private addresses or real user coordinates.

## Incident rule
If an implementation shortcut would expose precise location or a server secret, stop that implementation path and redesign it rather than accepting the exposure for convenience.
