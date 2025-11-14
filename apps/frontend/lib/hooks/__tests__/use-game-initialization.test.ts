import type { Dictionary } from "@/dictionaries";

import { renderHook, waitFor } from "@testing-library/react";

import { useGameInitialization } from "../use-game-initialization";

import * as gameApi from "@/lib/game-api";
import { useAuthStore } from "@/store/auth-store";
import { useGameStore } from "@/store/game-store";
import { useGameSocket } from "@/lib/hooks/use-game-socket";

// Mock dependencies
jest.mock("@/lib/game-api");
jest.mock("@/store/auth-store");
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

const mockGameApi = gameApi as jest.Mocked<typeof gameApi>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;
const mockUseGameStore = useGameStore as jest.MockedFunction<
  typeof useGameStore
>;
const mockUseGameSocket = useGameSocket as jest.MockedFunction<
  typeof useGameSocket
>;
const mockPush = jest.fn();

describe("useGameInitialization", () => {
  const mockDict: Dictionary = {
    game: {
      play: {
        errors: {
          failedToLoad: "Failed to load game",
        },
      },
    },
  } as Dictionary;

  const mockProps = {
    roomCode: "TEST123",
    lang: "en",
    dict: mockDict,
  };

  const mockJoinRoom = jest.fn();
  const mockSetGameState = jest.fn();
  const mockSetCharacters = jest.fn();
  const mockSetMyCharacter = jest.fn();
  const mockAddQuestion = jest.fn();
  const mockAddAnswer = jest.fn();
  const mockResetPlayState = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseGameSocket.mockReturnValue({
      joinRoom: mockJoinRoom,
    } as any);

    mockUseGameStore.mockReturnValue({
      setGameState: mockSetGameState,
      setCharacters: mockSetCharacters,
      setMyCharacter: mockSetMyCharacter,
      addQuestion: mockAddQuestion,
      addAnswer: mockAddAnswer,
      resetPlayState: mockResetPlayState,
    } as any);

    mockUseAuthStore.mockReturnValue({
      user: null,
    } as any);
  });

  describe("initialization with authenticated user", () => {
    it("loads game state and joins room for authenticated user", async () => {
      const mockUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        avatarUrl: null,
      };

      mockUseAuthStore.mockReturnValue({
        user: mockUser,
      } as any);

      const mockGameState = {
        id: "game-1",
        roomCode: "TEST123",
        players: [
          { id: "player-1", userId: "user-1", username: "testuser" },
          { id: "player-2", userId: "user-2", username: "player2" },
        ],
      };

      const mockLobby = {
        roomCode: "TEST123",
        characterSetId: "set-1",
        turnTimerSeconds: 60,
      };

      const mockCharacters = [
        { id: "char-1", name: "Character 1" },
        { id: "char-2", name: "Character 2" },
      ];

      const mockMyCharacter = {
        id: "char-1",
        name: "Character 1",
      };

      mockGameApi.getGameState.mockResolvedValueOnce(mockGameState as any);
      mockGameApi.getLobby.mockResolvedValueOnce(mockLobby as any);
      mockGameApi.getCharacters.mockResolvedValueOnce(mockCharacters as any);
      mockGameApi.getPlayerCharacter.mockResolvedValueOnce(
        mockMyCharacter as any,
      );
      mockGameApi.getQuestions.mockResolvedValueOnce([]);
      mockGameApi.getAnswers.mockResolvedValueOnce([]);
      mockJoinRoom.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useGameInitialization(mockProps));

      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGameApi.getGameState).toHaveBeenCalledWith("TEST123");
      expect(mockGameApi.getLobby).toHaveBeenCalledWith("TEST123");
      expect(mockGameApi.getCharacters).toHaveBeenCalledWith("set-1");
      expect(mockGameApi.getPlayerCharacter).toHaveBeenCalledWith(
        "TEST123",
        "player-1",
      );
      expect(mockJoinRoom).toHaveBeenCalledWith({
        roomCode: "TEST123",
        playerId: "player-1",
      });
      expect(result.current.currentPlayerId).toBe("player-1");
      expect(result.current.lobby).toEqual(mockLobby);
    });
  });

  describe("initialization with guest user", () => {
    it("loads game state for guest user", async () => {
      const mockGuestUser = {
        id: "guest-1",
        email: "",
        username: "guestuser",
        avatarUrl: null,
        isGuest: true,
      };

      mockUseAuthStore.mockReturnValue({
        user: mockGuestUser,
      } as any);

      const mockGameState = {
        id: "game-1",
        roomCode: "TEST123",
        players: [
          { id: "player-1", userId: null, username: "guestuser" },
          { id: "player-2", userId: "user-2", username: "player2" },
        ],
      };

      const mockLobby = {
        roomCode: "TEST123",
        characterSetId: "set-1",
        turnTimerSeconds: 60,
      };

      mockGameApi.getGameState.mockResolvedValueOnce(mockGameState as any);
      mockGameApi.getLobby.mockResolvedValueOnce(mockLobby as any);
      mockGameApi.getCharacters.mockResolvedValueOnce([]);
      mockGameApi.getPlayerCharacter.mockResolvedValueOnce({
        id: "char-1",
      } as any);
      mockGameApi.getQuestions.mockResolvedValueOnce([]);
      mockGameApi.getAnswers.mockResolvedValueOnce([]);
      mockJoinRoom.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useGameInitialization(mockProps));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currentPlayerId).toBe("player-1");
    });
  });

  describe("error handling", () => {
    it("redirects to home on error", async () => {
      const mockUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        avatarUrl: null,
      };

      mockUseAuthStore.mockReturnValue({
        user: mockUser,
      } as any);

      mockGameApi.getGameState.mockRejectedValueOnce(
        new Error("Failed to load"),
      );

      const { result } = renderHook(() => useGameInitialization(mockProps));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockPush).toHaveBeenCalledWith("/en");
    });

    it("handles missing player character gracefully", async () => {
      const mockUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        avatarUrl: null,
      };

      mockUseAuthStore.mockReturnValue({
        user: mockUser,
      } as any);

      const mockGameState = {
        id: "game-1",
        roomCode: "TEST123",
        players: [{ id: "player-1", userId: "user-1", username: "testuser" }],
      };

      mockGameApi.getGameState.mockResolvedValueOnce(mockGameState as any);
      mockGameApi.getLobby.mockResolvedValueOnce({
        characterSetId: "set-1",
      } as any);
      mockGameApi.getCharacters.mockResolvedValueOnce([]);
      mockGameApi.getPlayerCharacter.mockRejectedValueOnce(
        new Error("Not assigned yet"),
      );
      mockGameApi.getQuestions.mockResolvedValueOnce([]);
      mockGameApi.getAnswers.mockResolvedValueOnce([]);
      mockJoinRoom.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useGameInitialization(mockProps));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not crash or redirect
      expect(mockPush).not.toHaveBeenCalled();
      expect(result.current.currentPlayerId).toBe("player-1");
    });

    it("redirects when join room fails", async () => {
      const mockUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        avatarUrl: null,
      };

      mockUseAuthStore.mockReturnValue({
        user: mockUser,
      } as any);

      const mockGameState = {
        id: "game-1",
        roomCode: "TEST123",
        players: [{ id: "player-1", userId: "user-1", username: "testuser" }],
      };

      mockGameApi.getGameState.mockResolvedValueOnce(mockGameState as any);
      mockGameApi.getLobby.mockResolvedValueOnce({
        characterSetId: "set-1",
      } as any);
      mockGameApi.getCharacters.mockResolvedValueOnce([]);
      mockGameApi.getPlayerCharacter.mockResolvedValueOnce({
        id: "char-1",
      } as any);
      mockGameApi.getQuestions.mockResolvedValueOnce([]);
      mockGameApi.getAnswers.mockResolvedValueOnce([]);
      mockJoinRoom.mockResolvedValueOnce({
        success: false,
        error: "Room is full",
      });

      const { result } = renderHook(() => useGameInitialization(mockProps));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockPush).toHaveBeenCalledWith("/en");
    });
  });

  describe("loading questions and answers", () => {
    it("loads existing questions and answers", async () => {
      const mockUser = {
        id: "user-1",
        username: "testuser",
        email: "test@example.com",
        avatarUrl: null,
      };

      mockUseAuthStore.mockReturnValue({
        user: mockUser,
      } as any);

      const mockQuestions = [
        { id: "q1", text: "Question 1" },
        { id: "q2", text: "Question 2" },
      ];

      const mockAnswers = [
        { id: "a1", questionId: "q1", answerValue: true },
        { id: "a2", questionId: "q2", answerValue: false },
      ];

      mockGameApi.getGameState.mockResolvedValueOnce({
        id: "game-1",
        players: [{ id: "player-1", userId: "user-1", username: "testuser" }],
      } as any);
      mockGameApi.getLobby.mockResolvedValueOnce({
        characterSetId: "set-1",
      } as any);
      mockGameApi.getCharacters.mockResolvedValueOnce([]);
      mockGameApi.getPlayerCharacter.mockResolvedValueOnce({
        id: "char-1",
      } as any);
      mockGameApi.getQuestions.mockResolvedValueOnce(mockQuestions as any);
      mockGameApi.getAnswers.mockResolvedValueOnce(mockAnswers as any);
      mockJoinRoom.mockResolvedValueOnce({ success: true });

      const { result } = renderHook(() => useGameInitialization(mockProps));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockAddQuestion).toHaveBeenCalledTimes(2);
      expect(mockAddQuestion).toHaveBeenCalledWith(mockQuestions[0]);
      expect(mockAddQuestion).toHaveBeenCalledWith(mockQuestions[1]);

      expect(mockAddAnswer).toHaveBeenCalledTimes(2);
      expect(mockAddAnswer).toHaveBeenCalledWith(mockAnswers[0]);
      expect(mockAddAnswer).toHaveBeenCalledWith(mockAnswers[1]);
    });
  });

  describe("no user or guest session", () => {
    it("does not initialize when no user and no guest session", async () => {
      const { result } = renderHook(() => useGameInitialization(mockProps));

      // Should complete loading immediately since there's nothing to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should not call API methods
      expect(mockGameApi.getGameState).not.toHaveBeenCalled();
      expect(mockJoinRoom).not.toHaveBeenCalled();
    });
  });
});
