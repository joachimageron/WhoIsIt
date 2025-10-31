import type {
  CreateGameRequest,
  JoinGameRequest,
  GameLobbyResponse,
  CharacterSetResponseDto,
  CharacterResponseDto,
  AskQuestionRequest,
  QuestionResponse,
  GameStateResponse,
  SubmitAnswerRequest,
  AnswerResponse,
  SubmitGuessRequest,
  GuessResponse,
  GameOverResult,
} from "@whois-it/contracts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/**
 * Get all character sets
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
      .catch(() => ({ message: "Failed to get character sets" }));

    throw new Error(error.message || "Failed to get character sets");
  }

  return response.json();
};

/**
 * Get characters for a character set
 */
export const getCharacters = async (
  characterSetId: string,
): Promise<CharacterResponseDto[]> => {
  const response = await fetch(
    `${API_URL}/character-sets/${characterSetId}/characters`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to get characters" }));

    throw new Error(error.message || "Failed to get characters");
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

/**
 * Get game state
 */
export const getGameState = async (
  roomCode: string,
): Promise<GameStateResponse> => {
  const response = await fetch(`${API_URL}/games/${roomCode}/state`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to get game state" }));

    throw new Error(error.message || "Failed to get game state");
  }

  return response.json();
};

/**
 * Ask a question
 */
export const askQuestion = async (
  roomCode: string,
  data: AskQuestionRequest,
): Promise<QuestionResponse> => {
  const response = await fetch(`${API_URL}/games/${roomCode}/questions`, {
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
      .catch(() => ({ message: "Failed to ask question" }));

    throw new Error(error.message || "Failed to ask question");
  }

  return response.json();
};

/**
 * Submit an answer to a question
 */
export const submitAnswer = async (
  roomCode: string,
  data: SubmitAnswerRequest,
): Promise<AnswerResponse> => {
  const response = await fetch(`${API_URL}/games/${roomCode}/answers`, {
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
      .catch(() => ({ message: "Failed to submit answer" }));

    throw new Error(error.message || "Failed to submit answer");
  }

  return response.json();
};

/**
 * Submit a guess
 */
export const submitGuess = async (
  roomCode: string,
  data: SubmitGuessRequest,
): Promise<GuessResponse> => {
  const response = await fetch(`${API_URL}/games/${roomCode}/guesses`, {
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
      .catch(() => ({ message: "Failed to submit guess" }));

    throw new Error(error.message || "Failed to submit guess");
  }

  return response.json();
};

/**
 * Get game results after game over
 */
export const getGameResults = async (
  roomCode: string,
): Promise<GameOverResult> => {
  const response = await fetch(`${API_URL}/games/${roomCode}/results`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to get game results" }));

    throw new Error(error.message || "Failed to get game results");
  }

  return response.json();
};
