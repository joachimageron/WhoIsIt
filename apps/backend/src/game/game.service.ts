import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
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
  SubmitAnswerRequest,
  AnswerResponse,
  MakeGuessRequest,
  GuessResponse,
  GameOverResult,
  PlayerScore,
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
   * Ask a question in the game
   */
  async askQuestion(
    roomCode: string,
    request: AskQuestionRequest,
  ): Promise<QuestionResponse> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        players: true,
        rounds: { activePlayer: true },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    const player = game.players?.find((p) => p.id === request.playerId);
    if (!player) {
      throw new NotFoundException('Player not found in this game');
    }

    // Get the current round
    const currentRound = await this.getCurrentRound(game.id);
    if (!currentRound) {
      throw new InternalServerErrorException('No active round found');
    }

    // Validate it's the player's turn
    if (currentRound.activePlayer?.id !== player.id) {
      throw new BadRequestException('It is not your turn');
    }

    // Validate round state
    if (currentRound.state !== RoundState.AWAITING_QUESTION) {
      throw new BadRequestException(
        'Round is not awaiting a question (current state: ' +
          currentRound.state +
          ')',
      );
    }

    // Validate target player if specified
    let targetPlayer: GamePlayer | undefined;
    if (request.targetPlayerId) {
      targetPlayer = game.players?.find((p) => p.id === request.targetPlayerId);
      if (!targetPlayer) {
        throw new NotFoundException('Target player not found in this game');
      }
    }

    // Create the question
    const question = this.questionRepository.create({
      round: currentRound,
      askedBy: player,
      targetPlayer,
      questionText: request.questionText,
      category: this.mapQuestionCategory(request.category),
      answerType: this.mapAnswerType(request.answerType),
    });

    const savedQuestion = await this.questionRepository.save(question);

    // Update round state to awaiting answer
    currentRound.state = RoundState.AWAITING_ANSWER;
    await this.roundRepository.save(currentRound);

    return this.mapToQuestionResponse(savedQuestion, player, targetPlayer);
  }

  /**
   * Submit an answer to a question
   */
  async submitAnswer(
    roomCode: string,
    request: SubmitAnswerRequest,
  ): Promise<AnswerResponse> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        players: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    const player = game.players?.find((p) => p.id === request.playerId);
    if (!player) {
      throw new NotFoundException('Player not found in this game');
    }

    const question = await this.questionRepository.findOne({
      where: { id: request.questionId },
      relations: {
        round: { activePlayer: true, game: true },
        askedBy: true,
        targetPlayer: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    // Validate the question belongs to the current game
    if (question.round.game.id !== game.id) {
      throw new BadRequestException('Question does not belong to this game');
    }

    // Validate that the answerer is the target player or the active player
    const isTargetPlayer = question.targetPlayer?.id === player.id;
    const isActivePlayer = question.round.activePlayer?.id === player.id;
    if (!isTargetPlayer && !isActivePlayer) {
      throw new BadRequestException(
        'You are not authorized to answer this question',
      );
    }

    // Get player's secret character to determine the answer
    const playerSecret = await this.playerSecretRepository.findOne({
      where: { player: { id: player.id } },
      relations: { character: true },
    });

    if (!playerSecret) {
      throw new InternalServerErrorException('Player secret not found');
    }

    // Create the answer
    const answer = this.answerRepository.create({
      question,
      answeredBy: player,
      answerValue: this.mapAnswerValue(request.answerValue),
      answerText: request.answerText,
      latencyMs: request.latencyMs,
    });

    const savedAnswer = await this.answerRepository.save(answer);

    // Advance to next turn
    await this.advanceRound(question.round);

    return this.mapToAnswerResponse(savedAnswer, player, question);
  }

  /**
   * Make a guess about a character
   */
  async makeGuess(
    roomCode: string,
    request: MakeGuessRequest,
  ): Promise<GuessResponse> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        players: true,
        rounds: { activePlayer: true },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.IN_PROGRESS) {
      throw new BadRequestException('Game is not in progress');
    }

    const player = game.players?.find((p) => p.id === request.playerId);
    if (!player) {
      throw new NotFoundException('Player not found in this game');
    }

    // Get the current round
    const currentRound = await this.getCurrentRound(game.id);
    if (!currentRound) {
      throw new InternalServerErrorException('No active round found');
    }

    // Validate it's the player's turn
    if (currentRound.activePlayer?.id !== player.id) {
      throw new BadRequestException('It is not your turn to guess');
    }

    // Get target character
    const targetCharacter = await this.characterRepository.findOne({
      where: { id: request.targetCharacterId },
    });

    if (!targetCharacter) {
      throw new NotFoundException('Character not found');
    }

    // Determine target player if specified
    let targetPlayer: GamePlayer | undefined;
    if (request.targetPlayerId) {
      targetPlayer = game.players?.find((p) => p.id === request.targetPlayerId);
      if (!targetPlayer) {
        throw new NotFoundException('Target player not found in this game');
      }
    }

    // Check if the guess is correct
    // Note: Guesses require a target player because players are guessing
    // which character another player has. If no target player is specified,
    // the guess cannot be validated and will be marked as incorrect.
    let isCorrect = false;
    if (targetPlayer) {
      const targetSecret = await this.playerSecretRepository.findOne({
        where: { player: { id: targetPlayer.id } },
        relations: { character: true },
      });

      if (targetSecret) {
        isCorrect = targetSecret.character.id === targetCharacter.id;
      }
    }

    // Create the guess
    const guess = this.guessRepository.create({
      round: currentRound,
      guessedBy: player,
      targetPlayer,
      targetCharacter,
      isCorrect,
      latencyMs: request.latencyMs,
    });

    const savedGuess = await this.guessRepository.save(guess);

    // If incorrect, eliminate the player (mark them as left)
    if (!isCorrect) {
      player.leftAt = new Date();
      await this.playerRepository.save(player);
    }

    // If correct, mark the game as completed
    if (isCorrect) {
      game.status = GameStatus.COMPLETED;
      game.endedAt = new Date();
      await this.gameRepository.save(game);
    } else {
      // Otherwise, advance to next player's turn
      await this.advanceRound(currentRound);
    }

    return this.mapToGuessResponse(
      savedGuess,
      player,
      targetPlayer,
      targetCharacter,
    );
  }

  /**
   * Check if game is over and return results
   */
  async checkGameOver(roomCode: string): Promise<GameOverResult | null> {
    const normalizedRoomCode = this.normalizeRoomCode(roomCode);
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        players: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.COMPLETED) {
      return null;
    }

    // Get all rounds for scoring
    const rounds = await this.roundRepository.find({
      where: { game: { id: game.id } },
      order: { roundNumber: 'ASC' },
    });

    const totalRounds = rounds.length;
    const gameDurationMs =
      game.endedAt && game.startedAt
        ? game.endedAt.getTime() - game.startedAt.getTime()
        : 0;

    // Calculate scores for each player
    const scores: PlayerScore[] = [];
    for (const player of game.players || []) {
      const questionsAsked = await this.questionRepository.count({
        where: { askedBy: { id: player.id } },
      });

      const guesses = await this.guessRepository.find({
        where: { guessedBy: { id: player.id } },
      });

      const correctGuesses = guesses.filter((g) => g.isCorrect).length;
      const incorrectGuesses = guesses.filter((g) => !g.isCorrect).length;

      // Score calculation: correct guesses * 100 - incorrect guesses * 50
      const score = correctGuesses * 100 - incorrectGuesses * 50;

      scores.push({
        playerId: player.id,
        username: player.username,
        score,
        isEliminated: !!player.leftAt,
        questionsAsked,
        correctGuesses,
        incorrectGuesses,
      });
    }

    // Sort scores by score descending
    scores.sort((a, b) => b.score - a.score);

    // Find winner (highest score)
    const winner = scores[0];

    return {
      winnerId: winner?.playerId,
      winnerUsername: winner?.username,
      scores,
      totalRounds,
      gameDurationMs,
    };
  }

  /**
   * Get the current round for a game
   */
  private async getCurrentRound(gameId: string): Promise<Round | null> {
    return this.roundRepository.findOne({
      where: {
        game: { id: gameId },
        state: Not(RoundState.CLOSED),
      },
      relations: {
        activePlayer: true,
        game: true,
      },
      order: {
        roundNumber: 'DESC',
      },
    });
  }

  /**
   * Advance to the next round
   */
  private async advanceRound(currentRound: Round): Promise<void> {
    const game = await this.gameRepository.findOne({
      where: { id: currentRound.game.id },
      relations: {
        players: true,
      },
    });

    if (!game) {
      throw new InternalServerErrorException('Game not found');
    }

    // Get active players (not left)
    const activePlayers =
      game.players
        ?.filter((p) => !p.leftAt)
        .sort((a, b) => {
          const aTime = a.joinedAt?.getTime?.() ?? 0;
          const bTime = b.joinedAt?.getTime?.() ?? 0;
          return aTime - bTime;
        }) || [];

    if (activePlayers.length === 0) {
      // No active players, end the game
      game.status = GameStatus.ABORTED;
      game.endedAt = new Date();
      await this.gameRepository.save(game);
      return;
    }

    if (activePlayers.length === 1) {
      // Only one player left, they win
      game.status = GameStatus.COMPLETED;
      game.endedAt = new Date();
      await this.gameRepository.save(game);
      return;
    }

    // Find the next player
    const currentPlayerIndex = activePlayers.findIndex(
      (p) => p.id === currentRound.activePlayer?.id,
    );

    const nextPlayerIndex = (currentPlayerIndex + 1) % activePlayers.length;
    const nextPlayer = activePlayers[nextPlayerIndex];

    // Close current round
    currentRound.state = RoundState.CLOSED;
    currentRound.endedAt = new Date();
    if (currentRound.startedAt) {
      currentRound.durationMs =
        currentRound.endedAt.getTime() - currentRound.startedAt.getTime();
    }
    await this.roundRepository.save(currentRound);

    // Create next round
    const nextRound = this.roundRepository.create({
      game,
      roundNumber: currentRound.roundNumber + 1,
      activePlayer: nextPlayer,
      state: RoundState.AWAITING_QUESTION,
      startedAt: new Date(),
    });

    await this.roundRepository.save(nextRound);
  }

  /**
   * Map question category from contract to enum
   */
  private mapQuestionCategory(category: string): QuestionCategory {
    switch (category) {
      case 'trait':
        return QuestionCategory.TRAIT;
      case 'direct':
        return QuestionCategory.DIRECT;
      case 'meta':
        return QuestionCategory.META;
      default:
        throw new BadRequestException('Invalid question category');
    }
  }

  /**
   * Map answer type from contract to enum
   */
  private mapAnswerType(answerType: string): AnswerType {
    switch (answerType) {
      case 'boolean':
        return AnswerType.BOOLEAN;
      case 'text':
        return AnswerType.TEXT;
      default:
        throw new BadRequestException('Invalid answer type');
    }
  }

  /**
   * Map answer value from contract to enum
   */
  private mapAnswerValue(answerValue: string): AnswerValue {
    switch (answerValue) {
      case 'yes':
        return AnswerValue.YES;
      case 'no':
        return AnswerValue.NO;
      case 'unsure':
        return AnswerValue.UNSURE;
      default:
        throw new BadRequestException('Invalid answer value');
    }
  }

  /**
   * Map Question entity to QuestionResponse
   */
  private mapToQuestionResponse(
    question: Question,
    askedBy: GamePlayer,
    targetPlayer?: GamePlayer,
  ): QuestionResponse {
    return {
      id: question.id,
      roundId: question.round.id,
      askedById: askedBy.id,
      askedByUsername: askedBy.username,
      targetPlayerId: targetPlayer?.id,
      targetPlayerUsername: targetPlayer?.username,
      questionText: question.questionText,
      category: question.category,
      answerType: question.answerType,
      askedAt: question.askedAt
        ? question.askedAt.toISOString()
        : new Date().toISOString(),
    };
  }

  /**
   * Map Answer entity to AnswerResponse
   */
  private mapToAnswerResponse(
    answer: Answer,
    answeredBy: GamePlayer,
    question: Question,
  ): AnswerResponse {
    return {
      id: answer.id,
      questionId: question.id,
      answeredById: answeredBy.id,
      answeredByUsername: answeredBy.username,
      answerValue: answer.answerValue,
      answerText: answer.answerText ?? undefined,
      answeredAt: answer.answeredAt
        ? answer.answeredAt.toISOString()
        : new Date().toISOString(),
    };
  }

  /**
   * Map Guess entity to GuessResponse
   */
  private mapToGuessResponse(
    guess: Guess,
    guessedBy: GamePlayer,
    targetPlayer: GamePlayer | undefined,
    targetCharacter: Character,
  ): GuessResponse {
    return {
      id: guess.id,
      roundId: guess.round.id,
      guessedById: guessedBy.id,
      guessedByUsername: guessedBy.username,
      targetPlayerId: targetPlayer?.id,
      targetPlayerUsername: targetPlayer?.username,
      targetCharacterId: targetCharacter.id,
      targetCharacterName: targetCharacter.name,
      isCorrect: guess.isCorrect,
      guessedAt: guess.guessedAt
        ? guess.guessedAt.toISOString()
        : new Date().toISOString(),
    };
  }
}
