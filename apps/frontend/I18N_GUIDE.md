# Internationalization (i18n) Guide

This frontend application supports multiple languages using Next.js 15's app router with dynamic routing.

## Supported Languages

- **English (en)** - Default language
- **French (fr)**

## How It Works

### Automatic Language Detection

The middleware automatically detects the user's preferred language from their browser's `Accept-Language` header and redirects them to the appropriate language version:

- User visits `/` → Redirected to `/en` or `/fr` based on browser language
- User visits `/about` → Redirected to `/en/about` or `/fr/about`

### URL Structure

All routes are prefixed with the language code:

```
/en              → English home page
/fr              → French home page
/en/about        → English about page
/fr/about        → French about page
/en/auth/login   → English login page
/fr/auth/login   → French login page
```

### Language Switcher

Users can manually switch languages using the language switcher buttons (EN/FR) in the navbar. The switcher preserves the current page path.

## Adding New Translations

### 1. Update Dictionary Files

Add your translation strings to both language files:

**`dictionaries/en.json`**
```json
{
  "mySection": {
    "myKey": "My English Text"
  }
}
```

**`dictionaries/fr.json`**
```json
{
  "mySection": {
    "myKey": "Mon Texte Français"
  }
}
```

### 2. Use Translations in Server Components

```tsx
import { getDictionary, type Locale } from "@/dictionaries";

export default async function MyPage({
  params,
}: {
  params: Promise<{ lang: Locale }>;
}) {
  const { lang } = await params;
  const dict = await getDictionary(lang);

  return <h1>{dict.mySection.myKey}</h1>;
}
```

### 3. Use Translations in Client Components

For client components, pass the dictionary as a prop from the parent server component:

```tsx
// In parent server component
<MyClientComponent dict={dict} />

// In client component
"use client";

interface MyClientComponentProps {
  dict: any; // Or create a proper type
}

export function MyClientComponent({ dict }: MyClientComponentProps) {
  return <button>{dict.mySection.myKey}</button>;
}
```

## Adding New Languages

To add a new language (e.g., Spanish):

1. Add the locale code to the middleware:
```typescript
// middleware.ts
const locales = ['en', 'fr', 'es'];
```

2. Create a new dictionary file:
```bash
touch apps/frontend/dictionaries/es.json
```

3. Add the dictionary loader:
```typescript
// dictionaries/index.ts
const dictionaries = {
  en: () => import("./en.json").then((module) => module.default),
  fr: () => import("./fr.json").then((module) => module.default),
  es: () => import("./es.json").then((module) => module.default),
};

export type Locale = "en" | "fr" | "es";
```

4. Update generateStaticParams in layout.tsx:
```typescript
export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "fr" }, { lang: "es" }];
}
```

5. Update the language switcher component to include the new language.

## Best Practices

1. **Keep dictionaries organized**: Group related translations together
2. **Use consistent keys**: Use the same key structure across all languages
3. **Provide fallbacks**: The system falls back to English if a translation is missing
4. **Server-only imports**: Dictionaries use `server-only` to prevent client-side bundle bloat
5. **Static generation**: All language routes are pre-rendered at build time for optimal performance

## Testing

To test different languages:

1. **Using URL**: Navigate to `/en` or `/fr` directly
2. **Using Language Switcher**: Click EN or FR buttons in the navbar
3. **Using Browser Settings**: Change your browser's language preferences and visit the root URL

## Performance

- All translations are loaded server-side only
- Static pages are pre-generated for all languages at build time
- No impact on client-side JavaScript bundle size
- Middleware redirects are fast and lightweight
