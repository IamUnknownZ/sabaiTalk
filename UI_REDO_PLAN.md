# SabaiTalk UI Redo Plan

## Direction
Repo 2 is the primary visual skeleton. Repo 1 supplies supporting patterns where Repo 2 is thin (chat input/header, full-screen match celebration, exhausted-card state, simple auth/profile forms).

## Rules
- Mobile-first: design around 390×844.
- Preserve SabaiTalk routes, logic, privacy behavior, colors, and generated assets.
- Do not invent a new card/box pattern when Repo 1 or Repo 2 already provides one.
- Prefer photo/illustration-first composition, simple white cards, subtle shadows, circular actions, compact headers, and plain message rows.
- Keep SabaiTalk-specific features (Radar, Fair Meeting, approximate location) visually subordinate to the main content instead of turning them into extra dashboard panels.

## Order
1. Fix tester bugs.
2. Align theme/shared primitives.
3. Redo Welcome/Auth/Onboarding.
4. Redo Discover/Matches/Chats/Profile/Match.
5. Redo Meeting using Repo 2 profile-detail structure.
6. Verify typecheck, lint, Expo Doctor, web export, Android export.
