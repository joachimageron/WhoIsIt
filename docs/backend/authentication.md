# Authentication and Authorization

## Overview

WhoIsIt implements a **JWT-based authentication system** with support for both **registered users** and **guest sessions**. Authentication tokens are stored in HTTP-only cookies for security, and the system includes email verification and password reset functionality.

## Architecture

### Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     Registration/Login Flow                      │
└─────────────────────────────────────────────────────────────────┘

User → Frontend → POST /auth/register → Backend
                                          ├─ Validate input
                                          ├─ Hash password (bcrypt)
                                          ├─ Create user in DB
                                          ├─ Generate JWT token
                                          ├─ Send verification email
                                          └─ Return JWT in cookie

User → Frontend → POST /auth/login → Backend
                                       ├─ Validate credentials
                                       ├─ Generate JWT token
                                       └─ Return JWT in cookie
```

### Components

1. **AuthModule**: Main authentication module
2. **AuthService**: Business logic for auth operations
3. **JwtStrategy**: Passport JWT strategy
4. **LocalStrategy**: Passport local strategy for login
5. **Guards**: Route protection (JwtAuthGuard, OptionalJwtAuthGuard)
6. **DTOs**: Request validation
7. **WsAuthAdapter**: WebSocket authentication adapter

## User Types

### Registered Users

Users with email and password who create an account.

**Features**:
- Email/password authentication
- Email verification
- Password reset
- Profile management
- Game history tracking
- Statistics

**User Model**:
```typescript
{
  id: 'uuid',
  email: 'user@example.com',
  username: 'johndoe',
  passwordHash: 'bcrypt-hash',
  avatarUrl: '/avatar/avatar_5.jpg',
  isGuest: false,
  emailVerified: true,
  verificationToken: null,
  verificationTokenExpiresAt: null,
  createdAt: '2024-01-01T00:00:00Z',
  lastSeenAt: '2024-01-05T12:00:00Z'
}
```

### Guest Users

Temporary users created without registration.

**Features**:
- Play without account
- Temporary session in localStorage
- No email or password
- Limited persistence
- Can upgrade to registered user (future)

**Guest Session**:
```typescript
// Stored in localStorage
{
  guestId: 'guest-uuid',
  username: 'Guest123',
  createdAt: '2024-01-01T00:00:00Z'
}
```

## JWT Token System

### Token Structure

**Payload**:
```typescript
interface JwtPayload {
  sub: string;        // User ID (subject)
  email: string | null;
  username: string;
  iat?: number;       // Issued at (automatic)
  exp?: number;       // Expiration (automatic)
}
```

**Example Token Payload**:
```json
{
  "sub": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "username": "johndoe",
  "iat": 1609459200,
  "exp": 1610064000
}
```

### Token Generation

```typescript
// Backend: Generate token
const payload: JwtPayload = {
  sub: user.id,
  email: user.email ?? null,
  username: user.username,
};

const accessToken = this.jwtService.sign(payload, {
  secret: process.env.JWT_SECRET,
  expiresIn: '7d',  // 7 days
});
```

### Token Storage

**HTTP-Only Cookie**:
```typescript
// Set cookie in response
res.cookie('access_token', token, {
  httpOnly: true,          // Not accessible via JavaScript
  secure: NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax',         // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
});
```

**Security Benefits**:
- **XSS Protection**: HttpOnly prevents JavaScript access
- **CSRF Protection**: SameSite attribute
- **HTTPS Only**: Secure flag in production
- **Automatic Sending**: Browser sends cookie with every request

## Authentication Endpoints

### Register

Create a new user account.

**POST** `/auth/register`

**Request Body**:
```typescript
{
  email: string;      // Valid email format
  username: string;   // 3-20 characters
  password: string;   // Minimum 8 characters
  avatarUrl?: string; // Optional
}
```

**Process**:
1. Validate input (email format, password strength, unique username)
2. Hash password using bcrypt (10 salt rounds)
3. Generate verification token (32-byte random hex)
4. Create user in database
5. Send verification email
6. Generate JWT token
7. Set HTTP-only cookie
8. Return user data

**Response**:
```typescript
{
  user: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string;
  }
}
// + access_token cookie
```

**Password Hashing**:
```typescript
const passwordHash = await bcrypt.hash(password, 10);
// 10 = salt rounds (cost factor)
// Higher = more secure but slower
```

### Login

Authenticate existing user.

**POST** `/auth/login`

**Request Body**:
```typescript
{
  email: string;     // Email or username
  password: string;
}
```

**Process**:
1. Find user by email or username
2. Verify password using bcrypt.compare()
3. Update lastSeenAt timestamp
4. Generate JWT token
5. Set HTTP-only cookie
6. Return user data

**Password Verification**:
```typescript
const isValid = await bcrypt.compare(plainPassword, user.passwordHash);
// bcrypt automatically uses salt from hash
```

### Get Profile

Get current authenticated user's profile.

**GET** `/auth/profile`

**Authentication**: Required (JWT)

**Response**:
```typescript
{
  id: string;
  email: string;
  username: string;
  avatarUrl: string;
  isGuest: boolean;
  emailVerified: boolean;
}
```

### Logout

Clear authentication token.

**POST** `/auth/logout`

**Authentication**: Required (JWT)

**Process**:
1. Clear access_token cookie
2. Return success message

**Response**:
```typescript
{
  message: 'Logged out successfully'
}
```

## Email Verification

### Verification Flow

```
1. User registers → Verification token generated
2. Email sent with verification link
3. User clicks link → GET /auth/verify-email?token=xxx
4. Backend validates token → Updates user.emailVerified = true
5. User can now access verified-only features (future)
```

### Verify Email

**POST** `/auth/verify-email`

**Request Body**:
```typescript
{
  token: string;  // 32-byte hex token from email
}
```

**Process**:
1. Find user by verification token
2. Check token not expired (24 hours)
3. Update emailVerified = true
4. Clear verification token
5. Return success

**Token Expiration**:
- Tokens expire after 24 hours
- Expired tokens return error
- User can request new token (future feature)

### Email Template

Verification email uses MJML template:
```
Subject: Verify your WhoIsIt account

Hi {username},

Please verify your email by clicking the link below:

{frontendUrl}/auth/verify-email/{token}

This link expires in 24 hours.

Thanks,
The WhoIsIt Team
```

## Password Reset

### Reset Flow

```
1. User requests reset → POST /auth/forgot-password
2. Reset token generated and emailed
3. User clicks link → Opens reset form
4. User submits new password → POST /auth/reset-password
5. Password updated → User can login
```

### Request Password Reset

**POST** `/auth/forgot-password`

**Request Body**:
```typescript
{
  email: string;
}
```

**Process**:
1. Find user by email
2. Generate reset token (32-byte hex)
3. Set token expiration (1 hour)
4. Send reset email
5. Return success (even if user not found for security)

**Security Note**: Always return success to prevent email enumeration attacks.

### Reset Password

**POST** `/auth/reset-password`

**Request Body**:
```typescript
{
  token: string;      // From email link
  newPassword: string; // Minimum 8 characters
}
```

**Process**:
1. Find user by reset token
2. Check token not expired (1 hour)
3. Validate new password strength
4. Hash new password
5. Update passwordHash
6. Clear reset token
7. Return success

## Guards and Protection

### JwtAuthGuard

Protects routes requiring authentication.

**Usage**:
```typescript
@Controller('profile')
export class ProfileController {
  @UseGuards(JwtAuthGuard)
  @Get()
  getProfile(@Request() req) {
    return req.user;  // User from JWT
  }
}
```

**Process**:
1. Extract JWT from cookie
2. Verify signature
3. Check expiration
4. Attach user to request
5. Allow or deny access

### OptionalJwtAuthGuard

Allows both authenticated and unauthenticated access.

**Usage**:
```typescript
@Controller('games')
export class GameController {
  @UseGuards(OptionalJwtAuthGuard)
  @Post()
  createGame(@Request() req, @Body() dto: CreateGameDto) {
    const userId = req.user?.sub;  // May be undefined
    // Logic for both auth and guest users
  }
}
```

**When to Use**:
- Endpoints that support guest users
- Public data with optional personalization
- Game creation/joining

### LocalAuthGuard

Used for login endpoint to validate credentials.

**Usage**:
```typescript
@Controller('auth')
export class AuthController {
  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Request() req) {
    // req.user populated by LocalStrategy
    return this.authService.login(req.user);
  }
}
```

## Passport Strategies

### JWT Strategy

Validates JWT tokens from cookies.

**Implementation**:
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request) => {
          return request?.cookies?.access_token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
    };
  }
}
```

**Token Extraction**:
1. Check cookies for `access_token`
2. Extract and verify signature
3. Check expiration
4. Call `validate()` with payload
5. Attach returned object to `req.user`

### Local Strategy

Validates username/password for login.

**Implementation**:
```typescript
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',  // Can be email or username
      passwordField: 'password',
    });
  }

  async validate(emailOrUsername: string, password: string): Promise<User> {
    const user = await this.authService.validateUser(
      emailOrUsername,
      password
    );
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    return user;
  }
}
```

## WebSocket Authentication

### WsAuthAdapter

Custom Socket.IO adapter for JWT authentication.

**Implementation**:
```typescript
export class WsAuthAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);
    
    server.use(async (socket, next) => {
      try {
        // Extract token from cookie or handshake auth
        const token = 
          socket.handshake.auth.token ||
          socket.request.cookies?.access_token;
        
        if (token) {
          // Verify and decode token
          const payload = this.jwtService.verify(token, {
            secret: this.configService.get('JWT_SECRET'),
          });
          
          // Attach user to socket
          socket.user = {
            id: payload.sub,
            email: payload.email,
            username: payload.username,
          };
        }
        
        // Allow connection even without auth (guest users)
        next();
      } catch (error) {
        // Invalid token - allow as guest
        next();
      }
    });
    
    return server;
  }
}
```

**Key Points**:
- Token extracted from cookie OR handshake.auth
- Invalid/missing token doesn't prevent connection
- `socket.user` available in gateway handlers
- Guest users have `socket.user = undefined`

## Security Best Practices

### Password Security

**Hashing**:
- bcrypt with 10 salt rounds
- Automatic salt generation
- Slow hash function (intentional)
- Resistant to rainbow tables

**Password Requirements**:
- Minimum 8 characters
- Can enforce complexity (future)
- No maximum length (bcrypt handles)

**Best Practices**:
```typescript
// ✅ Good
const hash = await bcrypt.hash(password, 10);

// ❌ Bad - Don't use MD5/SHA1
const hash = crypto.createHash('md5').update(password).digest('hex');

// ❌ Bad - Don't store plaintext
user.password = password;
```

### Token Security

**JWT Secret**:
- Use cryptographically random string
- Minimum 32 characters
- Store in environment variable
- Never commit to source control
- Rotate periodically

**Generate Strong Secret**:
```bash
# Unix/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Cookie Security**:
```typescript
{
  httpOnly: true,     // ✅ Prevent XSS
  secure: true,       // ✅ HTTPS only
  sameSite: 'strict', // ✅ Prevent CSRF
  maxAge: 604800000,  // ✅ 7 days
}
```

### Email Security

**Verification Tokens**:
- 32-byte random hex (256 bits entropy)
- Single use
- Time-limited (24 hours)
- Cleared after use

**Reset Tokens**:
- 32-byte random hex
- Single use
- Time-limited (1 hour)
- Cleared after use

**Rate Limiting** (recommended):
- Limit verification email requests
- Limit password reset requests
- Prevent email enumeration

## Error Handling

### Authentication Errors

**401 Unauthorized**:
```typescript
{
  statusCode: 401,
  message: 'Unauthorized',
  error: 'Unauthorized'
}
```

**Scenarios**:
- Missing token
- Invalid token
- Expired token
- Invalid credentials

**Frontend Handling**:
```typescript
try {
  const response = await fetch('/api/protected', {
    credentials: 'include',
  });
  
  if (response.status === 401) {
    // Redirect to login
    router.push('/auth/login');
  }
} catch (error) {
  // Handle error
}
```

### Validation Errors

**400 Bad Request**:
```typescript
{
  statusCode: 400,
  message: [
    'email must be a valid email',
    'password must be at least 8 characters'
  ],
  error: 'Bad Request'
}
```

## Frontend Integration

### Auth Store (Zustand)

```typescript
interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });
      
      const data = await response.json();
      set({ user: data.user, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },
  
  logout: async () => {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    set({ user: null, isAuthenticated: false });
  },
}));
```

### Protected Routes (Middleware)

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token');
  
  if (isProtectedRoute(request.nextUrl.pathname)) {
    if (!token) {
      // Redirect to login
      return NextResponse.redirect(
        new URL('/auth/login', request.url)
      );
    }
  }
  
  return NextResponse.next();
}
```

## Testing

### Unit Tests

```typescript
describe('AuthService', () => {
  it('should hash password on registration', async () => {
    const password = 'password123';
    const result = await authService.register({
      email: 'test@example.com',
      username: 'testuser',
      password,
    });
    
    const user = await userRepository.findOne({
      where: { email: 'test@example.com' }
    });
    
    expect(user.passwordHash).not.toBe(password);
    expect(await bcrypt.compare(password, user.passwordHash)).toBe(true);
  });
});
```

### Integration Tests

```typescript
describe('POST /auth/login', () => {
  it('should return JWT token in cookie', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      })
      .expect(200);
    
    expect(response.headers['set-cookie']).toBeDefined();
    expect(response.headers['set-cookie'][0]).toContain('access_token');
  });
});
```

## Troubleshooting

### "Unauthorized" Errors

**Check**:
1. Cookie present in request?
2. Token expired?
3. JWT_SECRET matches?
4. Cookie domain/path correct?

**Debug**:
```typescript
// Decode JWT (without verification)
const decoded = jwt.decode(token);
console.log('Token payload:', decoded);
console.log('Expired?', decoded.exp < Date.now() / 1000);
```

### Cookies Not Sent

**CORS Configuration**:
```typescript
app.enableCors({
  origin: process.env.FRONTEND_ORIGIN,
  credentials: true,  // ✅ Required for cookies
});
```

**Frontend Fetch**:
```typescript
fetch(url, {
  credentials: 'include',  // ✅ Required
})
```

### Email Not Sent

**Check**:
1. SMTP credentials correct?
2. Email service configured?
3. Check backend logs
4. Test email service separately

**Fallback**:
```typescript
// Logs email to console if SMTP not configured
if (!emailConfigured) {
  console.log('Verification email:', {
    to: user.email,
    token: verificationToken,
  });
}
```

## Related Documentation

- [REST API Reference](../api/rest-api.md)
- [Database Schema](./database.md)
- [WebSocket Implementation](./websockets.md)
- [Frontend Auth](../frontend/README.md)

---

**Last Updated**: November 2024
