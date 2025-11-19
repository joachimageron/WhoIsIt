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
  SocketCharacterAssignedEvent,
  SocketQuestionAskedEvent,
  SocketAnswerSubmittedEvent,
  SocketGuessResultEvent,
  SocketGameOverEvent,
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

  const onCharacterAssigned = useCallback(
    (callback: (event: SocketCharacterAssignedEvent) => void) => {
      socketRef.current.on("characterAssigned", callback);

      return () => {
        socketRef.current.off("characterAssigned", callback);
      };
    },
    [],
  );

  const onQuestionAsked = useCallback(
    (callback: (event: SocketQuestionAskedEvent) => void) => {
      socketRef.current.on("questionAsked", callback);

      return () => {
        socketRef.current.off("questionAsked", callback);
      };
    },
    [],
  );

  const onAnswerSubmitted = useCallback(
    (callback: (event: SocketAnswerSubmittedEvent) => void) => {
      socketRef.current.on("answerSubmitted", callback);

      return () => {
        socketRef.current.off("answerSubmitted", callback);
      };
    },
    [],
  );

  const onGuessResult = useCallback(
    (callback: (event: SocketGuessResultEvent) => void) => {
      socketRef.current.on("guessResult", callback);

      return () => {
        socketRef.current.off("guessResult", callback);
      };
    },
    [],
  );

  const onGameOver = useCallback(
    (callback: (event: SocketGameOverEvent) => void) => {
      socketRef.current.on("gameOver", callback);

      return () => {
        socketRef.current.off("gameOver", callback);
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
    onCharacterAssigned,
    onQuestionAsked,
    onAnswerSubmitted,
    onGuessResult,
    onGameOver,
  };
};
