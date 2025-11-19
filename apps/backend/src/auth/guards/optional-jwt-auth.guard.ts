import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Optional JWT Authentication Guard
 * Unlike JwtAuthGuard, this guard allows requests through even if JWT is missing/invalid
 * But if a valid JWT is present, it populates req.user
 * This is useful for endpoints that support both authenticated and guest users
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to not throw on missing/invalid JWT
  handleRequest<TUser = any>(err: any, user: any): TUser {
    // If there's an error or no user, just return null instead of throwing
    // This allows the request to continue without authentication
    if (err || !user) {
      return null as TUser;
    }
    return user as TUser;
  }
}
