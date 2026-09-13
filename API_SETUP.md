# SabaiTalk — API, OAuth and Credential Registry

## Rule
Do not require all credentials at project start.

The codebase should contain placeholders and configuration checks. When development reaches a credential-dependent integration, the agent should give the user a dedicated, detailed setup guide for that one requirement.

No real secret belongs in this repository.

---

## 1. Supabase client configuration

### Purpose
Used by the mobile app for:
- Auth
- database access under RLS
- Realtime
- Storage

### Client placeholders
```env
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

### Safe to ship?
These values are intended to be usable by the client **only when database/storage access is protected by correct RLS/policies**.

### User action when requested
The detailed guide should cover:
1. Create/open Supabase project.
2. Find Project URL.
3. Find the client anon/publishable key.
4. Paste into local environment file.
5. Restart Expo.
6. Run a connection/auth test.

---

## 2. Supabase server/service credentials

### Purpose
Potentially required by trusted server code or administrative tooling.

### Important
`SUPABASE_SERVICE_ROLE_KEY` must never be placed in Expo public environment variables or shipped in the mobile bundle.

### Placeholder
If local server tooling later needs an example:
```env
SUPABASE_SERVICE_ROLE_KEY=
```

Prefer Supabase-hosted secrets for Edge Functions.

---

## 3. Google OAuth / Sign in with Google

### Purpose
Optional Google sign-in through Supabase Auth.

### Planned placeholders
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

Exact IDs required depend on the final Expo/Supabase OAuth flow and target platforms.

### User action when requested
The detailed guide should separately explain:
1. Google Cloud project creation/selection.
2. OAuth consent screen configuration.
3. Web OAuth client creation.
4. Android OAuth client creation if needed.
5. iOS OAuth client creation if needed.
6. Package/bundle identifiers and fingerprints when required.
7. Supabase Auth → Google provider configuration.
8. Redirect/callback URLs.
9. Local Expo Go vs development/production redirect differences.
10. Verification test.

Do not guess redirect URLs before the project identifiers are finalized.

---

## 4. Google Maps key

### Purpose
Interactive meeting map/platform map SDK configuration when required.

### Client placeholder
```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

`app.config.js` reads this value only when it is non-empty and injects it into the Android Google Maps native config. An empty placeholder keeps local/web/export work functional without pretending Maps is configured.

### Security
Use platform/API restrictions appropriate to the final Android/iOS app. Do not reuse an unrestricted server key.

### User action when requested
Detailed instructions should cover:
- enabling required Maps SDK,
- billing requirement/status,
- creating a dedicated key,
- Android/iOS application restrictions,
- API restrictions,
- where Expo/app config consumes the key,
- testing map rendering.

---

## 5. Google Places API

### Purpose
Find candidate public meeting places such as cafes, restaurants, malls, parks, cinemas or study locations.

### Preferred architecture
```text
Expo client
→ authenticated Supabase Edge Function
→ Google Places API
```

### Server-only placeholder
```env
GOOGLE_PLACES_API_KEY=
```

Store it as a Supabase Edge Function secret or equivalent trusted secret.

### User action when requested
Detailed guide should cover:
1. Enable the required Places API/SKU in Google Cloud.
2. Confirm billing.
3. Create a dedicated server key.
4. Restrict the key to required APIs where supported.
5. Store with Supabase secrets.
6. Deploy/redeploy Edge Function.
7. Test one candidate search.
8. Configure quota/budget alerts.

---

## 6. Google Routes API

### Purpose
Calculate travel time/distance from each matched user to each candidate meeting place.

### Preferred architecture
```text
Expo client
→ authenticated Supabase Edge Function
→ Google Routes API
```

### Server-only placeholder
```env
GOOGLE_ROUTES_API_KEY=
```

### User action when requested
Detailed guide should cover:
1. Enable Routes API.
2. Confirm billing.
3. Create/restrict server key.
4. Store with Supabase secrets.
5. Test route matrix request.
6. Add quota/budget controls.

---

## 7. Other future credentials
Do not add new vendors casually.

If a future feature needs another credential:
- justify why it is needed,
- define whether it is client-safe or server-only,
- add a clearly named placeholder,
- update this file,
- provide setup instructions only when that feature is being implemented.

---

## Local environment convention

Use an untracked local file such as:
```text
.env.local
```

Copy values from `.env.example` and fill them locally.

Never commit:
- `.env.local`
- service-role keys
- unrestricted Google server keys
- OAuth client secrets
- private certificates

---

## Integration status checklist

| Integration | Placeholder | Needed immediately? | Preferred location |
|---|---|---:|---|
| Supabase URL | yes | when backend phase begins | Expo client env |
| Supabase anon/publishable key | yes | when backend phase begins | Expo client env |
| Google OAuth client IDs | yes | only for Google sign-in | Expo client/Supabase config |
| Google Maps key | yes | map integration/build config | platform-restricted client config |
| Google Places key | yes | meeting-place phase | server secret |
| Google Routes key | yes | fair-meeting phase | server secret |
| Supabase service role | documented only | only if trusted server/admin code needs it | server secret only |
