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
  QuestionCategory,
  AnswerType,
  AnswerValue,
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
  Guess,
} from '../database/entities';
import type {
  CreateGameRequest,
  GameLobbyResponse,
  GamePlayerResponse,
  JoinGameRequest,
  GameVisibility as ContractGameVisibility,
  AskQuestionRequest,
  QuestionResponse,
  GameStateResponse,
  SubmitAnswerRequest,
  AnswerResponse,
  SubmitGuessRequest,
  GuessResponse,
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
    @InjectRepository(Guess)
    private readonly guessRepository: Repository<Guess>,
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

  /**
   * Initialize the first round of the game
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

  /**
   * Ask a question during the game
   */
  async askQuestion(
    roomCode: string,
    request: AskQuestionRequest,
  ): Promise<QuestionResponse> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);

    // Get the game with all necessary relations
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        players: true,
        rounds: { activePlayer: true },
      },
      order: {
        rounds: { roundNumber: 'DESC' },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    // Get the current round
    const currentRound = game.rounds?.[0];
    if (!currentRound) {
      throw new InternalServerErrorException('No active round found');
    }

    if (currentRound.state !== RoundState.AWAITING_QUESTION) {
      throw new BadRequestException(
        `Cannot ask question in round state: ${currentRound.state}`,
      );
    }

    // Validate that the player asking the question is the active player
    if (
      !currentRound.activePlayer ||
      currentRound.activePlayer.id !== request.playerId
    ) {
      throw new BadRequestException(
        'Only the active player can ask a question',
      );
    }

    // Get the player asking the question
    const askedByPlayer = await this.playerRepository.findOne({
      where: { id: request.playerId },
      relations: { game: true },
    });

    if (!askedByPlayer) {
      throw new NotFoundException('Player not found');
    }

    // Get the target player if specified
    let targetPlayer: GamePlayer | null = null;
    if (request.targetPlayerId) {
      targetPlayer = await this.playerRepository.findOne({
        where: { id: request.targetPlayerId },
        relations: { game: true },
      });

      if (!targetPlayer) {
        throw new NotFoundException('Target player not found');
      }

      if (targetPlayer.game.id !== game.id) {
        throw new BadRequestException('Target player is not in this game');
      }
    }

    // Create the question
    const question = this.questionRepository.create({
      round: currentRound,
      askedBy: askedByPlayer,
      targetPlayer,
      questionText: request.questionText.trim(),
      category: request.category as QuestionCategory,
      answerType: request.answerType as AnswerType,
    });

    const savedQuestion = await this.questionRepository.save(question);

    // Update the round state to AWAITING_ANSWER
    currentRound.state = RoundState.AWAITING_ANSWER;
    await this.roundRepository.save(currentRound);

    // Return the question response
    return this.mapToQuestionResponse(
      savedQuestion,
      askedByPlayer,
      targetPlayer,
    );
  }

  /**
   * Get the current game state for a room
   */
  async getGameState(roomCode: string): Promise<GameStateResponse> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);

    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        players: { user: true },
        rounds: { activePlayer: true },
      },
      order: {
        rounds: { roundNumber: 'DESC' },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    const currentRound = game.rounds?.[0];
    const activePlayers = game.players?.filter((p) => !p.leftAt) ?? [];

    return {
      id: game.id,
      roomCode: game.roomCode,
      status: game.status,
      currentRoundNumber: currentRound?.roundNumber ?? 0,
      currentRoundState: currentRound?.state ?? '',
      activePlayerId: currentRound?.activePlayer?.id,
      activePlayerUsername: currentRound?.activePlayer?.username,
      players: activePlayers.map((player) => ({
        id: player.id,
        username: player.username,
        avatarUrl: player.avatarUrl ?? undefined,
        role: player.role,
        isReady: player.isReady,
        joinedAt: player.joinedAt?.toISOString?.() ?? new Date().toISOString(),
        leftAt: player.leftAt?.toISOString?.(),
        userId: player.user?.id,
      })),
    };
  }

  /**
   * Map Question entity to QuestionResponse
   */
  private mapToQuestionResponse(
    question: Question,
    askedByPlayer: GamePlayer,
    targetPlayer: GamePlayer | null,
  ): QuestionResponse {
    return {
      id: question.id,
      roundId: question.round.id,
      roundNumber: question.round.roundNumber,
      askedByPlayerId: askedByPlayer.id,
      askedByPlayerUsername: askedByPlayer.username,
      targetPlayerId: targetPlayer?.id,
      targetPlayerUsername: targetPlayer?.username,
      questionText: question.questionText,
      category: question.category,
      answerType: question.answerType,
      askedAt: question.askedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  /**
   * Submit an answer to a question
   */
  async submitAnswer(
    roomCode: string,
    request: SubmitAnswerRequest,
  ): Promise<AnswerResponse> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);

    // Get the game with all necessary relations
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        players: true,
        rounds: true,
      },
      order: {
        rounds: { roundNumber: 'DESC' },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    // Get the current round
    const currentRound = game.rounds?.[0];
    if (!currentRound) {
      throw new InternalServerErrorException('No active round found');
    }

    if (currentRound.state !== RoundState.AWAITING_ANSWER) {
      throw new BadRequestException(
        `Cannot submit answer in round state: ${currentRound.state}`,
      );
    }

    // Get the question being answered
    const question = await this.questionRepository.findOne({
      where: { id: request.questionId },
      relations: {
        round: true,
        askedBy: true,
        targetPlayer: true,
        answers: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    if (question.round.id !== currentRound.id) {
      throw new BadRequestException('Question is not for the current round');
    }

    // Check if question has already been answered
    if (question.answers && question.answers.length > 0) {
      throw new BadRequestException('Question has already been answered');
    }

    // Get the player submitting the answer
    const answeringPlayer = await this.playerRepository.findOne({
      where: { id: request.playerId },
      relations: {
        game: true,
        secret: { character: { traitValues: { traitValue: { trait: true } } } },
      },
    });

    if (!answeringPlayer) {
      throw new NotFoundException('Player not found');
    }

    if (answeringPlayer.game.id !== game.id) {
      throw new BadRequestException('Player is not in this game');
    }

    // Validate that the answering player is the target player (if specified)
    if (question.targetPlayer) {
      if (question.targetPlayer.id !== answeringPlayer.id) {
        throw new BadRequestException(
          'Only the targeted player can answer this question',
        );
      }
    } else {
      // If no target player specified, any player except the asker can answer
      if (question.askedBy.id === answeringPlayer.id) {
        throw new BadRequestException('Cannot answer your own question');
      }
    }

    // Calculate the answer based on the player's secret character
    const calculatedAnswer = this.calculateAnswer(
      answeringPlayer,
      question,
      request,
    );

    // Create the answer
    const answer = this.answerRepository.create({
      question,
      answeredBy: answeringPlayer,
      answerValue: calculatedAnswer.answerValue,
      answerText: calculatedAnswer.answerText,
      latencyMs: calculatedAnswer.latencyMs,
    });

    const savedAnswer = await this.answerRepository.save(answer);

    // Update the round state to AWAITING_QUESTION (next turn)
    await this.advanceToNextTurn(currentRound, game);

    // Return the answer response
    return this.mapToAnswerResponse(savedAnswer, answeringPlayer);
  }

  /**
   * Calculate the answer based on the player's secret character
   */
  private calculateAnswer(
    player: GamePlayer,
    question: Question,
    request: SubmitAnswerRequest,
  ): {
    answerValue: AnswerValue;
    answerText?: string | null;
    latencyMs?: number | null;
  } {
    // If the player doesn't have a secret character yet, throw an error
    if (!player.secret || !player.secret.character) {
      throw new InternalServerErrorException(
        'Player does not have a secret character assigned',
      );
    }

    // Note: For now, we trust the player to provide the correct answer based on their secret character
    // In a future iteration, we could automatically validate the answer based on character traits

    // answerValue has been validated by the controller to be a valid AnswerValue enum member
    const validatedAnswerValue = request.answerValue as AnswerValue;

    // For boolean questions, use the provided answer value
    if (question.answerType === AnswerType.BOOLEAN) {
      return {
        answerValue: validatedAnswerValue,
        answerText: null,
        latencyMs: null,
      };
    }

    // For text questions, use the provided answer text
    if (question.answerType === AnswerType.TEXT) {
      return {
        answerValue: validatedAnswerValue,
        answerText: request.answerText ?? null,
        latencyMs: null,
      };
    }

    // Default fallback
    return {
      answerValue: validatedAnswerValue,
      answerText: request.answerText ?? null,
      latencyMs: null,
    };
  }

  /**
   * Advance to the next player's turn
   */
  private async advanceToNextTurn(
    currentRound: Round,
    game: Game,
  ): Promise<void> {
    // Get all active players
    const activePlayers = game.players?.filter((p) => !p.leftAt) ?? [];

    if (activePlayers.length === 0) {
      throw new InternalServerErrorException('No active players found');
    }

    // Find the current active player's index
    const currentPlayerIndex = activePlayers.findIndex(
      (p) => p.id === currentRound.activePlayer?.id,
    );

    // Get the next player (circular)
    const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
    const nextPlayer = activePlayers[nextPlayerIndex];

    // Update the round state
    currentRound.state = RoundState.AWAITING_QUESTION;
    currentRound.activePlayer = nextPlayer;
    await this.roundRepository.save(currentRound);
  }

  /**
   * Map Answer entity to AnswerResponse
   */
  private mapToAnswerResponse(
    answer: Answer,
    answeringPlayer: GamePlayer,
  ): AnswerResponse {
    return {
      id: answer.id,
      questionId: answer.question.id,
      answeredByPlayerId: answeringPlayer.id,
      answeredByPlayerUsername: answeringPlayer.username,
      answerValue: answer.answerValue,
      answerText: answer.answerText ?? undefined,
      latencyMs: answer.latencyMs ?? undefined,
      answeredAt: answer.answeredAt.toISOString(),
    };
  }

  /**
   * Submit a guess for a character
   */
  async submitGuess(
    roomCode: string,
    request: SubmitGuessRequest,
  ): Promise<GuessResponse> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);

    // Get the game with all necessary relations
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        players: true,
        rounds: true,
      },
      order: {
        rounds: { roundNumber: 'DESC' },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    // Get the current round
    const currentRound = game.rounds?.[0];
    if (!currentRound) {
      throw new InternalServerErrorException('No active round found');
    }

    // Get the player making the guess
    const guessingPlayer = await this.playerRepository.findOne({
      where: { id: request.playerId },
      relations: {
        game: true,
      },
    });

    if (!guessingPlayer) {
      throw new NotFoundException('Player not found');
    }

    if (guessingPlayer.game.id !== game.id) {
      throw new BadRequestException('Player is not in this game');
    }

    // Get the target player if specified
    let targetPlayer: GamePlayer | null = null;
    if (request.targetPlayerId) {
      targetPlayer = await this.playerRepository.findOne({
        where: { id: request.targetPlayerId },
        relations: {
          game: true,
          secret: { character: true },
        },
      });

      if (!targetPlayer) {
        throw new NotFoundException('Target player not found');
      }

      if (targetPlayer.game.id !== game.id) {
        throw new BadRequestException('Target player is not in this game');
      }

      if (targetPlayer.id === guessingPlayer.id) {
        throw new BadRequestException('Cannot guess your own character');
      }
    }

    // Get the target character
    const targetCharacter = await this.characterRepository.findOne({
      where: { id: request.targetCharacterId },
    });

    if (!targetCharacter) {
      throw new NotFoundException('Target character not found');
    }

    // Determine if the guess is correct
    let isCorrect = false;
    if (targetPlayer) {
      // If guessing a specific player's character
      if (!targetPlayer.secret || !targetPlayer.secret.character) {
        throw new InternalServerErrorException(
          'Target player does not have a secret character assigned',
        );
      }
      isCorrect = targetPlayer.secret.character.id === targetCharacter.id;
    }

    // Create the guess
    const guess = this.guessRepository.create({
      round: currentRound,
      guessedBy: guessingPlayer,
      targetPlayer,
      targetCharacter,
      isCorrect,
      latencyMs: null,
    });

    const savedGuess = await this.guessRepository.save(guess);

    // Handle game logic based on guess result
    if (isCorrect && targetPlayer) {
      // Correct guess - reveal the target player's secret
      if (targetPlayer.secret) {
        targetPlayer.secret.status = PlayerSecretStatus.REVEALED;
        await this.playerSecretRepository.save(targetPlayer.secret);
      }

      // Check if game should end (only one unrevealed player left or the guesser won)
      const unrevealedPlayers = await this.playerSecretRepository
        .createQueryBuilder('secret')
        .innerJoin('secret.player', 'player')
        .where('player.game_id = :gameId', { gameId: game.id })
        .andWhere('player.leftAt IS NULL')
        .andWhere('secret.status = :status', {
          status: PlayerSecretStatus.HIDDEN,
        })
        .getCount();

      if (unrevealedPlayers <= 1) {
        // Game over - mark game as completed
        game.status = GameStatus.COMPLETED;
        game.endedAt = new Date();
        await this.gameRepository.save(game);
      }
    } else if (!isCorrect && targetPlayer) {
      // Incorrect guess - eliminate the guesser (optional - depends on game rules)
      // For now, we just record the incorrect guess
      // Future: could eliminate player or apply penalty
    }

    // Return the guess response
    return this.mapToGuessResponse(
      savedGuess,
      guessingPlayer,
      targetPlayer,
      targetCharacter,
      currentRound,
    );
  }

  /**
   * Map Guess entity to GuessResponse
   */
  private mapToGuessResponse(
    guess: Guess,
    guessingPlayer: GamePlayer,
    targetPlayer: GamePlayer | null,
    targetCharacter: Character,
    round: Round,
  ): GuessResponse {
    return {
      id: guess.id,
      roundId: round.id,
      roundNumber: round.roundNumber,
      guessedByPlayerId: guessingPlayer.id,
      guessedByPlayerUsername: guessingPlayer.username,
      targetPlayerId: targetPlayer?.id,
      targetPlayerUsername: targetPlayer?.username,
      targetCharacterId: targetCharacter.id,
      targetCharacterName: targetCharacter.name,
      isCorrect: guess.isCorrect,
      latencyMs: guess.latencyMs ?? undefined,
      guessedAt: guess.guessedAt.toISOString(),
    };
  }
}
