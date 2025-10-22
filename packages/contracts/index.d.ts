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

// Socket.IO Events
export interface ServerToClientEvents {
  lobbyUpdate: (lobby: GameLobbyResponse) => void;
  playerJoined: (event: SocketPlayerJoinedEvent) => void;
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

