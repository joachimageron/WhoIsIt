import type {
  GameLobbyResponse,
  SocketJoinRoomRequest,
  SocketJoinRoomResponse,
  SocketLeaveRoomRequest,
  SocketUpdatePlayerReadyRequest,
  SocketUpdatePlayerReadyResponse,
  SocketPlayerJoinedEvent,
  SocketPlayerLeftEvent,
  SocketGameStartedEvent,
} from "@whois-it/contracts";

import { useEffect, useCallback, useRef } from "react";

import { getSocket, disconnectSocket } from "@/lib/socket";

export const useGameSocket = () => {
  const socketRef = useRef(getSocket());

  useEffect(() => {
    const socket = socketRef.current;

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  const joinRoom = useCallback(
    (data: SocketJoinRoomRequest): Promise<SocketJoinRoomResponse> => {
      return new Promise((resolve) => {
        socketRef.current.emit("joinRoom", data, (response) => {
          resolve(response);
        });
      });
    },
    [],
  );

  const leaveRoom = useCallback((data: SocketLeaveRoomRequest) => {
    return new Promise((resolve) => {
      socketRef.current.emit("leaveRoom", data, (response) => {
        resolve(response);
      });
    });
  }, []);

  const updatePlayerReady = useCallback(
    (
      data: SocketUpdatePlayerReadyRequest,
    ): Promise<SocketUpdatePlayerReadyResponse> => {
      return new Promise((resolve) => {
        socketRef.current.emit("updatePlayerReady", data, (response) => {
          resolve(response);
        });
      });
    },
    [],
  );

  const onLobbyUpdate = useCallback(
    (callback: (lobby: GameLobbyResponse) => void) => {
      socketRef.current.on("lobbyUpdate", callback);

      return () => {
        socketRef.current.off("lobbyUpdate", callback);
      };
    },
    [],
  );

  const onPlayerJoined = useCallback(
    (callback: (event: SocketPlayerJoinedEvent) => void) => {
      socketRef.current.on("playerJoined", callback);

      return () => {
        socketRef.current.off("playerJoined", callback);
      };
    },
    [],
  );

  const onPlayerLeft = useCallback(
    (callback: (event: SocketPlayerLeftEvent) => void) => {
      socketRef.current.on("playerLeft", callback);

      return () => {
        socketRef.current.off("playerLeft", callback);
      };
    },
    [],
  );

  const onGameStarted = useCallback(
    (callback: (event: SocketGameStartedEvent) => void) => {
      socketRef.current.on("gameStarted", callback);

      return () => {
        socketRef.current.off("gameStarted", callback);
      };
    },
    [],
  );

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    updatePlayerReady,
    onLobbyUpdate,
    onPlayerJoined,
    onPlayerLeft,
    onGameStarted,
  };
};
