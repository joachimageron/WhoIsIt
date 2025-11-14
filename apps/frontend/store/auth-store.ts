import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

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
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  logout: () => void;
  reset: () => void;
};

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
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          isGuest: false,
          error: null,
        });
      },
      reset: () => {
        set({
          user: null,
          isAuthenticated: false,
          isGuest: false,
          isLoading: false,
          error: null,
        });
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
