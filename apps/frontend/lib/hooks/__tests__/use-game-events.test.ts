import type { Dictionary } from "@/dictionaries";

import { renderHook, act } from "@testing-library/react";

import { useGameEvents } from "../use-game-events";

import { useGameStore } from "@/store/game-store";
import { useGameSocket } from "@/lib/hooks/use-game-socket";

// Mock dependencies
jest.mock("@/store/game-store");
jest.mock("@/lib/hooks/use-game-socket");
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));
jest.mock("@heroui/toast", () => ({
  addToast: jest.fn(),
}));

const mockUseGameStore = useGameStore as jest.MockedFunction<
  typeof useGameStore
>;
const mockUseGameSocket = useGameSocket as jest.MockedFunction<
  typeof useGameSocket
>;
const mockPush = jest.fn();

describe("useGameEvents", () => {
  const mockDict: Dictionary = {
    game: {
      play: {
        answers: {
          answerSubmitted: "Answer submitted",
        },
        guess: {
          correctGuess: "Correct guess!",
          incorrectGuess: "Incorrect guess",
        },
        gameOver: "Game Over!",
      },
    },
  } as Dictionary;

  const mockProps = {
    currentPlayerId: "player-1",
    roomCode: "TEST123",
    lang: "en",
    dict: mockDict,
  };

  const mockSocket = {
    on: jest.fn(),
    off: jest.fn(),
    connected: true,
  };

  const mockSetGameState = jest.fn();
  const mockAddQuestion = jest.fn();
  const mockAddAnswer = jest.fn();
  const mockSetConnected = jest.fn();
  const mockEliminateCharacter = jest.fn();

  // Store cleanup functions for event listeners
  let onQuestionAskedCallback: any;
  let onAnswerSubmittedCallback: any;
  let onGuessResultCallback: any;
  let onGameOverCallback: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseGameSocket.mockReturnValue({
      socket: mockSocket,
      onQuestionAsked: jest.fn((cb) => {
        onQuestionAskedCallback = cb;

        return jest.fn();
      }),
      onAnswerSubmitted: jest.fn((cb) => {
        onAnswerSubmittedCallback = cb;

        return jest.fn();
      }),
      onGuessResult: jest.fn((cb) => {
        onGuessResultCallback = cb;

        return jest.fn();
      }),
      onGameOver: jest.fn((cb) => {
        onGameOverCallback = cb;

        return jest.fn();
      }),
    } as any);

    mockUseGameStore.mockReturnValue({
      setGameState: mockSetGameState,
      addQuestion: mockAddQuestion,
      addAnswer: mockAddAnswer,
      setConnected: mockSetConnected,
      eliminateCharacter: mockEliminateCharacter,
    } as any);
  });

  describe("socket connection tracking", () => {
    it("listens to socket connect events", () => {
      renderHook(() => useGameEvents(mockProps));

      expect(mockSocket.on).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
    });

    it("listens to socket disconnect events", () => {
      renderHook(() => useGameEvents(mockProps));

      expect(mockSocket.on).toHaveBeenCalledWith(
        "disconnect",
        expect.any(Function),
      );
    });

    it("sets connected state based on socket connection", () => {
      renderHook(() => useGameEvents(mockProps));

      expect(mockSetConnected).toHaveBeenCalledWith(true);
    });

    it("cleans up event listeners on unmount", () => {
      const { unmount } = renderHook(() => useGameEvents(mockProps));

      unmount();

      expect(mockSocket.off).toHaveBeenCalledWith(
        "connect",
        expect.any(Function),
      );
      expect(mockSocket.off).toHaveBeenCalledWith(
        "disconnect",
        expect.any(Function),
      );
    });
  });

  describe("question asked events", () => {
    it("adds question to store when received", () => {
      renderHook(() => useGameEvents(mockProps));

      const mockQuestion = {
        id: "q1",
        askedByPlayerId: "player-2",
        targetPlayerId: null,
        text: "Is it a person?",
      };

      const mockGameState = { id: "game-1" };

      act(() => {
        onQuestionAskedCallback({
          question: mockQuestion,
          gameState: mockGameState,
        });
      });

      expect(mockAddQuestion).toHaveBeenCalledWith(mockQuestion);
      expect(mockSetGameState).toHaveBeenCalledWith(mockGameState);
    });

    it("opens answer modal when question is targeted at current player", () => {
      const { result } = renderHook(() => useGameEvents(mockProps));

      const mockQuestion = {
        id: "q1",
        askedByPlayerId: "player-2",
        targetPlayerId: "player-1",
        text: "Is it a person?",
      };

      act(() => {
        onQuestionAskedCallback({
          question: mockQuestion,
          gameState: { id: "game-1" },
        });
      });

      expect(result.current.pendingQuestion).toEqual(mockQuestion);
      expect(result.current.isAnswerModalOpen).toBe(true);
    });

    it("opens answer modal when question has no target and is not from current player", () => {
      const { result } = renderHook(() => useGameEvents(mockProps));

      const mockQuestion = {
        id: "q1",
        askedByPlayerId: "player-2",
        targetPlayerId: null,
        text: "Is it a person?",
      };

      act(() => {
        onQuestionAskedCallback({
          question: mockQuestion,
          gameState: { id: "game-1" },
        });
      });

      expect(result.current.pendingQuestion).toEqual(mockQuestion);
      expect(result.current.isAnswerModalOpen).toBe(true);
    });

    it("does not open answer modal when question is from current player", () => {
      const { result } = renderHook(() => useGameEvents(mockProps));

      const mockQuestion = {
        id: "q1",
        askedByPlayerId: "player-1",
        targetPlayerId: null,
        text: "Is it a person?",
      };

      act(() => {
        onQuestionAskedCallback({
          question: mockQuestion,
          gameState: { id: "game-1" },
        });
      });

      expect(result.current.pendingQuestion).toBeNull();
      expect(result.current.isAnswerModalOpen).toBe(false);
    });
  });

  describe("answer submitted events", () => {
    it("adds answer to store and updates game state", () => {
      renderHook(() => useGameEvents(mockProps));

      const mockAnswer = {
        id: "a1",
        questionId: "q1",
        answerValue: true,
        answeredByPlayerUsername: "Player2",
      };

      const mockGameState = { id: "game-1" };

      act(() => {
        onAnswerSubmittedCallback({
          answer: mockAnswer,
          gameState: mockGameState,
        });
      });

      expect(mockSetGameState).toHaveBeenCalledWith(mockGameState);
      expect(mockAddAnswer).toHaveBeenCalledWith(mockAnswer);
    });

    it("clears pending question when answered", () => {
      const { result } = renderHook(() => useGameEvents(mockProps));

      // Set a pending question first
      act(() => {
        result.current.setPendingQuestion({ id: "q1" } as any);
        result.current.setIsAnswerModalOpen(true);
      });

      const mockAnswer = {
        id: "a1",
        questionId: "q1",
        answerValue: true,
        answeredByPlayerUsername: "Player2",
      };

      act(() => {
        onAnswerSubmittedCallback({
          answer: mockAnswer,
          gameState: { id: "game-1" },
        });
      });

      expect(result.current.pendingQuestion).toBeNull();
      expect(result.current.isAnswerModalOpen).toBe(false);
    });

    it("does not clear pending question if different question answered", () => {
      const { result } = renderHook(() => useGameEvents(mockProps));

      // Set a pending question first
      act(() => {
        result.current.setPendingQuestion({ id: "q1" } as any);
        result.current.setIsAnswerModalOpen(true);
      });

      const mockAnswer = {
        id: "a1",
        questionId: "q2", // Different question
        answerValue: true,
        answeredByPlayerUsername: "Player2",
      };

      act(() => {
        onAnswerSubmittedCallback({
          answer: mockAnswer,
          gameState: { id: "game-1" },
        });
      });

      expect(result.current.pendingQuestion).not.toBeNull();
      expect(result.current.isAnswerModalOpen).toBe(true);
    });
  });

  describe("guess result events", () => {
    it("updates game state on correct guess", () => {
      renderHook(() => useGameEvents(mockProps));

      const mockGuess = {
        isCorrect: true,
        targetCharacterId: "char-1",
        targetCharacterName: "Character 1",
        guessedByPlayerUsername: "Player2",
      };

      const mockGameState = { id: "game-1" };

      act(() => {
        onGuessResultCallback({
          guess: mockGuess,
          gameState: mockGameState,
        });
      });

      expect(mockSetGameState).toHaveBeenCalledWith(mockGameState);
      expect(mockEliminateCharacter).not.toHaveBeenCalled();
    });

    it("eliminates character on incorrect guess", () => {
      renderHook(() => useGameEvents(mockProps));

      const mockGuess = {
        isCorrect: false,
        targetCharacterId: "char-1",
        targetCharacterName: "Character 1",
        guessedByPlayerUsername: "Player2",
      };

      const mockGameState = { id: "game-1" };

      act(() => {
        onGuessResultCallback({
          guess: mockGuess,
          gameState: mockGameState,
        });
      });

      expect(mockSetGameState).toHaveBeenCalledWith(mockGameState);
      expect(mockEliminateCharacter).toHaveBeenCalledWith("char-1");
    });
  });

  describe("game over events", () => {
    it("navigates to results page on game over", () => {
      renderHook(() => useGameEvents(mockProps));

      const mockResult = {
        winnerId: "player-2",
        winnerUsername: "Player2",
      };

      act(() => {
        onGameOverCallback({
          result: mockResult,
        });
      });

      expect(mockPush).toHaveBeenCalledWith("/en/game/results/TEST123");
    });

    it("navigates to results page even without winner", () => {
      renderHook(() => useGameEvents(mockProps));

      act(() => {
        onGameOverCallback({
          result: {},
        });
      });

      expect(mockPush).toHaveBeenCalledWith("/en/game/results/TEST123");
    });
  });

  describe("state management", () => {
    it("provides pendingQuestion state", () => {
      const { result } = renderHook(() => useGameEvents(mockProps));

      expect(result.current.pendingQuestion).toBeNull();
    });

    it("provides setPendingQuestion function", () => {
      const { result } = renderHook(() => useGameEvents(mockProps));

      const mockQuestion = { id: "q1", text: "Question?" } as any;

      act(() => {
        result.current.setPendingQuestion(mockQuestion);
      });

      expect(result.current.pendingQuestion).toEqual(mockQuestion);
    });

    it("provides isAnswerModalOpen state", () => {
      const { result } = renderHook(() => useGameEvents(mockProps));

      expect(result.current.isAnswerModalOpen).toBe(false);
    });

    it("provides setIsAnswerModalOpen function", () => {
      const { result } = renderHook(() => useGameEvents(mockProps));

      act(() => {
        result.current.setIsAnswerModalOpen(true);
      });

      expect(result.current.isAnswerModalOpen).toBe(true);
    });
  });
});
