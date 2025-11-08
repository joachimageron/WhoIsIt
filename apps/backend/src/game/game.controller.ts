import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import type {
  CreateGameRequest,
  GameLobbyResponse,
  JoinGameRequest,
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
import { GameService } from './game.service';
import { BroadcastService } from './broadcast.service';
import { AnswerValue } from '../database/enums';

@Controller('games')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly broadcastService: BroadcastService,
  ) {}

  @Post()
  async create(@Body() body: CreateGameRequest): Promise<GameLobbyResponse> {
    if (!body?.characterSetId || body.characterSetId.trim().length === 0) {
      throw new BadRequestException('characterSetId is required');
    }

    if (!body.hostUsername && !body.hostUserId) {
      throw new BadRequestException(
        'hostUsername is required when hostUserId is missing',
      );
    }

    return this.gameService.createGame({
      ...body,
      characterSetId: body.characterSetId.trim(),
      hostUsername: body.hostUsername?.trim(),
    });
  }

  @Post(':roomCode/join')
  async join(
    @Param('roomCode') roomCode: string,
    @Body() body: JoinGameRequest,
  ): Promise<GameLobbyResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    if (!body?.username && !body?.userId) {
      throw new BadRequestException(
        'username is required when userId is missing',
      );
    }

    return this.gameService.joinGame(roomCode, {
      ...body,
      username: body.username?.trim(),
      avatarUrl: body.avatarUrl?.trim(),
    });
  }

  @Get(':roomCode')
  async getLobby(
    @Param('roomCode') roomCode: string,
  ): Promise<GameLobbyResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    return this.gameService.getLobbyByRoomCode(roomCode);
  }

  @Get(':roomCode/players/:playerId/character')
  async getPlayerCharacter(
    @Param('roomCode') roomCode: string,
    @Param('playerId') playerId: string,
  ): Promise<PlayerCharacterResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    if (!playerId || playerId.trim().length === 0) {
      throw new BadRequestException('playerId is required');
    }

    return this.gameService.getPlayerCharacter(roomCode, playerId);
  }

  @Post(':roomCode/start')
  async startGame(
    @Param('roomCode') roomCode: string,
  ): Promise<GameLobbyResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    const result = await this.gameService.startGame(roomCode);

    // Broadcast gameStarted event to all players in the room
    await this.broadcastService.broadcastGameStarted(roomCode);

    return result;
  }

  @Post(':roomCode/questions')
  async askQuestion(
    @Param('roomCode') roomCode: string,
    @Body() body: AskQuestionRequest,
  ): Promise<QuestionResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    if (!body?.playerId || body.playerId.trim().length === 0) {
      throw new BadRequestException('playerId is required');
    }

    if (!body?.questionText || body.questionText.trim().length === 0) {
      throw new BadRequestException('questionText is required');
    }

    const question = await this.gameService.askQuestion(roomCode, {
      ...body,
      questionText: body.questionText.trim(),
      playerId: body.playerId.trim(),
      targetPlayerId: body.targetPlayerId?.trim(),
    });

    // Get updated game state
    const gameState = await this.gameService.getGameState(roomCode);

    // Broadcast questionAsked event to all players in the room
    this.broadcastService.broadcastQuestionAsked(roomCode, question, gameState);

    return question;
  }

  @Get(':roomCode/state')
  async getGameState(
    @Param('roomCode') roomCode: string,
  ): Promise<GameStateResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    return this.gameService.getGameState(roomCode);
  }

  @Get(':roomCode/questions')
  async getQuestions(
    @Param('roomCode') roomCode: string,
  ): Promise<QuestionResponse[]> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    return this.gameService.getQuestions(roomCode);
  }

  @Get(':roomCode/answers')
  async getAnswers(
    @Param('roomCode') roomCode: string,
  ): Promise<AnswerResponse[]> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    return this.gameService.getAnswers(roomCode);
  }

  @Post(':roomCode/answers')
  async submitAnswer(
    @Param('roomCode') roomCode: string,
    @Body() body: SubmitAnswerRequest,
  ): Promise<AnswerResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    if (!body?.playerId || body.playerId.trim().length === 0) {
      throw new BadRequestException('playerId is required');
    }

    if (!body?.questionId || body.questionId.trim().length === 0) {
      throw new BadRequestException('questionId is required');
    }

    if (!body?.answerValue) {
      throw new BadRequestException('answerValue is required');
    }

    const validAnswerValues = Object.values(AnswerValue);
    if (!validAnswerValues.includes(body.answerValue as AnswerValue)) {
      throw new BadRequestException(
        `answerValue must be one of: ${validAnswerValues.join(', ')}`,
      );
    }

    const answer = await this.gameService.submitAnswer(roomCode, {
      ...body,
      playerId: body.playerId.trim(),
      questionId: body.questionId.trim(),
      answerText: body.answerText?.trim(),
    });

    // Get updated game state
    const gameState = await this.gameService.getGameState(roomCode);

    // Broadcast answerSubmitted event to all players in the room
    this.broadcastService.broadcastAnswerSubmitted(roomCode, answer, gameState);

    return answer;
  }

  @Post(':roomCode/guesses')
  async submitGuess(
    @Param('roomCode') roomCode: string,
    @Body() body: SubmitGuessRequest,
  ): Promise<GuessResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    if (!body?.playerId || body.playerId.trim().length === 0) {
      throw new BadRequestException('playerId is required');
    }

    if (
      !body?.targetCharacterId ||
      body.targetCharacterId.trim().length === 0
    ) {
      throw new BadRequestException('targetCharacterId is required');
    }

    const guess = await this.gameService.submitGuess(roomCode, {
      ...body,
      playerId: body.playerId.trim(),
      targetPlayerId: body.targetPlayerId?.trim(),
      targetCharacterId: body.targetCharacterId.trim(),
    });

    // Get updated game state
    const gameState = await this.gameService.getGameState(roomCode);

    // Broadcast guessResult event to all players in the room
    this.broadcastService.broadcastGuessResult(roomCode, guess, gameState);

    // Check if game has ended and broadcast gameOver if so
    if (gameState.status === 'completed') {
      await this.broadcastService.broadcastGameOver(roomCode);
    }

    return guess;
  }

  @Get(':roomCode/results')
  async getGameResults(
    @Param('roomCode') roomCode: string,
  ): Promise<GameOverResult> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    return this.gameService.getGameOverResult(roomCode);
  }
}
