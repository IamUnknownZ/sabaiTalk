# SabaiTalk — Agent Operating Rules

## Purpose
This file is the operating contract for any coding agent working in this repository.

SabaiTalk is a location-based social matching application. The project must feel like one coherent product even when UI ideas or components are inspired by multiple open-source repositories.

## Source of truth order
When instructions conflict, use this order:
1. Current user instruction.
2. This `AGENTS.md`.
3. `SYSTEM.md`.
4. `IMPLEMENTATION_PLAN.md`.
5. Existing code and project conventions.
6. `ref/` visual references.

Never ignore `ref/`. Read it before making visual decisions.

## Current visual direction
The canonical visual reference is `ref/color-palete.md` plus the image asset in `ref/`.

Primary palette:
- Primary blue: `#78B7EE`
- Primary light: `#A9D7F7`
- Background: `#F5FAFD`
- Surface/white: `#FFFFFF`
- Accent green: `#9BCB9A`

Brand idea:
**Two people + location + fair midpoint + shared public activity.**

Do not make the app look like a red/pink Tinder clone. Location and social discovery should be more visually important than hearts.

## Core implementation rules
- Prefer Expo + React Native + TypeScript.
- Prefer Expo Router for navigation.
- Keep the development experience Expo Go compatible for as long as possible.
- Use `expo-location` for foreground device location.
- Use `react-native-maps` for the meeting map.
- Do not introduce `expo-maps` unless the user explicitly changes this decision.
- Use Supabase for Auth, PostgreSQL, PostGIS, Storage, and Realtime.
- Production/staging/test Supabase must not be populated with fake user profiles, fake likes, fake matches, fake chats, fake locations, or fake meeting records. Real integration/acceptance testing uses accounts created by actual testers. Static reference/catalog data such as the interest list may still be seeded.
- Local mock/demo data may exist only for offline UI development and must never be written into the real database.
- Use PostGIS for nearby-user filtering and distance queries.
- Use Google Places and Google Routes only where the meeting feature requires them.
- Prefer server-side/proxy calls for Google Places and Routes secrets instead of exposing unrestricted keys in the mobile bundle.
- Exact user coordinates must never be displayed to another user.
- No background tracking or live location sharing in V1.

## Template and open-source reuse policy
Multiple open-source repositories may be used for ideas.

Rules:
- Select one repository as the technical base whenever possible.
- Recreate/adapt useful UI patterns from other repositories instead of merging several complete codebases.
- Before copying code, verify the repository license.
- MIT, Apache-2.0, BSD and similarly permissive licenses are acceptable when their conditions are followed.
- A public repository with no license is reference-only; do not copy its code.
- Record every reused repository in `LICENSES.md`.
- Preserve required notices.
- Replace third-party branding, logos, copyrighted photos, and unclear demo assets.
- Normalize reused components to SabaiTalk naming, theme tokens, architecture, linting, and TypeScript conventions.

## Credential/API workflow
The user does not want to configure all APIs before development starts.

When a feature reaches an external credential boundary:
1. Implement everything that can be implemented without the real credential.
2. Add a named placeholder in the appropriate environment/config file.
3. Never insert a fake-but-plausible secret.
4. Never commit a real secret.
5. Continue all independent work that is not blocked.
6. Tell the user exactly which credential is needed.
7. Give detailed acquisition/setup instructions for that credential at that time.
8. State exactly where the user should paste it.
9. After the user supplies/configures it, verify the integration.

Use `API_SETUP.md` as the credential registry.

## Secret handling
- Client-safe public identifiers may use `EXPO_PUBLIC_*`.
- Server-only secrets must never use `EXPO_PUBLIC_*`.
- Supabase service-role keys must never be shipped in the mobile app.
- Google Places/Routes server keys should be stored as Supabase Edge Function secrets or another server-side secret store.
- Do not print secrets into logs.
- Do not put secrets in README files, screenshots, commits, or test fixtures.

## Work style
Before non-trivial modifications:
- Inspect the current tree.
- Read relevant files.
- Understand existing architecture before editing.
- Preserve working behavior unless the plan explicitly replaces it.
- Prefer narrow, reversible edits over broad rewrites.
- Do not rebuild an existing feature just because a different template implements it differently.

For each implementation phase:
- implement,
- typecheck/lint where available,
- run relevant tests,
- inspect errors,
- fix regressions,
- then move on.

## Blocking behavior
Do not stop merely because one API key is missing.
Mark only the affected integration as blocked and continue unrelated phases.

Ask the user only for account/device actions that the agent cannot perform safely, such as:
- creating a Supabase project,
- creating Google Cloud OAuth credentials,
- enabling billing/APIs,
- entering secrets,
- accepting device permissions,
- testing physical-device behavior.

## Product safety/privacy rules
- Discovery may show approximate distance and broad area only.
- Do not show exact map pins for nearby users.
- Radar positions are illustrative; they must not reveal a precise bearing.
- Meeting recommendations should favor public places.
- Block/report is a V1 requirement.
- Matching should not bypass blocks, passes, or privacy filters.

## Definition of done
A feature is not done because the screen renders.
It is done when:
- the intended user flow works,
- loading/empty/error states exist,
- TypeScript has no feature-related errors,
- permissions/failure paths are handled,
- privacy rules are respected,
- and the feature works with the real backend or is explicitly marked as awaiting one named credential.
