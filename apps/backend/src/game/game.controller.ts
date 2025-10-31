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

    if (!body?.answerType) {
      throw new BadRequestException('answerType is required');
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
}
