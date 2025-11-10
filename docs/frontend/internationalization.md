# Internationalization (i18n)

## Overview

WhoIsIt implements internationalization using Next.js App Router's built-in i18n support. The application currently supports **English (en)** and **French (fr)** with a file-based dictionary system.

## Architecture

### URL-Based Localization

All routes are prefixed with a language parameter:

- `/en/...` - English routes
- `/fr/...` - French routes

**Example URLs**:

```docs
/en/game/create
/fr/game/create
/en/auth/login
/fr/auth/login
```

### Directory Structure

```docs
apps/frontend/
├── app/
│   └── [lang]/          # Dynamic language segment
│       ├── page.tsx
│       ├── layout.tsx
│       └── ...
├── dictionaries/         # Translation files
│   ├── en.json          # English translations
│   └── fr.json          # French translations
├── middleware.ts         # Language detection
└── lib/
    └── get-dictionary.ts # Dictionary loader
```

## Translation Files

### Structure

Translations are organized hierarchically in JSON files:

```json
// dictionaries/en.json
{
  "nav": {
    "home": "Home",
    "createGame": "Create Game",
    "joinGame": "Join Game",
    "login": "Login",
    "signUp": "Sign Up",
    "profile": "Profile",
    "logout": "Logout"
  },
  "home": {
    "title1": "Guess",
    "title2": "Who's Who",
    "title3": "in real-time multiplayer experience!",
    "subtitle": "Create or join a game, ask questions and find your opponents' mystery characters.",
    "createGameButton": "Create a Game",
    "joinGameButton": "Join a Game",
    "howToPlay": "How to Play"
  },
  "auth": {
    "login": {
      "title": "Login",
      "email": "Email",
      "password": "Password",
      "submit": "Log In",
      "forgotPassword": "Forgot password?",
      "noAccount": "Don't have an account?",
      "signUp": "Sign up",
      "loggingIn": "Logging in...",
      "invalidCredentials": "Invalid email or password",
      "error": "Failed to log in"
    },
    "register": {
      "title": "Sign Up",
      "email": "Email",
      "username": "Username",
      "password": "Password",
      "confirmPassword": "Confirm Password",
      "submit": "Sign Up",
      "registering": "Signing up...",
      "haveAccount": "Already have an account?",
      "login": "Log in",
      "error": "Failed to sign up",
      "passwordMismatch": "Passwords do not match"
    }
  },
  "game": {
    "create": {
      "title": "Create a Game",
      "characterSet": "Character Set",
      "turnTimer": "Turn Timer",
      "submit": "Create Game",
      "creating": "Creating..."
    },
    "lobby": {
      "roomCode": "Room Code",
      "players": "Players",
      "waiting": "Waiting for players...",
      "ready": "Ready",
      "notReady": "Not Ready",
      "start": "Start Game",
      "leave": "Leave"
    }
  },
  "common": {
    "loading": "Loading...",
    "error": "An error occurred",
    "cancel": "Cancel",
    "confirm": "Confirm",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "back": "Back",
    "next": "Next",
    "submit": "Submit",
    "close": "Close"
  }
}
```

```json
// dictionaries/fr.json
{
  "nav": {
    "home": "Accueil",
    "createGame": "Créer une Partie",
    "joinGame": "Rejoindre une Partie",
    "login": "Connexion",
    "signUp": "Inscription",
    "profile": "Profil",
    "logout": "Déconnexion"
  },
  "home": {
    "title1": "Devinez",
    "title2": "Qui est Qui",
    "title3": "dans une expérience multijoueur en temps réel!",
    "subtitle": "Créez ou rejoignez une partie, posez des questions et trouvez les personnages mystères de vos adversaires.",
    "createGameButton": "Créer une Partie",
    "joinGameButton": "Rejoindre une Partie",
    "howToPlay": "Comment Jouer"
  },
  "auth": {
    "login": {
      "title": "Connexion",
      "email": "Email",
      "password": "Mot de passe",
      "submit": "Se connecter",
      "forgotPassword": "Mot de passe oublié?",
      "noAccount": "Pas de compte?",
      "signUp": "S'inscrire",
      "loggingIn": "Connexion en cours...",
      "invalidCredentials": "Email ou mot de passe invalide",
      "error": "Échec de la connexion"
    }
  }
}
```

## Dictionary Loader

### Server-Side Dictionary Loading

```typescript
// lib/get-dictionary.ts
import 'server-only';

type Locale = 'en' | 'fr';

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((module) => module.default),
  fr: () => import('@/dictionaries/fr.json').then((module) => module.default),
};

export const getDictionary = async (locale: Locale) => {
  return dictionaries[locale]();
};
```

**Note**: `'server-only'` ensures this code only runs on the server.

## Usage in Server Components

### Page Component

```tsx
// app/[lang]/page.tsx
import { getDictionary } from '@/lib/get-dictionary';

export default async function Home({
  params,
}: {
  params: { lang: 'en' | 'fr' };
}) {
  const dict = await getDictionary(params.lang);

  return (
    <div>
      <h1>{dict.home.title1} {dict.home.title2}</h1>
      <p>{dict.home.subtitle}</p>
      <button>{dict.home.createGameButton}</button>
      <button>{dict.home.joinGameButton}</button>
    </div>
  );
}
```

### Passing to Client Components

```tsx
// app/[lang]/auth/login/page.tsx
import { getDictionary } from '@/lib/get-dictionary';
import LoginForm from './login-form';

export default async function LoginPage({
  params,
}: {
  params: { lang: 'en' | 'fr' };
}) {
  const dict = await getDictionary(params.lang);

  return <LoginForm dict={dict.auth.login} lang={params.lang} />;
}
```

```tsx
// app/[lang]/auth/login/login-form.tsx
'use client';

interface LoginFormProps {
  dict: {
    title: string;
    email: string;
    password: string;
    submit: string;
    // ... other translations
  };
  lang: 'en' | 'fr';
}

export default function LoginForm({ dict, lang }: LoginFormProps) {
  return (
    <form>
      <h1>{dict.title}</h1>
      <input placeholder={dict.email} type="email" />
      <input placeholder={dict.password} type="password" />
      <button>{dict.submit}</button>
    </form>
  );
}
```

## Middleware for Language Detection

### Language Detection

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

const locales = ['en', 'fr'];
const defaultLocale = 'en';

function getLocale(request: NextRequest): string {
  // Check URL for explicit locale
  const pathname = request.nextUrl.pathname;
  const pathnameLocale = locales.find(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );
  
  if (pathnameLocale) return pathnameLocale;

  // Check cookie
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }

  // Check Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(',')
      .map((lang) => lang.split(';')[0].trim())
      .find((lang) => {
        const locale = lang.split('-')[0];
        return locales.includes(locale);
      });
    
    if (preferredLocale) {
      const locale = preferredLocale.split('-')[0];
      return locale;
    }
  }

  return defaultLocale;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip API routes, static files, etc.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check if locale is in pathname
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (!pathnameHasLocale) {
    // Redirect to locale-prefixed URL
    const locale = getLocale(request);
    const url = new URL(`/${locale}${pathname}`, request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
```

## Language Switcher

### Component

```tsx
// components/language-switcher.tsx
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem, Button } from '@heroui/react';

interface LanguageSwitcherProps {
  currentLang: 'en' | 'fr';
}

export function LanguageSwitcher({ currentLang }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const languages = {
    en: { label: 'English', flag: '🇬🇧' },
    fr: { label: 'Français', flag: '🇫🇷' },
  };

  const handleLanguageChange = (lang: 'en' | 'fr') => {
    // Replace current language in pathname
    const newPathname = pathname.replace(/^\/[^\/]+/, `/${lang}`);
    
    // Set cookie
    document.cookie = `NEXT_LOCALE=${lang}; path=/; max-age=31536000`;
    
    // Navigate to new path
    router.push(newPathname);
  };

  return (
    <Dropdown>
      <DropdownTrigger>
        <Button variant="light">
          {languages[currentLang].flag} {languages[currentLang].label}
        </Button>
      </DropdownTrigger>
      <DropdownMenu
        aria-label="Language selection"
        onAction={(key) => handleLanguageChange(key as 'en' | 'fr')}
      >
        <DropdownItem key="en" startContent={languages.en.flag}>
          {languages.en.label}
        </DropdownItem>
        <DropdownItem key="fr" startContent={languages.fr.flag}>
          {languages.fr.label}
        </DropdownItem>
      </DropdownMenu>
    </Dropdown>
  );
}
```

### Usage in Layout

```tsx
// app/[lang]/layout.tsx
import { LanguageSwitcher } from '@/components/language-switcher';

export default function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: 'en' | 'fr' };
}) {
  return (
    <html lang={params.lang}>
      <body>
        <nav>
          {/* Other nav items */}
          <LanguageSwitcher currentLang={params.lang} />
        </nav>
        {children}
      </body>
    </html>
  );
}
```

## Type Safety

### TypeScript Types

```typescript
// types/dictionary.ts
export type Dictionary = typeof import('@/dictionaries/en.json');
export type DictionaryKey = keyof Dictionary;

// Use in components
import type { Dictionary } from '@/types/dictionary';

interface PageProps {
  dict: Dictionary;
  lang: 'en' | 'fr';
}
```

### Nested Type Safety

```typescript
// Extract nested types
type AuthDict = Dictionary['auth'];
type LoginDict = Dictionary['auth']['login'];

// Use in component
interface LoginFormProps {
  dict: LoginDict;
}
```

## Navigation with Locale

### Link Component Wrapper

```tsx
// components/localized-link.tsx
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

interface LocalizedLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export function LocalizedLink({ href, children, className }: LocalizedLinkProps) {
  const params = useParams();
  const lang = params.lang as string;

  const localizedHref = href.startsWith('/') ? `/${lang}${href}` : href;

  return (
    <Link href={localizedHref} className={className}>
      {children}
    </Link>
  );
}

// Usage
<LocalizedLink href="/game/create">
  {dict.nav.createGame}
</LocalizedLink>
```

### Programmatic Navigation

```tsx
'use client';

import { useRouter, useParams } from 'next/navigation';

export function MyComponent() {
  const router = useRouter();
  const params = useParams();
  const lang = params.lang as string;

  const navigateTo = (path: string) => {
    router.push(`/${lang}${path}`);
  };

  return (
    <button onClick={() => navigateTo('/game/create')}>
      Create Game
    </button>
  );
}
```

## Date and Number Formatting

### Using Intl API

```tsx
// lib/format.ts
export function formatDate(date: Date, locale: 'en' | 'fr'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatNumber(number: number, locale: 'en' | 'fr'): string {
  return new Intl.NumberFormat(locale).format(number);
}

export function formatCurrency(
  amount: number,
  currency: string,
  locale: 'en' | 'fr'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

// Usage
const date = new Date();
const formatted = formatDate(date, 'fr'); // "9 novembre 2024"
const number = formatNumber(1234567, 'fr'); // "1 234 567"
```

## Adding New Languages

### Steps

**Create translation file**:

```bash
# Create new dictionary
touch dictionaries/es.json  # Spanish
```

**Add translations**:

```json
// dictionaries/es.json
{
  "nav": {
    "home": "Inicio",
    "createGame": "Crear Juego",
    // ... translations
  }
}
```

**Update locale type**:

```typescript
// lib/get-dictionary.ts
type Locale = 'en' | 'fr' | 'es';

const dictionaries = {
  en: () => import('@/dictionaries/en.json').then((m) => m.default),
  fr: () => import('@/dictionaries/fr.json').then((m) => m.default),
  es: () => import('@/dictionaries/es.json').then((m) => m.default),
};
```

**Update middleware**:

```typescript
// middleware.ts
const locales = ['en', 'fr', 'es'];
```

**Update language switcher**:

```typescript
const languages = {
  en: { label: 'English', flag: '🇬🇧' },
  fr: { label: 'Français', flag: '🇫🇷' },
  es: { label: 'Español', flag: '🇪🇸' },
};
```

## Best Practices

### 1. Organize by Feature

```json
{
  "auth": { /* auth translations */ },
  "game": { /* game translations */ },
  "profile": { /* profile translations */ },
  "common": { /* shared translations */ }
}
```

### 2. Use Meaningful Keys

```json
// ✅ Good - Descriptive keys
{
  "auth": {
    "login": {
      "title": "Log In",
      "submit": "Log In",
      "forgotPassword": "Forgot password?"
    }
  }
}

// ❌ Bad - Generic keys
{
  "auth": {
    "login": {
      "text1": "Log In",
      "button": "Log In",
      "link": "Forgot password?"
    }
  }
}
```

### 3. Consistent Naming

```json
{
  "common": {
    "actions": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete",
      "edit": "Edit"
    }
  }
}
```

### 4. Pluralization Support

```json
{
  "game": {
    "players": {
      "zero": "No players",
      "one": "1 player",
      "other": "{count} players"
    }
  }
}
```

### 5. Interpolation

For dynamic values, use a simple pattern:

```typescript
// Dictionary
{
  "welcome": "Welcome, {name}!"
}

// Helper function
function translate(key: string, values: Record<string, string>) {
  let text = dict[key];
  Object.entries(values).forEach(([key, value]) => {
    text = text.replace(`{${key}}`, value);
  });
  return text;
}

// Usage
translate('welcome', { name: 'John' }); // "Welcome, John!"
```

## Testing

### Testing Translated Components

```tsx
import { render } from '@testing-library/react';
import { getDictionary } from '@/lib/get-dictionary';
import LoginForm from './login-form';

describe('LoginForm', () => {
  it('should display French translations', async () => {
    const dict = await getDictionary('fr');
    
    const { getByText } = render(
      <LoginForm dict={dict.auth.login} lang="fr" />
    );
    
    expect(getByText('Connexion')).toBeInTheDocument();
  });
});
```

## Related Documentation

- [Application Structure](./application-structure.md)
- [UI Components](./ui-components.md)
- [State Management](./state-management.md)

---

**Last Updated**: November 2024
