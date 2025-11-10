import { renderHook, act, waitFor } from "@testing-library/react";
import type { Dictionary } from "@/dictionaries";

import { useGameActions } from "../use-game-actions";
import * as gameApi from "@/lib/game-api";
import { useGameStore } from "@/store/game-store";
import { useGameSocket } from "@/lib/hooks/use-game-socket";

// Mock dependencies
jest.mock("@/lib/game-api");
jest.mock("@/store/game-store");
jest.mock("@/lib/hooks/use-game-socket");

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
}));

jest.mock("@heroui/toast", () => ({
  addToast: jest.fn(),
}));

import { addToast } from "@heroui/toast";
const mockAddToast = addToast as jest.MockedFunction<typeof addToast>;

const mockGameApi = gameApi as jest.Mocked<typeof gameApi>;
const mockUseGameStore = useGameStore as jest.MockedFunction<typeof useGameStore>;
const mockUseGameSocket = useGameSocket as jest.MockedFunction<
  typeof useGameSocket
>;

describe("useGameActions", () => {
  const mockDict: Dictionary = {
    game: {
      play: {
        errors: {
          failedToGuess: "Failed to guess",
          failedToAnswer: "Failed to answer",
        },
        guess: {
          correctGuess: "Correct guess!",
          incorrectGuess: "Incorrect guess",
        },
        answers: {
          answerSubmitted: "Answer submitted",
        },
      },
    },
  } as Dictionary;

  const mockProps = {
    roomCode: "TEST123",
    currentPlayerId: "player-1",
    lang: "en",
    dict: mockDict,
    setPendingQuestion: jest.fn(),
    setIsAnswerModalOpen: jest.fn(),
  };

  const mockLeaveRoom = jest.fn();
  const mockEliminateCharacter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseGameSocket.mockReturnValue({
      leaveRoom: mockLeaveRoom,
    } as any);

    mockUseGameStore.mockReturnValue({
      playState: {
        gameState: {
          players: [
            { id: "player-1", username: "Player1" },
            { id: "player-2", username: "Player2" },
          ],
        },
        characters: [],
        questions: [],
        answers: new Map(),
        eliminatedCharacterIds: new Set(),
        flippedCharacterIds: new Set(),
        myCharacter: null,
      },
      eliminateCharacter: mockEliminateCharacter,
    } as any);
  });

  describe("handleLeaveGame", () => {
    it("calls leaveRoom and navigates to home", async () => {
      mockLeaveRoom.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useGameActions(mockProps));

      await act(async () => {
        await result.current.handleLeaveGame();
      });

      expect(mockLeaveRoom).toHaveBeenCalledWith({
        roomCode: "TEST123",
        playerId: "player-1",
      });
      expect(mockPush).toHaveBeenCalledWith("/en");
    });

    it("navigates home even if leaveRoom fails", async () => {
      mockLeaveRoom.mockRejectedValueOnce(new Error("Failed"));

      const { result } = renderHook(() => useGameActions(mockProps));

      await act(async () => {
        await result.current.handleLeaveGame();
      });

      expect(mockPush).toHaveBeenCalledWith("/en");
    });

    it("does not call leaveRoom if no currentPlayerId", async () => {
      const props = { ...mockProps, currentPlayerId: null };
      const { result } = renderHook(() => useGameActions(props));

      await act(async () => {
        await result.current.handleLeaveGame();
      });

      expect(mockLeaveRoom).not.toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/en");
    });
  });

  describe("handleOpenGuessModal", () => {
    it("opens guess modal", () => {
      const { result } = renderHook(() => useGameActions(mockProps));

      expect(result.current.isGuessModalOpen).toBe(false);

      act(() => {
        result.current.handleOpenGuessModal();
      });

      expect(result.current.isGuessModalOpen).toBe(true);
    });
  });

  describe("handleConfirmGuess", () => {
    it("submits guess successfully for 2-player game", async () => {
      mockGameApi.submitGuess.mockResolvedValueOnce({
        isCorrect: true,
        targetCharacterId: "char-1",
        targetCharacterName: "Character 1",
      } as any);

      const { result } = renderHook(() => useGameActions(mockProps));

      act(() => {
        result.current.handleOpenGuessModal();
      });

      await act(async () => {
        await result.current.handleConfirmGuess("char-1");
      });

      expect(mockGameApi.submitGuess).toHaveBeenCalledWith("TEST123", {
        playerId: "player-1",
        targetPlayerId: "player-2",
        targetCharacterId: "char-1",
      });
      expect(result.current.isGuessModalOpen).toBe(false);
    });

    it("eliminates character on incorrect guess", async () => {
      mockGameApi.submitGuess.mockResolvedValueOnce({
        isCorrect: false,
        targetCharacterId: "char-1",
        targetCharacterName: "Character 1",
      } as any);

      const { result } = renderHook(() => useGameActions(mockProps));

      await act(async () => {
        await result.current.handleConfirmGuess("char-1");
      });

      expect(mockEliminateCharacter).toHaveBeenCalledWith("char-1");
    });

    it("returns early if no characterId provided", async () => {
      const { result } = renderHook(() => useGameActions(mockProps));

      await act(async () => {
        await result.current.handleConfirmGuess("");
      });

      expect(mockGameApi.submitGuess).not.toHaveBeenCalled();
    });

    it("shows error if no currentPlayerId", async () => {
      const props = { ...mockProps, currentPlayerId: null };
      const { result } = renderHook(() => useGameActions(props));

      await act(async () => {
        await result.current.handleConfirmGuess("char-1");
      });

      expect(mockGameApi.submitGuess).not.toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "danger",
        }),
      );
    });

    it("shows error if no game state", async () => {
      mockUseGameStore.mockReturnValue({
        playState: null,
        eliminateCharacter: mockEliminateCharacter,
      } as any);

      const { result } = renderHook(() => useGameActions(mockProps));

      await act(async () => {
        await result.current.handleConfirmGuess("char-1");
      });

      expect(mockGameApi.submitGuess).not.toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "danger",
        }),
      );
    });
  });

  describe("handleSubmitAnswer", () => {
    it("submits answer successfully", async () => {
      mockGameApi.submitAnswer.mockResolvedValueOnce({} as any);

      const { result } = renderHook(() => useGameActions(mockProps));

      await act(async () => {
        await result.current.handleSubmitAnswer("q1", true);
      });

      expect(mockGameApi.submitAnswer).toHaveBeenCalledWith("TEST123", {
        playerId: "player-1",
        questionId: "q1",
        answerValue: true,
        answerText: undefined,
      });
      expect(mockProps.setPendingQuestion).toHaveBeenCalledWith(null);
      expect(mockProps.setIsAnswerModalOpen).toHaveBeenCalledWith(false);
    });

    it("submits answer with text", async () => {
      mockGameApi.submitAnswer.mockResolvedValueOnce({} as any);

      const { result } = renderHook(() => useGameActions(mockProps));

      await act(async () => {
        await result.current.handleSubmitAnswer("q1", "yes", "Custom answer");
      });

      expect(mockGameApi.submitAnswer).toHaveBeenCalledWith("TEST123", {
        playerId: "player-1",
        questionId: "q1",
        answerValue: "yes",
        answerText: "Custom answer",
      });
    });

    it("shows error if no currentPlayerId", async () => {
      const props = { ...mockProps, currentPlayerId: null };
      const { result } = renderHook(() => useGameActions(props));

      await act(async () => {
        await result.current.handleSubmitAnswer("q1", true);
      });

      expect(mockGameApi.submitAnswer).not.toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "danger",
        }),
      );
    });

    it("handles API error gracefully", async () => {
      mockGameApi.submitAnswer.mockRejectedValueOnce(
        new Error("Network error"),
      );

      const { result } = renderHook(() => useGameActions(mockProps));

      await act(async () => {
        await result.current.handleSubmitAnswer("q1", true);
      });

      expect(mockProps.setPendingQuestion).not.toHaveBeenCalled();
      expect(mockProps.setIsAnswerModalOpen).not.toHaveBeenCalled();
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({
          color: "danger",
        }),
      );
    });
  });

  describe("modal state management", () => {
    it("provides isGuessModalOpen state", () => {
      const { result } = renderHook(() => useGameActions(mockProps));

      expect(result.current.isGuessModalOpen).toBe(false);
    });

    it("provides setIsGuessModalOpen function", () => {
      const { result } = renderHook(() => useGameActions(mockProps));

      act(() => {
        result.current.setIsGuessModalOpen(true);
      });

      expect(result.current.isGuessModalOpen).toBe(true);

      act(() => {
        result.current.setIsGuessModalOpen(false);
      });

      expect(result.current.isGuessModalOpen).toBe(false);
    });

    it("provides isGuessing state", () => {
      const { result } = renderHook(() => useGameActions(mockProps));

      expect(result.current.isGuessing).toBe(false);
    });
  });
});
