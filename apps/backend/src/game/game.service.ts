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
  RoundState,
  PlayerSecretStatus,
  AnswerValue,
  QuestionCategory,
  AnswerType,
} from '../database/enums';
import {
  CharacterSet,
  Game,
  GamePlayer,
  User,
  Round,
  PlayerSecret,
  Character,
  Question,
  Answer,
} from '../database/entities';
import type {
  CreateGameRequest,
  GameLobbyResponse,
  GamePlayerResponse,
  JoinGameRequest,
  GameVisibility as ContractGameVisibility,
  SubmitAnswerRequest,
  AnswerResponse,
  QuestionResponse,
} from '@whois-it/contracts';

@Injectable()
export class GameService {
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
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    @InjectRepository(PlayerSecret)
    private readonly playerSecretRepository: Repository<PlayerSecret>,
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  /**
   * Normalize room code to uppercase and trimmed
   */
  private normalizeRoomCode(roomCode: string): string {
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
      maxPlayers: this.normalizeOptionalNumber(request.maxPlayers),
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

    // Check if game is full (only count active players)
    const activePlayers = game.players?.filter((p) => !p.leftAt) ?? [];
    if (
      typeof game.maxPlayers === 'number' &&
      activePlayers.length >= game.maxPlayers
    ) {
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

  async getGameByRoomCode(roomCode: string): Promise<Game | null> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    return this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        characterSet: true,
        host: true,
        players: { user: true },
      },
    });
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

  async startGame(roomCode: string): Promise<GameLobbyResponse> {
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
      throw new BadRequestException('Game has already started or ended');
    }

    if (!game.players || game.players.length < 2) {
      throw new BadRequestException(
        'Need at least 2 players to start the game',
      );
    }

    const allPlayersReady = game.players.every((player) => player.isReady);
    if (!allPlayersReady) {
      throw new BadRequestException('All players must be ready to start');
    }

    // Update game status and start time
    game.status = GameStatus.IN_PROGRESS;
    game.startedAt = new Date();
    await this.gameRepository.save(game);

    // Initialize the first round
    await this.initializeFirstRound(game);

    // Assign secret characters to each player
    await this.assignSecretCharacters(game);

    const refreshedGame = await this.loadLobbyById(game.id);
    return this.mapToLobbyResponse(refreshedGame);
  }

  async submitAnswer(
    roomCode: string,
    request: SubmitAnswerRequest,
  ): Promise<{ answer: AnswerResponse; question: QuestionResponse }> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);

    // Find the question with all necessary relations
    const question = await this.questionRepository.findOne({
      where: { id: request.questionId },
      relations: {
        round: {
          game: true,
        },
        askedBy: true,
        targetPlayer: {
          secret: {
            character: {
              traitValues: {
                traitValue: {
                  trait: true,
                },
              },
            },
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Verify the question belongs to the specified game
    if (question.round.game.roomCode !== normalizedRoomCode) {
      throw new BadRequestException('Question does not belong to this game');
    }

    // Verify the game is in progress
    if (question.round.game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    // Verify the round is awaiting an answer
    if (question.round.state !== RoundState.AWAITING_ANSWER) {
      throw new BadRequestException('Round is not awaiting an answer');
    }

    // Check if an answer already exists for this question
    const existingAnswer = await this.answerRepository.findOne({
      where: { question: { id: question.id } },
    });

    if (existingAnswer) {
      throw new BadRequestException('Question has already been answered');
    }

    // Verify that the answerer is the target player
    if (!question.targetPlayer) {
      throw new BadRequestException('Question has no target player');
    }

    // Get the target player's secret character for answer computation
    const targetPlayerSecret = question.targetPlayer.secret;
    if (!targetPlayerSecret) {
      throw new InternalServerErrorException(
        'Target player has no secret character assigned',
      );
    }

    // Compute the answer based on the question and the secret character
    const computedAnswer = this.computeAnswer(
      question,
      targetPlayerSecret,
      request,
    );

    // Create and save the answer
    const answer = this.answerRepository.create({
      question,
      answeredBy: question.targetPlayer,
      answerValue: computedAnswer.answerValue,
      answerText: computedAnswer.answerText,
      latencyMs: request.latencyMs ?? null,
      answeredAt: new Date(),
    });

    const savedAnswer = await this.answerRepository.save(answer);

    // Update round state to allow next action (in this case, back to awaiting question for next turn)
    // In a full implementation, this would transition to AWAITING_GUESS if the player wants to guess
    question.round.state = RoundState.AWAITING_QUESTION;
    await this.roundRepository.save(question.round);

    const answerResponse = this.mapToAnswerResponse(savedAnswer, question);
    const questionResponse = this.mapToQuestionResponse(question);

    return { answer: answerResponse, question: questionResponse };
  }

  /**
   * Compute the answer based on the question and the player's secret character
   */
  private computeAnswer(
    question: Question,
    playerSecret: PlayerSecret,
    request: SubmitAnswerRequest,
  ): { answerValue: AnswerValue; answerText: string | null } {
    // Convert the contract type to enum type
    const answerValueEnum = this.toAnswerValueEnum(request.answerValue);

    // For trait-based questions, compute based on character traits
    if (
      question.category === QuestionCategory.TRAIT &&
      question.answerType === AnswerType.BOOLEAN
    ) {
      // Extract trait information from the question text
      // In a real implementation, questions would have structured trait references
      // For now, we'll use the provided answer value from the request
      // This allows the frontend/player to provide the answer based on their secret character

      return {
        answerValue: answerValueEnum,
        answerText: request.answerText ?? null,
      };
    }

    // For direct questions (yes/no about specific character)
    if (
      question.category === QuestionCategory.DIRECT &&
      question.answerType === AnswerType.BOOLEAN
    ) {
      return {
        answerValue: answerValueEnum,
        answerText: request.answerText ?? null,
      };
    }

    // For text-based questions
    if (question.answerType === AnswerType.TEXT) {
      return {
        answerValue: answerValueEnum,
        answerText: request.answerText ?? null,
      };
    }

    // Default case
    return {
      answerValue: answerValueEnum,
      answerText: request.answerText ?? null,
    };
  }

  /**
   * Convert contract AnswerValue type to backend enum
   */
  private toAnswerValueEnum(
    value: import('@whois-it/contracts').AnswerValue,
  ): AnswerValue {
    if (value === 'yes') {
      return AnswerValue.YES;
    }
    if (value === 'no') {
      return AnswerValue.NO;
    }
    if (value === 'unsure') {
      return AnswerValue.UNSURE;
    }
    throw new BadRequestException(`Invalid answer value: ${String(value)}`);
  }

  /**
   * Map Answer entity to AnswerResponse DTO
   */
  private mapToAnswerResponse(
    answer: Answer,
    question: Question,
  ): AnswerResponse {
    return {
      id: answer.id,
      questionId: question.id,
      answeredBy: {
        id: answer.answeredBy.id,
        username: answer.answeredBy.username,
      },
      answerValue: answer.answerValue,
      answerText: answer.answerText ?? undefined,
      latencyMs: answer.latencyMs ?? undefined,
      answeredAt: answer.answeredAt.toISOString(),
    };
  }

  /**
   * Map Question entity to QuestionResponse DTO
   */
  private mapToQuestionResponse(question: Question): QuestionResponse {
    return {
      id: question.id,
      roundId: question.round.id,
      askedBy: {
        id: question.askedBy.id,
        username: question.askedBy.username,
      },
      targetPlayer: question.targetPlayer
        ? {
            id: question.targetPlayer.id,
            username: question.targetPlayer.username,
          }
        : undefined,
      questionText: question.questionText,
      category: question.category,
      answerType: question.answerType,
      askedAt: question.askedAt.toISOString(),
    };
  }

  /**
   * Normalize room code to uppercase and trimmed
   */
  private async initializeFirstRound(game: Game): Promise<Round> {
    // Get the first player to be the active player
    const firstPlayer = game.players?.[0];

    if (!firstPlayer) {
      throw new InternalServerErrorException(
        'No players found to initialize round',
      );
    }

    const round = this.roundRepository.create({
      game,
      roundNumber: 1,
      activePlayer: firstPlayer,
      state: RoundState.AWAITING_QUESTION,
      startedAt: new Date(),
    });

    return this.roundRepository.save(round);
  }

  /**
   * Assign secret characters to each player randomly
   */
  private async assignSecretCharacters(game: Game): Promise<void> {
    // Get all active characters from the character set
    const characters = await this.characterRepository.find({
      where: {
        set: { id: game.characterSet.id },
        isActive: true,
      },
    });

    if (!characters || characters.length === 0) {
      throw new InternalServerErrorException(
        'No characters found in the character set',
      );
    }

    if (!game.players || game.players.length === 0) {
      throw new InternalServerErrorException('No players found in the game');
    }

    if (characters.length < game.players.length) {
      throw new BadRequestException(
        'Not enough characters in the set for all players',
      );
    }

    // Shuffle characters using Fisher-Yates algorithm
    const shuffledCharacters = this.shuffleArray([...characters]);

    // Assign one character to each player
    const playerSecrets: PlayerSecret[] = [];
    for (let i = 0; i < game.players.length; i++) {
      const player = game.players[i];
      const character = shuffledCharacters[i];

      const secret = this.playerSecretRepository.create({
        player,
        character,
        status: PlayerSecretStatus.HIDDEN,
        assignedAt: new Date(),
      });

      playerSecrets.push(secret);
    }

    await this.playerSecretRepository.save(playerSecrets);
  }

  /**
   * Shuffle an array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
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

  private mapToLobbyResponse(game: Game): GameLobbyResponse {
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
      maxPlayers:
        typeof game.maxPlayers === 'number' ? game.maxPlayers : undefined,
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
      attempt < GameService.MAX_ROOM_CODE_ATTEMPTS;
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
    for (let i = 0; i < GameService.ROOM_CODE_LENGTH; i += 1) {
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
