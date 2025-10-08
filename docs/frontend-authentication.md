# Frontend Authentication Guide

This guide explains how to use the authentication system in the WhoIsIt frontend application.

## Overview

The frontend authentication system is built using:

- **Zustand** for state management
- **HTTP-only cookies** for secure token storage
- **React hooks** for authentication state access

## Architecture

### 1. Auth Store (`store/auth-store.ts`)

The Zustand store manages the authentication state:

```typescript
import { useAuthStore } from "@/store/auth-store";

// Access authentication state
const { user, isAuthenticated, isLoading, error } = useAuthStore();

// Update authentication state
const { setUser, setLoading, setError, clearError, logout } = useAuthStore();
```

**State:**

- `user`: Current user object or null
- `isAuthenticated`: Boolean indicating authentication status
- `isLoading`: Boolean for loading state during auth operations
- `error`: Error message string or null

**Actions:**

- `setUser(user)`: Set the current user and mark as authenticated
- `setLoading(loading)`: Set loading state
- `setError(error)`: Set error message
- `clearError()`: Clear error message
- `logout()`: Clear user and authentication state
- `reset()`: Reset all state to initial values

### 2. Auth API Service (`lib/auth-api.ts`)

API functions for authentication operations:

```typescript
import * as authApi from "@/lib/auth-api";

// Register a new user
await authApi.register({
  email: "user@example.com",
  username: "username",
  password: "password123",
  displayName: "Display Name",
});

// Login
await authApi.login({
  emailOrUsername: "user@example.com",
  password: "password123",
});

// Get current user profile
await authApi.getProfile();

// Logout
await authApi.logout();
```

All API calls use `credentials: 'include'` to ensure cookies are sent with requests.

### 3. useAuth Hook (`lib/hooks/use-auth.ts`)

React hook that combines auth state and provides convenient methods:

```typescript
import { useAuth } from "@/lib/hooks/use-auth";

function MyComponent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  // Automatically checks authentication on mount
  // and restores user session if valid cookie exists

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.displayName}!</p>
      ) : (
        <p>Please log in</p>
      )}
    </div>
  );
}
```

**Features:**

- Automatically checks authentication status on first render
- Provides logout function that clears both server and client state
- Handles loading states during authentication checks

## Usage Examples

### Login Page

```typescript
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setLoading, setError, clearError, isLoading, error } = useAuthStore();
  const [emailOrUsername, setEmailOrUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!emailOrUsername || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const user = await authApi.login({ emailOrUsername, password });
      setUser(user);
      router.push("/"); // Redirect after successful login
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      <input
        value={emailOrUsername}
        onChange={(e) => setEmailOrUsername(e.target.value)}
        placeholder="Email or Username"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>
    </form>
  );
}
```

### Register Page

```typescript
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setLoading, setError, clearError, isLoading, error } = useAuthStore();
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    displayName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    // Add validation logic here

    setLoading(true);

    try {
      const user = await authApi.register(formData);
      setUser(user);
      router.push("/"); // Redirect after successful registration
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Form implementation...
}
```

### Protected Component

```typescript
"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <div>
      <h1>Welcome, {user?.displayName}!</h1>
      <p>This is a protected page</p>
    </div>
  );
}
```

### Navbar with Authentication

```typescript
"use client";

import { useAuth } from "@/lib/hooks/use-auth";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  return (
    <nav>
      {isAuthenticated && user ? (
        <>
          <span>Welcome, {user.displayName}!</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <a href="/auth/login">Login</a>
          <a href="/auth/register">Sign Up</a>
        </>
      )}
    </nav>
  );
}
```

## Configuration

### Environment Variables

Create a `.env.local` file in the `apps/frontend` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

These variables configure:

- `NEXT_PUBLIC_API_URL`: Backend API server URL (default: `http://localhost:4000`)
- `NEXT_PUBLIC_SOCKET_URL`: Socket.IO server URL (default: `http://localhost:3000`)

### CORS Configuration

Ensure your backend is configured to accept requests from your frontend domain with credentials enabled. The backend should have CORS configured as shown in the backend documentation.

## Security Considerations

1. **HTTP-only Cookies**: Authentication tokens are stored in HTTP-only cookies, making them inaccessible to JavaScript and protecting against XSS attacks.

2. **Credentials Mode**: All API requests use `credentials: 'include'` to ensure cookies are sent with every request.

3. **No Token Storage**: The JWT token is never exposed to the frontend JavaScript; it's only stored in secure HTTP-only cookies.

4. **Automatic Token Management**: The browser automatically includes the authentication cookie with every request to the backend.

## Error Handling

The auth store and API service handle errors consistently:

```typescript
try {
  await authApi.login({ emailOrUsername, password });
} catch (error) {
  if (error instanceof Error) {
    // Handle specific error message
    console.error(error.message);
  } else {
    // Handle generic error
    console.error("An unexpected error occurred");
  }
}
```

Common error scenarios:

- Invalid credentials (401)
- Missing required fields (400)
- Email/username already exists (409) - during registration
- Network errors
- Server errors (500)

## Best Practices

1. **Use useAuth Hook**: Prefer the `useAuth` hook over direct store access for better ergonomics.

2. **Clear Errors**: Always clear previous errors before starting a new auth operation.

3. **Loading States**: Show loading indicators during auth operations.

4. **Redirect After Auth**: Redirect users to appropriate pages after successful login/registration.

5. **Protected Routes**: Always check authentication status in protected pages/components.

6. **Logout Cleanup**: Use the `logout()` function from `useAuth` hook to ensure proper cleanup.

7. **Error Messages**: Display user-friendly error messages from the API.

## Testing

When testing authentication flows:

1. Start the backend server (see backend README)
2. Ensure the `NEXT_PUBLIC_API_URL` environment variable points to your backend
3. Test registration, login, logout, and profile fetching
4. Verify cookies are being set correctly in browser DevTools (Application > Cookies)

## Troubleshooting

### "Failed to fetch" errors

- Ensure backend server is running
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify CORS configuration on backend

### Cookies not being set

- Check browser console for cookie errors
- Ensure `credentials: 'include'` is used in all fetch calls
- Verify backend is setting cookies correctly

### User session not persisting

- Check if cookies are being stored in browser
- Verify cookie expiration time (7 days by default)
- Ensure `useAuth` hook is called in components that need auth state

### TypeScript errors

- Ensure all type imports are correct
- Check that Zustand types are properly inferred
- Verify API response types match the User type
