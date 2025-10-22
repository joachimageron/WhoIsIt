/**
 * JWT Payload structure used throughout the application
 * for authentication and authorization
 */
export interface JwtPayload {
  /** User ID (subject) */
  sub: string;
  /** User email */
  email: string | null;
  /** Username */
  username: string;
}
