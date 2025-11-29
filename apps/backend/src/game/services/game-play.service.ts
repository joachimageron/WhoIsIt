import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GameStatus,
  RoundState,
  PlayerSecretStatus,
  AnswerValue,
} from '../../database/enums';
import {
  Game,
  GamePlayer,
  Round,
  PlayerSecret,
  Character,
  Question,
  Answer,
  Guess,
} from '../../database/entities';
import type {
  AskQuestionRequest,
  QuestionResponse,
  GameStateResponse,
  SubmitAnswerRequest,
  AnswerResponse,
  SubmitGuessRequest,
  GuessResponse,
  PlayerCharacterResponse,
} from '@whois-it/contracts';
import { GameLobbyService } from './game-lobby.service';

@Injectable()
export class GamePlayService {
  // Scoring constants
  private static readonly SCORE_CORRECT_GUESS = 1000;
  private static readonly SCORE_QUESTION_BONUS = 10;
  private static readonly SCORE_ANSWER_BONUS = 5;
  private static readonly SCORE_INCORRECT_GUESS_PENALTY = -100;

  // Game rules constants
  private static readonly MAX_GUESSES_PER_PLAYER = 3;

  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private readonly playerRepository: Repository<GamePlayer>,
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
    private readonly gameLobbyService: GameLobbyService,
  ) {}

  /**
   * Initialize the first round of the game
   */
  async initializeFirstRound(game: Game): Promise<Round> {
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
  async assignSecretCharacters(game: Game): Promise<void> {
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

  /**
   * Get the current game state for a room
   */
  async getGameState(roomCode: string): Promise<GameStateResponse> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);

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
   * Ask a question during the game
   */
  async askQuestion(
    roomCode: string,
    playerId: string,
    request: AskQuestionRequest,
  ): Promise<QuestionResponse> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);

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
      currentRound.activePlayer.id !== playerId
    ) {
      throw new BadRequestException(
        'Only the active player can ask a question',
      );
    }

    // Get the player asking the question
    const askedByPlayer = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: { game: true },
    });

    if (!askedByPlayer) {
      throw new NotFoundException('Player not found');
    }

    // Get the target player (required in 2-player game)
    const targetPlayer = await this.playerRepository.findOne({
      where: { id: request.targetPlayerId },
      relations: { game: true },
    });

    if (!targetPlayer) {
      throw new NotFoundException('Target player not found');
    }

    if (targetPlayer.game.id !== game.id) {
      throw new BadRequestException('Target player is not in this game');
    }

    // Create the question
    const question = this.questionRepository.create({
      round: currentRound,
      askedBy: askedByPlayer,
      targetPlayer,
      questionText: request.questionText.trim(),
    });

    const savedQuestion = await this.questionRepository.save(question);

    // Award points for asking a question
    askedByPlayer.score += GamePlayService.SCORE_QUESTION_BONUS;
    await this.playerRepository.save(askedByPlayer);

    // Update the round state to AWAITING_ANSWER
    currentRound.state = RoundState.AWAITING_ANSWER;

    // Advance to the next player's turn after asking a question
    const nextPlayer = this.getNextPlayer(currentRound, game);
    currentRound.activePlayer = nextPlayer;

    await this.roundRepository.save(currentRound);

    // Return the question response
    return this.mapToQuestionResponse(
      savedQuestion,
      askedByPlayer,
      targetPlayer,
    );
  }

  /**
   * Get all questions for a game
   */
  async getQuestions(roomCode: string): Promise<QuestionResponse[]> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);

    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        rounds: {
          questions: {
            askedBy: true,
            targetPlayer: true,
            round: true,
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Flatten questions from all rounds and sort by creation time
    const questions =
      game.rounds
        ?.flatMap((round) => round.questions || [])
        .sort(
          (a, b) =>
            new Date(a.askedAt).getTime() - new Date(b.askedAt).getTime(),
        ) ?? [];

    return questions.map((q) => {
      if (!q.targetPlayer) {
        throw new InternalServerErrorException(
          'Question missing required target player',
        );
      }
      return this.mapToQuestionResponse(q, q.askedBy, q.targetPlayer);
    });
  }

  /**
   * Get all answers for a game
   */
  async getAnswers(roomCode: string): Promise<AnswerResponse[]> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);

    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        rounds: {
          questions: {
            answers: {
              answeredBy: true,
              question: true,
            },
          },
        },
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Flatten answers from all questions and sort by creation time
    const answers =
      game.rounds
        ?.flatMap(
          (round) =>
            round.questions?.flatMap((question) => question.answers || []) ||
            [],
        )
        .sort(
          (a, b) =>
            new Date(a.answeredAt).getTime() - new Date(b.answeredAt).getTime(),
        ) ?? [];

    return answers.map((a) => this.mapToAnswerResponse(a, a.answeredBy));
  }

  /**
   * Map Question entity to QuestionResponse
   */
  private mapToQuestionResponse(
    question: Question,
    askedByPlayer: GamePlayer,
    targetPlayer: GamePlayer,
  ): QuestionResponse {
    return {
      id: question.id,
      roundId: question.round.id,
      roundNumber: question.round.roundNumber,
      askedByPlayerId: askedByPlayer.id,
      askedByPlayerUsername: askedByPlayer.username,
      targetPlayerId: targetPlayer.id,
      targetPlayerUsername: targetPlayer.username,
      questionText: question.questionText,
      askedAt: question.askedAt?.toISOString?.() ?? new Date().toISOString(),
    };
  }

  /**
   * Submit an answer to a question
   */
  async submitAnswer(
    roomCode: string,
    playerId: string,
    request: SubmitAnswerRequest,
  ): Promise<AnswerResponse> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);

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
      where: { id: playerId },
      relations: {
        game: true,
        secret: { character: true },
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

    // Award points for answering a question
    answeringPlayer.score += GamePlayService.SCORE_ANSWER_BONUS;
    await this.playerRepository.save(answeringPlayer);

    // Update the round state back to AWAITING_QUESTION
    // Note: Turn already changed when question was asked
    currentRound.state = RoundState.AWAITING_QUESTION;
    await this.roundRepository.save(currentRound);

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

    // answerValue has been validated by the controller to be a valid AnswerValue enum member
    const validatedAnswerValue = request.answerValue as AnswerValue;

    // All questions use boolean answers (yes/no/unsure)
    return {
      answerValue: validatedAnswerValue,
      answerText: request.answerText || null,
      latencyMs: null,
    };
  }

  /**
   * Get the next player in turn order
   */
  private getNextPlayer(currentRound: Round, game: Game): GamePlayer {
    // Get all active players
    const activePlayers = game.players?.filter((p) => !p.leftAt) ?? [];

    if (activePlayers.length === 0) {
      throw new InternalServerErrorException('No active players found');
    }

    // Get all players (including eliminated ones) to maintain turn order
    const allPlayers = game.players ?? [];

    // Find the current active player's index in the full player list
    const currentPlayerIndex = allPlayers.findIndex(
      (p) => p.id === currentRound.activePlayer?.id,
    );

    // If current player not found, start from beginning
    if (currentPlayerIndex === -1) {
      return activePlayers[0];
    }

    // Find the next active player after the current one
    // Loop through all players starting from the next position
    const nextIndex = currentPlayerIndex + 1;
    for (let i = 0; i < allPlayers.length; i++) {
      const checkIndex = (nextIndex + i) % allPlayers.length;
      const player = allPlayers[checkIndex];

      // Check if this player is still active (not eliminated)
      if (!player.leftAt) {
        return player;
      }
    }

    // Fallback: should not reach here if there are active players
    return activePlayers[0];
  }

  /**
   * Advance to the next player's turn
   */
  async advanceToNextTurn(currentRound: Round, game: Game): Promise<void> {
    const nextPlayer = this.getNextPlayer(currentRound, game);

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
    playerId: string,
    request: SubmitGuessRequest,
  ): Promise<GuessResponse> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);

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

    // Validate round state - guessing is only allowed during AWAITING_QUESTION
    if (currentRound.state !== RoundState.AWAITING_QUESTION) {
      throw new BadRequestException(
        `Cannot submit guess in round state: ${currentRound.state}`,
      );
    }

    // Get the player making the guess
    const guessingPlayer = await this.playerRepository.findOne({
      where: { id: playerId },
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

    // Validate that the player making the guess is the active player
    if (
      !currentRound.activePlayer ||
      currentRound.activePlayer.id !== playerId
    ) {
      throw new BadRequestException('Only the active player can make a guess');
    }

    // Validate guess limit by counting existing guesses
    const existingGuessCount = await this.guessRepository.count({
      where: {
        guessedBy: { id: guessingPlayer.id },
        round: { game: { id: game.id } },
      },
    });

    if (existingGuessCount >= GamePlayService.MAX_GUESSES_PER_PLAYER) {
      throw new BadRequestException(
        `Maximum number of guesses (${GamePlayService.MAX_GUESSES_PER_PLAYER}) reached`,
      );
    }

    // Get the target player (required in 2-player game)
    const targetPlayer = await this.playerRepository.findOne({
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

    // Get the target character
    const targetCharacter = await this.characterRepository.findOne({
      where: { id: request.targetCharacterId },
    });

    if (!targetCharacter) {
      throw new NotFoundException('Target character not found');
    }

    // Determine if the guess is correct
    // If guessing a specific player's character
    if (!targetPlayer.secret || !targetPlayer.secret.character) {
      throw new InternalServerErrorException(
        'Target player does not have a secret character assigned',
      );
    }
    const isCorrect = targetPlayer.secret.character.id === targetCharacter.id;

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

    // Apply score penalty for incorrect guess
    if (!isCorrect) {
      guessingPlayer.score += GamePlayService.SCORE_INCORRECT_GUESS_PENALTY;
      // Ensure score doesn't go below 0
      if (guessingPlayer.score < 0) {
        guessingPlayer.score = 0;
      }
      await this.playerRepository.save(guessingPlayer);
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
   * Handle game logic after a guess (scoring, elimination, game end)
   * This is called by GameStatsService after creating the guess
   */
  async handleGuessResult(guess: Guess): Promise<boolean> {
    const guessingPlayer = guess.guessedBy;
    const targetPlayer = guess.targetPlayer;

    // Handle game logic based on guess result
    if (guess.isCorrect && targetPlayer) {
      // Correct guess - reveal the target player's secret and award points
      if (targetPlayer.secret) {
        targetPlayer.secret.status = PlayerSecretStatus.REVEALED;
        await this.playerSecretRepository.save(targetPlayer.secret);
      }

      // Award points to the guessing player
      guessingPlayer.score += GamePlayService.SCORE_CORRECT_GUESS;
      await this.playerRepository.save(guessingPlayer);
    } else {
      // Incorrect guess - penalty is applied in submitGuess
      // We just need to return false to indicate no game end check needed yet
      // unless we want to implement elimination logic here
    }

    // Return true to indicate we need to check for game end
    return true;
  }

  /**
   * Map Guess entity to GuessResponse
   */
  private mapToGuessResponse(
    guess: Guess,
    guessingPlayer: GamePlayer,
    targetPlayer: GamePlayer,
    targetCharacter: Character,
    round: Round,
  ): GuessResponse {
    return {
      id: guess.id,
      roundId: round.id,
      roundNumber: round.roundNumber,
      guessedByPlayerId: guessingPlayer.id,
      guessedByPlayerUsername: guessingPlayer.username,
      targetPlayerId: targetPlayer.id,
      targetPlayerUsername: targetPlayer.username,
      targetCharacterId: targetCharacter.id,
      targetCharacterName: targetCharacter.name,
      isCorrect: guess.isCorrect,
      latencyMs: guess.latencyMs ?? undefined,
      guessedAt: guess.guessedAt.toISOString(),
    };
  }

  /**
   * Get a player's assigned character
   */
  async getPlayerCharacter(
    roomCode: string,
    playerId: string,
  ): Promise<PlayerCharacterResponse> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);

    // Get the game to verify it exists and is in progress
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    // Get the player with their secret character
    const player = await this.playerRepository.findOne({
      where: { id: playerId },
      relations: {
        game: true,
        secret: { character: true },
      },
    });

    if (!player) {
      throw new NotFoundException('Player not found');
    }

    if (player.game.id !== game.id) {
      throw new BadRequestException('Player is not in this game');
    }

    if (!player.secret || !player.secret.character) {
      throw new NotFoundException(
        'No character has been assigned to this player yet',
      );
    }

    // Return the player's assigned character
    return {
      playerId: player.id,
      character: {
        id: player.secret.character.id,
        name: player.secret.character.name,
        slug: player.secret.character.slug,
        imageUrl: player.secret.character.imageUrl ?? null,
        summary: player.secret.character.summary ?? null,
        metadata: player.secret.character.metadata ?? {},
        isActive: player.secret.character.isActive,
      },
      assignedAt: player.secret.assignedAt.toISOString(),
    };
  }
}
