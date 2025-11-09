# Testing Setup - Frontend

> **Note**: This documentation is located in `/docs/frontend/testing.md` as part of the main project documentation.

This document describes the testing setup for the frontend application.

## Overview

The frontend uses **Jest** and **React Testing Library** for unit and integration testing of React components.

## Technologies

- **Jest**: JavaScript testing framework (v30.x)
- **React Testing Library**: Testing utilities for React (v16.x)
- **@testing-library/jest-dom**: Custom Jest matchers for DOM assertions
- **@testing-library/user-event**: User interaction simulation (v14.x)

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage report
pnpm test:coverage

# Run tests from root (includes backend tests)
cd /home/runner/work/WhoIsIt/WhoIsIt
pnpm test
```

## Test File Structure

Tests are located in `__tests__` directories adjacent to the components they test:

```
components/
  __tests__/
    counter.test.tsx
    language-switcher.test.tsx
  counter.tsx
  language-switcher.tsx
```

## Configuration Files

### jest.config.js

Main Jest configuration file that:
- Uses Next.js's Jest configuration preset
- Sets up jsdom test environment
- Configures module path mapping for `@/` imports
- Defines test file patterns and coverage collection

### jest.setup.ts

Setup file that runs before each test suite:
- Imports `@testing-library/jest-dom` for custom matchers
- Mocks `framer-motion` to avoid dynamic import issues in test environment

## Writing Tests

### Basic Component Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from '../my-component';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyButton } from '../my-button';

describe('MyButton', () => {
  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<MyButton onClick={handleClick} />);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Mocking Next.js Hooks

```typescript
// Mock useRouter
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => '/en/test',
}));
```

## Known Issues & Workarounds

### Framer Motion Dynamic Imports

The HeroUI component library uses framer-motion which has dynamic imports that don't work in Jest's test environment. We mock framer-motion in `jest.setup.ts` to work around this issue.

You may see console warnings like:
```
Warning: Unknown event handler property `onAnimationComplete`. It will be ignored.
```

These warnings are expected and don't affect test functionality.

### HeroUI Component Testing

When testing HeroUI components (Select, Button, etc.), be aware that:
- Components may render multiple elements with the same text (visible value + hidden select option)
- Use specific selectors like `[data-slot="value"]` or role-based queries
- The components use React Aria for accessibility, which may add extra ARIA attributes

## Coverage Goals

Current coverage:
- Counter component: 100%
- Language Switcher component: ~60% (full UI interactions not tested)

Coverage reports are generated in the `coverage/` directory (gitignored).

## Best Practices

1. **Test behavior, not implementation**: Focus on what the user sees and does
2. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`
3. **Mock external dependencies**: Mock Next.js hooks, API calls, and external libraries
4. **Keep tests isolated**: Each test should be independent and not rely on other tests
5. **Use descriptive test names**: Clearly describe what is being tested

## References

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library Documentation](https://testing-library.com/react)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Next.js Testing Documentation](https://nextjs.org/docs/testing)
