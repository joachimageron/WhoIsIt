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

// Gameplay types
export type QuestionCategory = "trait" | "direct" | "meta";
export type AnswerType = "boolean" | "text";
export type AnswerValue = "yes" | "no" | "unsure";
export type RoundState = "awaiting_question" | "awaiting_answer" | "awaiting_guess" | "closed";

export type AskQuestionRequest = {
  roomCode: string;
  playerId: string;
  targetPlayerId?: string;
  questionText: string;
  category: QuestionCategory;
  answerType: AnswerType;
};

export type SubmitAnswerRequest = {
  roomCode: string;
  playerId: string;
  questionId: string;
  answerValue: AnswerValue;
  answerText?: string;
  latencyMs?: number;
};

export type MakeGuessRequest = {
  roomCode: string;
  playerId: string;
  targetPlayerId?: string;
  targetCharacterId: string;
  latencyMs?: number;
};

export type QuestionResponse = {
  id: string;
  roundId: string;
  askedById: string;
  askedByUsername: string;
  targetPlayerId?: string;
  targetPlayerUsername?: string;
  questionText: string;
  category: QuestionCategory;
  answerType: AnswerType;
  askedAt: string;
};

export type AnswerResponse = {
  id: string;
  questionId: string;
  answeredById: string;
  answeredByUsername: string;
  answerValue: AnswerValue;
  answerText?: string;
  answeredAt: string;
};

export type GuessResponse = {
  id: string;
  roundId: string;
  guessedById: string;
  guessedByUsername: string;
  targetPlayerId?: string;
  targetPlayerUsername?: string;
  targetCharacterId: string;
  targetCharacterName: string;
  isCorrect: boolean;
  guessedAt: string;
};

export type RoundResponse = {
  id: string;
  roundNumber: number;
  activePlayerId?: string;
  activePlayerUsername?: string;
  state: RoundState;
  startedAt?: string;
  endedAt?: string;
  durationMs?: number;
};

export type PlayerScore = {
  playerId: string;
  username: string;
  score: number;
  isEliminated: boolean;
  questionsAsked: number;
  correctGuesses: number;
  incorrectGuesses: number;
};

export type GameOverResult = {
  winnerId?: string;
  winnerUsername?: string;
  scores: PlayerScore[];
  totalRounds: number;
  gameDurationMs: number;
};

export type SocketQuestionAskedEvent = {
  roomCode: string;
  question: QuestionResponse;
  round: RoundResponse;
};

export type SocketAnswerSubmittedEvent = {
  roomCode: string;
  answer: AnswerResponse;
  question: QuestionResponse;
  round: RoundResponse;
};

export type SocketGuessResultEvent = {
  roomCode: string;
  guess: GuessResponse;
  round: RoundResponse;
};

export type SocketRoundEndedEvent = {
  roomCode: string;
  round: RoundResponse;
  nextRound?: RoundResponse;
};

export type SocketGameOverEvent = {
  roomCode: string;
  result: GameOverResult;
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
  roundEnded: (event: SocketRoundEndedEvent) => void;
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

export type TraitValueResponseDto = {
  id: string;
  traitId: string;
  traitName: string;
  traitSlug: string;
  valueText: string;
};

export type CharacterResponseDto = {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  summary?: string | null;
  metadata: Record<string, unknown>;
  isActive: boolean;
  traits?: TraitValueResponseDto[];
};

