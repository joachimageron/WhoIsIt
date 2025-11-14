import { useEffect } from "react";

import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";

/**
 * Hook to check and restore authentication state on app initialization
 */
export const useAuth = () => {
  const { user, setUser, setLoading, isLoading, isAuthenticated, isGuest } =
    useAuthStore();

  useEffect(() => {
    // Only check profile if we don't already have a user
    if (!user) {
      const checkAuth = async () => {
        setLoading(true);
        try {
          const profile = await authApi.getProfile();

          setUser(profile);
        } catch {
          // User is not authenticated - that's okay, they can create a guest session if needed
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }
  }, [user, setUser, setLoading]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Call API logout to clear server-side cookies
      await authApi.logout();
      useAuthStore.getState().logout();
    } catch {
      // Silently fail - user will remain logged in on the frontend
      // This is acceptable as the server-side cookie is still cleared
    } finally {
      setLoading(false);
    }
  };

  const createGuestSession = async (username?: string) => {
    setLoading(true);
    try {
      const guestUser = await authApi.createGuest(
        username ? { username } : undefined,
      );

      setUser(guestUser);

      return guestUser;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    isAuthenticated,
    isGuest,
    isLoading,
    logout: handleLogout,
    createGuestSession,
  };
};
