import type {
  GameStateResponse,
  CharacterResponseDto,
} from "@whois-it/contracts";

import { renderHook, act } from "@testing-library/react";

import { useGameStore } from "../game-store";

describe("useGameStore - Persistence", () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    // Reset store using the reset action
    act(() => {
      useGameStore.getState().reset();
    });
    // Clear localStorage after each test
    localStorage.clear();
  });

  describe("localStorage persistence", () => {
    it("persists eliminated and flipped character IDs", async () => {
      const { result } = renderHook(() => useGameStore());

      // Initialize playState
      await act(async () => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      // Eliminate and flip some characters
      await act(async () => {
        result.current.eliminateCharacter("char-1");
        result.current.eliminateCharacter("char-2");
        result.current.toggleFlipCharacter("char-3");
        // Wait for persistence to complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      // Check that data is in localStorage
      const stored = localStorage.getItem("whoisit-game-storage");

      expect(stored).toBeTruthy();

      if (stored) {
        const parsed = JSON.parse(stored);

        expect(parsed.state.playState).not.toBeNull();
        // Sets are stored as arrays in localStorage
        expect(parsed.state.playState.eliminatedCharacterIds).toEqual([
          "char-1",
          "char-2",
        ]);
        expect(parsed.state.playState.flippedCharacterIds).toEqual(["char-3"]);
      }
    });

    it("does not persist lobby and connection state", () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setLobby({
          roomCode: "TEST123",
          players: [],
        } as any);
        result.current.setConnected(true);
      });

      const stored = localStorage.getItem("whoisit-game-storage");

      if (stored) {
        const parsed = JSON.parse(stored);

        // Lobby and connection state should not be persisted
        expect(parsed.state.lobby).toBeUndefined();
        expect(parsed.state.isConnected).toBeUndefined();
      }
    });

    it("does not persist real-time game state data", () => {
      const { result } = renderHook(() => useGameStore());

      const characters: CharacterResponseDto[] = [
        {
          id: "char-1",
          name: "Alice",
          imageUrl: "url1",
        } as CharacterResponseDto,
      ];

      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
        result.current.setCharacters(characters);
      });

      const stored = localStorage.getItem("whoisit-game-storage");

      if (stored) {
        const parsed = JSON.parse(stored);

        expect(parsed.state.playState).not.toBeNull();
        // Game state, characters, questions, answers, myCharacter should not be persisted
        expect(parsed.state.playState.gameState).toBeNull();
        expect(parsed.state.playState.characters).toEqual([]);
        expect(parsed.state.playState.questions).toEqual([]);
        expect(parsed.state.playState.answers).toEqual([]);
        expect(parsed.state.playState.myCharacter).toBeNull();
      }
    });

    it("restores eliminated and flipped characters from localStorage", async () => {
      // Manually set localStorage as if player had previously eliminated/flipped characters
      localStorage.setItem(
        "whoisit-game-storage",
        JSON.stringify({
          state: {
            playState: {
              gameState: null,
              characters: [],
              questions: [],
              answers: [],
              eliminatedCharacterIds: ["char-1", "char-2"],
              flippedCharacterIds: ["char-3"],
              myCharacter: null,
            },
          },
          version: 0,
        }),
      );

      // Force rehydration by calling persist.rehydrate()
      if (useGameStore.persist?.rehydrate) {
        await useGameStore.persist.rehydrate();
      }

      // Create a new hook instance - it should restore from localStorage
      const { result } = renderHook(() => useGameStore());

      expect(result.current.playState).not.toBeNull();
      expect(result.current.playState?.eliminatedCharacterIds.size).toBe(2);
      expect(
        result.current.playState?.eliminatedCharacterIds.has("char-1"),
      ).toBe(true);
      expect(
        result.current.playState?.eliminatedCharacterIds.has("char-2"),
      ).toBe(true);
      expect(result.current.playState?.flippedCharacterIds.size).toBe(1);
      expect(result.current.playState?.flippedCharacterIds.has("char-3")).toBe(
        true,
      );
    });

    it("handles Map serialization correctly", () => {
      const { result } = renderHook(() => useGameStore());

      // Initialize playState
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      // Eliminate a character to trigger persistence
      act(() => {
        result.current.eliminateCharacter("char-1");
      });

      // Check that Map was serialized as array
      const stored = localStorage.getItem("whoisit-game-storage");

      if (stored) {
        const parsed = JSON.parse(stored);

        // Answers Map should be serialized as an empty array (since we don't persist it)
        expect(Array.isArray(parsed.state.playState.answers)).toBe(true);
      }
    });

    it("handles Set serialization correctly", () => {
      const { result } = renderHook(() => useGameStore());

      // Initialize playState
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      act(() => {
        result.current.eliminateCharacter("char-1");
        result.current.toggleFlipCharacter("char-2");
      });

      // Check that Sets were serialized as arrays
      const stored = localStorage.getItem("whoisit-game-storage");

      if (stored) {
        const parsed = JSON.parse(stored);

        expect(
          Array.isArray(parsed.state.playState.eliminatedCharacterIds),
        ).toBe(true);
        expect(Array.isArray(parsed.state.playState.flippedCharacterIds)).toBe(
          true,
        );
      }
    });

    it("clears playState persistence on reset", () => {
      const { result } = renderHook(() => useGameStore());

      // Set up some playState
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
        result.current.eliminateCharacter("char-1");
      });

      // Verify data is stored
      expect(localStorage.getItem("whoisit-game-storage")).toBeTruthy();

      act(() => {
        result.current.reset();
      });

      // After reset, localStorage should be updated with null playState
      const stored = localStorage.getItem("whoisit-game-storage");

      if (stored) {
        const parsed = JSON.parse(stored);

        expect(parsed.state.playState).toBeNull();
      }
    });

    it("handles corrupted localStorage data gracefully", () => {
      // Set corrupted data in localStorage
      localStorage.setItem("whoisit-game-storage", "corrupted-json-data");

      // Should not crash and should use default state
      const { result } = renderHook(() => useGameStore());

      expect(result.current.lobby).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.playState).toBeNull();
    });

    it("merges persisted state with new game state", async () => {
      // Set up persisted state
      localStorage.setItem(
        "whoisit-game-storage",
        JSON.stringify({
          state: {
            playState: {
              gameState: null,
              characters: [],
              questions: [],
              answers: [],
              eliminatedCharacterIds: ["char-1"],
              flippedCharacterIds: ["char-2"],
              myCharacter: null,
            },
          },
          version: 0,
        }),
      );

      // Force rehydration by calling persist.rehydrate()
      if (useGameStore.persist?.rehydrate) {
        await useGameStore.persist.rehydrate();
      }

      const { result } = renderHook(() => useGameStore());

      // Verify persisted data is restored
      expect(
        result.current.playState?.eliminatedCharacterIds.has("char-1"),
      ).toBe(true);
      expect(result.current.playState?.flippedCharacterIds.has("char-2")).toBe(
        true,
      );

      // Now set new game state - it should merge with persisted data
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      // Persisted eliminated/flipped characters should still be there
      expect(
        result.current.playState?.eliminatedCharacterIds.has("char-1"),
      ).toBe(true);
      expect(result.current.playState?.flippedCharacterIds.has("char-2")).toBe(
        true,
      );
      // New game state should be set
      expect(result.current.playState?.gameState).not.toBeNull();
    });
  });
});
