# PROJECT_CONTEXT.md

> Single source of truth for any AI assistant working on this project. Keep this file updated any time significant changes are made to the codebase.

---

## Last Updated

March 9, 2026 (bidirectional friendship fix)

---

## Project Summary

inTouch is a mobile social app built with React Native / Expo that helps friends stay aware of where each other are in the world. Users set a home city and a current city on their profile; friends can see each other on a list or map view. The core value proposition is knowing when a friend happens to be in your city — enabling spontaneous meetups that would otherwise never happen. Authentication is handled by Clerk, location data is stored per-user in a PostgreSQL database, and friend connections require mutual acceptance before location data is shared.

---

## Tech Stack

### Backend
| Package | Version | Purpose |
|---|---|---|
| Node.js | runtime | Server runtime |
| Express | ^5.1.0 | HTTP server / routing |
| @prisma/client | ^6.8.2 | Database ORM |
| prisma | ^6.8.2 | Schema management & migrations |
| @clerk/clerk-sdk-node | ^5.1.6 | JWT verification middleware |
| cors | ^2.8.5 | Cross-origin request handling |
| dotenv | ^16.5.0 | Environment variable loading |
| nodemon | ^3.1.10 | Dev auto-restart |
| PostgreSQL | — | Primary database |

### Frontend
| Package | Version | Purpose |
|---|---|---|
| expo | ~53.0.9 | React Native toolchain |
| react | 19.0.0 | UI library |
| react-native | 0.79.2 | Native runtime |
| expo-router | ~5.0.6 | File-based navigation |
| @clerk/clerk-expo | ^2.19.4 | Auth (sign-in, sign-up, JWT) |
| expo-secure-store | ^15.0.7 | Clerk token cache |
| @react-native-async-storage/async-storage | ^2.1.2 | Local storage (DB user ID) |
| react-native-maps | 1.20.1 | MapView + Markers for friends map |
| react-native-google-places-autocomplete | ^2.6.1 | City search on profile |
| react-native-safe-area-context | — | Safe area insets |
| typescript | ~5.8.3 | Type safety |

### External Services
| Service | Usage |
|---|---|
| Clerk | Authentication (email/password + Google/Apple OAuth), JWT tokens |
| Google Places API | City autocomplete on profile screen |

---

## Project Structure

```
inTouch/
├── .env                              # Root-level (EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY)
├── .gitignore
├── .cursorrules
├── PROJECT_CONTEXT.md
├── README.md
├── SETUP.md
├── filetree.txt
│
├── backend/
│   ├── .env                          # DATABASE_URL, CLERK_SECRET_KEY, CLERK_PUBLISHABLE_KEY
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── generated/prisma/             # Auto-generated Prisma client (committed)
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/
│   │       ├── 20250523010221_init/
│   │       ├── 20250523022815_add_friendship_and_location/
│   │       ├── 20250523023429_add_location_fields/
│   │       ├── 20251122203013_add_clerk_id/
│   │       ├── 20251215032951_add_friendship_status/
│   │       └── migration_lock.toml
│   └── src/
│       ├── index.js                  # Express app entry point
│       ├── testPrisma.js             # Manual Prisma test script
│       ├── controllers/
│       │   ├── friendController.js
│       │   ├── syncController.js
│       │   └── userController.js
│       ├── middleware/
│       │   └── auth.js               # Clerk JWT verification + attachClerkUser
│       └── routes/
│           ├── friendRoutes.js
│           ├── syncRoutes.js
│           └── userRoutes.js
│
├── docs/
│   ├── AUTH_FLOW.md
│   ├── AUTH_SETUP.md
│   ├── EMPTY_BODY_FIX.md
│   ├── FRIEND_REQUEST_IMPLEMENTATION.md
│   ├── GOOGLE_PLACES_IMPLEMENTATION.md
│   ├── GOOGLE_PLACES_UX_FIXES.md
│   ├── HEADER_COMPONENT_FIX.md
│   ├── MIGRATION_NOTES.md
│   ├── PROFILE_FLATLIST_REFACTOR.md
│   ├── RACE_CONDITION_FIX.md
│   └── SYNC_FIX.md
│
└── frontend/intouch-frontend/
    ├── .env                          # EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY, EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
    ├── .gitignore
    ├── app.json                      # Expo config, scheme: "intouchfrontend"
    ├── eslint.config.js
    ├── expo-env.d.ts
    ├── package.json
    ├── package-lock.json
    ├── tsconfig.json                 # strict mode, path alias @/* → ./
    ├── .expo/
    │   ├── README.md
    │   ├── devices.json
    │   └── types/router.d.ts
    ├── .vscode/settings.json
    ├── app/
    │   ├── _layout.tsx               # Root layout: ClerkProvider + Stack nav
    │   ├── index.tsx                 # Auth gate: redirects to tabs or sign-in
    │   ├── oauth-callback.tsx        # Handles OAuth deep-link redirect
    │   ├── +not-found.tsx
    │   ├── (auth)/
    │   │   ├── _layout.tsx
    │   │   ├── sign-in.tsx
    │   │   └── sign-up.tsx
    │   └── (tabs)/
    │       ├── _layout.tsx           # Tab bar config (Home, Friends, Notifications, Profile, Settings)
    │       ├── index.tsx             # Home tab — PLACEHOLDER
    │       ├── profile.tsx           # Profile view/edit
    │       ├── friends.tsx           # Friends list + map view
    │       ├── notifications.tsx     # PLACEHOLDER (empty screen)
    │       ├── settings.tsx          # Account info + sign out
    │       └── explore.tsx           # UNUSED Expo template screen
    ├── assets/
    │   ├── fonts/SpaceMono-Regular.ttf
    │   └── images/                   # App icons, splash screen
    ├── components/
    │   ├── Collapsible.tsx
    │   ├── ExternalLink.tsx
    │   ├── FriendRequestsModal.tsx   # Modal for accept/reject incoming requests
    │   ├── HapticTab.tsx
    │   ├── HelloWave.tsx
    │   ├── ParallaxScrollView.tsx
    │   ├── ThemedText.tsx
    │   ├── ThemedView.tsx
    │   ├── auth/
    │   │   ├── AuthButton.tsx        # Reusable themed button (primary/secondary)
    │   │   ├── AuthInput.tsx         # Reusable themed input with error state
    │   │   ├── OAuthButton.tsx       # Google/Apple OAuth button
    │   │   ├── RequireAuth.tsx       # Guard: redirects unauthenticated users
    │   │   └── UserSync.tsx          # Syncs Clerk user to DB on mount
    │   └── ui/
    │       ├── IconSymbol.tsx
    │       ├── IconSymbol.ios.tsx
    │       ├── TabBarBackground.tsx
    │       └── TabBarBackground.ios.tsx
    ├── constants/Colors.ts           # Light/dark tint colors
    ├── hooks/
    │   ├── useColorScheme.ts
    │   ├── useColorScheme.web.ts
    │   └── useThemeColor.ts
    ├── lib/
    │   └── api.ts                    # createAuthedFetch factory
    ├── scripts/reset-project.js
    ├── services/
    │   └── api.ts                    # ApiService class — all API calls
    └── utils/                        # Empty directory
```

---

## Database Schema

```prisma
// backend/prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(uuid())
  clerkId     String   @unique
  name        String
  email       String   @unique
  company     String?
  homeCity    String?
  currentCity String?
  latitude    Float?
  longitude   Float?
  lastUpdated DateTime @default(now())
  createdAt   DateTime @default(now())

  friends  Friendship[] @relation("UserFriends")
  friendOf Friendship[] @relation("FriendOf")
}

model Friendship {
  id        String   @id @default(uuid())
  userId    String
  friendId  String
  status    String   @default("PENDING")  // "PENDING" | "ACCEPTED"
  createdAt DateTime @default(now())

  user   User @relation("UserFriends", fields: [userId], references: [id])
  friend User @relation("FriendOf", fields: [friendId], references: [id])

  @@unique([userId, friendId])
}
```

**Note on friendship storage:** The `Friendship` table stores one row per connection: `{ userId: requester, friendId: recipient, status }`. There is no reverse row. `getUserFriends` queries both the `userId` and `friendId` columns and merges the results so both sides of a connection see each other. Results are deduplicated by user ID before returning.

---

## API Endpoints

All protected routes require `Authorization: Bearer <clerk_jwt_token>` header.

### Public

| Method | Path | Description | Response |
|---|---|---|---|
| `GET` | `/health` | Health check | `{ status: "ok" }` |

### User Routes (`/users`) — all protected

| Method | Path | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/users` | Create user manually | `{ name, email, company?, homeCity?, currentCity? }` | `User` object |
| `GET` | `/users` | Get all users | — | `User[]` |
| `GET` | `/users/search?q=` | Search by name or email (max 10) | query param `q` | `User[]` |
| `GET` | `/users/:id` | Get user by DB UUID | — | `User` object |
| `GET` | `/users/:id/friends` | Get accepted friends of user | — | `User[]` (each with `friendshipId`) |
| `PUT` | `/users/:id` | Update user profile | `{ name?, email?, company?, homeCity?, currentCity?, latitude?, longitude? }` | Updated `User` |

### Friend Routes (`/friends`) — all protected

| Method | Path | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/friends` | Send friend request (creates PENDING) | `{ userId, friendId }` | `Friendship` object |
| `DELETE` | `/friends` | Remove friend | `{ userId, friendId }` | `{ message: "Friendship removed successfully." }` |
| `GET` | `/friends/requests/:userId` | Get incoming PENDING requests | — | `User[]` (each with `friendshipId`) |
| `PUT` | `/friends/:id/accept` | Accept a friend request | — | `{ message, friendship }` |
| `DELETE` | `/friends/:id/reject` | Reject/delete a friend request | — | `{ message: "Friend request rejected." }` |

### Sync Route — protected

| Method | Path | Description | Request Body | Response |
|---|---|---|---|---|
| `POST` | `/api/sync-user` | Upsert Clerk user into DB | `{ email, name, username? }` | `User` object (DB record) |

**`User` object shape:**
```json
{
  "id": "uuid",
  "clerkId": "clerk_xxx",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "company": null,
  "homeCity": "San Francisco, CA, USA",
  "currentCity": "New York, NY, USA",
  "latitude": 40.7128,
  "longitude": -74.006,
  "lastUpdated": "2025-12-15T03:29:51.000Z",
  "createdAt": "2025-05-23T01:02:21.000Z"
}
```

---

## Environment Variables

### `/.env` (root)
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
```

### `/backend/.env`
```
DATABASE_URL
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY
```

### `/frontend/intouch-frontend/.env`
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
```

**Note:** `EXPO_PUBLIC_API_URL` is not set anywhere. All API calls fall back to `http://localhost:5001`. On a physical device or a simulator on a different machine, this will fail unless you set `EXPO_PUBLIC_API_URL` to the backend machine's LAN IP (e.g. `http://192.168.1.x:5001`).

---

## What's Actually Working

The following features are fully functional end-to-end:

- **Authentication** — Email/password sign-up and sign-in via Clerk, including email verification code step. Google and Apple OAuth flows work with deep-link redirect back to the app.
- **User sync** — On first auth, `UserSync` component calls `POST /api/sync-user`, creates a DB record, and stores the DB UUID in AsyncStorage for all future requests.
- **Profile view and edit** — Users can view and edit their name, email, company, home city, and current city. Home/current city use Google Places Autocomplete with coordinate capture. Profile saves to the backend via `PUT /users/:id`.
- **Friends list** — Fetches all accepted friends and displays them as cards with initials avatar, current city, and home city.
- **Friends map** — Toggleable map view showing custom circular initials markers for all friends that have coordinates set. Auto-fits map region to show all friends.
- **Friend search** — Search bar on the Friends screen filters the loaded friends list by name or city (client-side). Separate user search for adding new friends goes through `GET /users/search?q=`.
- **Friend requests** — Full send/accept/reject flow: user searches for another user, sends a request (PENDING), recipient sees a badge count on the friends tab, opens the modal, and accepts or ignores. Accepted friends appear in the list and map.
- **Bidirectional friends list** — Both sides of a friendship see each other after acceptance. `getUserFriends` queries both the `userId` and `friendId` directions and deduplicates. `removeFriend` also searches both directions so either party can remove the connection.
- **Sign out** — Settings screen signs out of Clerk and redirects to sign-in.

---

## What's Stubbed / Incomplete

- **Home tab (`app/(tabs)/index.tsx`)** — Shows a static "Welcome to inTouch / You'll see friends who are in the same city here" message. No API calls. The core feature (detecting when a friend is in your city) is not built yet.
- **Notifications tab (`app/(tabs)/notifications.tsx`)** — Renders only "Notifications Screen" text. No functionality. No API calls.
- **Explore tab (`app/(tabs)/explore.tsx`)** — The default Expo template screen. Should be deleted or repurposed. Currently included in the tab bar but not part of the product.
- **`frontend/intouch-frontend/utils/`** — Directory exists but is empty.
- **Push notifications** — There is no push notification system. The notification badge for friend requests is polled on screen load only; there are no real-time or background notifications.
- **User profile screen for other users** — There is no screen to view another user's full profile. Friends are shown as cards with limited info only.
- **Cancel sent friend request** — Users can send requests but cannot cancel them once sent.

---

## Current Auth Flow

```
App launch
  └─ app/_layout.tsx
       └─ <ClerkProvider publishableKey={EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY}
                         tokenCache={SecureStore}>
            └─ app/index.tsx
                 ├─ useAuth().isSignedIn === false  →  redirect to /(auth)/sign-in
                 └─ useAuth().isSignedIn === true   →  redirect to /(tabs)

Sign-in / Sign-up screens (app/(auth)/sign-in.tsx, sign-up.tsx)
  ├─ Email + password via Clerk's useSignIn() / useSignUp()
  ├─ Email verification code step on sign-up
  └─ Google / Apple OAuth via useOAuth() → deep-link back to app://oauth-callback

After sign-in, on tab load:
  └─ components/auth/RequireAuth.tsx   guards all tab screens
  └─ components/auth/UserSync.tsx      (runs once per session)
       ├─ reads clerkUser from useUser()
       ├─ checks AsyncStorage for 'user_id'
       ├─ if missing: calls POST /api/sync-user with { email, name }
       │    and Authorization: Bearer <clerk_token>
       ├─ backend verifies JWT with ClerkExpressRequireAuth()
       ├─ backend upserts User row keyed on clerkId
       └─ stores returned DB user.id in AsyncStorage as 'user_id'

All subsequent API calls:
  └─ apiService.setAuth(getToken) sets up createAuthedFetch
       └─ every request adds: Authorization: Bearer <clerk_token>
  └─ DB user ID read from AsyncStorage('user_id') as needed
```

---

## Frontend Screens

### `app/index.tsx` — Auth Gate
- Reads `isSignedIn` from Clerk `useAuth()`
- Redirects to `/(tabs)` if signed in, `/(auth)/sign-in` if not
- No UI rendered directly

### `app/(auth)/sign-in.tsx` — Sign In
- Email + password form using Clerk `useSignIn()`
- Google and Apple OAuth buttons via `OAuthButton` component
- Link to sign-up screen

### `app/(auth)/sign-up.tsx` — Sign Up
- Email, username, and password form using Clerk `useSignUp()`
- Email verification code step (Clerk sends 6-digit code)
- Google and Apple OAuth buttons
- Link to sign-in screen

### `app/oauth-callback.tsx` — OAuth Callback Handler
- Handles `intouchfrontend://oauth-callback` deep link
- Calls `useOAuth().handleOpenAuthSessionAsync()`
- Redirects to `/(tabs)` on success

### `app/(tabs)/index.tsx` — Home Tab (PLACEHOLDER)
- Static text: "Welcome to inTouch / You'll see friends who are in the same city here"
- No API calls
- Intended future feature: show which friends are currently in the same city as you

### `app/(tabs)/profile.tsx` — Profile
- Loads user from `GET /users/:id` (ID from AsyncStorage)
- Falls back to `POST /api/sync-user` if no ID stored yet
- View mode: shows all profile fields as read-only inputs
- Edit mode: name, email, company as TextInput; homeCity and currentCity via `GooglePlacesAutocomplete` (fetches coordinates)
- Save calls `PUT /users/:id`
- Known issue: homeCity and currentCity share the same `latitude`/`longitude` state — last one set wins

### `app/(tabs)/friends.tsx` — Friends
- On mount: calls `GET /users/:id/friends` and `GET /friends/requests/:userId`
- List view: FlatList of friend cards (initials avatar, name, current/home city)
- Map view: `react-native-maps` MapView with custom circular initials markers; auto-fits region; shows notice if some friends lack coordinates
- Search bar filters loaded list client-side by name or city
- Header badge showing count of pending incoming friend requests
- Tapping badge opens `FriendRequestsModal`
- Refresh button re-fetches both friends and request count

### `app/(tabs)/notifications.tsx` — Notifications (PLACEHOLDER)
- Renders only "Notifications Screen" text
- No API calls

### `app/(tabs)/settings.tsx` — Settings
- Reads `user` from Clerk `useAuth()` (Clerk object, not DB object)
- Displays email and username from Clerk
- Sign Out button: calls `signOut()`, redirects to `/(auth)/sign-in`
- No API calls to backend

### `app/(tabs)/explore.tsx` — Explore (UNUSED)
- Default Expo starter template screen
- Still present in codebase and tab bar; should be removed

### `components/FriendRequestsModal.tsx` — Friend Requests Modal
- Full-screen modal opened from Friends screen
- Calls `GET /friends/requests/:userId` on open
- Shows list of users who sent requests with initials avatar
- "Accept" button calls `PUT /friends/:id/accept`, refreshes list
- "Ignore" button calls `DELETE /friends/:id/reject`, refreshes list
- Empty state when no pending requests

---

## Known Issues / Tech Debt

1. **Shared latitude/longitude for homeCity and currentCity** — In `profile.tsx`, selecting a currentCity overwrites the same `latitude`/`longitude` state as homeCity. The DB only stores one coordinate pair. If you want to show both pins independently on the map, this needs to be split into `homeLatitude/homeLongitude` and `currentLatitude/currentLongitude`.

2. **No `EXPO_PUBLIC_API_URL` in any `.env`** — The app always falls back to `http://localhost:5001`. This only works when running the simulator on the same machine as the backend. For physical device testing or staging, set this env var to the appropriate host.

3. **No push notifications** — Friend request badge count is loaded only when the Friends screen mounts. There is no real-time or background notification system. A user will not know they received a request unless they open the app and navigate to Friends.

4. **Settings screen uses Clerk user object, not DB user** — The settings screen displays data from `useAuth()` (Clerk), not from the database. If a user updates their name on the Profile screen (which updates the DB), Settings will still show the Clerk-side name.

5. **`explore.tsx` is still in the tab bar** — The Expo template screen is included in tab navigation and should be removed or replaced.

6. **`utils/` directory is empty** — The directory exists but contains nothing. Either remove it or populate it with shared utility functions.

7. **No pagination on `/users` or search** — `GET /users` returns all users with no limit. `GET /users/search` caps at 10 results but there is no cursor-based pagination.

8. **`testPrisma.js` committed to source** — `backend/src/testPrisma.js` is a manual debugging script that should not be in production source.

---

## Last Thing We Were Building

The **bidirectional friendship fix** was the last completed work. This includes:
- `getUserFriends` in `backend/src/controllers/userController.js` now runs two Prisma queries (one for `userId = id`, one for `friendId = id`), merges the results, and deduplicates by user ID using a `Set` before returning. Both sides of an accepted connection now see each other.
- `removeFriend` in `backend/src/controllers/friendController.js` now uses a Prisma `OR` clause to find the friendship row in either column direction, so either party can successfully remove the connection regardless of who originally sent the request.
- No schema changes or migrations were required.

Prior to that: the **friend request system** — `Friendship.status` field (`PENDING` | `ACCEPTED`), endpoints for get/accept/reject requests, `FriendRequestsModal` component, and badge count on the Friends tab. Reference: `docs/FRIEND_REQUEST_IMPLEMENTATION.md`

---

## Next Priorities

1. **Home tab — "friends in your city" feature** — The core product promise. Query the backend for friends whose `currentCity` (or `homeCity`) matches the current user's `currentCity`. Display them as a list on the Home tab. Requires either a new backend endpoint (`GET /users/:id/friends/nearby` or similar) or client-side filtering of the friends list.

2. **Notifications tab** — Replace the placeholder with real functionality. At minimum, show a list of recent friend request activity (accepted/received). Longer term, integrate Expo Push Notifications (`expo-notifications`) so users get background alerts when someone sends them a friend request.

3. **Split latitude/longitude per city** — Currently `homeCity` and `currentCity` share a single `latitude`/`longitude` pair in the DB and in profile state. Splitting into `homeLatitude/homeLongitude` and `currentLatitude/currentLongitude` would allow the map to show both a home pin and a current-location pin per friend.
