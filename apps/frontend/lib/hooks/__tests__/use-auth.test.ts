import { renderHook, waitFor } from "@testing-library/react";

import { useAuth } from "../use-auth";

import { useAuthStore } from "@/store/auth-store";
import * as authApi from "@/lib/auth-api";

// Mock the auth API
jest.mock("@/lib/auth-api");
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

// Mock guest-session module (used by auth-store)
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

describe("useAuth", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset store
    useAuthStore.getState().reset();
  });

  describe("initialization", () => {
    it("checks authentication on mount when no user exists", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      mockAuthApi.getProfile.mockResolvedValueOnce(mockUser);

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAuthApi.getProfile).toHaveBeenCalledTimes(1);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("initializes guest session when profile check fails", async () => {
      mockAuthApi.getProfile.mockRejectedValueOnce(
        new Error("Not authenticated"),
      );

      const { result } = renderHook(() => useAuth());

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAuthApi.getProfile).toHaveBeenCalledTimes(1);
      // Guest session initialization would be called via initializeAuth
      expect(result.current.user).toBeNull();
    });

    it("does not check auth when user already exists", async () => {
      // Set user in store first
      const existingUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      useAuthStore.getState().setUser(existingUser);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(existingUser);
      expect(mockAuthApi.getProfile).not.toHaveBeenCalled();
    });

    it("sets loading state during authentication check", async () => {
      mockAuthApi.getProfile.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  id: "user-1",
                  email: "test@example.com",
                  username: "testuser",
                  avatarUrl: null,
                }),
              100,
            ),
          ),
      );

      const { result } = renderHook(() => useAuth());

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("logout", () => {
    it("calls API logout for authenticated users", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      useAuthStore.getState().setUser(mockUser);
      mockAuthApi.logout.mockResolvedValueOnce(undefined);

      const { result } = renderHook(() => useAuth());

      await result.current.logout();

      expect(mockAuthApi.logout).toHaveBeenCalledTimes(1);
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("calls API logout for guest users to clear guest_token cookie", async () => {
      const guestUser = {
        id: "guest-1",
        email: "",
        username: "guestuser",
        avatarUrl: null,
        isGuest: true,
      };

      useAuthStore.getState().setUser(guestUser);

      const { result } = renderHook(() => useAuth());

      await result.current.logout();

      expect(mockAuthApi.logout).toHaveBeenCalledTimes(1);
      expect(result.current.user).toBeNull();
      expect(result.current.isGuest).toBe(false);
    });

    it("does not clear user state if API logout fails", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      useAuthStore.getState().setUser(mockUser);
      mockAuthApi.logout.mockRejectedValueOnce(new Error("Logout failed"));

      const { result } = renderHook(() => useAuth());

      await result.current.logout();

      expect(mockAuthApi.logout).toHaveBeenCalledTimes(1);

      // User remains logged in when API fails (by design)
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });
    });

    it("sets loading state during logout", async () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      useAuthStore.getState().setUser(mockUser);
      mockAuthApi.logout.mockImplementation(
        () =>
          new Promise((resolve) => setTimeout(() => resolve(), 50)),
      );

      const { result } = renderHook(() => useAuth());

      // Start logout but don't await it yet
      const logoutPromise = result.current.logout();

      // Wait for loading to become true
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

      await logoutPromise;

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe("return values", () => {
    it("returns user when authenticated", () => {
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      useAuthStore.getState().setUser(mockUser);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isGuest).toBe(false);
    });

    it("returns guest status when user is guest", () => {
      const guestUser = {
        id: "guest-1",
        email: "",
        username: "guestuser",
        avatarUrl: null,
        isGuest: true,
      };

      useAuthStore.getState().setUser(guestUser);

      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toEqual(guestUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isGuest).toBe(true);
    });

    it("returns null user when not logged in", () => {
      const { result } = renderHook(() => useAuth());

      // Note: this will trigger auth check, so we need to mock it
      mockAuthApi.getProfile.mockRejectedValueOnce(
        new Error("Not authenticated"),
      );

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(false);
    });

    it("provides logout function", () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.logout).toBe("function");
    });
  });
});
