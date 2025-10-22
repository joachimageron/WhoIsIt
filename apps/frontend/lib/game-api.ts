import type {
  GameLobbyResponse, CharacterSetResponseDto, CreateGameRequest, JoinGameRequest
} from "@whois-it/contracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Join an existing game using a room code
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

  const lobby: GameLobbyResponse = await response.json();

  return lobby;
};

/**
 * Get the current lobby state for a room code
 */
export const getLobby = async (
  roomCode: string,
): Promise<GameLobbyResponse> => {
  const response = await fetch(`${API_URL}/games/${roomCode}`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch lobby");
  }

  const lobby: GameLobbyResponse = await response.json();

  return lobby;
};

/**
 * Get all available character sets
 */
export const getCharacterSets = async (): Promise<
  CharacterSetResponseDto[]
> => {
  const response = await fetch(`${API_URL}/character-sets`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch character sets" }));

    throw new Error(error.message || "Failed to fetch character sets");
  }

  return response.json();
};

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
