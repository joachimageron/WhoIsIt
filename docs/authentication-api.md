# Authentication API Documentation

This document describes the RESTful authentication endpoints available in the WhoIsIt backend.

## Base URL

```
http://localhost:4000/auth
```

## Endpoints

### 1. Register

Create a new user account.

**Endpoint:** `POST /auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "displayName": "Display Name"
}
```

**Validation Rules:**
- `email`: Must be a valid email address
- `username`: Required, minimum 3 characters
- `password`: Required, minimum 6 characters
- `displayName`: Required

**Success Response (201):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "Display Name",
    "avatarUrl": null
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid input data (validation failed)
- `409 Conflict`: Email or username already exists

---

### 2. Login

Authenticate an existing user.

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "emailOrUsername": "user@example.com",
  "password": "password123"
}
```

**Notes:**
- `emailOrUsername` can be either the user's email address or username

**Success Response (200):**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "displayName": "Display Name",
    "avatarUrl": null
  }
}
```

**Error Responses:**
- `400 Bad Request`: Missing required fields
- `401 Unauthorized`: Invalid credentials

---

### 3. Get Profile

Get the current user's profile information.

**Endpoint:** `GET /auth/profile`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "username",
  "displayName": "Display Name",
  "avatarUrl": null,
  "isGuest": false
}
```

**Error Responses:**
- `401 Unauthorized`: Missing or invalid token

---

## JWT Token

The JWT access token is valid for **7 days** from issuance. Include it in the `Authorization` header for protected endpoints:

```
Authorization: Bearer <access_token>
```

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with 10 rounds
- **JWT Signature**: Tokens are signed with a secret key (configurable via `JWT_SECRET` environment variable)
- **Validation**: All inputs are validated using class-validator
- **CORS**: Enabled for frontend integration

## Environment Variables

Set these in your `.env` file:

```env
JWT_SECRET=your-secret-key-here
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whois_it
DB_SYNC=true
PORT=4000
```

## Example Usage

### Using curl

**Register:**
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123","displayName":"Test User"}'
```

**Login:**
```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"testuser","password":"password123"}'
```

**Get Profile:**
```bash
curl -X GET http://localhost:4000/auth/profile \
  -H "Authorization: Bearer <your-token-here>"
```

### Using JavaScript/TypeScript

```typescript
// Register
const registerResponse = await fetch('http://localhost:4000/auth/register', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    username: 'testuser',
    password: 'password123',
    displayName: 'Test User',
  }),
});
const { accessToken, user } = await registerResponse.json();

// Login
const loginResponse = await fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    emailOrUsername: 'testuser',
    password: 'password123',
  }),
});
const { accessToken, user } = await loginResponse.json();

// Get Profile
const profileResponse = await fetch('http://localhost:4000/auth/profile', {
  headers: {
    'Authorization': `Bearer ${accessToken}`,
  },
});
const profile = await profileResponse.json();
```
