# Email Module

This module handles email sending functionality for the WhoIsIt backend, including email verification and password reset emails.

## Overview

The email module provides:

- Email verification emails for new registrations
- Password reset emails
- MJML template compilation for responsive emails
- Nodemailer integration for SMTP delivery
- Development mode with email logging

## Architecture

### Module Structure

- `email.service.ts` - Core email sending service
- `email.module.ts` - Module configuration
- `templates/` - MJML email templates
  - `verify-email.mjml` - Email verification template
  - `reset-password.mjml` - Password reset template

## Features

### Email Templates

Templates are written in MJML (Mailjet Markup Language) which compiles to responsive HTML:

- Consistent branding across all emails
- Mobile-responsive design
- Variable substitution support
- Automatic HTML compilation

### Email Types

#### Verification Email

Sent when a user registers:

- Contains username greeting
- Includes verification link with token
- Link expires in 24 hours
- Both HTML and plain text versions

#### Password Reset Email

Sent when user requests password reset:

- Contains username greeting
- Includes reset link with token
- Link expires in 1 hour
- Both HTML and plain text versions

### Development Mode

When email credentials are not configured:

- Emails are not sent via SMTP
- Email content and links are logged to console
- Allows development without email server
- Useful for testing flows locally

### Production Mode

When properly configured:

- Sends real emails via SMTP
- Supports TLS/SSL
- Configurable SMTP server
- Error handling and logging

## Configuration

### Required Environment Variables

For production email sending:

- `EMAIL_HOST` - SMTP server hostname (e.g., smtp.gmail.com)
- `EMAIL_PORT` - SMTP port (587 for TLS, 465 for SSL)
- `EMAIL_USER` - SMTP username/email
- `EMAIL_PASSWORD` - SMTP password/app password
- `EMAIL_FROM` - Sender email address (default: noreply@whoisit.com)
- `FRONTEND_URL` - Frontend URL for link generation (default: http://localhost:3000)

### Development Setup

For local development, you can:

1. Leave email vars unconfigured (emails logged to console)
2. Use a test email service like Ethereal Email
3. Use Gmail with app-specific password

### Gmail Setup Example

1. Enable 2-factor authentication on Gmail
2. Generate app-specific password
3. Configure environment:

```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
FRONTEND_URL=http://localhost:3000
```

## Usage

### Sending Verification Email

```typescript
await emailService.sendVerificationEmail(
  'user@example.com',
  'username',
  'verification-token-here'
);
```

### Sending Password Reset Email

```typescript
await emailService.sendPasswordResetEmail(
  'user@example.com',
  'username',
  'reset-token-here'
);
```

## Template Variables

### verify-email.mjml

- `{{username}}` - User's username
- `{{verificationLink}}` - Full verification URL

### reset-password.mjml

- `{{username}}` - User's username
- `{{resetLink}}` - Full password reset URL

## Dependencies

- `nodemailer` - SMTP email sending
- `mjml` - Email template compilation
- `@nestjs/config` - Configuration management

## Error Handling

The email service handles errors gracefully:

- Logs MJML compilation warnings
- Catches and logs SMTP errors
- Throws errors for template reading failures
- Continues operation in dev mode without SMTP

## Testing

Run email module tests:

```bash
# Unit tests
pnpm test:backend -- email
```

Tests verify:
- Template compilation
- Variable substitution
- Email content generation
- Dev mode behavior
- SMTP configuration

## Security Considerations

- Email credentials stored in environment variables
- Never log email passwords
- Use app-specific passwords for Gmail
- TLS/SSL encryption for email transmission
- Tokens are one-time use only
- Links expire after set time periods
- Plain text fallback included

## MJML Best Practices

- Keep templates simple and focused
- Test on multiple email clients
- Use inline styles (automatically handled by MJML)
- Include alt text for images
- Provide plain text version as fallback
- Keep email width under 600px
- Test on mobile devices

## Monitoring

In production, monitor:

- Email delivery success rate
- SMTP connection errors
- Template compilation errors
- Bounce rates
- Link click-through rates

## Troubleshooting

### Emails not sending in development

Check that environment variables are set correctly. If intentionally developing without email, check console logs for verification links.

### Gmail authentication errors

- Ensure 2FA is enabled
- Use app-specific password, not account password
- Check "less secure app access" settings

### Template compilation errors

- Verify MJML syntax is correct
- Check template file paths
- Ensure templates directory is included in build

### SMTP connection timeout

- Verify firewall allows SMTP ports
- Check SMTP server hostname
- Confirm credentials are correct
- Try different port (587 vs 465)

## Future Enhancements

Potential improvements:

- HTML email preview in development
- Email queuing system
- Retry logic for failed sends
- Email analytics/tracking
- More template types (game invites, results)
- Internationalization support
- Custom branding per environment
- Email template testing tools
