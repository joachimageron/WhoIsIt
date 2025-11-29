import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameStatus } from '../../database/enums';
import { Game, Guess } from '../../database/entities';
import type {
  CreateGameRequest,
  GameLobbyResponse,
  AskQuestionRequest,
  QuestionResponse,
  GameStateResponse,
  SubmitAnswerRequest,
  AnswerResponse,
  SubmitGuessRequest,
  GuessResponse,
  GameOverResult,
  PlayerCharacterResponse,
} from '@whois-it/contracts';
import { GameLobbyService } from './game-lobby.service';
import { GamePlayService } from './game-play.service';
import { GameStatsService } from './game-stats.service';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    private readonly gameLobbyService: GameLobbyService,
    private readonly gamePlayService: GamePlayService,
    private readonly gameStatsService: GameStatsService,
  ) {}

  // Delegate lobby operations to GameLobbyService
  async createGame(
    request: CreateGameRequest,
    hostUserId: string,
    hostUsername: string,
  ): Promise<GameLobbyResponse> {
    return this.gameLobbyService.createGame(request, hostUserId, hostUsername);
  }

  async joinGame(
    roomCode: string,
    userId: string,
    username: string,
  ): Promise<GameLobbyResponse> {
    return this.gameLobbyService.joinGame(roomCode, userId, username);
  }

  async getLobbyByRoomCode(roomCode: string): Promise<GameLobbyResponse> {
    return this.gameLobbyService.getLobbyByRoomCode(roomCode);
  }

  async getGameByRoomCode(roomCode: string): Promise<Game | null> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);
    return this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        characterSet: true,
        host: true,
        players: { user: true },
      },
    });
  }

  async getPlayerIdByUserId(
    roomCode: string,
    userId: string,
  ): Promise<string | null> {
    const game = await this.getGameByRoomCode(roomCode);
    if (!game) return null;

    const player = game.players?.find((p) => p.user?.id === userId);
    return player ? player.id : null;
  }

  async updatePlayerReady(playerId: string, isReady: boolean) {
    return this.gameLobbyService.updatePlayerReady(playerId, isReady);
  }

  async markPlayerAsLeft(playerId: string) {
    return this.gameLobbyService.markPlayerAsLeft(playerId);
  }

  // Start game logic
  async startGame(roomCode: string): Promise<GameLobbyResponse> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        characterSet: true,
        host: true,
        players: { user: true },
      },
    });

    if (!game) {
      throw new BadRequestException('Game not found');
    }

    if (game.status !== GameStatus.LOBBY) {
      throw new BadRequestException('Game has already started or ended');
    }

    if (!game.players || game.players.length !== 2) {
      throw new BadRequestException('Need exactly 2 players to start the game');
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
    await this.gamePlayService.initializeFirstRound(game);

    // Assign secret characters to each player
    await this.gamePlayService.assignSecretCharacters(game);

    return this.gameLobbyService.getLobbyByRoomCode(roomCode);
  }

  // Delegate gameplay operations to GamePlayService
  async getGameState(roomCode: string): Promise<GameStateResponse> {
    return this.gamePlayService.getGameState(roomCode);
  }

  async askQuestion(
    roomCode: string,
    userId: string,
    request: AskQuestionRequest,
  ): Promise<QuestionResponse> {
    const playerId = await this.getPlayerIdByUserId(roomCode, userId);
    if (!playerId) {
      throw new ForbiddenException('You are not a player in this game');
    }
    return this.gamePlayService.askQuestion(roomCode, playerId, request);
  }

  async getQuestions(roomCode: string): Promise<QuestionResponse[]> {
    return this.gamePlayService.getQuestions(roomCode);
  }

  async getAnswers(roomCode: string): Promise<AnswerResponse[]> {
    return this.gamePlayService.getAnswers(roomCode);
  }

  async submitAnswer(
    roomCode: string,
    userId: string,
    request: SubmitAnswerRequest,
  ): Promise<AnswerResponse> {
    const playerId = await this.getPlayerIdByUserId(roomCode, userId);
    if (!playerId) {
      throw new ForbiddenException('You are not a player in this game');
    }
    return this.gamePlayService.submitAnswer(roomCode, playerId, request);
  }

  async submitGuess(
    roomCode: string,
    userId: string,
    request: SubmitGuessRequest,
  ): Promise<GuessResponse> {
    const playerId = await this.getPlayerIdByUserId(roomCode, userId);
    if (!playerId) {
      throw new ForbiddenException('You are not a player in this game');
    }

    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);

    // Get the game first
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
      throw new BadRequestException('Game not found');
    }

    const currentRound = game.rounds?.[0];
    if (!currentRound) {
      throw new BadRequestException('No active round found');
    }

    // Submit the guess
    const guessResponse = await this.gamePlayService.submitGuess(
      roomCode,
      playerId,
      request,
    );

    // Get the guess entity to handle game logic
    const guess = await this.gameRepository.manager.findOne(Guess, {
      where: { id: guessResponse.id },
      relations: {
        guessedBy: true,
        targetPlayer: { secret: true },
        round: true,
      },
    });

    if (guess) {
      // Handle guess result
      const shouldCheckGameEnd =
        await this.gamePlayService.handleGuessResult(guess);

      if (shouldCheckGameEnd) {
        // Check if game should end
        const gameEnded = await this.gameStatsService.checkAndHandleGameEnd(
          game,
          guess.isCorrect ? guess.guessedBy : null,
        );

        if (!gameEnded) {
          // Continue to next turn if game hasn't ended
          await this.gamePlayService.advanceToNextTurn(currentRound, game);
        }
      } else {
        // If we don't need to check game end, still advance to next turn
        await this.gamePlayService.advanceToNextTurn(currentRound, game);
      }
    }

    return guessResponse;
  }

  async getPlayerCharacter(
    roomCode: string,
    userId: string,
    playerId: string,
  ): Promise<PlayerCharacterResponse> {
    const authenticatedPlayerId = await this.getPlayerIdByUserId(
      roomCode,
      userId,
    );
    if (authenticatedPlayerId !== playerId) {
      throw new ForbiddenException('You can only view your own character');
    }
    return this.gamePlayService.getPlayerCharacter(roomCode, playerId);
  }

  // Delegate statistics operations to GameStatsService
  async getGameOverResult(roomCode: string): Promise<GameOverResult> {
    return this.gameStatsService.getGameOverResult(roomCode);
  }
}
