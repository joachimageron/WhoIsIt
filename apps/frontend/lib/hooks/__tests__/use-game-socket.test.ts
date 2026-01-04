import { renderHook } from "@testing-library/react";

import { getSocket, disconnectSocket } from "@/lib/socket";

import { useGameSocket } from "../use-game-socket";

// Mock socket module
const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockEmit = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();

const mockSocket = {
  connected: false,
  connect: mockConnect,
  disconnect: mockDisconnect,
  emit: mockEmit,
  on: mockOn,
  off: mockOff,
};

jest.mock("@/lib/socket", () => ({
  getSocket: jest.fn(() => mockSocket),
  disconnectSocket: jest.fn(),
}));

const mockGetSocket = getSocket as jest.MockedFunction<typeof getSocket>;
const mockDisconnectSocket = disconnectSocket as jest.MockedFunction<
  typeof disconnectSocket
>;

describe("useGameSocket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocket.connected = false;
  });

  describe("initialization", () => {
    it("gets socket instance on mount", () => {
      renderHook(() => useGameSocket());

      expect(mockGetSocket).toHaveBeenCalled();
    });

    it("connects socket if not already connected", () => {
      mockSocket.connected = false;

      renderHook(() => useGameSocket());

      expect(mockConnect).toHaveBeenCalled();
    });

    it("does not connect if already connected", () => {
      mockSocket.connected = true;

      renderHook(() => useGameSocket());

      expect(mockConnect).not.toHaveBeenCalled();
    });

    it("disconnects socket on unmount", () => {
      const { unmount } = renderHook(() => useGameSocket());

      unmount();

      expect(mockDisconnectSocket).toHaveBeenCalled();
    });
  });

  describe("joinRoom", () => {
    it("emits joinRoom event with callback", async () => {
      mockEmit.mockImplementation((event, data, callback) => {
        if (event === "joinRoom" && callback) {
          callback({ success: true });
        }
      });

      const { result } = renderHook(() => useGameSocket());

      const response = await result.current.joinRoom({
        roomCode: "TEST123",
        playerId: "player-1",
      });

      expect(mockEmit).toHaveBeenCalledWith(
        "joinRoom",
        { roomCode: "TEST123", playerId: "player-1" },
        expect.any(Function),
      );
      expect(response).toEqual({ success: true });
    });

    it("returns response from server", async () => {
      const mockResponse = {
        success: true,
        message: "Joined successfully",
      };

      mockEmit.mockImplementation((event, data, callback) => {
        if (callback) callback(mockResponse);
      });

      const { result } = renderHook(() => useGameSocket());

      const response = await result.current.joinRoom({
        roomCode: "TEST123",
        playerId: "player-1",
      });

      expect(response).toEqual(mockResponse);
    });
  });

  describe("leaveRoom", () => {
    it("emits leaveRoom event with callback", async () => {
      mockEmit.mockImplementation((event, data, callback) => {
        if (event === "leaveRoom" && callback) {
          callback({ success: true });
        }
      });

      const { result } = renderHook(() => useGameSocket());

      await result.current.leaveRoom({
        roomCode: "TEST123",
        playerId: "player-1",
      });

      expect(mockEmit).toHaveBeenCalledWith(
        "leaveRoom",
        { roomCode: "TEST123", playerId: "player-1" },
        expect.any(Function),
      );
    });
  });

  describe("updatePlayerReady", () => {
    it("emits updatePlayerReady event with callback", async () => {
      const mockResponse = { success: true, isReady: true };

      mockEmit.mockImplementation((event, data, callback) => {
        if (callback) callback(mockResponse);
      });

      const { result } = renderHook(() => useGameSocket());

      const response = await result.current.updatePlayerReady({
        roomCode: "TEST123",
        playerId: "player-1",
        isReady: true,
      });

      expect(mockEmit).toHaveBeenCalledWith(
        "updatePlayerReady",
        { roomCode: "TEST123", playerId: "player-1", isReady: true },
        expect.any(Function),
      );
      expect(response).toEqual(mockResponse);
    });
  });

  describe("event listeners", () => {
    it("registers lobbyUpdate listener and returns cleanup function", () => {
      const { result } = renderHook(() => useGameSocket());

      const callback = jest.fn();
      const cleanup = result.current.onLobbyUpdate(callback);

      expect(mockOn).toHaveBeenCalledWith("lobbyUpdate", callback);

      cleanup();

      expect(mockOff).toHaveBeenCalledWith("lobbyUpdate", callback);
    });

    it("registers playerJoined listener and returns cleanup function", () => {
      const { result } = renderHook(() => useGameSocket());

      const callback = jest.fn();
      const cleanup = result.current.onPlayerJoined(callback);

      expect(mockOn).toHaveBeenCalledWith("playerJoined", callback);

      cleanup();

      expect(mockOff).toHaveBeenCalledWith("playerJoined", callback);
    });

    it("registers playerLeft listener and returns cleanup function", () => {
      const { result } = renderHook(() => useGameSocket());

      const callback = jest.fn();
      const cleanup = result.current.onPlayerLeft(callback);

      expect(mockOn).toHaveBeenCalledWith("playerLeft", callback);

      cleanup();

      expect(mockOff).toHaveBeenCalledWith("playerLeft", callback);
    });

    it("registers gameStarted listener and returns cleanup function", () => {
      const { result } = renderHook(() => useGameSocket());

      const callback = jest.fn();
      const cleanup = result.current.onGameStarted(callback);

      expect(mockOn).toHaveBeenCalledWith("gameStarted", callback);

      cleanup();

      expect(mockOff).toHaveBeenCalledWith("gameStarted", callback);
    });

    it("registers questionAsked listener and returns cleanup function", () => {
      const { result } = renderHook(() => useGameSocket());

      const callback = jest.fn();
      const cleanup = result.current.onQuestionAsked(callback);

      expect(mockOn).toHaveBeenCalledWith("questionAsked", callback);

      cleanup();

      expect(mockOff).toHaveBeenCalledWith("questionAsked", callback);
    });

    it("registers answerSubmitted listener and returns cleanup function", () => {
      const { result } = renderHook(() => useGameSocket());

      const callback = jest.fn();
      const cleanup = result.current.onAnswerSubmitted(callback);

      expect(mockOn).toHaveBeenCalledWith("answerSubmitted", callback);

      cleanup();

      expect(mockOff).toHaveBeenCalledWith("answerSubmitted", callback);
    });

    it("registers guessResult listener and returns cleanup function", () => {
      const { result } = renderHook(() => useGameSocket());

      const callback = jest.fn();
      const cleanup = result.current.onGuessResult(callback);

      expect(mockOn).toHaveBeenCalledWith("guessResult", callback);

      cleanup();

      expect(mockOff).toHaveBeenCalledWith("guessResult", callback);
    });

    it("registers gameOver listener and returns cleanup function", () => {
      const { result } = renderHook(() => useGameSocket());

      const callback = jest.fn();
      const cleanup = result.current.onGameOver(callback);

      expect(mockOn).toHaveBeenCalledWith("gameOver", callback);

      cleanup();

      expect(mockOff).toHaveBeenCalledWith("gameOver", callback);
    });
  });

  describe("socket reference", () => {
    it("provides socket instance in return value", () => {
      const { result } = renderHook(() => useGameSocket());

      expect(result.current.socket).toBe(mockSocket);
    });

    it("maintains stable socket reference", () => {
      const { result, rerender } = renderHook(() => useGameSocket());

      const firstSocket = result.current.socket;

      rerender();
      const secondSocket = result.current.socket;

      expect(firstSocket).toBe(secondSocket);
    });
  });

  describe("callback stability", () => {
    it("maintains stable function references", () => {
      const { result, rerender } = renderHook(() => useGameSocket());

      const firstJoinRoom = result.current.joinRoom;
      const firstLeaveRoom = result.current.leaveRoom;
      const firstUpdatePlayerReady = result.current.updatePlayerReady;

      rerender();

      expect(result.current.joinRoom).toBe(firstJoinRoom);
      expect(result.current.leaveRoom).toBe(firstLeaveRoom);
      expect(result.current.updatePlayerReady).toBe(firstUpdatePlayerReady);
    });

    it("maintains stable listener function references", () => {
      const { result, rerender } = renderHook(() => useGameSocket());

      const firstOnLobbyUpdate = result.current.onLobbyUpdate;
      const firstOnPlayerJoined = result.current.onPlayerJoined;
      const firstOnGameStarted = result.current.onGameStarted;

      rerender();

      expect(result.current.onLobbyUpdate).toBe(firstOnLobbyUpdate);
      expect(result.current.onPlayerJoined).toBe(firstOnPlayerJoined);
      expect(result.current.onGameStarted).toBe(firstOnGameStarted);
    });
  });
});
