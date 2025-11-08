# Environment Variables Setup Guide

This document explains how to properly configure environment variables for both the frontend and backend of the WhoIsIt application.

## Frontend Environment Variables

The frontend uses Next.js, which requires environment variables to be prefixed with `NEXT_PUBLIC_` to be accessible in the browser.

### Configuration File

Create a `.env` or `.env.local` file in the `apps/frontend` directory:

```env
# Backend API URL - Change this to match your backend server URL
NEXT_PUBLIC_API_URL=http://localhost:4000

# Socket.IO server URL - Change this to match your Socket.IO server URL
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

### Environment Variables Explained

- **`NEXT_PUBLIC_API_URL`**: The base URL for the REST API backend server. Used by `lib/auth-api.ts` for all authentication and API calls.
- **`NEXT_PUBLIC_SOCKET_URL`**: The URL for the Socket.IO WebSocket server. Used by `lib/socket.ts` for real-time game updates.

### Important Notes

1. **NEXT_PUBLIC_ Prefix**: Environment variables that need to be accessed in browser-side code must be prefixed with `NEXT_PUBLIC_`. This is a Next.js requirement.

2. **Build Time**: These variables are embedded in the build at build time. If you change them, you need to rebuild the frontend:
   ```bash
   pnpm run build
   ```

3. **Default Values**: If not set, the application defaults to `http://localhost:4000` for both API and Socket URLs.

## Backend Environment Variables

The backend uses NestJS with standard environment variables (no special prefix needed).

### Configuration File

Create a `.env` file in the `apps/backend` directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=whois_it
DB_SYNC=true

# Email Configuration (optional - if not set, emails will be logged to console)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@whoisit.com

# Frontend URL for email links
FRONTEND_URL=http://localhost:3000

# JWT Secret
JWT_SECRET=your-secret-key

# Application Port (optional, defaults to 4000)
PORT=4000
```

### Environment Variables Explained

- **Database (DB_*)**: PostgreSQL connection settings
  - `DB_SYNC=false` uses migrations system for production
- **Email (EMAIL_*)**: SMTP configuration for sending emails (optional for development)
- **`FRONTEND_URL`**: Used in email templates for links back to the frontend
- **`JWT_SECRET`**: Secret key for signing JWT tokens (change this in production!)
- **`PORT`**: The port the backend server will listen on

**Important**: When `DB_SYNC=false`, the application will automatically run pending migrations on startup. See [backend migrations documentation](../apps/backend/README-MIGRATIONS.md) for more details.

### Important Notes

1. **DB_SYNC**: 
   - Set to `true` in development for automatic schema synchronization
   - Set to `false` in production to use migrations system
   - When `false`, migrations run automatically on app startup
2. **JWT_SECRET**: Use a strong, random secret in production
3. **Email Configuration**: Optional for development; emails will be logged to console if not configured
4. **Migrations**: See [backend migrations documentation](../apps/backend/README-MIGRATIONS.md) for detailed migration workflow

## CORS Configuration

The backend is configured to accept requests from the frontend domain with credentials enabled. Make sure:

1. The frontend `NEXT_PUBLIC_API_URL` matches the backend URL
2. The backend CORS configuration allows the frontend origin
3. API calls use `credentials: 'include'` to send cookies

## Common Issues

### "Failed to fetch" errors
- Ensure backend server is running
- Check `NEXT_PUBLIC_API_URL` environment variable
- Verify CORS configuration on backend

### Cookies not being set
- Check browser console for cookie errors
- Ensure `credentials: 'include'` is used in all fetch calls
- Verify backend is setting cookies correctly

### Environment variables not working
- Remember to rebuild the frontend after changing `NEXT_PUBLIC_*` variables
- Backend variables are read at runtime, so restart the server after changes
- Check that `.env` files are not committed to git (they should be in `.gitignore`)

## Development vs Production

### Development
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000

# Backend
DB_SYNC=true
FRONTEND_URL=http://localhost:3000
```

### Production
```env
# Frontend
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SOCKET_URL=https://api.yourdomain.com

# Backend
DB_SYNC=false  # IMPORTANT: Use migrations in production
FRONTEND_URL=https://yourdomain.com
JWT_SECRET=strong-random-secret-here
```

## Quick Start

1. Copy the example files:
   ```bash
   cp apps/frontend/.env.example apps/frontend/.env
   cp apps/backend/.env.example apps/backend/.env
   ```

2. Update the values as needed for your environment

3. Start the development servers:
   ```bash
   pnpm dev
   ```

The default values are already configured for local development, so you can start immediately if you have PostgreSQL running locally.
