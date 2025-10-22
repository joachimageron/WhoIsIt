# Guest Session Manual Test Plan

Since there's no frontend test infrastructure, use this manual test plan to validate the guest session functionality.

## Prerequisites

- Browser with localStorage support
- Dev server running (`pnpm dev:frontend`)

## Test Cases

### Test 1: Create Guest Session

**Steps:**

1. Open browser DevTools → Console
2. Run:
   ```javascript
   import { createGuestSession } from '@/lib/guest-session';
   const session = createGuestSession('TestUser123');
   console.log('Session created:', session);
   ```
3. Check localStorage: `localStorage.getItem('whoisit_guest_session')`

**Expected:**

- Session object returned with:
  - `id` starting with "guest\_"
  - `username` = "TestUser123"
  - `createdAt` = current timestamp
  - `expiresAt` = ~24 hours from now
- Session saved in localStorage

### Test 2: Retrieve Guest Session

**Steps:**

1. After Test 1, run:
   ```javascript
   import { getGuestSession } from '@/lib/guest-session';
   const session = getGuestSession();
   console.log('Retrieved session:', session);
   ```

**Expected:**

- Same session object as created
- All fields match

### Test 3: Session Expiration

**Steps:**

1. Manually edit localStorage session to have expired timestamp:
   ```javascript
   const session = JSON.parse(localStorage.getItem('whoisit_guest_session'));
   session.expiresAt = Date.now() - 1000; // 1 second ago
   localStorage.setItem('whoisit_guest_session', JSON.stringify(session));
   ```
2. Try to retrieve:
   ```javascript
   import { getGuestSession } from '@/lib/guest-session';
   const session = getGuestSession();
   console.log('Session after expiry:', session);
   ```

**Expected:**

- Returns `null`
- Session removed from localStorage

### Test 4: Clear Guest Session

**Steps:**

1. Create a new session (Test 1)
2. Run:
   ```javascript
   import { clearGuestSession } from '@/lib/guest-session';
   clearGuestSession();
   ```
3. Check localStorage

**Expected:**

- Session removed from localStorage

### Test 5: Update Guest Username

**Steps:**

1. Create a session (Test 1)
2. Run:
   ```javascript
   import { updateGuestUsername } from '@/lib/guest-session';
   const updated = updateGuestUsername('NewUsername');
   console.log('Updated session:', updated);
   ```
3. Retrieve session to verify

**Expected:**

- Username changed to "NewUsername"
- Other fields unchanged
- Changes persisted in localStorage

### Test 6: Auth Store Integration

**Steps:**

1. In a component/page:
   ```javascript
   import { useAuthStore } from '@/store/auth-store';

   const { setGuestUser, user, isGuest } = useAuthStore();
   setGuestUser('GuestPlayer');
   console.log('User:', user);
   console.log('Is guest:', isGuest);
   ```

**Expected:**

- `user` object with:
  - `id` starting with "guest\_"
  - `username` = "GuestPlayer"
  - `email` = ""
  - `isGuest` = true
- `isGuest` = true
- Session created in localStorage

### Test 7: Route Guard with Guest

**Setup:** Create a test page with RouteGuard

```tsx
// app/[lang]/test-guard/page.tsx
import { RouteGuard } from '@/components/guards';

export default function TestGuardPage() {
  return (
    <RouteGuard requireAuth={false} allowGuest={true}>
      <div>
        <h1>Protected Page</h1>
        <p>You can see this!</p>
      </div>
    </RouteGuard>
  );
}
```

**Steps:**

1. Clear localStorage
2. Clear cookies
3. Navigate to `/en/test-guard`
4. Create guest session when prompted
5. Should see protected content

**Expected:**

- Page loads successfully
- Protected content visible
- Guest session created

### Test 8: Route Guard Requires Auth

**Setup:** Create another test page

```tsx
// app/[lang]/test-auth/page.tsx
import { RouteGuard } from '@/components/guards';

export default function TestAuthPage() {
  return (
    <RouteGuard requireAuth={true} allowGuest={false}>
      <div>
        <h1>Auth Required</h1>
        <p>Only authenticated users</p>
      </div>
    </RouteGuard>
  );
}
```

**Steps:**

1. As guest user, navigate to `/en/test-auth`

**Expected:**

- Redirected to `/en/auth/login?returnUrl=/en/test-auth`

### Test 9: useGameAccess Hook

**Setup:** In a component:

```tsx
import { useGameAccess } from '@/lib/hooks/use-game-access';

function TestComponent() {
  const {
    canAccessGame,
    ensureGameAccess,
    getGameUsername,
    getGameUserId,
    requiresGuestSetup,
  } = useGameAccess();

  console.log({
    canAccessGame,
    username: getGameUsername(),
    userId: getGameUserId(),
    requiresGuestSetup,
  });
}
```

**Scenarios:**

**A. No user:**

- `canAccessGame` = false
- `requiresGuestSetup` = true
- `getGameUsername()` = null
- `getGameUserId()` = null

**B. After `ensureGameAccess('Player123')`:**

- `canAccessGame` = true
- `requiresGuestSetup` = false
- `getGameUsername()` = "Player123"
- `getGameUserId()` = null

**C. Authenticated user:**

- `canAccessGame` = true
- `requiresGuestSetup` = false
- `getGameUsername()` = authenticated username
- `getGameUserId()` = authenticated user ID

### Test 10: Middleware Protection

**Steps:**

1. Clear all cookies and localStorage
2. Navigate directly to `/en/game/lobby/TESTCODE`

**Expected:**

- Redirected to `/en/auth/login?returnUrl=/en/game/lobby/TESTCODE`
- (Note: Middleware check is best-effort for guest sessions)

## Browser Compatibility Tests

Test in:

- Chrome/Edge (Chromium)
- Firefox
- Safari

Verify:

- crypto.randomUUID() or crypto.getRandomValues() works
- localStorage access works
- Session persistence across page refreshes
- Cookie handling (for authenticated users)

## Edge Cases

### Invalid localStorage Data

1. Set invalid JSON:
   ```javascript
   localStorage.setItem('whoisit_guest_session', 'invalid json');
   ```
2. Try to retrieve session

**Expected:** Returns null, clears invalid data

### Multiple Sessions

1. Create session in Tab 1
2. Open Tab 2 (same browser)
3. Retrieve session

**Expected:** Same session visible in both tabs

### Session During Registration

1. Create guest session
2. Register new account
3. Login with new account

**Expected:** Guest session cleared, JWT auth used

## Performance Tests

1. Create 100 sessions rapidly (loop)
2. Check localStorage size
3. Retrieve session 1000 times

**Expected:**

- No memory leaks
- Consistent performance
- Only one session stored at a time

## Security Tests

### XSS Prevention

Try to inject script in username:

```javascript
createGuestSession('<script>alert("xss")</script>');
```

**Expected:**

- Username stored as-is (string)
- No script execution when rendered (React escapes)

### Session Hijacking

1. Copy guest session from localStorage
2. Open incognito window
3. Paste session into localStorage
4. Refresh page

**Expected:**

- Guest session works (by design - no server validation)
- No elevated privileges
- Cannot access authenticated-only features

## Cleanup

After testing:

```javascript
// Clear test data
localStorage.clear();
// Or just: localStorage.removeItem('whoisit_guest_session');
```
