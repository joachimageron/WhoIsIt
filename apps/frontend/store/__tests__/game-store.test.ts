import { renderHook, act } from "@testing-library/react";
import type {
  GameLobbyResponse,
  GameStateResponse,
  QuestionResponse,
  CharacterResponseDto,
  AnswerResponse,
  PlayerCharacterResponse,
} from "@whois-it/contracts";

import { useGameStore } from "../game-store";

describe("useGameStore", () => {
  beforeEach(() => {
    // Reset store to initial state
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.reset();
    });
  });

  describe("initial state", () => {
    it("has correct initial values", () => {
      const { result } = renderHook(() => useGameStore());

      expect(result.current.lobby).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.playState).toBeNull();
    });
  });

  describe("setLobby", () => {
    it("sets lobby data", () => {
      const { result } = renderHook(() => useGameStore());

      const lobby: GameLobbyResponse = {
        roomCode: "TEST123",
        players: [],
        hostId: "host-1",
        maxPlayers: 4,
        characterSetId: "set-1",
        isStarted: false,
      } as GameLobbyResponse;

      act(() => {
        result.current.setLobby(lobby);
      });

      expect(result.current.lobby).toEqual(lobby);
    });

    it("clears lobby when null is passed", () => {
      const { result } = renderHook(() => useGameStore());

      const lobby: GameLobbyResponse = {
        roomCode: "TEST123",
        players: [],
        hostId: "host-1",
        maxPlayers: 4,
        characterSetId: "set-1",
        isStarted: false,
      } as GameLobbyResponse;

      act(() => {
        result.current.setLobby(lobby);
      });

      expect(result.current.lobby).not.toBeNull();

      act(() => {
        result.current.setLobby(null);
      });

      expect(result.current.lobby).toBeNull();
    });
  });

  describe("setConnected", () => {
    it("sets connected status to true", () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setConnected(true);
      });

      expect(result.current.isConnected).toBe(true);
    });

    it("sets connected status to false", () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setConnected(true);
      });

      expect(result.current.isConnected).toBe(true);

      act(() => {
        result.current.setConnected(false);
      });

      expect(result.current.isConnected).toBe(false);
    });
  });

  describe("setGameState", () => {
    it("initializes playState when it does not exist", () => {
      const { result } = renderHook(() => useGameStore());

      const gameState: GameStateResponse = {
        id: "game-1",
        roomCode: "TEST123",
        currentPlayerId: "player-1",
        roundNumber: 1,
      } as GameStateResponse;

      act(() => {
        result.current.setGameState(gameState);
      });

      expect(result.current.playState).not.toBeNull();
      expect(result.current.playState?.gameState).toEqual(gameState);
      expect(result.current.playState?.characters).toEqual([]);
      expect(result.current.playState?.questions).toEqual([]);
      expect(result.current.playState?.answers).toEqual(new Map());
    });

    it("updates gameState when playState exists", () => {
      const { result } = renderHook(() => useGameStore());

      const gameState1: GameStateResponse = {
        id: "game-1",
        roomCode: "TEST123",
        currentPlayerId: "player-1",
        roundNumber: 1,
      } as GameStateResponse;

      act(() => {
        result.current.setGameState(gameState1);
      });

      const gameState2: GameStateResponse = {
        id: "game-1",
        roomCode: "TEST123",
        currentPlayerId: "player-2",
        roundNumber: 2,
      } as GameStateResponse;

      act(() => {
        result.current.setGameState(gameState2);
      });

      expect(result.current.playState?.gameState).toEqual(gameState2);
    });
  });

  describe("setCharacters", () => {
    it("initializes playState with characters when it does not exist", () => {
      const { result } = renderHook(() => useGameStore());

      const characters: CharacterResponseDto[] = [
        { id: "char-1", name: "Alice", imageUrl: "url1" } as CharacterResponseDto,
        { id: "char-2", name: "Bob", imageUrl: "url2" } as CharacterResponseDto,
      ];

      act(() => {
        result.current.setCharacters(characters);
      });

      expect(result.current.playState).not.toBeNull();
      expect(result.current.playState?.characters).toEqual(characters);
    });

    it("updates characters when playState exists", () => {
      const { result } = renderHook(() => useGameStore());

      const characters1: CharacterResponseDto[] = [
        { id: "char-1", name: "Alice", imageUrl: "url1" } as CharacterResponseDto,
      ];

      act(() => {
        result.current.setCharacters(characters1);
      });

      const characters2: CharacterResponseDto[] = [
        { id: "char-2", name: "Bob", imageUrl: "url2" } as CharacterResponseDto,
      ];

      act(() => {
        result.current.setCharacters(characters2);
      });

      expect(result.current.playState?.characters).toEqual(characters2);
    });
  });

  describe("setMyCharacter", () => {
    it("initializes playState with myCharacter when it does not exist", () => {
      const { result } = renderHook(() => useGameStore());

      const myCharacter: PlayerCharacterResponse = {
        id: "char-1",
        name: "Alice",
        imageUrl: "url1",
      } as PlayerCharacterResponse;

      act(() => {
        result.current.setMyCharacter(myCharacter);
      });

      expect(result.current.playState).not.toBeNull();
      expect(result.current.playState?.myCharacter).toEqual(myCharacter);
    });

    it("updates myCharacter when playState exists", () => {
      const { result } = renderHook(() => useGameStore());

      const myCharacter1: PlayerCharacterResponse = {
        id: "char-1",
        name: "Alice",
        imageUrl: "url1",
      } as PlayerCharacterResponse;

      act(() => {
        result.current.setMyCharacter(myCharacter1);
      });

      const myCharacter2: PlayerCharacterResponse = {
        id: "char-2",
        name: "Bob",
        imageUrl: "url2",
      } as PlayerCharacterResponse;

      act(() => {
        result.current.setMyCharacter(myCharacter2);
      });

      expect(result.current.playState?.myCharacter).toEqual(myCharacter2);
    });
  });

  describe("addQuestion", () => {
    it("initializes playState with question when it does not exist", () => {
      const { result } = renderHook(() => useGameStore());

      const question: QuestionResponse = {
        id: "q1",
        text: "Is it a person?",
        playerId: "player-1",
      } as QuestionResponse;

      act(() => {
        result.current.addQuestion(question);
      });

      expect(result.current.playState).not.toBeNull();
      expect(result.current.playState?.questions).toHaveLength(1);
      expect(result.current.playState?.questions[0]).toEqual(question);
    });

    it("adds question to existing questions when playState exists", () => {
      const { result } = renderHook(() => useGameStore());

      const question1: QuestionResponse = {
        id: "q1",
        text: "Is it a person?",
        playerId: "player-1",
      } as QuestionResponse;

      act(() => {
        result.current.addQuestion(question1);
      });

      const question2: QuestionResponse = {
        id: "q2",
        text: "Does it fly?",
        playerId: "player-1",
      } as QuestionResponse;

      act(() => {
        result.current.addQuestion(question2);
      });

      expect(result.current.playState?.questions).toHaveLength(2);
      expect(result.current.playState?.questions[0]).toEqual(question1);
      expect(result.current.playState?.questions[1]).toEqual(question2);
    });
  });

  describe("addAnswer", () => {
    it("does not add answer when playState does not exist", () => {
      const { result } = renderHook(() => useGameStore());

      const answer: AnswerResponse = {
        id: "a1",
        questionId: "q1",
        answer: true,
      } as AnswerResponse;

      act(() => {
        result.current.addAnswer(answer);
      });

      expect(result.current.playState).toBeNull();
    });

    it("adds answer to answers map when playState exists", () => {
      const { result } = renderHook(() => useGameStore());

      // Initialize playState
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      const answer: AnswerResponse = {
        id: "a1",
        questionId: "q1",
        answer: true,
      } as AnswerResponse;

      act(() => {
        result.current.addAnswer(answer);
      });

      expect(result.current.playState?.answers.size).toBe(1);
      expect(result.current.playState?.answers.get("q1")).toEqual(answer);
    });

    it("updates existing answer in map", () => {
      const { result } = renderHook(() => useGameStore());

      // Initialize playState
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      const answer1: AnswerResponse = {
        id: "a1",
        questionId: "q1",
        answer: true,
      } as AnswerResponse;

      act(() => {
        result.current.addAnswer(answer1);
      });

      const answer2: AnswerResponse = {
        id: "a2",
        questionId: "q1",
        answer: false,
      } as AnswerResponse;

      act(() => {
        result.current.addAnswer(answer2);
      });

      expect(result.current.playState?.answers.size).toBe(1);
      expect(result.current.playState?.answers.get("q1")).toEqual(answer2);
    });
  });

  describe("eliminateCharacter", () => {
    it("does not eliminate when playState does not exist", () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.eliminateCharacter("char-1");
      });

      expect(result.current.playState).toBeNull();
    });

    it("adds character to eliminated set", () => {
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
      });

      expect(result.current.playState?.eliminatedCharacterIds.size).toBe(1);
      expect(result.current.playState?.eliminatedCharacterIds.has("char-1")).toBe(true);
    });

    it("handles multiple eliminations", () => {
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
        result.current.eliminateCharacter("char-2");
        result.current.eliminateCharacter("char-3");
      });

      expect(result.current.playState?.eliminatedCharacterIds.size).toBe(3);
      expect(result.current.playState?.eliminatedCharacterIds.has("char-1")).toBe(true);
      expect(result.current.playState?.eliminatedCharacterIds.has("char-2")).toBe(true);
      expect(result.current.playState?.eliminatedCharacterIds.has("char-3")).toBe(true);
    });
  });

  describe("toggleFlipCharacter", () => {
    it("does not toggle when playState does not exist", () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.toggleFlipCharacter("char-1");
      });

      expect(result.current.playState).toBeNull();
    });

    it("adds character to flipped set when not present", () => {
      const { result } = renderHook(() => useGameStore());

      // Initialize playState
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      act(() => {
        result.current.toggleFlipCharacter("char-1");
      });

      expect(result.current.playState?.flippedCharacterIds.size).toBe(1);
      expect(result.current.playState?.flippedCharacterIds.has("char-1")).toBe(true);
    });

    it("removes character from flipped set when present", () => {
      const { result } = renderHook(() => useGameStore());

      // Initialize playState
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      act(() => {
        result.current.toggleFlipCharacter("char-1");
      });

      expect(result.current.playState?.flippedCharacterIds.has("char-1")).toBe(true);

      act(() => {
        result.current.toggleFlipCharacter("char-1");
      });

      expect(result.current.playState?.flippedCharacterIds.size).toBe(0);
      expect(result.current.playState?.flippedCharacterIds.has("char-1")).toBe(false);
    });

    it("handles multiple toggles", () => {
      const { result } = renderHook(() => useGameStore());

      // Initialize playState
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      act(() => {
        result.current.toggleFlipCharacter("char-1");
        result.current.toggleFlipCharacter("char-2");
      });

      expect(result.current.playState?.flippedCharacterIds.size).toBe(2);

      act(() => {
        result.current.toggleFlipCharacter("char-1");
      });

      expect(result.current.playState?.flippedCharacterIds.size).toBe(1);
      expect(result.current.playState?.flippedCharacterIds.has("char-2")).toBe(true);
    });
  });

  describe("resetPlayState", () => {
    it("resets playState to null", () => {
      const { result } = renderHook(() => useGameStore());

      // Set up some play state
      act(() => {
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
        result.current.setCharacters([
          { id: "char-1", name: "Alice" } as CharacterResponseDto,
        ]);
      });

      expect(result.current.playState).not.toBeNull();

      act(() => {
        result.current.resetPlayState();
      });

      expect(result.current.playState).toBeNull();
    });

    it("does not affect other state", () => {
      const { result } = renderHook(() => useGameStore());

      const lobby: GameLobbyResponse = {
        roomCode: "TEST123",
        players: [],
      } as GameLobbyResponse;

      act(() => {
        result.current.setLobby(lobby);
        result.current.setConnected(true);
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      act(() => {
        result.current.resetPlayState();
      });

      expect(result.current.lobby).toEqual(lobby);
      expect(result.current.isConnected).toBe(true);
    });
  });

  describe("reset", () => {
    it("resets all state to initial values", () => {
      const { result } = renderHook(() => useGameStore());

      act(() => {
        result.current.setLobby({
          roomCode: "TEST123",
          players: [],
        } as GameLobbyResponse);
        result.current.setConnected(true);
        result.current.setGameState({
          id: "game-1",
          roomCode: "TEST123",
        } as GameStateResponse);
      });

      expect(result.current.lobby).not.toBeNull();
      expect(result.current.isConnected).toBe(true);
      expect(result.current.playState).not.toBeNull();

      act(() => {
        result.current.reset();
      });

      expect(result.current.lobby).toBeNull();
      expect(result.current.isConnected).toBe(false);
      expect(result.current.playState).toBeNull();
    });
  });
});
