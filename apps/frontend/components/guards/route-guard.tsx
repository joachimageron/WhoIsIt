"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/hooks/use-auth";

type RouteGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
  allowGuest?: boolean;
  redirectTo?: string;
};

/**
 * Route guard component to protect pages based on authentication status
 *
 * @param requireAuth - If true, requires user to be authenticated (not guest)
 * @param allowGuest - If true, allows guest users to access the route
 * @param redirectTo - Custom redirect path if access is denied
 */
export function RouteGuard({
  children,
  requireAuth = false,
  allowGuest = true,
  redirectTo,
}: RouteGuardProps) {
  const { user, isAuthenticated, isGuest, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    // Check authorization based on requirements
    const checkAuth = () => {
      // If require auth and user is not authenticated, deny access
      if (requireAuth && !isAuthenticated) {
        const redirect = redirectTo || "/auth/login";
        const currentPath = window.location.pathname;
        const redirectUrl = `${redirect}?returnUrl=${encodeURIComponent(currentPath)}`;

        router.push(redirectUrl);

        return false;
      }

      // If guest is not allowed and user is guest, deny access
      if (!allowGuest && isGuest) {
        const redirect = redirectTo || "/auth/login";
        const currentPath = window.location.pathname;
        const redirectUrl = `${redirect}?returnUrl=${encodeURIComponent(currentPath)}`;

        router.push(redirectUrl);

        return false;
      }

      // User is authorized if they have any user (authenticated or guest when allowed)
      // or if no authentication is required
      return !!user || !requireAuth;
    };

    const authorized = checkAuth();

    setIsAuthorized(authorized);
  }, [
    user,
    isAuthenticated,
    isGuest,
    isLoading,
    requireAuth,
    allowGuest,
    redirectTo,
    router,
  ]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show nothing if not authorized (will redirect)
  if (!isAuthorized) {
    return null;
  }

  // Render children if authorized
  return <>{children}</>;
}
