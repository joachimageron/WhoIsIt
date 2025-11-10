import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GamePlayerRole,
  GameStatus,
  GameVisibility,
} from '../../database/enums';
import { CharacterSet, Game, GamePlayer, User } from '../../database/entities';
import type {
  CreateGameRequest,
  GameLobbyResponse,
  GamePlayerResponse,
  JoinGameRequest,
  GameVisibility as ContractGameVisibility,
} from '@whois-it/contracts';

@Injectable()
export class GameLobbyService {
  private static readonly ROOM_CODE_LENGTH = 5;
  private static readonly MAX_ROOM_CODE_ATTEMPTS = 10;

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private readonly playerRepository: Repository<GamePlayer>,
    @InjectRepository(CharacterSet)
    private readonly characterSetRepository: Repository<CharacterSet>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Normalize room code to uppercase and trimmed
   */
  normalizeRoomCode(roomCode: string): string {
    return roomCode.trim().toUpperCase();
  }

  async createGame(request: CreateGameRequest): Promise<GameLobbyResponse> {
    const characterSet = await this.characterSetRepository.findOne({
      where: { id: request.characterSetId },
    });

    if (!characterSet) {
      throw new NotFoundException('Character set not found');
    }

    let hostUser: User | null = null;
    if (request.hostUserId) {
      hostUser = await this.userRepository.findOne({
        where: { id: request.hostUserId },
      });

      if (!hostUser) {
        throw new NotFoundException('Host user not found');
      }
    }

    const roomCode = await this.generateRoomCode();

    const game = this.gameRepository.create({
      roomCode,
      characterSet,
      host: hostUser ?? undefined,
      status: GameStatus.LOBBY,
      visibility: this.resolveVisibility(request.visibility),
      turnTimerSeconds: this.normalizeOptionalNumber(request.turnTimerSeconds),
      ruleConfig: request.ruleConfig ?? {},
    });

    const savedGame = await this.gameRepository.save(game);

    const hostUsername = request.hostUsername?.trim() || hostUser?.username;
    if (!hostUsername) {
      throw new BadRequestException('A host username is required');
    }

    const hostPlayer = this.playerRepository.create({
      game: savedGame,
      user: hostUser ?? undefined,
      username: hostUsername,
      avatarUrl: hostUser?.avatarUrl ?? undefined,
      role: GamePlayerRole.HOST,
      isReady: true,
    });

    await this.playerRepository.save(hostPlayer);

    const hydratedGame = await this.loadLobbyById(savedGame.id);
    return this.mapToLobbyResponse(hydratedGame);
  }

  async joinGame(
    roomCode: string,
    request: JoinGameRequest,
  ): Promise<GameLobbyResponse> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        characterSet: true,
        host: true,
        players: { user: true },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.LOBBY) {
      throw new BadRequestException('Game is not joinable');
    }

    let joiningUser: User | null = null;
    if (request.userId) {
      joiningUser = await this.userRepository.findOne({
        where: { id: request.userId },
      });
      if (!joiningUser) {
        throw new NotFoundException('Joining user not found');
      }
    }

    // Check if this player already exists in the game (including those who left)
    let existingPlayer: GamePlayer | undefined;

    if (joiningUser) {
      // For authenticated users, match by userId
      existingPlayer = game.players?.find(
        (player) => player.user?.id === joiningUser?.id,
      );
    } else {
      // For guests, match by username (case-insensitive)
      const requestUsername = request.username?.trim();
      if (requestUsername) {
        existingPlayer = game.players?.find(
          (player) =>
            !player.user && // Must be a guest player
            player.username &&
            player.username.toLowerCase() === requestUsername.toLowerCase(),
        );
      }
    }

    const username = request.username?.trim() || joiningUser?.username;
    if (!username) {
      throw new BadRequestException('A username is required');
    }

    if (existingPlayer) {
      // If player already exists and hasn't left, return current state
      if (!existingPlayer.leftAt) {
        return this.mapToLobbyResponse(game);
      }

      // Player is rejoining - clear leftAt and reset ready state
      existingPlayer.leftAt = null;
      existingPlayer.isReady = false;
      existingPlayer.username = username; // Update username in case it changed

      const preferredAvatar = request.avatarUrl?.trim();
      if (preferredAvatar && preferredAvatar.length > 0) {
        existingPlayer.avatarUrl = preferredAvatar;
      } else if (joiningUser?.avatarUrl) {
        existingPlayer.avatarUrl = joiningUser.avatarUrl;
      }

      await this.playerRepository.save(existingPlayer);

      const refreshedGame = await this.loadLobbyById(game.id);
      return this.mapToLobbyResponse(refreshedGame);
    }

    // Check if game is full (only count active players) - games are limited to 2 players
    const activePlayers = game.players?.filter((p) => !p.leftAt) ?? [];
    if (activePlayers.length >= 2) {
      throw new BadRequestException('Game is full');
    }

    // Create new player
    const preferredAvatar = request.avatarUrl?.trim();

    const player = this.playerRepository.create({
      game,
      user: joiningUser ?? undefined,
      username,
      avatarUrl:
        preferredAvatar && preferredAvatar.length > 0
          ? preferredAvatar
          : (joiningUser?.avatarUrl ?? undefined),
      role: GamePlayerRole.PLAYER,
      isReady: false,
    });

    await this.playerRepository.save(player);

    const refreshedGame = await this.loadLobbyById(game.id);
    return this.mapToLobbyResponse(refreshedGame);
  }

  async getLobbyByRoomCode(roomCode: string): Promise<GameLobbyResponse> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        characterSet: true,
        host: true,
        players: { user: true },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    return this.mapToLobbyResponse(game);
  }

  async updatePlayerReady(
    playerId: string,
    isReady: boolean,
  ): Promise<GamePlayer> {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: { game: true },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    if (player.game.status !== GameStatus.LOBBY) {
      throw new BadRequestException('Game is not in lobby state');
    }

    player.isReady = isReady;
    return this.playerRepository.save(player);
  }

  async markPlayerAsLeft(playerId: string): Promise<GamePlayer> {
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: { game: true },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    player.leftAt = new Date();
    return this.playerRepository.save(player);
  }

  private async loadLobbyById(id: string): Promise<Game> {
    const game = await this.gameRepository.findOne({
      where: { id },
      relations: {
        characterSet: true,
        host: true,
        players: { user: true },
      },
      order: {
        players: {
          joinedAt: 'ASC',
        },
      },
    });

    if (!game) {
      throw new InternalServerErrorException(
        'Game disappeared during processing',
      );
    }

    return game;
  }

  mapToLobbyResponse(game: Game): GameLobbyResponse {
    const players = [...(game.players ?? [])]
      .filter((player) => !player.leftAt) // Filter out players who have left
      .sort((a, b) => {
        const aTime = a.joinedAt?.getTime?.() ?? 0;
        const bTime = b.joinedAt?.getTime?.() ?? 0;
        return aTime - bTime;
      });

    const playerResponses: GamePlayerResponse[] = players.map((player) => ({
      id: player.id,
      username: player.username,
      avatarUrl: player.avatarUrl ?? undefined,
      role: player.role,
      isReady: player.isReady,
      joinedAt: player.joinedAt?.toISOString?.() ?? new Date().toISOString(),
      leftAt: player.leftAt?.toISOString?.(),
      userId: player.user?.id,
    }));

    return {
      id: game.id,
      roomCode: game.roomCode,
      status: game.status,
      visibility: game.visibility,
      hostUserId: game.host?.id,
      characterSetId: game.characterSet.id,
      turnTimerSeconds:
        typeof game.turnTimerSeconds === 'number'
          ? game.turnTimerSeconds
          : undefined,
      ruleConfig: game.ruleConfig ?? {},
      createdAt: game.createdAt?.toISOString?.() ?? new Date().toISOString(),
      startedAt: game.startedAt?.toISOString?.(),
      endedAt: game.endedAt?.toISOString?.(),
      players: playerResponses,
    };
  }

  private resolveVisibility(
    visibility?: ContractGameVisibility,
  ): GameVisibility {
    if (visibility === 'public') {
      return GameVisibility.PUBLIC;
    }

    if (visibility === 'private') {
      return GameVisibility.PRIVATE;
    }

    return GameVisibility.PRIVATE;
  }

  private async generateRoomCode(): Promise<string> {
    for (
      let attempt = 0;
      attempt < GameLobbyService.MAX_ROOM_CODE_ATTEMPTS;
      attempt += 1
    ) {
      const candidate = this.createRoomCodeCandidate();
      const exists = await this.gameRepository.exists({
        where: { roomCode: candidate },
      });
      if (!exists) {
        return candidate;
      }
    }

    throw new InternalServerErrorException('Unable to allocate a room code');
  }

  private createRoomCodeCandidate(): string {
    const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < GameLobbyService.ROOM_CODE_LENGTH; i += 1) {
      const index = Math.floor(Math.random() * alphabet.length);
      code += alphabet[index];
    }
    return code;
  }

  private normalizeOptionalNumber(
    value: number | null | undefined,
  ): number | null | undefined {
    if (typeof value !== 'number') {
      return undefined;
    }

    if (!Number.isFinite(value)) {
      throw new BadRequestException('Numeric fields must be finite numbers');
    }

    return Math.max(0, Math.floor(value));
  }
}
