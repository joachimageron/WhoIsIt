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

    if (!body?.category) {
      throw new BadRequestException('category is required');
    }

    const validCategories = ['trait', 'direct', 'meta'];
    if (!validCategories.includes(body.category)) {
      throw new BadRequestException(
        `category must be one of: ${validCategories.join(', ')}`,
      );
    }

    if (!body?.answerType) {
      throw new BadRequestException('answerType is required');
    }

    const validAnswerTypes = ['boolean', 'text'];
    if (!validAnswerTypes.includes(body.answerType)) {
      throw new BadRequestException(
        `answerType must be one of: ${validAnswerTypes.join(', ')}`,
      );
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
    this.gameGateway.broadcastQuestionAsked(roomCode, question, gameState);

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

    const validAnswerValues = ['yes', 'no', 'unsure'];
    if (!validAnswerValues.includes(body.answerValue)) {
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
    this.gameGateway.broadcastAnswerSubmitted(roomCode, answer, gameState);

    return answer;
  }
}
