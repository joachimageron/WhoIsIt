export type GameStatus = "lobby" | "in_progress" | "completed" | "aborted";
export type GameVisibility = "public" | "private";
export type GamePlayerRole = "host" | "player" | "spectator";

export type CreateGameRequest = {
  characterSetId: string;
  hostUsername?: string;
  hostUserId?: string;
  visibility?: GameVisibility;
  maxPlayers?: number | null;
  turnTimerSeconds?: number | null;
  ruleConfig?: Record<string, unknown>;
};

export type JoinGameRequest = {
  username?: string;
  userId?: string;
  avatarUrl?: string;
};

export type GamePlayerResponse = {
  id: string;
  username: string;
  avatarUrl?: string;
  role: GamePlayerRole;
  isReady: boolean;
  joinedAt: string;
  leftAt?: string;
  userId?: string;
};

export type GameLobbyResponse = {
  id: string;
  roomCode: string;
  status: GameStatus;
  visibility: GameVisibility;
  hostUserId?: string;
  characterSetId: string;
  maxPlayers?: number;
  turnTimerSeconds?: number;
  ruleConfig: Record<string, unknown>;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  players: GamePlayerResponse[];
};

// Socket.IO Event Types
export type SocketJoinRoomRequest = {
  roomCode: string;
  playerId?: string;
};

export type SocketJoinRoomResponse = {
  success: boolean;
  lobby?: GameLobbyResponse;
  error?: string;
};

export type SocketLeaveRoomRequest = {
  roomCode: string;
  playerId?: string;
};

export type SocketLeaveRoomResponse = {
  success: boolean;
  error?: string;
};

export type SocketUpdatePlayerReadyRequest = {
  roomCode: string;
  playerId: string;
  isReady: boolean;
};

export type SocketUpdatePlayerReadyResponse = {
  success: boolean;
  lobby?: GameLobbyResponse;
  error?: string;
};

export type SocketPlayerJoinedEvent = {
  roomCode: string;
  lobby: GameLobbyResponse;
};

export type SocketPlayerLeftEvent = {
  roomCode: string;
  lobby: GameLobbyResponse;
};

export type SocketGameStartedEvent = {
  roomCode: string;
  lobby: GameLobbyResponse;
};

// Socket.IO Events
export interface ServerToClientEvents {
  lobbyUpdate: (lobby: GameLobbyResponse) => void;
  playerJoined: (event: SocketPlayerJoinedEvent) => void;
  playerLeft: (event: SocketPlayerLeftEvent) => void;
  gameStarted: (event: SocketGameStartedEvent) => void;
  questionAsked: (event: SocketQuestionAskedEvent) => void;
  answerSubmitted: (event: SocketAnswerSubmittedEvent) => void;
  guessResult: (event: SocketGuessResultEvent) => void;
  gameOver: (event: SocketGameOverEvent) => void;
}

export interface ClientToServerEvents {
  joinRoom: (
    data: SocketJoinRoomRequest,
    callback: (response: SocketJoinRoomResponse) => void,
  ) => void;
  leaveRoom: (
    data: SocketLeaveRoomRequest,
    callback: (response: SocketLeaveRoomResponse) => void,
  ) => void;
  updatePlayerReady: (
    data: SocketUpdatePlayerReadyRequest,
    callback: (response: SocketUpdatePlayerReadyResponse) => void,
  ) => void;
}

// Character Sets API Types
export type CharacterSetResponseDto = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  visibility: string;
  isDefault: boolean;
  metadata: Record<string, unknown>;
  characterCount?: number;
};

export type CharacterResponseDto = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  summary?: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
};

// Questions API Types
export type AskQuestionRequest = {
  playerId: string;
  targetPlayerId?: string;
  questionText: string;
};

export type QuestionResponse = {
  id: string;
  roundId: string;
  roundNumber: number;
  askedByPlayerId: string;
  askedByPlayerUsername: string;
  targetPlayerId?: string;
  targetPlayerUsername?: string;
  questionText: string;
  askedAt: string;
};

export type GameStateResponse = {
  id: string;
  roomCode: string;
  status: GameStatus;
  currentRoundNumber: number;
  currentRoundState: string;
  activePlayerId?: string;
  activePlayerUsername?: string;
  players: GamePlayerResponse[];
};

// Socket.IO Question Events
export type SocketQuestionAskedEvent = {
  roomCode: string;
  question: QuestionResponse;
  gameState: GameStateResponse;
};

// Answers API Types
export type AnswerValue = "yes" | "no" | "unsure";

export type SubmitAnswerRequest = {
  playerId: string;
  questionId: string;
  answerValue: AnswerValue;
  answerText?: string;
};

export type AnswerResponse = {
  id: string;
  questionId: string;
  answeredByPlayerId: string;
  answeredByPlayerUsername: string;
  answerValue: AnswerValue;
  answerText?: string;
  latencyMs?: number;
  answeredAt: string;
};

// Socket.IO Answer Events
export type SocketAnswerSubmittedEvent = {
  roomCode: string;
  answer: AnswerResponse;
  gameState: GameStateResponse;
};

// Guesses API Types
export type SubmitGuessRequest = {
  playerId: string;
  targetPlayerId?: string;
  targetCharacterId: string;
};

export type GuessResponse = {
  id: string;
  roundId: string;
  roundNumber: number;
  guessedByPlayerId: string;
  guessedByPlayerUsername: string;
  targetPlayerId?: string;
  targetPlayerUsername?: string;
  targetCharacterId: string;
  targetCharacterName: string;
  isCorrect: boolean;
  latencyMs?: number;
  guessedAt: string;
};

// Socket.IO Guess Events
export type SocketGuessResultEvent = {
  roomCode: string;
  guess: GuessResponse;
  gameState: GameStateResponse;
};

// Game Results and Scoring Types
export type PlayerGameResult = {
  playerId: string;
  playerUsername: string;
  userId?: string;
  score: number;
  questionsAsked: number;
  questionsAnswered: number;
  correctGuesses: number;
  incorrectGuesses: number;
  timePlayedSeconds: number;
  isWinner: boolean;
  placement: number;
  leftAt?: string;
};

export type GameOverResult = {
  gameId: string;
  roomCode: string;
  winnerId?: string;
  winnerUsername?: string;
  totalRounds: number;
  gameDurationSeconds: number;
  endReason: "victory" | "last_player_standing" | "aborted";
  players: PlayerGameResult[];
};

// Socket.IO Game Over Event
export type SocketGameOverEvent = {
  roomCode: string;
  result: GameOverResult;
};

