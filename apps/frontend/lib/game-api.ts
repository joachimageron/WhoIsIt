import type {
  CreateGameRequest,
  JoinGameRequest,
  GameLobbyResponse,
} from "@whois-it/contracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Create a new game
 */
export const createGame = async (
  data: CreateGameRequest,
): Promise<GameLobbyResponse> => {
  const response = await fetch(`${API_URL}/games`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create game" }));

    throw new Error(error.message || "Failed to create game");
  }

  return response.json();
};

/**
 * Join an existing game
 */
export const joinGame = async (
  roomCode: string,
  data: JoinGameRequest,
): Promise<GameLobbyResponse> => {
  const response = await fetch(`${API_URL}/games/${roomCode}/join`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to join game" }));

    throw new Error(error.message || "Failed to join game");
  }

  return response.json();
};

/**
 * Get lobby details by room code
 */
export const getLobby = async (
  roomCode: string,
): Promise<GameLobbyResponse> => {
  const response = await fetch(`${API_URL}/games/${roomCode}`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to get lobby" }));

    throw new Error(error.message || "Failed to get lobby");
  }

  return response.json();
};

/**
 * Start a game
 */
export const startGame = async (
  roomCode: string,
): Promise<GameLobbyResponse> => {
  const response = await fetch(`${API_URL}/games/${roomCode}/start`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to start game" }));

    throw new Error(error.message || "Failed to start game");
  }

  return response.json();
};
