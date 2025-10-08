# Authentication API Documentation

This document describes the RESTful authentication endpoints available in the WhoIsIt backend.

## Base URL

```http
http://localhost:4000/auth
```

## Authentication Method

This API uses **HTTP-only cookies** for authentication. After successful registration or login, the JWT token is automatically stored in a secure, HTTP-only cookie named `access_token`. Your browser will automatically include this cookie in subsequent requests to protected endpoints.

## Endpoints

### 1. Register

Create a new user account and receive an authentication cookie.

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

*Response Headers:*

```http
Set-Cookie: access_token=<jwt_token>; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax
```

*Response Body:*

```json
{
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

Authenticate an existing user and receive an authentication cookie.

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

**Success Response (201):**

*Response Headers:*

```http
Set-Cookie: access_token=<jwt_token>; Max-Age=604800; Path=/; HttpOnly; SameSite=Lax
```

*Response Body:*

```json
{
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

Get the current user's profile information. Requires authentication via cookie.

**Endpoint:** `GET /auth/profile`

**Authentication:**
The authentication cookie is automatically included by the browser. No manual headers needed.

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

- `401 Unauthorized`: Missing or invalid authentication cookie

---

### 4. Logout

Clear the authentication cookie and log out the user.

**Endpoint:** `POST /auth/logout`

**Authentication:**
Requires authentication via cookie.

**Success Response (201):**

*Response Headers:*

```http
Set-Cookie: access_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT
```

*Response Body:*

```json
{
  "message": "Logged out successfully"
}
```

**Error Responses:**

- `401 Unauthorized`: Missing or invalid authentication cookie

---

## Cookie Details

The authentication cookie has the following security features:

- **Name:** `access_token`
- **Duration:** 7 days (604800 seconds)
- **HttpOnly:** Yes - prevents JavaScript access (XSS protection)
- **SameSite:** Lax - prevents CSRF attacks
- **Secure:** Yes (in production) - HTTPS-only transmission
- **Path:** / - available for all routes

## Security Features

- **Cookie-based Authentication**: JWT tokens stored in HTTP-only cookies for XSS protection
- **Password Hashing**: Passwords are hashed using bcrypt with 10 rounds
- **JWT Signature**: Tokens are signed with a secret key (configurable via `JWT_SECRET` environment variable)
- **CSRF Protection**: SameSite=Lax cookie attribute prevents cross-site request forgery
- **Validation**: All inputs are validated using class-validator
- **CORS**: Enabled with credentials support for cookie-based authentication

## Environment Variables

Set these in your `.env` file:

```env
JWT_SECRET=your-secret-key-here
NODE_ENV=production  # Enables secure flag on cookies for HTTPS-only
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
curl -c cookies.txt -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123","displayName":"Test User"}'
```

**Login:**

```bash
curl -c cookies.txt -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"testuser","password":"password123"}'
```

**Get Profile:**

```bash
curl -b cookies.txt -X GET http://localhost:4000/auth/profile
```

**Logout:**

```bash
curl -b cookies.txt -c cookies.txt -X POST http://localhost:4000/auth/logout
```

**Note:** The `-c cookies.txt` flag saves cookies to a file, and `-b cookies.txt` sends cookies from that file.

### Using JavaScript/TypeScript

```typescript
// Register
const registerResponse = await fetch('http://localhost:4000/auth/register', {
  method: 'POST',
  credentials: 'include', // Important: includes cookies in requests
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
const { user } = await registerResponse.json();
// Authentication cookie is automatically stored by the browser

// Login
const loginResponse = await fetch('http://localhost:4000/auth/login', {
  method: 'POST',
  credentials: 'include', // Important: includes cookies in requests
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    emailOrUsername: 'testuser',
    password: 'password123',
  }),
});
const { user } = await loginResponse.json();
// Authentication cookie is automatically stored by the browser

// Get Profile
const profileResponse = await fetch('http://localhost:4000/auth/profile', {
  credentials: 'include', // Important: sends cookies with the request
});
const profile = await profileResponse.json();

// Logout
const logoutResponse = await fetch('http://localhost:4000/auth/logout', {
  method: 'POST',
  credentials: 'include', // Important: sends cookies with the request
});
const { message } = await logoutResponse.json();
// Authentication cookie is automatically cleared by the browser
```

**Important:** Always use `credentials: 'include'` in fetch requests to ensure cookies are sent and received properly.

## Backward Compatibility

For API clients that cannot use cookies, the JWT token can still be sent via the `Authorization` header:

```http
Authorization: Bearer <access_token>
```

However, this method is less secure than cookie-based authentication and should only be used when cookies are not available (e.g., mobile apps, server-to-server communication).
