# Frontend Testing Coverage Strategy

This document defines the testing coverage strategy for the WhoIsIt frontend, explaining which files require tests and which are better tested through other means or don't need tests at all.

## Overview

The frontend is built with **Next.js 15** (App Router), **React 18**, and **HeroUI** components. Testing infrastructure is set up with **Jest** and **React Testing Library**, but comprehensive test coverage is still in development.

**Current Status**: Testing infrastructure configured, minimal tests implemented  
**Testing Stack**: Jest 30 + React Testing Library + jsdom

## Testing Strategy by File Type

### ✅ Should Have Unit Tests (Target: 80%+ coverage)

These files contain business logic that should be thoroughly unit tested:

- **React Components**: Interactive UI components with logic
- **Custom Hooks**: Reusable hooks with state management
- **Utility Functions**: Helper functions in `lib/`
- **Store Logic**: Zustand store actions and selectors
- **Client-side API Functions**: API wrappers in `lib/`

**Priority**: Focus on components and hooks with complex logic first

### 🧪 Should Use Integration Tests

These features involve multiple components working together:

- **Page Flows**: Complete user journeys (join game → lobby → gameplay)
- **Socket.IO Integration**: Real-time event handling with server
- **Form Submissions**: Multi-step forms with validation
- **Authentication Flows**: Login → profile → logout sequences

### 🚀 Should Use E2E Tests (Planned: Playwright)

These scenarios should be validated through end-to-end tests:

- **Complete Game Sessions**: Create game → join → play → end
- **Multi-player Scenarios**: Multiple browsers/tabs interacting
- **Real-time Updates**: WebSocket synchronization across clients
- **Responsive Behavior**: Different screen sizes and devices
- **Navigation Flows**: Multi-page user journeys

### ❌ Do Not Need Tests

These files are excluded from coverage requirements:

- **Configuration Files**: Next.js, Tailwind, PostCSS configs
- **Type Definitions**: TypeScript interfaces and types
- **Static Assets**: Images, fonts, SVGs
- **Server Components** (without logic): Pure presentational Next.js server components
- **Entry Points**: Root layout, middleware (tested via E2E)

---

## Files Excluded from Coverage Requirements

### Configuration Files

#### `next.config.js`

**Coverage: 0%** ✅ Expected

**Reason**: Next.js configuration file. Contains only build and runtime configuration, no business logic.

**Type**: Configuration  
**Lines**: ~15 lines

#### `tailwind.config.js`

**Coverage: 0%** ✅ Expected

**Reason**: Tailwind CSS configuration with HeroUI plugin setup. Pure configuration, no executable logic.

**Type**: Configuration  
**Lines**: ~50 lines

#### `postcss.config.js`

**Coverage: 0%** ✅ Expected

**Reason**: PostCSS configuration for Tailwind CSS processing.

**Type**: Configuration  
**Lines**: ~8 lines

#### `jest.config.js`

**Coverage: 0%** ✅ Expected

**Reason**: Jest test framework configuration. Only runs during test setup.

**Type**: Test configuration  
**Lines**: ~20 lines

#### `jest.setup.ts`

**Coverage: 0%** ✅ Expected

**Reason**: Jest environment setup file. Configures testing-library/jest-dom extensions.

**Type**: Test setup  
**Lines**: ~5 lines

#### `middleware.ts`

**Coverage: 0%** ✅ Expected (better tested via E2E)

**Reason**: Next.js middleware for i18n routing and auth protection. Complex logic best validated through E2E tests with real HTTP requests.

**Type**: Next.js middleware  
**Lines**: ~80 lines  
**Note**: Should be tested via E2E tests, not unit tests

---

### Type Definition Files

#### `types/index.ts`

**Coverage: 0%** ✅ Expected

**Reason**: TypeScript type definitions for frontend-specific types. No executable code.

**Type**: Type definitions

#### `next-env.d.ts`

**Coverage: 0%** ✅ Expected

**Reason**: Auto-generated Next.js type definitions. Do not modify or test.

**Type**: Auto-generated types

---

### Configuration and Setup Files

#### `config/fonts.ts`

**Coverage: 0%** ✅ Expected

**Reason**: Font configuration using next/font. Pure configuration, loaded at build time.

**Type**: Font configuration  
**Lines**: ~10 lines

#### `config/site.ts`

**Coverage: 0%** ✅ Expected

**Reason**: Static site metadata configuration (title, description, URLs). No logic to test.

**Type**: Static configuration  
**Lines**: ~20 lines

---

### Dictionary and i18n Files

#### `dictionaries/en.json`

**Coverage: 0%** ✅ Expected

**Reason**: JSON translation file for English locale. Static data, no logic.

**Type**: Static data

#### `dictionaries/fr.json`

**Coverage: 0%** ✅ Expected

**Reason**: JSON translation file for French locale. Static data, no logic.

**Type**: Static data

#### `dictionaries/index.ts`

**Coverage: 0%** ✅ Expected

**Reason**: Simple dictionary loader function. Trivial logic (imports JSON based on locale), better tested via integration tests.

**Type**: Simple utility  
**Lines**: ~10 lines

#### `dictionaries/types.ts`

**Coverage: 0%** ✅ Expected

**Reason**: TypeScript types for dictionary structure. No executable code.

**Type**: Type definitions

---

### Presentational Components (No Complex Logic)

#### `components/icons.tsx`

**Coverage: 0%** ✅ Expected

**Reason**: Icon components wrapping SVG elements. Pure presentation, no logic. Visual validation is sufficient.

**Type**: Presentational component  
**Lines**: ~100 lines

#### `components/primitives.ts`

**Coverage: 0%** ✅ Expected

**Reason**: Tailwind Variants (tv) utility configurations for component styling. Pure configuration, no runtime logic.

**Type**: Style configuration  
**Lines**: ~30 lines

---

### Server Components (Without Logic)

#### Root Layout Files

**Example**: `app/[lang]/layout.tsx`, `app/layout.tsx`

**Coverage: 0%** ✅ Expected

**Reason**: Next.js server-side layout components. Pure structure with metadata, no client-side logic. Better tested via E2E.

**Type**: Server component  
**Note**: If layouts contain complex logic (data fetching, auth checks), consider integration tests

#### Page Components (Without Logic)

**Example**: `app/[lang]/page.tsx`, `app/[lang]/game/page.tsx`

**Coverage: 0%** ✅ Expected

**Reason**: Next.js page components that are purely structural. If they contain logic or interactivity, they should be tested.

**Type**: Server component  
**Note**: Client components in pages (`"use client"`) with logic SHOULD be tested

---

## Components That SHOULD Be Tested

### Priority 1: High-Value Components

#### `components/room-code-display.tsx`

**Target Coverage: 90%+**

**Reason**: Displays and formats room codes. Contains logic for formatting and copying to clipboard.

**Test Focus**:

- Room code formatting (uppercase, spacing)
- Copy to clipboard functionality
- Visual states (hover, copied)

#### `app/[lang]/game/lobby/[roomCode]/lobby-client.tsx`

**Target Coverage: 80%+**

**Reason**: Core lobby component with Socket.IO integration, player management, and game start logic.

**Test Focus**:

- Player list rendering
- Ready state toggling
- Socket event handling (mocked)
- Start game button states
- Leave lobby functionality

#### `app/[lang]/game/join/join-form.tsx`

**Target Coverage: 90%+**

**Reason**: Form component with validation and API integration.

**Test Focus**:

- Input validation (room code format)
- Form submission
- Error handling
- Loading states
- Navigation on success

---

### Priority 2: Interactive Components

#### `components/navbar.tsx`

**Target Coverage: 70%+**

**Reason**: Navigation component with authentication state, dropdowns, and language switching.

**Test Focus**:

- Authenticated vs guest states
- Dropdown menu interactions
- Language switcher integration
- Mobile responsive behavior (mocked)

#### `components/language-switcher.tsx`

**Target Coverage: 80%+**

**Reason**: Language selection component with locale persistence.

**Test Focus**:

- Current locale display
- Locale switching
- Cookie/localStorage updates
- Dropdown behavior

#### `components/theme-switch.tsx`

**Target Coverage: 80%+**

**Reason**: Theme toggle component (light/dark mode).

**Test Focus**:

- Theme state toggling
- Icon rendering
- Persistence

---

### Priority 3: State Management

#### `store/auth-store.ts`

**Target Coverage: 90%+**

**Reason**: Zustand store managing authentication state.

**Test Focus**:

- Login/logout actions
- User state updates
- Token management
- Guest session handling

#### `store/game-store.ts`

**Target Coverage: 90%+**

**Reason**: Zustand store managing game lobby state and socket connection.

**Test Focus**:

- Lobby state updates
- Connection status management
- Player updates
- Action dispatchers

---

### Priority 4: API and Utility Functions

#### `lib/game-api.ts`

**Target Coverage: 90%+**

**Reason**: API wrapper functions for game endpoints.

**Test Focus**:

- HTTP request formatting
- Error handling
- Response parsing
- Token handling

#### `lib/auth-api.ts`

**Target Coverage: 90%+**

**Reason**: API wrapper functions for authentication.

**Test Focus**:

- Login/register/logout requests
- Token handling
- Error responses
- Cookie management

#### `lib/guest-session.ts`

**Target Coverage: 90%+**

**Reason**: Guest session management utility.

**Test Focus**:

- Session creation
- Session retrieval
- localStorage interaction
- Session validation

---

### Priority 5: Custom Hooks

#### `lib/hooks/use-game-socket.ts`

**Target Coverage: 80%+**

**Reason**: Hook managing Socket.IO connection and game events.

**Test Focus**:

- Socket connection lifecycle
- Event emission
- Event listening
- Cleanup on unmount
- Mock Socket.IO client

---

## Files Excluded from Coverage Requirements (Summary)

### Configuration & Entry Points (0% OK)

- `next.config.js`
- `tailwind.config.js`
- `postcss.config.js`
- `jest.config.js`
- `jest.setup.ts`
- `middleware.ts` (test via E2E)

**Total**: ~6 files

### Type Definitions (0% OK)

- `types/index.ts`
- `next-env.d.ts`
- `dictionaries/types.ts`
- All `.d.ts` files

**Total**: ~4-5 files

### Static Data & i18n (0% OK)

- `dictionaries/en.json`
- `dictionaries/fr.json`
- `dictionaries/index.ts`
- `config/fonts.ts`
- `config/site.ts`

**Total**: ~5 files

### Presentational Components (0% OK)

- `components/icons.tsx`
- `components/primitives.ts`
- Server components without logic

**Total**: ~5-10 files

**Grand Total Excluded**: ~20-26 files

---

## Coverage Goals by File Type

| File Type | Target Coverage | Current Status | Priority |
|-----------|----------------|----------------|----------|
| Custom Hooks | 90%+ | ⚠️ Not tested | 🔴 High |
| Zustand Stores | 90%+ | ⚠️ Not tested | 🔴 High |
| API Utilities | 90%+ | ⚠️ Not tested | 🔴 High |
| Form Components | 80%+ | ⚠️ Not tested | 🔴 High |
| Interactive Components | 70%+ | ⚠️ Minimal | 🟡 Medium |
| Socket Integration | 60%+ | ⚠️ Not tested | 🟡 Medium |
| Presentational Components | 40%+ | ⚠️ Not tested | 🟢 Low |
| Config Files | 0% | ✅ 0% (expected) | N/A |
| Type Definitions | 0% | ✅ 0% (expected) | N/A |

---

## Testing Decision Tree

Use this decision tree to determine the appropriate testing strategy:

```text
Is it a config file, type definition, or static data?
├─ YES → ❌ No tests needed
└─ NO → Continue

Is it a Next.js server component without logic?
├─ YES → ❌ No unit tests (test via E2E if needed)
└─ NO → Continue

Is it middleware or API routes?
├─ YES → 🚀 Focus on E2E tests
└─ NO → Continue

Is it a pure presentational component (icons, wrappers)?
├─ YES → ⚠️ Optional tests (low priority)
└─ NO → Continue

Is it a custom hook or utility function?
├─ YES → ✅ Write unit tests (high priority)
└─ NO → Continue

Is it a Zustand store or state management?
├─ YES → ✅ Write unit tests (high priority)
└─ NO → Continue

Is it an interactive component with logic?
├─ YES → ✅ Write unit tests (medium priority)
└─ NO → Continue

Is it a complex page flow or multi-component feature?
├─ YES → 🧪 Focus on integration tests
└─ NO → ✅ Write unit tests
```

---

## Testing Best Practices

### Unit Tests ✅

**When to use**:

- Custom hooks with logic
- Utility functions
- API wrappers
- Store actions and selectors
- Interactive components

**How to write**:

- Use React Testing Library
- Mock external dependencies (fetch, Socket.IO)
- Test user interactions, not implementation
- Use screen queries (getByRole, getByText)
- Test accessibility (roles, labels)

**Example**: Testing a form component

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinForm } from './join-form';

describe('JoinForm', () => {
  it('should submit valid room code', async () => {
    const mockOnJoin = jest.fn();
    render(<JoinForm onJoin={mockOnJoin} />);

    const input = screen.getByLabelText(/room code/i);
    const submitBtn = screen.getByRole('button', { name: /join/i });

    await userEvent.type(input, 'ABC123');
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockOnJoin).toHaveBeenCalledWith('ABC123');
    });
  });

  it('should show error for invalid room code', async () => {
    render(<JoinForm />);

    const input = screen.getByLabelText(/room code/i);
    await userEvent.type(input, '123'); // Too short

    expect(screen.getByText(/invalid room code/i)).toBeInTheDocument();
  });
});
```

### Integration Tests 🧪

**When to use**:

- Multi-component interactions
- Socket.IO with multiple listeners
- Store + component integration
- Form submission with API calls

**How to write**:

- Use MSW (Mock Service Worker) for API mocking
- Test component trees, not isolated components
- Verify side effects (API calls, state updates)
- Mock Socket.IO server

**Example**: Testing lobby with Socket.IO

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { LobbyClient } from './lobby-client';
import { mockSocketServer } from '@/test-utils/socket-mock';

describe('LobbyClient Integration', () => {
  let socketServer: ReturnType<typeof mockSocketServer>;

  beforeEach(() => {
    socketServer = mockSocketServer();
  });

  afterEach(() => {
    socketServer.close();
  });

  it('should update player list when player joins', async () => {
    render(<LobbyClient roomCode="ABC123" />);

    // Simulate server event
    socketServer.emit('playerJoined', {
      player: { id: '2', username: 'Player2' }
    });

    await waitFor(() => {
      expect(screen.getByText('Player2')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests 🚀 (Planned)

**When to use**:

- Complete user journeys
- Real-time multi-client scenarios
- Middleware and authentication flows
- Cross-browser compatibility

**Tool**: Playwright (planned)

**How to write**:

- Use real browser instances
- Test complete flows (not isolated features)
- Verify network requests
- Test responsive behavior

**Example**: Testing game creation flow

```typescript
import { test, expect } from '@playwright/test';

test('complete game creation flow', async ({ page }) => {
  // Login
  await page.goto('/auth/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Create game
  await page.goto('/game/create');
  await page.selectOption('[name="characterSet"]', 'classic');
  await page.click('button[type="submit"]');

  // Verify lobby
  await expect(page).toHaveURL(/\/game\/lobby\/[A-Z0-9]+/);
  await expect(page.locator('.room-code')).toBeVisible();
});
```

---

## Next Steps for Improving Coverage

### Immediate Priorities (Sprint 1)

1. ✅ **Set up test utilities**
   - Socket.IO mock helper
   - MSW handlers for API
   - Custom render with providers

2. 🎯 **Test critical paths first**
   - `lib/guest-session.ts` (guest system)
   - `store/auth-store.ts` (auth state)
   - `store/game-store.ts` (game state)
   - `lib/game-api.ts` (API wrapper)

3. 🎯 **Test core components**
   - `join-form.tsx` (game joining)
   - `lobby-client.tsx` (lobby management)
   - `room-code-display.tsx` (room code UI)

### Medium-term Goals (Sprint 2-3)

1. Add integration tests for:
   - Complete lobby flow
   - Socket.IO event handling
   - Form validation and submission

2. Add tests for:
   - `navbar.tsx`
   - `language-switcher.tsx`
   - `theme-switch.tsx`
   - `use-game-socket.ts` hook

### Long-term Goals

1. Set up Playwright for E2E tests
2. Add E2E tests for:
   - Complete game flows
   - Multi-player scenarios
   - Authentication flows

3. Implement visual regression testing (optional)
4. Set up test coverage thresholds in CI/CD

---

## Related Documentation

- [Testing Guide](../development/testing.md) - Complete testing documentation
- [Frontend Application Structure](./application-structure.md) - Understanding the codebase
- [State Management](./state-management.md) - Zustand stores documentation
- [Real-time Communication](./realtime.md) - Socket.IO integration

---

**Last Updated**: November 9, 2025  
**Test Status**: Infrastructure ready, minimal tests implemented  
**Coverage**: TBD (tests not yet comprehensive)
