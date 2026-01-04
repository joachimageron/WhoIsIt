# Components

This directory contains shared, reusable React components used throughout the WhoIsIt frontend application.

## Overview

Shared components provide:

- Consistent UI across the application
- Reusable building blocks
- HeroUI-based components
- Accessibility features
- Responsive design

## Components

### Navbar (`navbar.tsx`)

Main navigation bar displayed on all pages.

**Features**:
- Brand logo and title
- Navigation links (Create Game, Join Game)
- User authentication state
- Profile menu with avatar
- Theme switcher
- Language switcher
- Responsive mobile menu
- Logout functionality

**Props**:
- `lang: Locale` - Current language
- `dict: Dictionary` - Translations

**Usage**:
```tsx
<Navbar lang={lang} dict={dict} />
```

**Authentication States**:
- **Not authenticated**: Shows login/register buttons
- **Authenticated**: Shows user avatar and profile menu
- **Guest**: Shows guest indicator

**Navigation Items**:
- Create Game
- Join Game
- Profile (authenticated only)
- Login/Register (unauthenticated only)

---

### LanguageSwitcher (`language-switcher.tsx`)

Dropdown for selecting application language.

**Features**:
- Language selection dropdown
- Flag icons for languages
- Preserves current route
- Smooth language transition

**Supported Languages**:
- English (en)
- French (fr)
- More can be added

**Props**:
- `lang: Locale` - Current language

**Usage**:
```tsx
<LanguageSwitcher lang={lang} />
```

**Behavior**:
- Updates URL with new language
- Maintains current page path
- Reloads with new translations

---

### ThemeSwitch (`theme-switch.tsx`)

Toggle for switching between light and dark themes.

**Features**:
- Light/dark theme toggle
- Smooth theme transitions
- Persists theme preference
- Sun/moon icons
- Accessible button

**Props**: None (standalone component)

**Usage**:
```tsx
<ThemeSwitch />
```

**Theme Storage**:
- Uses localStorage to persist preference
- Syncs across tabs
- Respects system preference initially

---

### RoomCodeDisplay (`room-code-display.tsx`)

Displays and allows copying of game room codes.

**Features**:
- Large, readable room code display
- Copy to clipboard button
- Success feedback
- Formatted display (uppercase)

**Props**:
- `roomCode: string` - The 5-character room code
- `dict: Dictionary` - Translations

**Usage**:
```tsx
<RoomCodeDisplay roomCode="ABC12" dict={dict} />
```

**Behavior**:
- Displays room code prominently
- Click to copy
- Shows checkmark on successful copy
- Toast notification on copy

---

### Icons (`icons.tsx`)

Collection of SVG icon components.

**Available Icons**:
- `Logo` - Application logo
- `GithubIcon` - GitHub logo
- `DiscordIcon` - Discord logo
- `TwitterIcon` - Twitter logo
- `HeartFilledIcon` - Filled heart
- `SearchIcon` - Search icon
- `SunFilledIcon` - Sun (light theme)
- `MoonFilledIcon` - Moon (dark theme)

**Props**:
- Common SVG props (size, fill, etc.)

**Usage**:
```tsx
import { Logo, GithubIcon } from '@/components/icons';

<Logo />
<GithubIcon size={24} />
```

**Customization**:
- Accepts standard SVG props
- Scalable vector graphics
- Theme-aware colors

---

### Counter (`counter.tsx`)

Example/demo counter component (for testing).

**Features**:
- Increment/decrement buttons
- Display current count
- State management example

**Props**: None

**Usage**:
```tsx
<Counter />
```

**Note**: This is a demo component and may be removed in production.

---

### Primitives (`primitives.ts`)

Tailwind CSS utility functions for consistent styling.

**Exports**:
- Typography variants
- Button variants
- Layout utilities
- Color utilities

**Usage**:
```tsx
import { title, subtitle } from '@/components/primitives';

<h1 className={title()}>Heading</h1>
<p className={subtitle()}>Subheading</p>
```

**Benefits**:
- Type-safe styling
- Consistent design tokens
- Reusable patterns
- Easy customization

---

### Guards (`guards/`)

Route guard components for protecting pages.

#### RequireAuth (`guards/require-auth.tsx`)

Protects routes that require authentication.

**Features**:
- Checks authentication state
- Redirects to login if not authenticated
- Shows loading state during check
- Preserves intended destination

**Props**:
- `children: ReactNode` - Protected content

**Usage**:
```tsx
<RequireAuth>
  <ProtectedPage />
</RequireAuth>
```

**Behavior**:
1. Checks if user is authenticated
2. If not, redirects to login
3. Saves return URL for after login
4. If authenticated, renders children

#### GuestOnly (`guards/guest-only.tsx`)

Protects routes that should only be accessible to unauthenticated users.

**Features**:
- Checks authentication state
- Redirects to home if authenticated
- Prevents logged-in users from accessing login/register

**Props**:
- `children: ReactNode` - Guest-only content

**Usage**:
```tsx
<GuestOnly>
  <LoginPage />
</GuestOnly>
```

---

## Component Patterns

### Server vs Client Components

- **Server Components**: Default in Next.js 15
- **Client Components**: Marked with `"use client"`
- Use server components when possible for better performance
- Use client components for interactivity

### Props Pattern

```typescript
interface ComponentProps {
  lang: Locale;
  dict: Dictionary;
  // ... other props
}

export const Component = ({ lang, dict }: ComponentProps) => {
  // ...
};
```

### Event Handlers

```typescript
const handleClick = () => {
  // Handle event
};

<Button onPress={handleClick}>Click me</Button>
```

## Styling

### HeroUI Components

All UI components use HeroUI library:

```tsx
import { Button } from '@heroui/button';
import { Card } from '@heroui/card';

<Card>
  <Button color="primary">Click</Button>
</Card>
```

### Tailwind CSS

Custom styles use Tailwind:

```tsx
<div className="flex items-center justify-center">
  {/* Content */}
</div>
```

### Theme Support

Components respect theme:
- Light/dark mode support
- Theme-aware colors
- CSS variables for theming

## Accessibility

All components follow accessibility best practices:

- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- Focus management
- Screen reader support

## Testing

Components should be tested for:

- Rendering correctly
- Props handling
- Event handling
- Different states
- Accessibility

Test files in `__tests__/` directory.

## Best Practices

### Component Structure

1. Import dependencies
2. Define TypeScript interfaces
3. Component implementation
4. Export component

### Naming Conventions

- PascalCase for components
- camelCase for functions
- Descriptive names
- Consistent naming

### File Organization

- One component per file
- Related types in same file
- Tests in `__tests__/`
- Shared utilities in separate files

### Performance

- Use React.memo for expensive renders
- Avoid inline functions in render
- Lazy load heavy components
- Optimize re-renders

## Dependencies

- `@heroui/*` - UI component library
- `next/navigation` - Next.js routing
- `next/link` - Next.js links
- `clsx` - Class name utilities
- `react` - React library

## Future Enhancements

Potential improvements:

- Animation library integration
- More icon components
- Loading skeletons
- Error boundaries
- Form components library
- Data table components
- Chart/graph components
- Modal/dialog components
- Notification system
- Drag-and-drop components
