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

  @Post(':roomCode/answers')
  async submitAnswer(
    @Param('roomCode') roomCode: string,
    @Body() body: SubmitAnswerRequest,
  ): Promise<AnswerResponse> {
    if (!roomCode || roomCode.trim().length === 0) {
      throw new BadRequestException('roomCode is required');
    }

    if (!body?.questionId || body.questionId.trim().length === 0) {
      throw new BadRequestException('questionId is required');
    }

    if (!body?.answerValue) {
      throw new BadRequestException('answerValue is required');
    }

    const { answer, question } = await this.gameService.submitAnswer(
      roomCode,
      body,
    );

    // Broadcast answerSubmitted event to all players in the room
    this.gameGateway.broadcastAnswerSubmitted(roomCode, {
      answer,
      question,
    });

    return answer;
  }
}
