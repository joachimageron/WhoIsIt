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

const mockGuestSession = require("@/lib/guest-session");

describe("useAuthStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.reset();
    });

    jest.clearAllMocks();
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("setUser", () => {
    it("sets authenticated user correctly", () => {
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

      expect(result.current.user).toEqual(user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isGuest).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("sets guest user correctly", () => {
      const { result } = renderHook(() => useAuthStore());

      const guestUser: User = {
        id: "guest-1",
        email: "",
        username: "guestuser",
        avatarUrl: null,
        isGuest: true,
      };

      act(() => {
        result.current.setUser(guestUser);
      });

      expect(result.current.user).toEqual(guestUser);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it("clears user when null is passed", () => {
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

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.setUser(null);
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(false);
    });

    it("clears error when setting user", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError("Some error");
      });

      expect(result.current.error).toBe("Some error");

      const user: User = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      act(() => {
        result.current.setUser(user);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("setGuestUser", () => {
    it("creates and sets guest user", () => {
      const { result } = renderHook(() => useAuthStore());

      const username = "GuestPlayer";

      act(() => {
        result.current.setGuestUser(username);
      });

      expect(mockGuestSession.createGuestSession).toHaveBeenCalledWith(
        username,
      );
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.username).toBe(username);
      expect(result.current.user?.isGuest).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(true);
    });

    it("clears error when setting guest user", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError("Some error");
      });

      expect(result.current.error).toBe("Some error");

      act(() => {
        result.current.setGuestUser("GuestPlayer");
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("setLoading", () => {
    it("sets loading state", () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("sets error message", () => {
      const { result } = renderHook(() => useAuthStore());

      const errorMessage = "Authentication failed";

      act(() => {
        result.current.setError(errorMessage);
      });

      expect(result.current.error).toBe(errorMessage);
    });

    it("sets error to null", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError("Error");
      });

      expect(result.current.error).toBe("Error");

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("clearError", () => {
    it("clears error message", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setError("Some error");
      });

      expect(result.current.error).toBe("Some error");

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("logout", () => {
    it("clears all auth state", () => {
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

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(mockGuestSession.clearGuestSession).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("clears guest session", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setGuestUser("GuestPlayer");
      });

      expect(result.current.isGuest).toBe(true);

      act(() => {
        result.current.logout();
      });

      expect(mockGuestSession.clearGuestSession).toHaveBeenCalled();
      expect(result.current.isGuest).toBe(false);
    });
  });

  describe("reset", () => {
    it("resets all state to initial values", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        const user: User = {
          id: "user-1",
          email: "test@example.com",
          username: "testuser",
          avatarUrl: null,
        };

        result.current.setUser(user);
        result.current.setLoading(true);
        result.current.setError("Some error");
      });

      expect(result.current.user).not.toBeNull();
      expect(result.current.isLoading).toBe(true);
      expect(result.current.error).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(mockGuestSession.clearGuestSession).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe("initializeAuth", () => {
    it("initializes with guest session if one exists", () => {
      const mockSession = {
        id: "guest-123",
        username: "GuestPlayer",
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };

      mockGuestSession.getGuestSession.mockReturnValueOnce(mockSession);

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initializeAuth();
      });

      expect(mockGuestSession.getGuestSession).toHaveBeenCalled();
      expect(result.current.user).not.toBeNull();
      expect(result.current.user?.username).toBe("GuestPlayer");
      expect(result.current.user?.isGuest).toBe(true);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(true);
    });

    it("does not change state if no guest session exists", () => {
      mockGuestSession.getGuestSession.mockReturnValueOnce(null);

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isGuest).toBe(false);

      act(() => {
        result.current.initializeAuth();
      });

      expect(mockGuestSession.getGuestSession).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.isGuest).toBe(false);
    });
  });
});
