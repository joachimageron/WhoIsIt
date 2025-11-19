import { renderHook } from "@testing-library/react";

import { useGameAccess } from "../use-game-access";
import { useAuth } from "../use-auth";

// Mock useAuth hook
jest.mock("../use-auth");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

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
  const mockCreateGuestSession = jest.fn();
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockCreateGuestSession.mockResolvedValue({
      id: "guest-123",
      email: "",
      username: "GuestPlayer",
      avatarUrl: null,
      isGuest: true,
    });

    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      logout: mockLogout,
      createGuestSession: mockCreateGuestSession,
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
        createGuestSession: mockCreateGuestSession,
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
        createGuestSession: mockCreateGuestSession,
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
    it("returns true when user is already authenticated", async () => {
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
        createGuestSession: mockCreateGuestSession,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(await result.current.ensureGameAccess()).toBe(true);
      expect(mockCreateGuestSession).not.toHaveBeenCalled();
    });

    it("returns true when user is already guest", async () => {
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
        createGuestSession: mockCreateGuestSession,
      });

      const { result } = renderHook(() => useGameAccess());

      expect(await result.current.ensureGameAccess()).toBe(true);
      expect(mockCreateGuestSession).not.toHaveBeenCalled();
    });

    it("creates guest session when not authenticated", async () => {
      const { result } = renderHook(() => useGameAccess());

      expect(await result.current.ensureGameAccess()).toBe(true);
      expect(mockCreateGuestSession).toHaveBeenCalledWith();
    });

    it("returns false when guest creation fails", async () => {
      mockCreateGuestSession.mockRejectedValue(new Error("Failed"));
      const { result } = renderHook(() => useGameAccess());

      expect(await result.current.ensureGameAccess()).toBe(false);
      expect(mockCreateGuestSession).toHaveBeenCalledWith();
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
        createGuestSession: mockCreateGuestSession,
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
        createGuestSession: mockCreateGuestSession,
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
        createGuestSession: mockCreateGuestSession,
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
        createGuestSession: mockCreateGuestSession,
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
        createGuestSession: mockCreateGuestSession,
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
        createGuestSession: mockCreateGuestSession,
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
        createGuestSession: mockCreateGuestSession,
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
