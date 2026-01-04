# Authentication Pages

This directory contains all authentication-related pages for the WhoIsIt frontend application.

## Overview

The authentication pages handle user account management:

1. **Register** - Create new account
2. **Login** - Sign in to existing account
3. **Verify Email** - Confirm email address
4. **Forgot Password** - Request password reset
5. **Reset Password** - Set new password with token

## Pages

### Register (`register/`)

**Route**: `/[lang]/auth/register`

User registration page for creating a new account.

**Features**:
- Email input with validation
- Username input
- Password input with strength indicator
- Confirm password field
- Guest to account conversion (future)
- Terms and conditions acceptance
- Error handling

**Components**:
- `page.tsx` - Server/client component with registration form

**Validation**:
- Email format validation
- Unique email check (server-side)
- Username requirements (3-20 characters)
- Password strength (min 8 characters)
- Password confirmation match

**Flow**:
1. User fills registration form
2. Submits to `/auth/register` API
3. Account created, verification email sent
4. JWT token set as HTTP-only cookie
5. Redirect to home page with success message
6. User clicks verification link in email (later)

**API Endpoints Used**:
- `POST /auth/register` - Create account

**Error Handling**:
- Email already exists
- Invalid email format
- Weak password
- Password mismatch
- Network errors

**Rate Limiting**: 3 attempts per minute

---

### Login (`login/`)

**Route**: `/[lang]/auth/login`

User login page for existing accounts.

**Features**:
- Email/password authentication
- Remember me checkbox
- Link to forgot password
- Link to register
- Error messages
- Guest login option

**Components**:
- `page.tsx` - Server/client component with login form

**Validation**:
- Email format validation
- Required fields

**Flow**:
1. User enters credentials
2. Submits to `/auth/login` API
3. Validates credentials
4. JWT token set as HTTP-only cookie
5. Redirect to previous page or home

**API Endpoints Used**:
- `POST /auth/login` - Authenticate user

**Error Handling**:
- Invalid credentials
- Account not found
- Email not verified (warning)
- Network errors

**Rate Limiting**: 5 attempts per minute

**Security**:
- HTTP-only cookies
- Secure cookies in production
- SameSite policy
- No password exposure

---

### Verify Email (`verify-email/[verify-token]/`)

**Route**: `/[lang]/auth/verify-email/[verify-token]`

Email verification page, accessed from verification email link.

**Features**:
- Automatic token verification
- Success/error messages
- Redirect to login/home
- Token expiration handling
- Resend verification option

**Components**:
- `page.tsx` - Server/client component with verification logic

**Flow**:
1. User clicks link in verification email
2. Page extracts token from URL
3. Calls `/auth/verify-email?token=...` API
4. Shows success or error message
5. Redirects to appropriate page

**API Endpoints Used**:
- `GET /auth/verify-email?token=...` - Verify email token

**Error Handling**:
- Invalid token
- Expired token (24 hours)
- Already verified
- Token not found

**Success Flow**:
- Email verified
- Account fully activated
- Can now use all features
- Redirect to home or login

---

### Forgot Password (`forgot-password/`)

**Route**: `/[lang]/auth/forgot-password`

Password reset request page.

**Features**:
- Email input for account lookup
- Success message (generic for security)
- Link back to login
- Instructions for next steps

**Components**:
- `page.tsx` - Server/client component with forgot password form

**Validation**:
- Email format validation
- Required field

**Flow**:
1. User enters email address
2. Submits to `/auth/forgot-password` API
3. If account exists, reset email is sent
4. Shows generic success message (security)
5. User checks email for reset link

**API Endpoints Used**:
- `POST /auth/forgot-password` - Request password reset

**Security**:
- Generic success message (don't reveal if email exists)
- Rate limiting
- Token expiration (1 hour)
- One-time use tokens

**Rate Limiting**: 3 attempts per minute

---

### Reset Password (`forgot-password/[reset-token]/`)

**Route**: `/[lang]/auth/forgot-password/[reset-token]`

Password reset page, accessed from reset email link.

**Features**:
- New password input
- Confirm password input
- Password strength indicator
- Token validation
- Error handling

**Components**:
- `page.tsx` - Server/client component with reset password form

**Validation**:
- Password strength (min 8 characters)
- Password confirmation match
- Token validity

**Flow**:
1. User clicks link in reset email
2. Page extracts token from URL
3. User enters new password
4. Submits to `/auth/reset-password?token=...` API
5. Password updated, token invalidated
6. Redirect to login with success message

**API Endpoints Used**:
- `POST /auth/reset-password?token=...` - Reset password

**Error Handling**:
- Invalid token
- Expired token (1 hour)
- Token already used
- Weak password
- Password mismatch

**Security**:
- Tokens expire after 1 hour
- Tokens are single-use
- Old password is invalidated
- User must login with new password

---

## Common Features

### Internationalization

All auth pages use the dictionary system:

```typescript
const dict = await getDictionary(lang);
```

**Language Parameter**: `[lang]` in URL (e.g., `en`, `fr`)

### Form Validation

Client-side validation using:
- HTML5 validation
- Custom validators
- Real-time feedback
- Error messages from dictionary

### Error Handling

Consistent error display:
- Toast notifications for errors
- Inline field errors
- Generic messages for security
- Network error handling

### Responsive Design

All auth pages are:
- Mobile-first design
- Centered card layout
- Accessible forms
- Touch-friendly inputs

### State Management

Auth state managed by Zustand:

```typescript
import { useAuthStore } from '@/store/auth-store';

const { user, setUser, logout } = useAuthStore();
```

## Security Best Practices

### Password Security

- Minimum 8 characters
- Strength indicator
- Hashed with bcrypt (server-side)
- Never logged or exposed
- Secure transmission (HTTPS in production)

### Token Security

- HTTP-only cookies (CSRF protection)
- Secure flag in production
- SameSite policy
- Expiration times
- One-time use for sensitive operations

### Rate Limiting

Prevents brute force attacks:
- Login: 5 per minute
- Register: 3 per minute
- Forgot password: 3 per minute

### Email Security

- Verification required for sensitive ops
- Reset tokens expire quickly
- Generic error messages
- Token single-use enforcement

## User Experience

### Success Messages

- Clear confirmation messages
- Next step instructions
- Automatic redirects
- Progress indicators

### Error Messages

- User-friendly language
- Actionable guidance
- No technical jargon
- Security-conscious (don't reveal too much)

### Loading States

- Button loading spinners
- Disabled inputs during submission
- Progress feedback
- Prevent double submission

## Navigation Flow

```
Register → Email Verification → Home
Login → Home (or previous page)
Forgot Password → Email → Reset Password → Login
```

## Testing

Auth pages should be tested for:

- Form validation
- Submission handling
- Error states
- Success flows
- Token validation
- Redirects
- Rate limiting
- Security measures

## Dependencies

- `@heroui/input` - Form inputs
- `@heroui/button` - Buttons
- `@heroui/card` - Card layout
- `@heroui/toast` - Notifications
- `react-hook-form` - Form management (if used)
- `@whois-it/contracts` - Shared types

## API Integration

All auth endpoints use:
- REST API at `/auth/*`
- HTTP-only cookies for tokens
- JSON request/response bodies
- Standard HTTP status codes

## Environment Variables

Frontend configuration:

- `NEXT_PUBLIC_API_URL` - Backend API URL
- Used for API calls in auth pages

## Accessibility

- Semantic HTML forms
- Proper labels for inputs
- Error announcements
- Keyboard navigation
- Focus management
- ARIA attributes

## Future Enhancements

Potential improvements:

- Social authentication (OAuth)
- Two-factor authentication
- Password-less login (magic links)
- Guest account conversion
- Profile picture upload
- Email change flow
- Account deletion
- Session management page
- Login history
- Security notifications
