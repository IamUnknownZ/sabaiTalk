# SabaiTalk — Security and Privacy Rules

SabaiTalk uses defense in depth. UI route guards improve navigation and reduce accidental exposure, but the actual security boundary is Supabase Auth + RLS + restricted RPC/Edge Function access.

## Authentication and protected routes

- Guests may access only Welcome, Login, and Register.
- Tabs, profile detail, chat, match, meeting, and onboarding routes require a valid Supabase session.
- Incomplete accounts are redirected to the first missing onboarding step: profile → 3–6 interests → foreground location.
- Signed-in users who open Login/Register are redirected into the signed-in flow.
- Logout invalidates the Supabase session and protected routes redirect to Login.
- Never treat the route guard as authorization. Backend RLS/RPC checks remain mandatory because clients can bypass UI code.

## SQL injection and query safety

The app must not build SQL from user-controlled strings.

Required patterns:
- use Supabase/PostgREST query methods and RPC parameters rather than interpolated SQL;
- validate UUIDs before resource IDs enter filters or realtime channel filters;
- keep SQL RPC functions static; avoid dynamic `EXECUTE` or concatenated SQL;
- keep `SECURITY DEFINER` functions on a controlled `search_path`;
- authenticated roles cannot create objects in the `public` schema.

SQL-like text in names/messages is valid user content and must be stored literally, not executed.

## Server-side input validation

Client validation is for UX only. Database/Edge Function rules enforce bounds independently:
- display name: 1–60 nonblank characters;
- bio: 1–160 nonblank characters;
- approximate area: max 120 characters;
- message: 1–2000 nonblank characters;
- report details: max 1000 characters;
- report reason allow-list;
- interests: exactly 3–6 unique catalog slugs through `set_my_interests`;
- latitude/longitude range validation in `set_my_location`;
- UUID validation for client resource IDs and Edge Function requests.

Sensitive relationship writes (location, interests, pass, block, report) are RPC-only rather than direct table writes.

## Location privacy

- Store exact coordinates only for server-side calculations.
- Do not show another user's exact coordinates, live pin, background location, home-level location, or real bearing.
- `profile_locations` is owner-readable only.
- Nearby discovery returns derived distance/public fields and never raw geography.

## Relationship privacy

- Profile and interest reads respect blocks in either direction.
- Active matches are visible only to their members.
- Messages are readable only while the match is active.
- Blocking deactivates the match and removes ordinary client access to that relationship and its messages.

## Meeting privacy

- `meeting_origins` is service-role only.
- The client receives public destinations and travel metrics only.
- The map shows destination only, never either user's origin.
- Meeting recommendations are rate-limited server-side.
- Edge Function method, auth, JSON size, UUID/category and active match membership are validated before Google API calls.

## RLS and least privilege

- Profile updates are owner-only.
- Exact location of another user is not selectable.
- Likes/matches are server-validated.
- Messages require active match membership and the authenticated sender ID.
- Blocks affect discovery, profile/interest visibility, active matches, and chat access.
- Direct writes are denied where an RPC is the intended mutation path.
- `service_role` must never be shipped to the app.

## Edge Function / CORS

`meeting-recommendations` accepts POST/OPTIONS only, requires a valid Bearer user token, caps request size, validates inputs, rate-limits per user, times out Google requests, and does not return internal exception details.

Browser origins are allowed only for localhost development or values configured in `ALLOWED_ORIGINS`. Native clients do not rely on CORS as a security boundary; authorization remains server-side.

## Upload security

- Avatar max size: 5 MB.
- Allowed MIME types: JPEG, PNG, WebP.
- Storage object paths are restricted to the authenticated user's folder.
- Client validates type/size before upload; Storage policies remain authoritative if the client is bypassed.

## API keys

- Never commit secrets or service-role keys.
- Restrict the client Maps key by Android package, SHA-1 and API.
- Keep Places/Routes keys in Edge Function secrets only.
- Use separate client and server keys.
- Do not log credentials or tokens.

## Brute force and production controls

Before public release configure provider-level protections in Supabase Auth: production rate limits, CAPTCHA/bot protection where appropriate, email confirmation policy, production SMTP, and monitoring/alerts. Configure Google Cloud budgets and API quotas as a cost-abuse backstop.

## Development/test data

- Runtime is real-data-only.
- Local automated QA may create temporary tester accounts and must clean them up.
- Do not seed fake user activity into hosted environments.
- Do not store private addresses or real tester coordinates in the repository.

## Incident rule

If a shortcut would expose precise location, a server secret, or bypass authorization, redesign it rather than accepting the exposure.
