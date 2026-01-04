# Authentication Module

This module handles all authentication and authorization functionality for the WhoIsIt backend.

## Overview

The authentication module provides:

- User registration and email verification
- Login with email/password
- JWT-based authentication
- Password reset flow
- User profile management
- Guest session support
- WebSocket authentication adapter

## Architecture

### Module Structure

- `auth.controller.ts` - REST API endpoints for authentication
- `auth.module.ts` - Module configuration and dependency injection
- `ws-auth.adapter.ts` - WebSocket authentication adapter for Socket.IO
- `services/` - Business logic services
  - `auth.service.ts` - Core authentication logic
  - `auth-token.service.ts` - Token generation and validation
  - `auth-profile.service.ts` - User profile management
- `strategies/` - Passport authentication strategies
  - `local.strategy.ts` - Email/password authentication
  - `jwt.strategy.ts` - JWT token validation
- `guards/` - Route guards for protecting endpoints
  - `local-auth.guard.ts` - Local authentication guard
  - `jwt-auth.guard.ts` - JWT authentication guard
  - `ws-jwt-auth.guard.ts` - WebSocket JWT authentication guard
- `dto/` - Data transfer objects for validation
- `types/` - TypeScript type definitions

### Authentication Flow

#### Registration

1. User submits registration form
2. Email uniqueness is validated
3. Password is hashed with bcrypt
4. User record and player stats are created
5. Email verification token is generated
6. Verification email is sent
7. JWT token is returned and set as HTTP-only cookie

#### Login

1. User submits credentials
2. LocalStrategy validates email/password
3. JWT token is generated
4. Token is returned and set as HTTP-only cookie

#### Email Verification

1. User clicks verification link from email
2. Token is validated
3. User account is marked as verified

#### Password Reset

1. User requests password reset
2. Reset token is generated and emailed
3. User clicks reset link and submits new password
4. Password is updated and reset token is invalidated

## Features

### JWT Authentication

- Tokens expire after 7 days
- Stored as HTTP-only cookies
- Validated on protected routes
- Used for both REST API and WebSocket connections

### Guest Sessions

- Supports anonymous players
- Guest users can create and join games
- Guest data persists in player stats
- Can upgrade to full account later

### Rate Limiting

- Registration: 3 attempts per minute
- Login: 5 attempts per minute
- Password reset: 3 attempts per minute
- Prevents brute force attacks

### Security Features

- Passwords hashed with bcrypt (10 rounds)
- HTTP-only cookies (CSRF protection)
- Secure cookies in production
- SameSite cookie policy
- Token expiration
- Email verification required
- Password strength validation

## API Endpoints

### POST /auth/register

Register a new user account.

**Rate limit**: 3 requests per minute

**Request body**:
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "securepassword"
}
```

### POST /auth/login

Login with email and password.

**Rate limit**: 5 requests per minute

**Request body**:
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### POST /auth/logout

Logout and clear authentication cookie.

**Authentication**: Required (JWT)

### GET /auth/profile

Get current user profile.

**Authentication**: Required (JWT)

### PATCH /auth/profile

Update user profile.

**Authentication**: Required (JWT)

**Request body**:
```json
{
  "username": "newusername"
}
```

### PATCH /auth/change-password

Change user password.

**Authentication**: Required (JWT)

**Request body**:
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword"
}
```

### POST /auth/forgot-password

Request password reset email.

**Rate limit**: 3 requests per minute

**Request body**:
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password

Reset password using reset token.

**Query params**: `token` - Reset token from email

**Request body**:
```json
{
  "password": "newpassword"
}
```

### GET /auth/verify-email

Verify email address.

**Query params**: `token` - Verification token from email

### POST /auth/resend-verification

Resend verification email.

**Authentication**: Required (JWT)

## WebSocket Authentication

The `ws-auth.adapter.ts` provides custom Socket.IO authentication:

- Validates JWT tokens from cookies or handshake auth
- Supports both authenticated users and guest sessions
- Attaches user/guest data to socket
- Handles connection rejection for invalid tokens

## Dependencies

- `@nestjs/jwt` - JWT token handling
- `@nestjs/passport` - Authentication strategies
- `bcrypt` - Password hashing
- `passport-local` - Local strategy
- `passport-jwt` - JWT strategy
- `class-validator` - DTO validation
- `TypeORM` - Database access

## Database Entities Used

- `User` - User account data
- `PlayerStats` - Player statistics and game history
- `Game` - Game records for profile queries
- `GamePlayer` - Player participation in games

## Environment Variables

- `JWT_SECRET` - Secret key for JWT signing (required in production)
- `COOKIE_DOMAIN` - Domain for auth cookies (optional)
- `NODE_ENV` - Environment mode (affects cookie security)

## Testing

Run authentication module tests:

```bash
# Unit tests
pnpm test:backend -- auth

# E2E tests
pnpm test:backend:e2e -- auth
```

## Security Considerations

- Always use HTTPS in production
- Set strong JWT_SECRET (min 32 characters)
- Configure COOKIE_DOMAIN appropriately
- Email verification required for sensitive operations
- Rate limiting prevents abuse
- Passwords are never logged or stored in plain text
- Tokens are invalidated on logout
