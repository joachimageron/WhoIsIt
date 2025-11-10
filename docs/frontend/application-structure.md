# Frontend Application Structure

## Overview

The WhoIsIt frontend is built with **Next.js 15** using the **App Router** paradigm, featuring file-based routing, server components, and internationalization support. The application follows a modular structure with clear separation of concerns.

## Directory Structure

```docs
apps/frontend/
├── app/                          # Next.js App Router
│   └── [lang]/                  # Internationalized routes
│       ├── page.tsx             # Home page
│       ├── layout.tsx           # Root layout
│       ├── auth/                # Authentication pages
│       │   ├── login/
│       │   ├── register/
│       │   ├── verify-email/
│       │   └── forgot-password/
│       ├── game/                # Game pages
│       │   ├── create/         # Create game lobby
│       │   ├── join/           # Join game lobby
│       │   ├── lobby/[roomCode]/  # Game lobby
│       │   ├── play/[roomCode]/   # Active gameplay
│       │   └── results/[roomCode]/ # Game results
│       └── profile/             # User profile
├── components/                   # Reusable components
│   ├── guards/                  # Route guards
│   ├── navbar.tsx
│   ├── theme-switch.tsx
│   ├── language-switcher.tsx
│   └── room-code-display.tsx
├── hooks/                        # Custom React hooks
│   ├── use-game-socket.ts
│   ├── use-game-actions.ts
│   ├── use-game-events.ts
│   └── use-game-initialization.ts
├── store/                        # Zustand state stores
│   ├── game-store.ts
│   └── auth-store.ts
├── lib/                          # Utility functions
│   ├── socket.ts                # Socket.IO client
│   └── guest-session.ts         # Guest session management
├── dictionaries/                 # i18n translations
│   ├── en.json
│   └── fr.json
├── middleware.ts                 # Next.js middleware
├── tailwind.config.js           # Tailwind CSS config
└── package.json
```

## App Router Structure

### Route Organization

**Pattern**: `app/[lang]/[feature]/[...segments]/page.tsx`

#### Internationalization Layer (`[lang]`)

All routes are prefixed with a language parameter:

- `/en` - English
- `/fr` - French

**Benefits**:

- URL-based language switching
- SEO-friendly
- Server-side language detection
- Automatic redirects for missing language

#### Feature Modules

**Authentication** (`auth/`):

```docs
auth/
├── login/
│   └── page.tsx              # Login form
├── register/
│   └── page.tsx              # Registration form
├── verify-email/
│   └── [verify-token]/
│       └── page.tsx          # Email verification handler
└── forgot-password/
    ├── page.tsx              # Request password reset
    └── [reset-token]/
        └── page.tsx          # Reset password form
```

**Game** (`game/`):

```docs
game/
├── create/
│   ├── page.tsx              # Create game form
│   └── create-game-form.tsx  # Form component
├── join/
│   ├── page.tsx              # Join game page
│   └── join-form.tsx         # Join form component
├── lobby/
│   └── [roomCode]/
│       ├── page.tsx          # Lobby wrapper
│       └── lobby-client.tsx  # Client component
├── play/
│   └── [roomCode]/
│       ├── page.tsx          # Game wrapper
│       ├── game-client.tsx   # Client component
│       └── components/       # Game-specific components
│           ├── character-grid.tsx
│           ├── question-panel.tsx
│           └── player-list.tsx
└── results/
    └── [roomCode]/
        ├── page.tsx          # Results wrapper
        └── results-client.tsx # Client component
```

**Profile** (`profile/`):

```docs
profile/
├── page.tsx                  # Profile view
└── edit/
    └── page.tsx              # Edit profile
```

### Server vs Client Components

**Server Components** (default):

- `layout.tsx` - Root layout with metadata
- `page.tsx` - Route pages (wrappers)
- Static content
- Data fetching (future)

**Client Components** (`'use client'`):

- Interactive components
- State management
- WebSocket connections
- Event handlers
- Forms with validation

**Pattern**:

```tsx
// app/[lang]/game/lobby/[roomCode]/page.tsx (Server)
export default function LobbyPage({ params }: { params: { roomCode: string } }) {
  return <LobbyClient roomCode={params.roomCode} />;
}

// app/[lang]/game/lobby/[roomCode]/lobby-client.tsx (Client)
'use client';
export default function LobbyClient({ roomCode }: { roomCode: string }) {
  const [lobby, setLobby] = useState<GameLobby | null>(null);
  // ... interactive logic
}
```

## Component Architecture

### Component Categories

#### 1. Layout Components

**Purpose**: Page structure and navigation

- `navbar.tsx` - Main navigation
- `layout.tsx` - Root layout
- `footer.tsx` (future)

**Example**:

```tsx
// components/navbar.tsx
export const Navbar = () => {
  return (
    <nav className="flex justify-between items-center p-4">
      <Logo />
      <NavLinks />
      <UserMenu />
      <LanguageSwitcher />
      <ThemeSwitch />
    </nav>
  );
};
```

#### 2. Page Components

**Purpose**: Route-specific pages

- Usually thin wrappers
- Pass route params to client components
- Handle metadata

**Example**:

```tsx
// app/[lang]/game/lobby/[roomCode]/page.tsx
export default function LobbyPage({ 
  params 
}: { 
  params: { roomCode: string; lang: string } 
}) {
  return <LobbyClient roomCode={params.roomCode} />;
}
```

#### 3. Feature Components

**Purpose**: Game and auth functionality

- `lobby-client.tsx` - Game lobby
- `game-client.tsx` - Active game
- `create-game-form.tsx` - Create game
- `login-form.tsx` - Authentication

#### 4. UI Components

**Purpose**: Reusable UI elements from HeroUI

- Button, Card, Input, Modal
- Avatar, Badge, Chip
- Dropdown, Popover, Tooltip

**Usage**:

```tsx
import { Button, Card, Input } from '@heroui/react';

<Card>
  <Input label="Room Code" />
  <Button color="primary">Join Game</Button>
</Card>
```

#### 5. Guard Components

**Purpose**: Route protection

- `AuthGuard` - Requires authentication
- `GuestGuard` - Allows guests

**Example**:

```tsx
// components/guards/auth-guard.tsx
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    redirect('/auth/login');
  }
  
  return <>{children}</>;
}
```

## Routing Patterns

### Dynamic Routes

**Pattern**: `[paramName]`

```tsx
// app/[lang]/game/lobby/[roomCode]/page.tsx
export default function Page({ params }: { params: { roomCode: string } }) {
  // params.roomCode = 'ABC123'
}
```

### Catch-all Routes

**Pattern**: `[...segments]`

```tsx
// app/[lang]/blog/[...slug]/page.tsx
// Matches: /en/blog/a, /en/blog/a/b, /en/blog/a/b/c
```

### Parallel Routes (Future)

**Pattern**: `@folder`

```tsx
// app/[lang]/@modal/(.)game/join/page.tsx
// Intercept route for modal
```

### Route Groups

**Pattern**: `(folder)`

```tsx
// app/[lang]/(marketing)/about/page.tsx
// URL: /en/about (group name not in URL)
```

## Navigation

### Client-Side Navigation

**Link Component**:

```tsx
import Link from 'next/link';

<Link href="/en/game/create">Create Game</Link>
```

**Programmatic Navigation**:

```tsx
import { useRouter } from 'next/navigation';

const router = useRouter();

// Navigate
router.push('/en/game/lobby/ABC123');

// Replace (no history)
router.replace('/en/auth/login');

// Back
router.back();

// Refresh
router.refresh();
```

### Language-Aware Navigation

**Helper Function**:

```tsx
// lib/navigation.ts
export function createLocalizedPath(path: string, lang: string) {
  return `/${lang}${path}`;
}

// Usage
const href = createLocalizedPath('/game/create', 'en'); // '/en/game/create'
```

## Data Fetching

### REST API Calls

**Pattern**: Fetch from backend API

```tsx
'use client';

export function GameList() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/games`)
      .then(res => res.json())
      .then(setGames);
  }, []);

  return <div>{/* Render games */}</div>;
}
```

### Server-Side Fetching (Future)

```tsx
// Server Component
async function GamePage({ params }: { params: { id: string } }) {
  const game = await fetch(`${API_URL}/games/${params.id}`)
    .then(res => res.json());

  return <GameDisplay game={game} />;
}
```

## Middleware

### Purpose

- Language detection and redirects
- Authentication checks
- Route protection

### Implementation

```tsx
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Language redirect
  if (pathname === '/') {
    const locale = getLocale(request);
    return NextResponse.redirect(new URL(`/${locale}`, request.url));
  }

  // Auth check
  if (isProtectedRoute(pathname)) {
    const token = request.cookies.get('access_token');
    if (!token) {
      return NextResponse.redirect(new URL('/en/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Layouts

### Root Layout

```tsx
// app/[lang]/layout.tsx
export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  return (
    <html lang={params.lang}>
      <body>
        <Providers>
          <Navbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
```

### Nested Layouts

```tsx
// app/[lang]/game/layout.tsx
export default function GameLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="game-container">
      <GameHeader />
      {children}
      <GameFooter />
    </div>
  );
}
```

## Loading States

### Loading.tsx

```tsx
// app/[lang]/game/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <Spinner size="lg" />
    </div>
  );
}
```

### Suspense Boundaries

```tsx
import { Suspense } from 'react';

<Suspense fallback={<Spinner />}>
  <GameList />
</Suspense>
```

## Error Handling

### Error.tsx

```tsx
// app/[lang]/game/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

### Not Found

```tsx
// app/[lang]/not-found.tsx
export default function NotFound() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <Link href="/en">Go Home</Link>
    </div>
  );
}
```

## Metadata

### Static Metadata

```tsx
// app/[lang]/game/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WhoIsIt - Multiplayer Guessing Game',
  description: 'Play WhoIsIt with friends online',
};
```

### Dynamic Metadata

```tsx
export async function generateMetadata({ params }: { params: { roomCode: string } }): Promise<Metadata> {
  const game = await fetchGame(params.roomCode);

  return {
    title: `Game ${params.roomCode} - WhoIsIt`,
    description: `Join game ${params.roomCode}`,
  };
}
```

## File Conventions

### Special Files

- `page.tsx` - Route page
- `layout.tsx` - Shared layout
- `loading.tsx` - Loading UI
- `error.tsx` - Error UI
- `not-found.tsx` - 404 UI
- `template.tsx` - Re-rendered layout
- `default.tsx` - Parallel route fallback

### Component Files

- `*-client.tsx` - Client components
- `*-form.tsx` - Form components
- `*-card.tsx` - Card components
- `use-*.ts` - Custom hooks

## Best Practices

### 1. Server Components First

Default to server components, opt into client components:

```tsx
// Server by default
export default function Page() {
  return <StaticContent />;
}

// Client when needed
'use client';
export function InteractiveForm() {
  const [state, setState] = useState();
  // ...
}
```

### 2. Colocate Components

Keep related components close:

```docs
game/
  play/
    [roomCode]/
      page.tsx
      game-client.tsx
      components/        # Game-specific components
        character-grid.tsx
        question-panel.tsx
```

### 3. Use TypeScript

Type everything:

```tsx
interface GamePageProps {
  params: { roomCode: string; lang: string };
}

export default function GamePage({ params }: GamePageProps) {
  // ...
}
```

### 4. Lazy Load Heavy Components

```tsx
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./heavy-component'), {
  loading: () => <Spinner />,
});
```

### 5. Error Boundaries

Wrap risky operations:

```tsx
<ErrorBoundary fallback={<ErrorMessage />}>
  <RiskyComponent />
</ErrorBoundary>
```

## Related Documentation

- [State Management](./state-management.md)
- [UI Components](./ui-components.md)
- [Internationalization](./internationalization.md)
- [Real-time Communication](./realtime.md)

---

**Last Updated**: November 2024
