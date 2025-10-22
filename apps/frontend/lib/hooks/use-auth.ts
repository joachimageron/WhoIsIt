import { useEffect } from "react";

import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";

/**
 * Hook to check and restore authentication state on app initialization
 */
export const useAuth = () => {
  const {
    user,
    setUser,
    setLoading,
    isLoading,
    isAuthenticated,
    isGuest,
    initializeAuth,
  } = useAuthStore();

  useEffect(() => {
    // Only check profile if we don't already have a user
    if (!user) {
      const checkAuth = async () => {
        setLoading(true);
        try {
          const profile = await authApi.getProfile();

          setUser(profile);
        } catch {
          // User is not authenticated with JWT, check for guest session
          initializeAuth();
        } finally {
          setLoading(false);
        }
      };

      checkAuth();
    }
  }, [user, setUser, setLoading, initializeAuth]);

  const handleLogout = async () => {
    setLoading(true);
    try {
      // Only call API logout if user is authenticated (not guest)
      if (isAuthenticated) {
        await authApi.logout();
      }
      useAuthStore.getState().logout();
    } catch {
      // Silently fail - user will remain logged in on the frontend
      // This is acceptable as the server-side cookie is still cleared
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
  };
};
