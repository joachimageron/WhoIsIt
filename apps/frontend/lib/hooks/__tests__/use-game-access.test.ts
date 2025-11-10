import { renderHook, act } from "@testing-library/react";

import { useGameAccess } from "../use-game-access";
import { useAuth } from "../use-auth";
import { useAuthStore } from "@/store/auth-store";

// Mock useAuth hook
jest.mock("../use-auth");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock auth store
jest.mock("@/store/auth-store", () => ({
  useAuthStore: jest.fn(),
}));
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock guest-session
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

describe("useGameAccess", () => {
  const mockSetGuestUser = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      setGuestUser: mockSetGuestUser,
    } as any);

    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      logout: mockLogout,
    });
  });

  describe("canAccessGame", () => {
    it("returns true when user is authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          username: "testuser",
          avatarUrl: null,
        },
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.canAccessGame).toBe(true);
    });

    it("returns true when user is guest", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "guest-1",
          email: "",
          username: "guestuser",
          avatarUrl: null,
          isGuest: true,
        },
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.canAccessGame).toBe(true);
    });

    it("returns false when user is not authenticated and not guest", () => {
      const { result } = renderHook(() => useGameAccess());

      expect(result.current.canAccessGame).toBe(false);
    });
  });

  describe("ensureGameAccess", () => {
    it("returns true when user is already authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          username: "testuser",
          avatarUrl: null,
        },
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.ensureGameAccess()).toBe(true);
      expect(mockSetGuestUser).not.toHaveBeenCalled();
    });

    it("returns true when user is already guest", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "guest-1",
          email: "",
          username: "guestuser",
          avatarUrl: null,
          isGuest: true,
        },
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.ensureGameAccess()).toBe(true);
      expect(mockSetGuestUser).not.toHaveBeenCalled();
    });

    it("creates guest session when username provided and not authenticated", () => {
      const { result } = renderHook(() => useGameAccess());

      expect(result.current.ensureGameAccess("GuestPlayer")).toBe(true);
      expect(mockSetGuestUser).toHaveBeenCalledWith("GuestPlayer");
    });

    it("returns false when no username provided and not authenticated", () => {
      const { result } = renderHook(() => useGameAccess());

      expect(result.current.ensureGameAccess()).toBe(false);
      expect(mockSetGuestUser).not.toHaveBeenCalled();
    });
  });

  describe("getGameUsername", () => {
    it("returns username when user is authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          username: "testuser",
          avatarUrl: null,
        },
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.getGameUsername()).toBe("testuser");
    });

    it("returns username when user is guest", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "guest-1",
          email: "",
          username: "guestuser",
          avatarUrl: null,
          isGuest: true,
        },
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.getGameUsername()).toBe("guestuser");
    });

    it("returns null when no user", () => {
      const { result } = renderHook(() => useGameAccess());

      expect(result.current.getGameUsername()).toBeNull();
    });
  });

  describe("getGameUserId", () => {
    it("returns user ID when authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          username: "testuser",
          avatarUrl: null,
        },
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.getGameUserId()).toBe("user-1");
    });

    it("returns null when user is guest", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "guest-1",
          email: "",
          username: "guestuser",
          avatarUrl: null,
          isGuest: true,
        },
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.getGameUserId()).toBeNull();
    });

    it("returns null when not authenticated", () => {
      const { result } = renderHook(() => useGameAccess());

      expect(result.current.getGameUserId()).toBeNull();
    });
  });

  describe("requiresGuestSetup", () => {
    it("returns false when authenticated", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          username: "testuser",
          avatarUrl: null,
        },
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.requiresGuestSetup).toBe(false);
    });

    it("returns false when guest", () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "guest-1",
          email: "",
          username: "guestuser",
          avatarUrl: null,
          isGuest: true,
        },
        isAuthenticated: false,
        isGuest: true,
        isLoading: false,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.requiresGuestSetup).toBe(false);
    });

    it("returns true when not authenticated and not guest", () => {
      const { result } = renderHook(() => useGameAccess());

      expect(result.current.requiresGuestSetup).toBe(true);
    });
  });

  describe("isLoading", () => {
    it("reflects loading state from useAuth", () => {
      mockUseAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
        isGuest: false,
        isLoading: true,
        logout: mockLogout,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(result.current.isLoading).toBe(true);
    });

    it("is false when not loading", () => {
      const { result } = renderHook(() => useGameAccess());

      expect(result.current.isLoading).toBe(false);
    });
  });
});
