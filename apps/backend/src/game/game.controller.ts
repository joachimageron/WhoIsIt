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
  SubmitAnswerRequest,
  AnswerResponse,
  MakeGuessRequest,
  GuessResponse,
} from '@whois-it/contracts';
import { GameService } from './game.service';
import { GameGateway } from './game.gateway';

@Controller('games')
export class GameController {
  constructor(
    private readonly gameService: GameService,
    private readonly gameGateway: GameGateway,
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

  @Post(':roomCode/start')
  async startGame(
    @Param('roomCode') roomCode: string,
  ): Promise<GameLobbyResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    const result = await this.gameService.startGame(roomCode);

    // Broadcast gameStarted event to all players in the room
    await this.gameGateway.broadcastGameStarted(roomCode);

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

    const result = await this.gameService.askQuestion(roomCode, {
      ...body,
      questionText: body.questionText.trim(),
    });

    // Broadcast questionAsked event
    this.gameGateway.broadcastQuestionAsked(roomCode, result);

    return result;
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

    const result = await this.gameService.submitAnswer(roomCode, body);

    // Broadcast answerSubmitted event
    this.gameGateway.broadcastAnswerSubmitted(roomCode, result);

    return result;
  }

  @Post(':roomCode/guesses')
  async makeGuess(
    @Param('roomCode') roomCode: string,
    @Body() body: MakeGuessRequest,
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

    const result = await this.gameService.makeGuess(roomCode, body);

    // Broadcast guessResult event
    this.gameGateway.broadcastGuessResult(roomCode, result);

    // Check if game is over
    const gameOver = await this.gameService.checkGameOver(roomCode);
    if (gameOver) {
      this.gameGateway.broadcastGameOver(roomCode, gameOver);
    }

    return result;
  }
}
