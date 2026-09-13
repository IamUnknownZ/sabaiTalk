# SabaiTalk — Real-Data-Only Runtime

SabaiTalk runtime is intentionally real-data-only.

## What is never mocked at runtime

- accounts/auth sessions
- profiles
- profile avatars
- user interests
- exact/approximate location records
- nearby discovery candidates
- likes and passes
- matches
- messages
- blocks/reports
- meeting candidates
- travel times
- fairness recommendations

When configuration is missing or an API/backend request fails, the UI shows an explicit error, loading state, or legitimate empty state. It does not substitute fabricated people or activity.

## Static data that is allowed

Application-owned catalogs/assets are not user data and can be committed:

- interest taxonomy seeded by the SQL migration
- place-category IDs/icons
- branding
- onboarding/empty-state illustrations
- UI theme/configuration

## Required live services

Client:
- Supabase Project URL
- Supabase anon/public key
- Android Google Maps key

Server:
- Supabase hosted Edge Function environment
- Google Places API (New) key
- Google Routes API key

See `REAL_API_HANDOFF.md`.

## Live acceptance checklist

After credentials are configured:

1. Register two real tester accounts.
2. Complete profile + interests for both.
3. Save foreground location for both.
4. Verify each account can discover the other only through the privacy-safe nearby RPC.
5. Like/pass and verify persistence.
6. Create a mutual match.
7. Verify Realtime chat in both directions.
8. Verify block/report behavior.
9. Request Fair Meeting recommendations and confirm they are real Google Places results.
10. Verify Routes travel times/fairness ranking.
11. Verify the map contains only the public destination marker.
12. Test Android Maps with the correct package + SHA-1 restricted key.

Do not call the deployment fully live-validated until this checklist passes against the actual external services.
