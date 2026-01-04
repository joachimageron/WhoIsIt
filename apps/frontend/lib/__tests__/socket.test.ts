// Mock socket.io-client
const mockDisconnect = jest.fn();
const mockIo = jest.fn(() => ({
  disconnect: mockDisconnect,
}));

jest.mock("socket.io-client", () => ({
  io: (...args: any[]) => (mockIo as any)(...args),
}));

import { getSocket, disconnectSocket } from "../socket";

describe("socket", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockDisconnect.mockClear();
    mockIo.mockClear();
    // Reset socket instance by disconnecting
    disconnectSocket();
  });

  describe("getSocket", () => {
    it("creates a new socket instance on first call", () => {
      const socket = getSocket();

      expect(socket).toBeDefined();
      expect(mockIo).toHaveBeenCalledTimes(1);
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          autoConnect: false,
          transports: ["websocket"],
        }),
      );
    });

    it("returns same socket instance on subsequent calls", () => {
      const socket1 = getSocket();
      const socket2 = getSocket();

      expect(socket1).toBe(socket2);
      expect(mockIo).toHaveBeenCalledTimes(1);
    });

    it("uses NEXT_PUBLIC_SOCKET_URL environment variable", () => {
      getSocket();

      expect(mockIo).toHaveBeenCalledWith(
        expect.stringContaining("localhost:4000"),
        expect.any(Object),
      );
    });

    it("configures socket with autoConnect false", () => {
      getSocket();

      expect(mockIo).toHaveBeenCalledWith(expect.any(String), {
        autoConnect: false,
        transports: ["websocket"],
      });
    });

    it("configures socket with websocket transport only", () => {
      getSocket();

      expect(mockIo).toHaveBeenCalledWith(expect.any(String), {
        autoConnect: false,
        transports: ["websocket"],
      });
    });
  });

  describe("disconnectSocket", () => {
    beforeEach(() => {
      // Clear mocks again after the outer beforeEach disconnects
      mockDisconnect.mockClear();
      mockIo.mockClear();
    });

    it("disconnects existing socket", () => {
      getSocket();

      disconnectSocket();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });

    it("resets socket instance", () => {
      getSocket();
      expect(mockIo).toHaveBeenCalledTimes(1);

      disconnectSocket();

      // Getting socket again should create a new instance
      getSocket();
      expect(mockIo).toHaveBeenCalledTimes(2);
    });

    it("does not throw error when called with no existing socket", () => {
      expect(() => disconnectSocket()).not.toThrow();
    });

    it("does not attempt to disconnect when no socket exists", () => {
      disconnectSocket();

      expect(mockDisconnect).not.toHaveBeenCalled();
    });

    it("can be called multiple times safely", () => {
      getSocket();
      disconnectSocket();
      disconnectSocket();

      expect(mockDisconnect).toHaveBeenCalledTimes(1);
    });
  });
});
