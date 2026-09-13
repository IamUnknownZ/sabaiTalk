# SabaiTalk — Real API Setup & Handoff Guide

เอกสารนี้ใช้สำหรับส่งต่อให้คนอื่นตั้งค่า API จริงของ SabaiTalk ต่อจาก placeholder ที่มีอยู่ในโปรเจกต์

> Path ทั้งหมดในเอกสารนี้เริ่มจาก root ของ workspace SabaiTalk
>
> Runtime ปัจจุบันเป็น **real-data-only**: ถ้า API/backend ยังไม่ถูกตั้งค่าหรือ request ล้มเหลว แอปจะแสดง error/empty state และจะไม่ fallback ไป fake profiles, chats, locations หรือ meeting recommendations

---

## 1. ภาพรวม: ตอนนี้ต้องใช้ API / Key อะไรบ้าง

| ค่า | เอาจากไหน | วางที่ไหน |
|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | Supabase → Project → Connect | `.env.local` |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API Keys → Legacy anon/public key | `.env.local` |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud → Credentials → Maps SDK for Android key | `.env.local` |
| `SUPABASE_URL` | Supabase project | Production Edge Function มีให้อัตโนมัติ |
| `SUPABASE_ANON_KEY` | Supabase project | Production Edge Function มีให้อัตโนมัติ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project | Production Edge Function มีให้อัตโนมัติ |
| `GOOGLE_PLACES_API_KEY` | Google Cloud → Places API (New) key | Supabase Edge Function Secrets |
| `GOOGLE_ROUTES_API_KEY` | Google Cloud → Routes API key | Supabase Edge Function Secrets |
| `ALLOWED_ORIGINS` | Production web origin allow-list | Supabase Edge Function Secrets |

---

# 2. Client environment file

สร้างไฟล์:

```text
.env.local
```

ใช้ `.env.example` เป็น template

ตอนนี้ค่าที่ต้องใส่จริงใน client คือ:

```env
EXPO_PUBLIC_APP_ENV=development

EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=

EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=
```

Google OAuth สามตัวนี้ยังไม่จำเป็นถ้ายังไม่ได้ทำ Google Sign-In:

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

ห้ามใส่ server secrets เช่น:

```text
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_PLACES_API_KEY
GOOGLE_ROUTES_API_KEY
```

ไว้ใน `.env.local` หรือ variable ที่ขึ้นต้นด้วย `EXPO_PUBLIC_`

---

# 3. Supabase URL

เข้า:

```text
Supabase Dashboard
→ เปิด project SabaiTalk
→ Connect
```

หา Project URL เช่น:

```text
https://xxxxxxxx.supabase.co
```

ใส่ลง:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
```

ใน:

```text
.env.local
```

---

# 4. Supabase ANON key

โค้ด SabaiTalk ปัจจุบันยังใช้ legacy anon key

เข้า:

```text
Supabase Dashboard
→ Settings
→ API Keys
→ Legacy API Keys
→ anon / public
```

นำ key ที่ได้ใส่:

```env
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

ใน:

```text
.env.local
```

ฝั่ง client ใช้ anon key ได้ เพราะข้อมูลถูกป้องกันด้วย RLS

ห้ามเอา:

```text
service_role
```

มาใส่ฝั่ง client

---

# 5. Google Cloud APIs ที่ต้องเปิด

ใช้ Google Cloud Project เดียวสำหรับ SabaiTalk

เข้า:

```text
Google Cloud Console
→ APIs & Services
→ Library
```

เปิด 3 API นี้:

```text
Maps SDK for Android
Places API (New)
Routes API
```

Google Maps Platform ต้องเปิด Billing account ก่อนจึงจะเปิดใช้งาน API จริงได้

---

# 6. Google Maps key สำหรับ Android

สร้าง key ใหม่:

```text
Google Cloud Console
→ APIs & Services
→ Credentials
→ Create credentials
→ API key
```

แนะนำชื่อ:

```text
SabaiTalk Android Maps
```

API restriction:

```text
Maps SDK for Android
```

Application restriction:

```text
Android apps
```

ต้องใส่:

```text
Android package name
SHA-1 signing certificate fingerprint
```

จากนั้นนำ key ที่ได้ใส่:

```env
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=YOUR_ANDROID_MAPS_KEY
```

ใน:

```text
.env.local
```

Android package ของโปรเจกต์ถูกกำหนดไว้แล้วเป็น:

```text
com.iamunknownz.sabaitalk
```

ให้ใช้ package นี้ตอนสร้าง Android application restriction และเพิ่ม SHA-1 ของ signing certificate ที่ตรงกับ build ที่จะติดตั้ง

---

# 7. Google Places key

สร้าง API key แยกจาก Maps key

ชื่อแนะนำ:

```text
SabaiTalk Places Server
```

API restriction:

```text
Places API (New)
```

อย่าใช้ Android app restriction กับ key นี้ เพราะ Places ใน SabaiTalk ถูกเรียกจาก Supabase Edge Function ไม่ได้เรียกจาก Android client โดยตรง

นำ key ไปใส่ที่:

```text
Supabase Dashboard
→ Edge Functions
→ Secrets
```

ชื่อ secret:

```text
GOOGLE_PLACES_API_KEY
```

อย่าใส่ Places key ใน `.env.local`

---

# 8. Google Routes key

สร้าง API key ใหม่อีกหนึ่งตัว

ชื่อแนะนำ:

```text
SabaiTalk Routes Server
```

API restriction:

```text
Routes API
```

นำ key ไปใส่ที่:

```text
Supabase Dashboard
→ Edge Functions
→ Secrets
```

ชื่อ secret:

```text
GOOGLE_ROUTES_API_KEY
```

อย่าใส่ Routes key ใน `.env.local`

---

# 9. Supabase Edge Function environment

ไฟล์ตัวอย่าง local อยู่ที่:

```text
supabase/.env.example
```

ค่าที่รองรับ:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GOOGLE_PLACES_API_KEY=
GOOGLE_ROUTES_API_KEY=
ALLOWED_ORIGINS=
```

ไฟล์นี้เป็น template เท่านั้น ห้ามใส่ real secret ลงในไฟล์ `.env.example`

Production Supabase Edge Function มีค่าต่อไปนี้ให้เองอยู่แล้ว:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

ดังนั้น production ต้องเพิ่มเองหลัก ๆ:

```text
GOOGLE_PLACES_API_KEY
GOOGLE_ROUTES_API_KEY
ALLOWED_ORIGINS
```

`ALLOWED_ORIGINS` ใช้สำหรับ Web CORS ของ Edge Function เช่น:

```text
https://app.example.com,https://www.example.com
```

ไม่ต้องใส่ `*` ใน production; native app ยังใช้ Bearer auth ตามปกติและไม่ได้พึ่ง CORS เป็น security boundary

---

# 10. สรุปไฟล์จริงที่ต้องแตะ

## Client

```text
.env.local
```

ใส่:

```env
EXPO_PUBLIC_APP_ENV=development
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...
```

## Client template

```text
.env.example
```

ใช้ดูว่า client รองรับ variable อะไรบ้าง

ห้ามใส่ secret จริงลง template

## Supabase local server template

```text
supabase/.env.example
```

ใช้เป็น reference สำหรับ Edge Function local development

ห้าม commit secret จริง

## Fair Meeting Edge Function

```text
supabase/functions/meeting-recommendations/index.ts
```

ไฟล์นี้อ่าน:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GOOGLE_PLACES_API_KEY
GOOGLE_ROUTES_API_KEY
```

---

# 11. ระบบ Fair Meeting ทำงานอย่างไร

Flow:

```text
User A exact location ─┐
                       ├─ Supabase Edge Function
User B exact location ─┘
            ↓
server อ่าน exact origins
            ↓
คำนวณ midpoint
            ↓
Google Places API (New)
            ↓
ค้นหา public meeting candidates
            ↓
Google Routes API
            ↓
A → Place
B → Place
            ↓
คำนวณ fairness score
            ↓
rank สถานที่
            ↓
ส่งเฉพาะข้อมูล destination กลับ client
```

ตัว client ไม่ควรได้รับ exact location ของอีกฝ่าย

---

# 12. Google Places ใช้ทำอะไร

Places API ใช้ค้นหาสถานที่สาธารณะใกล้ midpoint

category mapping ปัจจุบัน:

```text
cafe   → cafe
food   → restaurant
park   → park
mall   → shopping_mall
cinema → movie_theater
study  → library, cafe
```

Edge Function อยู่ที่:

```text
supabase/functions/meeting-recommendations/index.ts
```

และเรียก:

```text
https://places.googleapis.com/v1/places:searchNearby
```

ข้อมูลที่ขอจาก Google ถูกจำกัดด้วย Field Mask เช่น:

```text
id
displayName
formattedAddress
location
rating
primaryType
currentOpeningHours.openNow
```

---

# 13. Google Routes ใช้ทำอะไร

Places บอกได้แค่ว่าใกล้ midpoint มีสถานที่อะไรบ้าง

Routes ใช้หาว่าแต่ละคนใช้เวลาเดินทางไปแต่ละสถานที่เท่าไร

ตัวอย่าง:

```text
                 User A   User B
Cafe A             14m      15m
Cafe B              8m      24m
Cafe C             18m      17m
```

จากนั้นระบบคำนวณ fairness score

```text
Cafe A → fair มาก
Cafe C → fair
Cafe B → imbalance สูง
```

---

# 14. Google Maps ใช้ทำอะไร

Maps SDK for Android ใช้เฉพาะแสดง destination map

Component หลัก:

```text
src/components/MeetingMap.tsx
```

กฎ privacy:

```text
destination marker only
showsUserLocation = false
showsMyLocationButton = false
ไม่แสดง user origin
ไม่แสดง home
ไม่แสดง live location
ไม่แสดง bearing/direction ของอีกฝ่าย
```

---

# 15. ระบบ location

SabaiTalk ใช้:

```text
expo-location
```

เพื่ออ่าน foreground location ของ user

client ส่ง exact location ไปเก็บใน protected location table ฝั่ง Supabase

exact coordinates ไม่ควรถูก query ออกไปให้ user คนอื่น

Discover/Radar ใช้เพียง:

```text
distance
approx area
illustrative radar
```

Radar ไม่ใช่ real map และไม่แสดง direction จริง

---

# 16. Supabase database hardening

Migrations:

```text
supabase/migrations/0001_initial.sql
supabase/migrations/0002_matching_privacy_hardening.sql
supabase/migrations/0003_security_hardening.sql
```

ระบบหลักมี:

```text
profiles
profile_locations
interests
user_interests
likes
passes
matches
messages
blocks
reports
```

RPC สำคัญ:

```text
set_my_location
set_my_interests
my_onboarding_status
nearby_profiles
like_profile
pass_profile
block_profile
report_profile
my_matches
meeting_origins
consume_meeting_rate_limit
```

`meeting_origins` ต้องใช้ server/service-role เท่านั้น

---

# 17. API key separation

ห้ามใช้ key เดียวทุกอย่าง

ควรแยกเป็น:

```text
SabaiTalk Android Maps
→ Maps SDK for Android
→ client

SabaiTalk Places Server
→ Places API (New)
→ Supabase Edge Function

SabaiTalk Routes Server
→ Routes API
→ Supabase Edge Function
```

ข้อดีคือ restrict, revoke และ audit แยกได้

---

# 18. ลำดับการตั้งค่าที่แนะนำ

ทำตามนี้:

```text
1. Supabase Project URL
2. Supabase anon key
3. ใส่สองค่าลง .env.local
4. ตั้ง Android package แบบถาวร
5. เปิด Maps SDK for Android
6. เปิด Places API (New)
7. เปิด Routes API
8. สร้าง Android Maps key
9. ใส่ Maps key ลง .env.local
10. สร้าง Places server key
11. ใส่ GOOGLE_PLACES_API_KEY ใน Supabase Edge Function Secrets
12. สร้าง Routes server key
13. ใส่ GOOGLE_ROUTES_API_KEY ใน Supabase Edge Function Secrets
14. ใส่ ALLOWED_ORIGINS ถ้ามี production web deployment
15. deploy migrations รวม 0003_security_hardening.sql
16. deploy meeting-recommendations Edge Function
17. ตั้ง Supabase Auth rate limits / CAPTCHA / email confirmation ตาม production policy
18. ทดสอบ Auth guard / onboarding guard / Location / Nearby / Like / Pass / Match / Chat
19. ทดสอบ Places จริง
20. ทดสอบ Routes จริง
21. ทดสอบ Fair Meeting จริง
22. ทดสอบ react-native-maps บน Android device จริง
```

---

# 19. สิ่งที่ห้ามทำ

ห้าม:

```text
เอา SUPABASE_SERVICE_ROLE_KEY ใส่ EXPO_PUBLIC_*
เอา GOOGLE_PLACES_API_KEY ใส่ EXPO_PUBLIC_*
เอา GOOGLE_ROUTES_API_KEY ใส่ EXPO_PUBLIC_*
commit .env.local ที่มี key จริง
commit server secret
เอา exact location ของอีก user มาแสดงใน client
ใช้ real user GPS เป็น radar bearing
```

---

# 20. เมื่อตั้งค่าเสร็จ

หลังใส่ keys ครบแล้ว ให้ตรวจแค่ว่า environment variables มีค่า โดยไม่ print secret ออกมา

จากนั้นทำ:

```text
Supabase migrations
→ Edge Function deploy
→ live auth test
→ RLS/privacy test
→ Nearby/PostGIS test
→ Like/Pass/Match test
→ Realtime chat test
→ Places test
→ Routes test
→ Fair Meeting test
→ Android map test
→ final QA
```

