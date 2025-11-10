import {
  createGuestSession,
  getGuestSession,
  clearGuestSession,
  hasValidGuestSession,
  updateGuestUsername,
} from "../guest-session";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

// Mock crypto.randomUUID for consistent testing
const mockUUID = "123e4567-e89b-12d3-a456-426614174000";

Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: jest.fn(() => mockUUID),
  },
  writable: true,
});

describe("guest-session", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe("createGuestSession", () => {
    it("creates a new guest session with provided username", () => {
      const username = "TestUser";
      const session = createGuestSession(username);

      expect(session).toBeDefined();
      expect(session.username).toBe(username);
      expect(session.id).toContain("guest_");
      expect(session.createdAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
    });

    it("stores session in localStorage", () => {
      const username = "TestUser";
      const session = createGuestSession(username);

      const stored = localStorage.getItem("whoisit_guest_session");

      expect(stored).toBeDefined();

      const parsed = JSON.parse(stored!);

      expect(parsed.username).toBe(username);
      expect(parsed.id).toBe(session.id);
    });

    it("sets expiration time to 24 hours in the future", () => {
      const username = "TestUser";
      const now = Date.now();
      const session = createGuestSession(username);

      const expectedExpiration = now + 24 * 60 * 60 * 1000;
      const tolerance = 1000; // 1 second tolerance for test execution time

      expect(session.expiresAt).toBeGreaterThanOrEqual(
        expectedExpiration - tolerance,
      );
      expect(session.expiresAt).toBeLessThanOrEqual(
        expectedExpiration + tolerance,
      );
    });

    it("generates unique guest IDs", () => {
      const session1 = createGuestSession("User1");

      // Clear mock to get a "different" UUID
      (crypto.randomUUID as jest.Mock).mockReturnValueOnce("different-uuid");
      const session2 = createGuestSession("User2");

      expect(session1.id).not.toBe(session2.id);
    });
  });

  describe("getGuestSession", () => {
    it("returns null when no session exists", () => {
      const session = getGuestSession();

      expect(session).toBeNull();
    });

    it("returns valid session when it exists", () => {
      const username = "TestUser";
      const created = createGuestSession(username);

      const retrieved = getGuestSession();

      expect(retrieved).toBeDefined();
      expect(retrieved?.username).toBe(username);
      expect(retrieved?.id).toBe(created.id);
    });

    it("returns null and clears session if expired", () => {
      const username = "TestUser";
      const session = createGuestSession(username);

      // Manually set expired time
      session.expiresAt = Date.now() - 1000;
      localStorage.setItem("whoisit_guest_session", JSON.stringify(session));

      const retrieved = getGuestSession();

      expect(retrieved).toBeNull();

      // Verify session was cleared
      expect(localStorage.getItem("whoisit_guest_session")).toBeNull();
    });

    it("returns null and clears session if data is invalid JSON", () => {
      localStorage.setItem("whoisit_guest_session", "invalid json");

      const retrieved = getGuestSession();

      expect(retrieved).toBeNull();

      // Verify session was cleared
      expect(localStorage.getItem("whoisit_guest_session")).toBeNull();
    });

    it("returns session when expiration is in the future", () => {
      const username = "TestUser";
      const session = createGuestSession(username);

      // Ensure expiration is in future (should be by default)
      expect(session.expiresAt).toBeGreaterThan(Date.now());

      const retrieved = getGuestSession();

      expect(retrieved).toBeDefined();
      expect(retrieved?.username).toBe(username);
    });
  });

  describe("clearGuestSession", () => {
    it("removes guest session from localStorage", () => {
      createGuestSession("TestUser");
      expect(localStorage.getItem("whoisit_guest_session")).toBeDefined();

      clearGuestSession();
      expect(localStorage.getItem("whoisit_guest_session")).toBeNull();
    });

    it("does not throw error when no session exists", () => {
      expect(() => clearGuestSession()).not.toThrow();
    });
  });

  describe("hasValidGuestSession", () => {
    it("returns false when no session exists", () => {
      expect(hasValidGuestSession()).toBe(false);
    });

    it("returns true when valid session exists", () => {
      createGuestSession("TestUser");
      expect(hasValidGuestSession()).toBe(true);
    });

    it("returns false when session is expired", () => {
      const session = createGuestSession("TestUser");

      // Manually set expired time
      session.expiresAt = Date.now() - 1000;
      localStorage.setItem("whoisit_guest_session", JSON.stringify(session));

      expect(hasValidGuestSession()).toBe(false);
    });

    it("returns false when session data is corrupted", () => {
      localStorage.setItem("whoisit_guest_session", "invalid json");
      expect(hasValidGuestSession()).toBe(false);
    });
  });

  describe("updateGuestUsername", () => {
    it("updates username of existing session", () => {
      createGuestSession("OldUser");

      const newUsername = "NewUser";
      const updated = updateGuestUsername(newUsername);

      expect(updated).toBeDefined();
      expect(updated?.username).toBe(newUsername);

      // Verify it persisted
      const retrieved = getGuestSession();

      expect(retrieved?.username).toBe(newUsername);
    });

    it("returns null when no session exists", () => {
      const updated = updateGuestUsername("NewUser");

      expect(updated).toBeNull();
    });

    it("preserves other session properties when updating username", () => {
      const originalSession = createGuestSession("OldUser");
      const originalId = originalSession.id;
      const originalCreatedAt = originalSession.createdAt;
      const originalExpiresAt = originalSession.expiresAt;

      const updated = updateGuestUsername("NewUser");

      expect(updated?.id).toBe(originalId);
      expect(updated?.createdAt).toBe(originalCreatedAt);
      expect(updated?.expiresAt).toBe(originalExpiresAt);
    });

    it("updates localStorage with new username", () => {
      createGuestSession("OldUser");
      updateGuestUsername("NewUser");

      const stored = localStorage.getItem("whoisit_guest_session");
      const parsed = JSON.parse(stored!);

      expect(parsed.username).toBe("NewUser");
    });
  });
});
