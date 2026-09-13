# SabaiTalk — Open-Source Source and License Tracker

This file tracks templates, components, code references, and assets considered or reused by SabaiTalk.

## Rules
- Public GitHub does not automatically mean reusable code.
- Verify an explicit license before copying source code.
- Repositories with no license are visual/behavioral inspiration only.
- Preserve required notices for permissive licenses.
- Replace third-party branding, logos, and unclear demo imagery.

## Audited repositories

| Repository | License | SabaiTalk use | Code status | Verification |
|---|---|---|---|---|
| MartsTech/tinder-clone | MIT | match/chat flow reference | concepts and behavior adapted to Supabase; old Firebase/MobX code not shipped | verified at commit `64702cd` |
| stevenpersia/tinder-expo | MIT | primary card/matches/messages/profile UI reference | UI patterns/components adapted and substantially restyled/restructured | verified at commit `c777c09` |
| aman40399/cufy_application | no license found | visual/UX inspiration only | **no code copied** | inspected at commit `972b6285` |
| Prakashchandra-007/humbble | not audited in this phase | unused | no | candidate only |
| mashtechk/react-native-tinder-clone | not audited in this phase | unused | no | candidate only |

## Required notices
Copies of the MIT notices for the two reused permissive sources are stored in:
- `third_party/MartsTech-tinder-clone-LICENSE.txt`
- `third_party/stevenpersia-tinder-expo-LICENSE.txt`

## SabaiTalk-owned work
SabaiTalk-specific architecture, Expo Router shell, design tokens, location privacy model, PostGIS schema/RPCs, deterministic match scoring, fair-meeting scoring, copy, and custom project assets are project-specific work unless explicitly noted above.
