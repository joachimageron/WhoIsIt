# Route Guards

This directory contains route protection components and utilities for the WhoIsIt application.

## Quick Start

### Protecting a Game Route

```tsx
// app/[lang]/game/lobby/[roomCode]/page.tsx
import { RouteGuard } from "@/components/guards";

export default function LobbyPage() {
  return (
    <RouteGuard requireAuth={false} allowGuest={true}>
      <LobbyContent />
    </RouteGuard>
  );
}
```

### Protecting an Authenticated-Only Route

```tsx
// app/[lang]/profile/page.tsx
import { RouteGuard } from "@/components/guards";

export default function ProfilePage() {
  return (
    <RouteGuard requireAuth={true} allowGuest={false}>
      <ProfileContent />
    </RouteGuard>
  );
}
```

### Using Game Access Hook

```tsx
import { useGameAccess } from "@/lib/hooks/use-game-access";

function JoinGameButton() {
  const {
    canAccessGame,
    ensureGameAccess,
    getGameUsername,
    getGameUserId,
    requiresGuestSetup,
  } = useGameAccess();

  const handleJoin = async () => {
    // Ensure user has access (prompt for username if guest)
    if (requiresGuestSetup) {
      const username = prompt("Enter your username:");

      if (!username) return;
      ensureGameAccess(username);
    }

    // Now make API call with appropriate credentials
    const response = await fetch(`${API_URL}/games/${roomCode}/join`, {
      method: "POST",
      body: JSON.stringify({
        username: getGameUsername(), // Always available
        userId: getGameUserId(), // null for guests
      }),
    });
  };

  return <button onClick={handleJoin}>Join Game</button>;
}
```

## Components

- **RouteGuard** - Client-side component to protect pages
- See `example-usage.tsx` for more examples

## Hooks

- **useAuth** - Get current authentication state (authenticated or guest)
- **useGameAccess** - Specialized hook for game feature access

## Documentation

For detailed documentation, see:

- `/docs/guards-and-protection.md` - Complete architecture and usage guide
- `example-usage.tsx` - Code examples

## Key Concepts

### Authenticated Users

- Have a JWT token cookie
- Full access to all features
- Persistent user ID and profile

### Guest Users

- No JWT token required
- Stored in browser localStorage
- 24-hour session expiration
- Can access game features but not profile/settings
- Username only, no user ID

### Route Protection

Protected routes check for either:

1. Authentication cookie (authenticated users)
2. Guest session in localStorage (guest users)

If neither exists, users are redirected to login with return URL.
