import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import {
  getGuestSession,
  clearGuestSession,
  createGuestSession,
  type GuestSession,
} from "@/lib/guest-session";

export type User = {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  isGuest?: boolean;
  emailVerified?: boolean;
};

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isGuest: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setGuestUser: (username: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
  reset: () => void;
  initializeAuth: () => void;
};

/**
 * Convert a guest session to a User object
 */
const guestSessionToUser = (session: GuestSession): User => ({
  id: session.id,
  email: "",
  username: session.username,
  avatarUrl: null,
  isGuest: true,
});

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      error: null,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user && !user.isGuest,
          isGuest: !!user?.isGuest,
          error: null,
        }),
      setGuestUser: (username) => {
        const session = createGuestSession(username);
        const guestUser = guestSessionToUser(session);

        set({
          user: guestUser,
          isAuthenticated: false,
          isGuest: true,
          error: null,
        });
      },
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      logout: () => {
        clearGuestSession();
        set({
          user: null,
          isAuthenticated: false,
          isGuest: false,
          error: null,
        });
      },
      reset: () => {
        clearGuestSession();
        set({
          user: null,
          isAuthenticated: false,
          isGuest: false,
          isLoading: false,
          error: null,
        });
      },
      initializeAuth: () => {
        // Check for existing guest session on initialization
        const guestSession = getGuestSession();

        if (guestSession) {
          const guestUser = guestSessionToUser(guestSession);

          set({
            user: guestUser,
            isAuthenticated: false,
            isGuest: true,
          });
        }
      },
    }),
    {
      name: "whoisit-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        isGuest: state.isGuest,
        // Don't persist loading and error states
      }),
    },
  ),
);
