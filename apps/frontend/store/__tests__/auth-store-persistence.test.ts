import { renderHook, act } from "@testing-library/react";

import { useAuthStore, type User } from "../auth-store";

// Mock guest-session module
jest.mock("@/lib/guest-session", () => ({
  getGuestSession: jest.fn(),
  clearGuestSession: jest.fn(),
  createGuestSession: jest.fn((username: string) => ({
    id: "guest-123",
    username,
    createdAt: Date.now(),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  })),
}));

describe("useAuthStore - Persistence", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Reset store using the reset action
    act(() => {
      useAuthStore.getState().reset();
    });
    // Clear localStorage after each test
    localStorage.clear();
  });

  describe("localStorage persistence", () => {
    it("persists user data to localStorage", () => {
      const { result } = renderHook(() => useAuthStore());

      const user: User = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
        isGuest: false,
      };

      act(() => {
        result.current.setUser(user);
      });

      // Check that data is in localStorage
      const stored = localStorage.getItem("whoisit-auth-storage");

      expect(stored).toBeTruthy();

      if (stored) {
        const parsed = JSON.parse(stored);

        expect(parsed.state.user).toEqual(user);
        expect(parsed.state.isAuthenticated).toBe(true);
        expect(parsed.state.isGuest).toBe(false);
      }
    });

    it("does not persist loading and error states", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
        result.current.setError("Some error");
      });

      const stored = localStorage.getItem("whoisit-auth-storage");

      if (stored) {
        const parsed = JSON.parse(stored);

        // Loading and error should not be in persisted state
        expect(parsed.state.isLoading).toBeUndefined();
        expect(parsed.state.error).toBeUndefined();
      }
    });

    it("restores user from localStorage on mount", async () => {
      const user: User = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
        isGuest: false,
      };

      // Manually set localStorage as if user was previously logged in
      localStorage.setItem(
        "whoisit-auth-storage",
        JSON.stringify({
          state: {
            user,
            isAuthenticated: true,
            isGuest: false,
          },
          version: 0,
        }),
      );

      // Force rehydration by calling persist.rehydrate()
      // @ts-expect-error - accessing internal persist API for testing
      if (useAuthStore.persist?.rehydrate) {
        // @ts-expect-error
        await useAuthStore.persist.rehydrate();
      }

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toEqual(user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isGuest).toBe(false);
    });

    it("clears localStorage on logout", () => {
      const { result } = renderHook(() => useAuthStore());

      const user: User = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      act(() => {
        result.current.setUser(user);
      });

      // Verify data is stored
      expect(localStorage.getItem("whoisit-auth-storage")).toBeTruthy();

      act(() => {
        result.current.logout();
      });

      // After logout, localStorage should be updated with null user
      const stored = localStorage.getItem("whoisit-auth-storage");

      if (stored) {
        const parsed = JSON.parse(stored);

        expect(parsed.state.user).toBeNull();
        expect(parsed.state.isAuthenticated).toBe(false);
        expect(parsed.state.isGuest).toBe(false);
      }
    });

    it("persists guest user data", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setGuestUser("GuestPlayer");
      });

      const stored = localStorage.getItem("whoisit-auth-storage");

      expect(stored).toBeTruthy();

      if (stored) {
        const parsed = JSON.parse(stored);

        expect(parsed.state.user).not.toBeNull();
        expect(parsed.state.user?.username).toBe("GuestPlayer");
        expect(parsed.state.user?.isGuest).toBe(true);
        expect(parsed.state.isAuthenticated).toBe(false);
        expect(parsed.state.isGuest).toBe(true);
      }
    });

    it("handles corrupted localStorage data gracefully", () => {
      // Set corrupted data in localStorage
      localStorage.setItem("whoisit-auth-storage", "corrupted-json-data");

      // Should not crash and should use default state
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(false);
    });
  });
});
