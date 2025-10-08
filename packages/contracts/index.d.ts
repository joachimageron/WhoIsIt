export type GameStatus = "lobby" | "in_progress" | "completed" | "aborted";
export type GameVisibility = "public" | "private";
export type GamePlayerRole = "host" | "player" | "spectator";

export type CreateGameRequest = {
  characterSetId: string;
  hostDisplayName?: string;
  hostUserId?: string;
  visibility?: GameVisibility;
  maxPlayers?: number | null;
  turnTimerSeconds?: number | null;
  ruleConfig?: Record<string, unknown>;
};

export type JoinGameRequest = {
  displayName?: string;
  userId?: string;
  avatarUrl?: string;
};

export type GamePlayerResponse = {
  id: string;
  displayName: string;
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
