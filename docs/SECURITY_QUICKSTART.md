# Security Quick Reference Guide

## 🚀 Quick Start - Secure Deployment

### Before Deploying to Production

1. **Generate a strong JWT secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

2. **Set required environment variables**:
```bash
# Backend (.env)
JWT_SECRET=<your-generated-secret>
DB_PASSWORD=<strong-password>
FRONTEND_ORIGIN=https://yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Frontend (.env)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com
```

3. **Verify security settings**:
```bash
# Check no .env files are tracked
git ls-files | grep "\.env$"
# Should return nothing (except .env.example files)

# Run security audit
pnpm audit --prod

# Run tests
pnpm test
```

---

## 🛡️ Security Features Enabled

### Authentication
- ✅ JWT tokens in HTTP-only cookies
- ✅ Bcrypt password hashing (10 rounds)
- ✅ Secure cookie flags in production
- ✅ Token expiration (7 days)

### Rate Limiting
- ✅ Global: 100 requests/60s per IP
- ✅ Login: 5 attempts/minute
- ✅ Register: 3 attempts/minute
- ✅ Password reset: 3 attempts/minute

### Security Headers (via Helmet)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ Strict-Transport-Security
- ✅ X-XSS-Protection

### Input Validation
- ✅ Global validation pipe
- ✅ Whitelist mode (strips unknown properties)
- ✅ Transform mode (type safety)

### CORS
- ✅ Restrictive by default (false)
- ✅ Requires explicit origin setting
- ✅ Credentials enabled for cookies

---

## 🔒 Critical Security Checklist

### Development
- [ ] Never commit `.env` files
- [ ] Use `.env.example` for documentation only
- [ ] Run `pnpm audit` before commits
- [ ] Test with realistic data, not production data
- [ ] Keep dependencies updated

### Production
- [ ] Set strong `JWT_SECRET` (32+ random characters)
- [ ] Set `NODE_ENV=production`
- [ ] Set specific `FRONTEND_ORIGIN` (no wildcards)
- [ ] Use HTTPS/TLS certificates
- [ ] Use strong database passwords
- [ ] Enable database firewall rules
- [ ] Set up automated backups
- [ ] Monitor authentication logs
- [ ] Set up error alerting

### Post-Deployment
- [ ] Verify HTTPS is working
- [ ] Test rate limiting is active
- [ ] Check security headers are present
- [ ] Monitor for failed login attempts
- [ ] Review logs weekly
- [ ] Update dependencies monthly

---

## 📊 Security Monitoring

### What to Monitor
1. **Failed login attempts** - Possible brute force attacks
2. **Rate limit hits** - Possible DoS attempts
3. **JWT validation failures** - Possible token tampering
4. **Unusual traffic patterns** - Possible reconnaissance
5. **Database connection errors** - Possible SQL injection attempts

### Log Locations
- Backend: Check NestJS application logs
- Frontend: Check Next.js build and runtime logs
- Database: PostgreSQL logs (if enabled)

### Alert Thresholds (Recommended)
- Failed logins: > 10 in 5 minutes from same IP
- Rate limit hits: > 50 in 1 minute
- JWT failures: > 5 in 1 minute from same IP

---

## 🚨 Security Incident Response

### If You Discover a Vulnerability

1. **Do NOT create a public GitHub issue**
2. Contact: security@yourdomain.com (update this)
3. Provide:
   - Detailed description
   - Steps to reproduce
   - Potential impact assessment
   - Any proof of concept (if safe)

### If You Suspect a Breach

1. **Immediate Actions**:
   - Rotate JWT_SECRET immediately
   - Force all users to re-login
   - Review recent logs for suspicious activity
   - Check database for unauthorized changes

2. **Investigation**:
   - Identify entry point
   - Assess data exposure
   - Document timeline
   - Preserve logs for analysis

3. **Recovery**:
   - Patch the vulnerability
   - Deploy security fix
   - Monitor for 48 hours
   - Notify affected users if required

---

## 🔧 Quick Fixes for Common Issues

### "CORS error in browser"
- Check `FRONTEND_ORIGIN` is set correctly
- Verify protocol matches (http vs https)
- Check port number is included if non-standard

### "JWT_SECRET must be set in production"
- Set `JWT_SECRET` environment variable
- Use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- Add to `.env` file (never commit this file)

### "Rate limit exceeded"
- Wait 60 seconds and try again
- Check if automation is hitting endpoints too fast
- Consider increasing limits if legitimate use case

### "Too many password reset requests"
- Rate limited to 3 per minute
- Wait and try again
- Check email spam folder for previous emails

---

## 📚 Additional Resources

- [Full Security Documentation](./SECURITY.md)
- [Security Audit Summary](./SECURITY_AUDIT_SUMMARY.md)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security/helmet)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

---

## 🆘 Getting Help

### For Security Issues
- Email: security@yourdomain.com (update this)
- Response time: Within 24 hours for critical issues

### For Development Questions
- Check [SECURITY.md](./SECURITY.md) first
- GitHub Issues (for non-security questions)
- Development team contact

---

**Last Updated**: November 10, 2025  
**Version**: 1.0  
**Maintained By**: Development Team
