# Security Documentation

## Security Audit Report

Last Updated: 2025-11-10

This document outlines the security measures implemented in the WhoIsIt application and provides guidance for maintaining security.

## Overview

WhoIsIt is a multiplayer guessing game built with:
- **Frontend**: Next.js 15 with TypeScript
- **Backend**: NestJS 11 with TypeScript
- **Database**: PostgreSQL with TypeORM
- **Real-time**: Socket.IO for WebSocket communication

## Security Measures Implemented

### 1. Authentication & Authorization

#### JWT Token Management
- **HTTP-only cookies**: JWT tokens are stored in HTTP-only cookies to prevent XSS attacks
- **Secure flag**: Cookies are marked as secure in production (HTTPS only)
- **SameSite**: Set to 'lax' to prevent CSRF attacks
- **Token expiration**: 7-day expiration with automatic renewal
- **Secret key validation**: JWT_SECRET is required in production environment

#### Password Security
- **Bcrypt hashing**: Passwords are hashed using bcrypt with salt rounds of 10
- **No plaintext storage**: Passwords are never stored in plaintext
- **Password strength validation**: Enforced through DTOs with class-validator

### 2. Rate Limiting

Global and endpoint-specific rate limiting implemented using `@nestjs/throttler`:

- **Global limit**: 100 requests per 60 seconds per IP
- **Authentication endpoints**:
  - Login: 5 attempts per minute
  - Register: 3 attempts per minute
  - Password reset request: 3 attempts per minute
  - Resend verification: 3 attempts per minute

### 3. Security Headers

Implemented using Helmet middleware:
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **Strict-Transport-Security**: Forces HTTPS
- **X-XSS-Protection**: Enables browser XSS protection
- **Content-Security-Policy**: Controls resource loading

### 4. CORS Configuration

- **Restrictive origin**: CORS origin must be explicitly set via `FRONTEND_ORIGIN` environment variable
- **No wildcard in production**: Default is `false` instead of `true` (allow all)
- **Credentials enabled**: Allows cookies/auth headers to be sent

### 5. Input Validation

- **Global validation pipe**: Automatically validates all incoming requests
- **Whitelist mode**: Strips unknown properties from requests
- **Transform mode**: Automatically transforms payloads to DTO instances
- **Class-validator decorators**: Comprehensive validation rules on all DTOs

### 6. WebSocket Security

- **Authentication middleware**: Validates JWT tokens before allowing WebSocket connections
- **User context**: Attaches authenticated user to socket for authorization checks
- **Graceful degradation**: Allows unauthenticated connections but marks them as null user
- **CORS restrictions**: Same origin policy as REST API

### 7. Database Security

- **Parameterized queries**: TypeORM uses parameterized queries preventing SQL injection
- **No synchronize in production**: Schema synchronization is disabled, migrations only
- **Connection pooling**: Managed by TypeORM
- **Credentials via env**: Database credentials are never hardcoded

### 8. Token Security

Email verification and password reset tokens:
- **Cryptographically random**: Generated using `crypto.randomBytes(32)`
- **Time-limited expiration**:
  - Email verification: 24 hours
  - Password reset: 1 hour
- **Single-use**: Tokens are cleared after use

### 9. Dependency Security

Regular security audits of dependencies:
- **Automated scanning**: Using `pnpm audit`
- **Critical vulnerabilities**: Must be addressed immediately
- **Update policy**: Dependencies updated regularly

## Environment Variables

### Required for Production

```bash
# JWT Secret - MUST be set in production
JWT_SECRET=<strong-random-secret-key-here>

# Database credentials
DB_HOST=<database-host>
DB_PORT=5432
DB_USER=<database-user>
DB_PASSWORD=<strong-password>
DB_NAME=whois_it

# Frontend origin for CORS
FRONTEND_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# API URLs
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

### Optional (Email)

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@whoisit.com
```

## Security Best Practices

### For Developers

1. **Never commit secrets**: Use `.env` files (gitignored) for sensitive data
2. **Validate all inputs**: Use DTOs with class-validator decorators
3. **Sanitize outputs**: Prevent XSS by escaping user-generated content
4. **Follow principle of least privilege**: Users should only access their own resources
5. **Log security events**: Authentication failures, token validation errors, etc.
6. **Review dependencies**: Run `pnpm audit` before deployment
7. **Use HTTPS in production**: Never transmit credentials over HTTP

### For Deployment

1. **Set strong JWT_SECRET**: Use at least 32 random characters
2. **Enable HTTPS**: Use TLS certificates (Let's Encrypt)
3. **Set FRONTEND_ORIGIN**: Never use `true` in production
4. **Use strong database passwords**: Random, long, and complex
5. **Enable firewall**: Restrict database access to application servers only
6. **Regular backups**: Automated database backups with encryption
7. **Monitor logs**: Set up alerting for suspicious activities
8. **Keep dependencies updated**: Regular security patches

### For Users

1. **Strong passwords**: Enforce minimum 8 characters with complexity
2. **Email verification**: Users must verify their email addresses
3. **Password reset flow**: Secure token-based reset with expiration
4. **Session management**: Users can logout to invalidate tokens

## Known Limitations

1. **Session invalidation**: JWT tokens cannot be invalidated before expiration (consider implementing token blacklist for critical applications)
2. **Brute force protection**: Rate limiting provides basic protection but may need enhancement for high-traffic scenarios
3. **Two-factor authentication**: Not currently implemented
4. **IP-based blocking**: Not implemented (rate limiting is per-IP but doesn't block)

## Vulnerability Disclosure

If you discover a security vulnerability, please email: [security@example.com]

**Please do not create public GitHub issues for security vulnerabilities.**

## Compliance

This application follows:
- OWASP Top 10 security guidelines
- JWT best practices (RFC 7519)
- Password hashing best practices (bcrypt)

## Security Audit History

| Date | Auditor | Findings | Status |
|------|---------|----------|--------|
| 2025-11-10 | Copilot AI | Initial security audit | Complete |

### Vulnerabilities Identified and Fixed

1. ✅ **CRITICAL**: `.env` file tracked in git - Removed from version control
2. ✅ **HIGH**: Next.js SSRF vulnerability - Updated to 15.4.7
3. ✅ **HIGH**: Next.js content injection - Updated to 15.4.7
4. ✅ **HIGH**: Weak CORS policy - Changed default from `true` to `false`
5. ✅ **MEDIUM**: Missing rate limiting - Implemented globally and per-endpoint
6. ✅ **MEDIUM**: Missing security headers - Added Helmet middleware
7. ✅ **MEDIUM**: Weak JWT secret fallback - Enforced requirement in production
8. ⚠️ **MEDIUM**: html-minifier REDoS in mjml dependency - Awaiting upstream fix
9. ⚠️ **LOW**: validator.js URL bypass - Indirect dependency, low impact

## Regular Security Maintenance

### Weekly
- Review authentication logs for unusual patterns
- Check for failed login attempts

### Monthly
- Run `pnpm audit` and review vulnerabilities
- Update dependencies with security patches
- Review and rotate API keys if applicable

### Quarterly
- Full security audit
- Review and update security policies
- Penetration testing (recommended)
- Review access controls and permissions

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security Best Practices](https://docs.nestjs.com/security/helmet)
- [Next.js Security Headers](https://nextjs.org/docs/advanced-features/security-headers)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
