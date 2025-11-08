# Frontend Documentation

## Overview

This section contains comprehensive documentation for the WhoIsIt frontend, built with Next.js 15, HeroUI, and TypeScript.

## Contents

### Application Structure (Coming Soon)
Next.js App Router architecture with:
- File-based routing with `[lang]` segments
- Server and Client Components
- Layout system and composition
- Middleware for auth and i18n

### State Management (Coming Soon)
Zustand store patterns:
- Auth store (user authentication)
- Game store (lobby and game state)
- Store design patterns
- DevTools integration

### UI Components (Coming Soon)
HeroUI component library:
- Component catalog and usage
- Theme customization
- Dark mode support
- Responsive design patterns
- Custom components

### Internationalization (Coming Soon)
Multi-language support:
- English and French locales
- Dictionary structure
- Locale detection and routing
- Translation patterns

### Real-time Communication (Coming Soon)
Socket.IO client integration:
- Connection management
- Event handlers and listeners
- Custom hooks (`useGameSocket`)
- Reconnection handling

## Quick Links

### Project Structure
```
apps/frontend/
├── app/                  # Next.js App Router
│   └── [lang]/          # Internationalized routes
│       ├── auth/        # Authentication pages
│       ├── game/        # Game pages
│       └── profile/     # User profile
├── components/          # Reusable React components
├── config/             # Configuration files
├── dictionaries/       # i18n translations
├── hooks/              # Custom React hooks
├── lib/                # Utilities and API clients
│   ├── auth-api.ts     # Auth API client
│   ├── game-api.ts     # Game API client
│   ├── socket.ts       # Socket.IO client
│   └── guest-session.ts # Guest session manager
├── store/              # Zustand stores
│   ├── auth-store.ts
│   └── game-store.ts
├── middleware.ts       # Next.js middleware
└── styles/            # Global styles
```

### Key Technologies
- **Next.js 15**: React meta-framework with App Router
- **React 18**: UI library with Server Components
- **TypeScript 5**: Type-safe JavaScript
- **HeroUI 2**: React component library
- **Tailwind CSS 4**: Utility-first CSS
- **Zustand 5**: Lightweight state management
- **Socket.IO Client 4**: WebSocket client
- **Intl-MessageFormat**: i18n formatting

### Running the Frontend

```bash
# Development (with Turbopack)
pnpm dev:frontend

# Build
pnpm --filter @whois-it/frontend build

# Start production server
pnpm --filter @whois-it/frontend start

# Lint
pnpm --filter @whois-it/frontend lint
```

### Environment Variables

Create `apps/frontend/.env` from `.env.example`:

```bash
# Backend API URL (must be accessible from browser)
NEXT_PUBLIC_API_URL=http://localhost:4000

# Socket.IO server URL (usually same as API)
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

**Note**: Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

## Architecture Overview

### App Router Structure

Next.js 15 uses the App Router with React Server Components:

```
app/
└── [lang]/              # Dynamic segment for locale (en, fr)
    ├── layout.tsx       # Root layout with providers
    ├── page.tsx         # Home page
    ├── error.tsx        # Error boundary
    ├── auth/
    │   ├── login/
    │   │   └── page.tsx         # Server Component
    │   ├── register/
    │   │   └── page.tsx
    │   └── verify-email/
    │       └── [token]/
    │           └── page.tsx
    ├── game/
    │   ├── create/
    │   │   ├── page.tsx         # Server Component
    │   │   └── create-form.tsx  # Client Component
    │   ├── join/
    │   │   └── page.tsx
    │   ├── lobby/
    │   │   └── [roomCode]/
    │   │       ├── page.tsx
    │   │       └── lobby-client.tsx
    │   └── play/
    │       └── [roomCode]/
    │           └── page.tsx
    └── profile/
        └── page.tsx
```

### Component Pattern

**Server Component** (default):
```typescript
// app/[lang]/game/create/page.tsx
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Create Game | WhoIsIt',
};

export default function CreateGamePage() {
  return <CreateGameClient />;
}
```

**Client Component** (with `'use client'`):
```typescript
// app/[lang]/game/create/create-form.tsx
'use client';

import { useState } from 'react';
import { Button, Input } from '@heroui/react';

export default function CreateGameClient() {
  const [loading, setLoading] = useState(false);
  
  return (
    <form>
      {/* Interactive UI */}
    </form>
  );
}
```

### State Management

Zustand stores for global state:

**Auth Store**:
```typescript
// store/auth-store.ts
import { create } from 'zustand';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

**Usage in Components**:
```typescript
'use client';

import { useAuthStore } from '@/store/auth-store';

export default function ProfilePage() {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated) {
    return <LoginPrompt />;
  }
  
  return <UserProfile user={user} />;
}
```

### API Communication

**REST API Client**:
```typescript
// lib/game-api.ts
const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function createGame(data: CreateGameRequest) {
  const response = await fetch(`${API_URL}/games`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',  // Include cookies
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    throw new Error('Failed to create game');
  }
  
  return response.json();
}
```

**WebSocket Client**:
```typescript
// lib/socket.ts
import { io } from 'socket.io-client';

export function getSocket() {
  return io(process.env.NEXT_PUBLIC_SOCKET_URL!, {
    autoConnect: false,
    transports: ['websocket'],
    withCredentials: true,
  });
}
```

### Custom Hooks

**useGameSocket Hook**:
```typescript
// hooks/use-game-socket.ts
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '@/lib/socket';

export const useGameSocket = () => {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) {
      socket.connect();
    }
    return () => {
      socket.disconnect();
    };
  }, []);

  const joinRoom = useCallback((roomCode: string) => {
    return new Promise((resolve) => {
      socketRef.current.emit('joinRoom', { roomCode }, resolve);
    });
  }, []);

  return { joinRoom };
};
```

## Styling System

### Tailwind CSS Configuration

```javascript
// tailwind.config.js
const { heroui } = require("@heroui/theme");

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors
      },
    },
  },
  darkMode: "class",
  plugins: [heroui()],
};
```

### HeroUI Components

```typescript
import { 
  Button, 
  Card, 
  CardHeader, 
  CardBody,
  Input,
  Modal,
} from '@heroui/react';

export default function MyComponent() {
  return (
    <Card>
      <CardHeader>
        <h3>Title</h3>
      </CardHeader>
      <CardBody>
        <Input label="Name" />
        <Button color="primary">Submit</Button>
      </CardBody>
    </Card>
  );
}
```

## Routing and Navigation

### File-based Routing

Routes are created by file structure:
- `/app/[lang]/page.tsx` → `/:lang`
- `/app/[lang]/game/create/page.tsx` → `/:lang/game/create`
- `/app/[lang]/game/lobby/[roomCode]/page.tsx` → `/:lang/game/lobby/:roomCode`

### Navigation

```typescript
'use client';

import { useRouter } from 'next/navigation';

export default function MyComponent() {
  const router = useRouter();
  
  const navigate = () => {
    router.push('/en/game/create');
  };
  
  return <Button onPress={navigate}>Create Game</Button>;
}
```

### Middleware

Protected routes are handled by middleware:

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check authentication
  if (isProtectedRoute(pathname)) {
    const hasAuth = hasAuthCookie(request);
    if (!hasAuth) {
      return redirect('/auth/login');
    }
  }
  
  // Handle i18n
  if (!pathnameHasLocale) {
    return redirect(`/${locale}${pathname}`);
  }
}
```

## Internationalization

### Supported Locales
- English (`en`) - Default
- French (`fr`)

### Dictionary Structure

```json
// dictionaries/en.json
{
  "home": {
    "title": "Welcome to WhoIsIt",
    "subtitle": "Guess the character!",
    "createGame": "Create Game",
    "joinGame": "Join Game"
  },
  "game": {
    "lobby": {
      "title": "Game Lobby",
      "roomCode": "Room Code",
      "waitingForPlayers": "Waiting for players..."
    }
  }
}
```

### Usage in Components

```typescript
import { getDictionary } from '@/dictionaries';

export default async function Page({ params }) {
  const dict = await getDictionary(params.lang);
  
  return (
    <div>
      <h1>{dict.home.title}</h1>
      <p>{dict.home.subtitle}</p>
    </div>
  );
}
```

## Development Tips

### Hot Reload with Turbopack

Next.js 15 uses Turbopack by default:
```bash
pnpm dev:frontend  # --turbopack flag automatic
```

- Instant updates on file save
- Fast refresh for React components
- Persists component state

### Debugging

**Browser DevTools**:
- React DevTools extension
- Zustand DevTools integration
- Network tab for API calls
- WebSocket inspector

**VS Code**:
- Breakpoints in code
- Debug configurations
- TypeScript IntelliSense

### Testing

Currently no tests set up. Future additions:
- Jest for unit tests
- Testing Library for components
- Playwright for E2E tests

## Common Patterns

### Loading States

```typescript
'use client';

import { useState } from 'react';
import { Spinner } from '@heroui/react';

export default function MyComponent() {
  const [loading, setLoading] = useState(false);
  
  if (loading) {
    return <Spinner />;
  }
  
  return <Content />;
}
```

### Error Handling

```typescript
'use client';

import { useState } from 'react';
import { toast } from '@heroui/react';

export default function MyComponent() {
  const handleSubmit = async () => {
    try {
      await apiCall();
      toast.success('Success!');
    } catch (error) {
      toast.error('Failed to submit');
      console.error(error);
    }
  };
  
  return <Button onPress={handleSubmit}>Submit</Button>;
}
```

### Data Fetching

**Server Component**:
```typescript
// Fetch on server (no loading state needed)
export default async function Page() {
  const data = await fetch('http://localhost:4000/api/data');
  const json = await data.json();
  
  return <Display data={json} />;
}
```

**Client Component**:
```typescript
'use client';

import { useEffect, useState } from 'react';

export default function MyComponent() {
  const [data, setData] = useState(null);
  
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);
  
  if (!data) return <Spinner />;
  
  return <Display data={data} />;
}
```

## Performance Optimization

### Server Components
- Render on server by default
- Reduce client-side JavaScript
- Fetch data server-side

### Code Splitting
- Automatic route-based splitting
- Dynamic imports for large components
```typescript
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Spinner />,
});
```

### Image Optimization
```typescript
import Image from 'next/image';

<Image 
  src="/character.jpg" 
  alt="Character"
  width={200}
  height={200}
  priority  // Prioritize loading
/>
```

## Troubleshooting

### Hydration Errors
- Ensure server and client render same HTML
- Check for browser-only APIs in Server Components
- Use `'use client'` for interactive components

### Module Not Found
```bash
rm -rf .next node_modules
pnpm install
```

### TypeScript Errors
- Restart TypeScript server in VS Code
- Check `tsconfig.json` configuration
- Ensure types are installed

## Next Steps

1. Explore [Getting Started Guide](../development/getting-started.md)
2. Review [Design Patterns](../architecture/patterns.md)
3. Check [API Documentation](../api/rest-api.md)
4. Read [Backend Documentation](../backend/README.md)

---

**Related Documentation**:
- [Architecture Overview](../architecture/overview.md)
- [Technology Stack](../architecture/tech-stack.md)
- [Backend Documentation](../backend/README.md)
- [Development Workflow](../development/workflow.md)
