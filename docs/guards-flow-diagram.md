# Guards and Protection - Flow Diagram

## User Access Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     User Navigates to /game/*                    │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                   ┌──────────────────┐
                   │  Next.js         │
                   │  Middleware      │
                   └────────┬─────────┘
                            │
                ┌───────────┴───────────┐
                │                       │
                ▼                       ▼
    ┌──────────────────┐    ┌──────────────────┐
    │ Has auth_token   │    │ No auth_token    │
    │ cookie?          │    │ cookie?          │
    └────────┬─────────┘    └────────┬─────────┘
             │                       │
             │                       ▼
             │              ┌──────────────────┐
             │              │ Redirect to      │
             │              │ /auth/login      │
             │              │ with returnUrl   │
             │              └──────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ Allow access &   │
    │ render page      │
    └────────┬─────────┘
             │
             ▼
    ┌──────────────────────────────────────────┐
    │          Page Loads with RouteGuard       │
    └────────┬─────────────────────────────────┘
             │
             ▼
    ┌──────────────────┐
    │   useAuth()      │
    │   Hook Runs      │
    └────────┬─────────┘
             │
    ┌────────┴─────────┐
    │                  │
    ▼                  ▼
┌────────────┐    ┌────────────────┐
│ Has JWT?   │    │ No JWT?        │
│ Load user  │    │ Check guest    │
│ from API   │    │ session        │
└─────┬──────┘    └────────┬───────┘
      │                    │
      │           ┌────────┴──────────┐
      │           │                   │
      │           ▼                   ▼
      │    ┌──────────────┐   ┌──────────────┐
      │    │ Has valid    │   │ No guest     │
      │    │ guest        │   │ session      │
      │    │ session?     │   │              │
      │    └──────┬───────┘   └──────┬───────┘
      │           │                  │
      │           │                  ▼
      │           │         ┌──────────────────┐
      │           │         │ Prompt for       │
      │           │         │ guest username   │
      │           │         │ or redirect to   │
      │           │         │ login            │
      │           │         └──────────────────┘
      │           │
      ▼           ▼
┌──────────────────────────┐
│    User is Authorized    │
│    Render Page Content   │
└──────────────────────────┘
```

## Authentication State Machine

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Start                         │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Initialize     │
                   │  Auth Store     │
                   └────────┬────────┘
                            │
                ┌───────────┴────────────┐
                │                        │
                ▼                        ▼
    ┌────────────────────┐   ┌────────────────────┐
    │ Try to load        │   │ No authentication  │
    │ JWT profile        │   │ found              │
    └────────┬───────────┘   └────────┬───────────┘
             │                        │
    ┌────────┴────────┐               │
    │                 │               │
    ▼                 ▼               ▼
┌─────────┐    ┌──────────┐   ┌──────────────┐
│ Success │    │ Failed   │   │ Check for    │
│ Set     │    │ Try      │   │ guest        │
│ authed  │    │ guest    │   │ session in   │
│ user    │    │ session  │   │ localStorage │
└─────────┘    └────┬─────┘   └──────┬───────┘
                    │                │
                    └────────┬───────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
            ┌──────────────┐   ┌──────────────┐
            │ Guest        │   │ No session   │
            │ session      │   │ found        │
            │ found        │   │              │
            └──────┬───────┘   └──────┬───────┘
                   │                  │
                   ▼                  ▼
           ┌──────────────┐   ┌──────────────┐
           │ Set guest    │   │ User is      │
           │ user in      │   │ anonymous    │
           │ store        │   │              │
           └──────────────┘   └──────────────┘
```

## Guest Session Lifecycle

```
┌──────────────────────────────────────────────────────┐
│         User wants to join/create game                │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ Check if user   │
             │ has access      │
             │ (useGameAccess) │
             └────────┬────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
  ┌──────────────┐       ┌──────────────┐
  │ Already      │       │ Not          │
  │ authenticated│       │ authenticated│
  │ or guest     │       │ or guest     │
  └──────┬───────┘       └──────┬───────┘
         │                      │
         │                      ▼
         │             ┌─────────────────┐
         │             │ Show username   │
         │             │ prompt          │
         │             └────────┬────────┘
         │                      │
         │                      ▼
         │             ┌─────────────────┐
         │             │ createGuest     │
         │             │ Session()       │
         │             │ - Generate ID   │
         │             │ - Set expiry    │
         │             │ - Save to       │
         │             │   localStorage  │
         │             └────────┬────────┘
         │                      │
         └──────────────┬───────┘
                        │
                        ▼
              ┌──────────────────┐
              │ User can now     │
              │ access game      │
              │ features         │
              └────────┬─────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
  ┌──────────────┐         ┌──────────────┐
  │ After 24h    │         │ User         │
  │ session      │         │ registers    │
  │ expires      │         │ account      │
  └──────┬───────┘         └──────┬───────┘
         │                        │
         ▼                        ▼
  ┌──────────────┐         ┌──────────────┐
  │ Guest        │         │ Clear guest  │
  │ session      │         │ session      │
  │ cleared      │         │ Use JWT auth │
  └──────────────┘         └──────────────┘
```

## API Integration Flow

```
┌──────────────────────────────────────────────────────┐
│         Frontend Game Operation                       │
│         (Create, Join, etc.)                         │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
             ┌─────────────────┐
             │ useGameAccess() │
             │                 │
             │ getGameUsername()│
             │ getGameUserId() │
             └────────┬────────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
  ┌──────────────┐       ┌──────────────┐
  │ Authenticated│       │ Guest User   │
  │ User         │       │              │
  │              │       │              │
  │ username: X  │       │ username: Y  │
  │ userId: ABC  │       │ userId: null │
  └──────┬───────┘       └──────┬───────┘
         │                      │
         └──────────────┬───────┘
                        │
                        ▼
              ┌──────────────────┐
              │ POST /games      │
              │ {                │
              │   characterSetId │
              │   hostUsername   │
              │   hostUserId     │← nullable
              │ }                │
              └────────┬─────────┘
                       │
                       ▼
              ┌──────────────────┐
              │ Backend          │
              │ Validates &      │
              │ Creates Game     │
              │                  │
              │ - Uses userId if │
              │   provided       │
              │ - Falls back to  │
              │   username for   │
              │   guests         │
              └──────────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Layer 1: Middleware                   │
│  Server-side route protection (JWT cookie check)        │
│  - Catches unauthenticated requests early               │
│  - Redirects to login with return URL                   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Layer 2: RouteGuard                     │
│  Client-side component protection                       │
│  - Checks authentication & guest status                 │
│  - Shows loading state during check                     │
│  - Redirects if access denied                           │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                Layer 3: Backend Validation               │
│  API endpoint authorization                             │
│  - Validates JWT or guest credentials                   │
│  - Checks permissions for operations                    │
│  - Returns 401/403 if unauthorized                      │
└─────────────────────────────────────────────────────────┘
```
