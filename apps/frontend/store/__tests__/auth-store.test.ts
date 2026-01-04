import { renderHook, act } from "@testing-library/react";

import { useAuthStore, type User } from "../auth-store";

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
      expect(result.current.isAuthenticated).toBe(true);
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

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it("clears guest session when guest user logs out", () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        const guestUser: User = {
          id: "guest-1",
          email: "",
          username: "GuestPlayer",
          avatarUrl: null,
          isGuest: true,
        };

        result.current.setUser(guestUser);
      });

      expect(result.current.isGuest).toBe(true);

      act(() => {
        result.current.logout();
      });

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

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isGuest).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });
});
