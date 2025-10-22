# Guards and Protection

This document describes the authentication and authorization guards implemented to protect game routes in the WhoIsIt application.

## Overview

The guards and protection system allows both authenticated users and guest users to access game features while protecting routes from unauthorized access. This is essential for the multiplayer game experience where users may want to play without registering.

## Components

### 1. Guest Session Management (`lib/guest-session.ts`)

Provides utilities for managing temporary guest user sessions stored in browser localStorage.

**Key Functions:**

- `createGuestSession(username: string): GuestSession` - Creates a new guest session with a 24-hour expiration
- `getGuestSession(): GuestSession | null` - Retrieves the current guest session if valid
- `clearGuestSession(): void` - Removes the guest session
- `hasValidGuestSession(): boolean` - Checks if a valid session exists
- `updateGuestUsername(username: string): GuestSession | null` - Updates the guest username

**Guest Session Properties:**

```typescript
type GuestSession = {
  id: string; // Unique guest ID
  username: string; // Display name
  createdAt: number; // Timestamp
  expiresAt: number; // Expiration timestamp (24h after creation)
};
```

### 2. Enhanced Auth Store (`store/auth-store.ts`)

The auth store has been enhanced to support guest users alongside authenticated users.

**New Features:**

- `isGuest: boolean` - Indicates if the current user is a guest
- `setGuestUser(username: string): void` - Creates and sets a guest user
- `initializeAuth(): void` - Initializes auth state from guest session on app load

**User Type:**

```typescript
type User = {
  id: string;
  email: string; // Empty for guests
  username: string;
  avatarUrl: string | null;
  isGuest?: boolean; // True for guest users
};
```

### 3. Updated Auth Hook (`lib/hooks/use-auth.ts`)

The `useAuth` hook now handles both authenticated and guest users.

**Returns:**

```typescript
{
  user: User | null;
  isAuthenticated: boolean; // True only for JWT-authenticated users
  isGuest: boolean; // True for guest users
  isLoading: boolean;
  logout: () => Promise<void>;
}
```

**Behavior:**

- Checks for JWT authentication first
- Falls back to guest session if no JWT found
- Logout clears both JWT and guest sessions

### 4. Next.js Middleware (`middleware.ts`)

Server-side protection for game routes.

**Protected Routes:**

- `/game/*` - All game-related routes require authentication or guest session

**Logic:**

1. Handles locale routing (existing functionality)
2. Checks if route is protected
3. Verifies authentication via `access_token` cookie or guest session marker
4. Redirects to login with return URL if unauthorized

**Note:** Guest session check in middleware is best-effort since localStorage is client-side only. The primary protection is client-side via RouteGuard component.

### 5. Route Guard Component (`components/guards/route-guard.tsx`)

Client-side component for protecting pages.

**Usage:**

```tsx
import { RouteGuard } from "@/components/guards";

export default function GamePage() {
  return (
    <RouteGuard requireAuth={false} allowGuest={true}>
      <div>Game content</div>
    </RouteGuard>
  );
}
```

**Props:**

- `requireAuth?: boolean` - Requires JWT authentication (default: false)
- `allowGuest?: boolean` - Allows guest users (default: true)
- `redirectTo?: string` - Custom redirect path (default: /auth/login)
- `children: React.ReactNode` - Content to protect

**Examples:**

```tsx
// Allow both authenticated and guest users (game pages)
<RouteGuard requireAuth={false} allowGuest={true}>
  <GameLobby />
</RouteGuard>

// Require full authentication (profile settings)
<RouteGuard requireAuth={true} allowGuest={false}>
  <UserSettings />
</RouteGuard>
```

### 6. Game Access Hook (`lib/hooks/use-game-access.ts`)

Specialized hook for managing game access.

**Usage:**

```tsx
import { useGameAccess } from "@/lib/hooks/use-game-access";

function JoinGamePage() {
  const {
    canAccessGame,
    ensureGameAccess,
    getGameUsername,
    getGameUserId,
    requiresGuestSetup,
  } = useGameAccess();

  const handleJoinGame = async () => {
    // For guests, prompt for username first
    if (requiresGuestSetup) {
      const username = await promptForUsername();

      ensureGameAccess(username);
    }

    // Now can join game with appropriate credentials
    const username = getGameUsername();
    const userId = getGameUserId(); // null for guests
  };
}
```

**Returns:**

```typescript
{
  canAccessGame: boolean; // Can access game features
  ensureGameAccess: (guestUsername?: string) => boolean;
  getGameUsername: () => string | null;
  getGameUserId: () => string | null; // null for guests
  isLoading: boolean;
  requiresGuestSetup: boolean; // Needs guest username
}
```

## User Flows

### Authenticated User Flow

1. User logs in with email/password
2. JWT cookie is set by backend
3. Frontend detects JWT and loads user profile
4. User can access all game routes
5. User ID is sent to backend for game operations

### Guest User Flow

1. User navigates to game route
2. Middleware/RouteGuard prompts for guest username
3. Guest session created in localStorage
4. User can access game routes
5. Only username is sent to backend (no user ID)
6. Session expires after 24 hours

### Guest to Authenticated Conversion

1. Guest user decides to register
2. Registration creates authenticated account
3. Guest session is cleared
4. User is now fully authenticated
5. Previous guest game history not preserved (future enhancement)

## Security Considerations

### Guest Limitations

- Guest sessions are client-side only (localStorage)
- No server-side tracking of guest sessions
- Cannot access authenticated-only features (profile, history, etc.)
- Sessions expire after 24 hours
- No password protection

### Authentication Bypass Prevention

- JWT cookies are HTTP-only and secure
- Guest sessions cannot escalate privileges
- RouteGuard prevents unauthorized route access
- Backend validates all game operations separately

### Best Practices

1. Always use RouteGuard for protected pages
2. Check `isGuest` before accessing user-specific features
3. Use `getGameUserId()` which returns null for guests
4. Backend should validate permissions independently
5. Never trust client-side auth state alone

## Integration with Backend

### Game Creation

```typescript
const { getGameUsername, getGameUserId } = useGameAccess();

const createGame = async () => {
  const response = await fetch(`${API_URL}/games`, {
    method: "POST",
    body: JSON.stringify({
      characterSetId: "...",
      hostUsername: getGameUsername(), // Always provided
      hostUserId: getGameUserId(), // null for guests
    }),
  });
};
```

### Backend Handling

The backend `game.controller.ts` already supports both authenticated and guest users:

```typescript
@Post()
async create(@Body() body: CreateGameRequest) {
  // Accepts either hostUserId (authenticated) or hostUsername (guest)
  if (!body.hostUsername && !body.hostUserId) {
    throw new BadRequestException('hostUsername required when hostUserId missing');
  }
  // ...
}
```

## Testing

Since there's no frontend test infrastructure, manual testing is recommended:

### Test Cases

1. **Guest Access**

   - Navigate to `/game` without logging in
   - Should create guest session
   - Should allow game access

2. **Authenticated Access**

   - Log in first
   - Navigate to `/game`
   - Should use authenticated session
   - Should have user ID available

3. **Session Expiration**

   - Create guest session
   - Manually set expiration to past in localStorage
   - Refresh page
   - Should clear expired session

4. **Route Protection**
   - Try accessing `/game` routes
   - Should redirect to login if no auth or guest
   - Should allow access with valid session

## Future Enhancements

1. **Server-side Guest Tracking**

   - Store guest sessions in Redis
   - Associate game history with guest ID
   - Allow guest session migration to account

2. **Enhanced Security**

   - Add CSRF protection for guest sessions
   - Rate limiting for guest creation
   - Captcha for guest signup

3. **Persistence**
   - Save guest game history
   - Offer account creation with history migration
   - Link multiple guest sessions

## Migration Notes

When implementing game routes in Phase 2, follow this pattern:

```tsx
// apps/frontend/app/[lang]/game/lobby/[roomCode]/page.tsx
import { RouteGuard } from "@/components/guards";

export default function LobbyPage() {
  return (
    <RouteGuard requireAuth={false} allowGuest={true}>
      <LobbyContent />
    </RouteGuard>
  );
}
```

Remember to use `useGameAccess()` for all game operations to correctly handle both user types.
