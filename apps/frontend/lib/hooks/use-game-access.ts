"use client";

import { useAuth } from "./use-auth";

import { useAuthStore } from "@/store/auth-store";

/**
 * Hook to manage game access for both authenticated and guest users
 */
export const useGameAccess = () => {
  const { user, isAuthenticated, isGuest, isLoading } = useAuth();
  const { setGuestUser } = useAuthStore();

  /**
   * Check if the current user can access game features
   */
  const canAccessGame = (): boolean => {
    return isAuthenticated || isGuest;
  };

  /**
   * Ensure user has access (either authenticated or as guest)
   * Creates a guest session if needed
   */
  const ensureGameAccess = (guestUsername?: string): boolean => {
    if (canAccessGame()) {
      return true;
    }

    // Create guest session if username provided
    if (guestUsername) {
      setGuestUser(guestUsername);

      return true;
    }

    return false;
  };

  /**
   * Get the username to use for game operations
   */
  const getGameUsername = (): string | null => {
    return user?.username || null;
  };

  /**
   * Get the user ID to use for game operations
   */
  const getGameUserId = (): string | null => {
    // Only return user ID if authenticated (not guest)
    return isAuthenticated ? user?.id || null : null;
  };

  return {
    canAccessGame: canAccessGame(),
    ensureGameAccess,
    getGameUsername,
    getGameUserId,
    isLoading,
    requiresGuestSetup: !isAuthenticated && !isGuest,
  };
};
