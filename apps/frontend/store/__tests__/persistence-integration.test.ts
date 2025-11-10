import { renderHook, act } from "@testing-library/react";

import { useAuthStore, type User } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";

/**
 * Integration tests that demonstrate persistence works across
 * simulated "page reloads" (store re-initialization)
 */
describe("State Persistence - Integration Tests", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
    act(() => {
      useAuthStore.getState().reset();
      useGameStore.getState().reset();
    });
  });

  it("auth state persists across page reload simulation", async () => {
    // Step 1: User logs in
    {
      const { result } = renderHook(() => useAuthStore());

      const user: User = {
        id: "user-123",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: "https://example.com/avatar.jpg",
        isGuest: false,
      };

      act(() => {
        result.current.setUser(user);
      });

      expect(result.current.user).toEqual(user);
      expect(result.current.isAuthenticated).toBe(true);
    }

    // Step 2: Simulate page reload by rehydrating store
    {
      // Force rehydration
      // @ts-expect-error - accessing internal persist API for testing
      if (useAuthStore.persist?.rehydrate) {
        // @ts-expect-error
        await useAuthStore.persist.rehydrate();
      }

      const { result } = renderHook(() => useAuthStore());

      // User should still be logged in after "page reload"
      expect(result.current.user).toBeTruthy();
      expect(result.current.user?.id).toBe("user-123");
      expect(result.current.user?.email).toBe("test@example.com");
      expect(result.current.isAuthenticated).toBe(true);
    }
  });

  it("game state persists player choices across page reload simulation", async () => {
    // Step 1: Player eliminates and flips characters during game
    {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
          currentPlayerId: "player-1",
          roundNumber: 1,
        } as any);

        // Player eliminates some characters
        result.current.eliminateCharacter("char-1");
        result.current.eliminateCharacter("char-2");
        result.current.eliminateCharacter("char-3");

        // Player flips down some characters
        result.current.toggleFlipCharacter("char-4");
        result.current.toggleFlipCharacter("char-5");
      });

      expect(result.current.playState?.eliminatedCharacterIds.size).toBe(3);
      expect(result.current.playState?.flippedCharacterIds.size).toBe(2);
    }

    // Step 2: Simulate page reload
    {
      // Force rehydration
      // @ts-expect-error - accessing internal persist API for testing
      if (useGameStore.persist?.rehydrate) {
        // @ts-expect-error
        await useGameStore.persist.rehydrate();
      }

      const { result } = renderHook(() => useGameStore());

      // Player's choices should be restored
      expect(result.current.playState?.eliminatedCharacterIds.size).toBe(3);
      expect(
        result.current.playState?.eliminatedCharacterIds.has("char-1"),
      ).toBe(true);
      expect(
        result.current.playState?.eliminatedCharacterIds.has("char-2"),
      ).toBe(true);
      expect(
        result.current.playState?.eliminatedCharacterIds.has("char-3"),
      ).toBe(true);

      expect(result.current.playState?.flippedCharacterIds.size).toBe(2);
      expect(result.current.playState?.flippedCharacterIds.has("char-4")).toBe(
        true,
      );
      expect(result.current.playState?.flippedCharacterIds.has("char-5")).toBe(
        true,
      );

      // But server state should NOT be persisted
      expect(result.current.playState?.gameState).toBeNull();
      expect(result.current.playState?.characters).toEqual([]);
      expect(result.current.playState?.questions).toEqual([]);
      expect(result.current.lobby).toBeNull();
      expect(result.current.isConnected).toBe(false);
    }
  });

  it("logout clears persisted auth state", async () => {
    // Step 1: User logs in
    {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setUser({
          id: "user-123",
          email: "test@example.com",
          username: "testuser",
          avatarUrl: null,
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
    }

    // Step 2: User logs out
    {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    }

    // Step 3: Simulate page reload - user should remain logged out
    {
      // Force rehydration
      // @ts-expect-error - accessing internal persist API for testing
      if (useAuthStore.persist?.rehydrate) {
        // @ts-expect-error
        await useAuthStore.persist.rehydrate();
      }

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    }
  });

  it("reset clears persisted game state", async () => {
    // Step 1: Player has some game state
    {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setGameState({ id: "game-1" } as any);
        result.current.eliminateCharacter("char-1");
      });

      expect(result.current.playState).not.toBeNull();
    }

    // Step 2: Player resets (leaves game)
    {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.reset();
      });

      expect(result.current.playState).toBeNull();
    }

    // Step 3: Simulate page reload - state should remain reset
    {
      // Force rehydration
      // @ts-expect-error - accessing internal persist API for testing
      if (useGameStore.persist?.rehydrate) {
        // @ts-expect-error
        await useGameStore.persist.rehydrate();
      }

      const { result } = renderHook(() => useGameStore());

      expect(result.current.playState).toBeNull();
    }
  });
});
