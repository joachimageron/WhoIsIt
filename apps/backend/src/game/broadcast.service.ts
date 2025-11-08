import { Injectable, Logger } from '@nestjs/common';
import { GameService } from './game.service';
import type {
  QuestionResponse,
  GameStateResponse,
  AnswerResponse,
  GuessResponse,
} from '@whois-it/contracts';
import type { TypedServer } from './types/gateway.types';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);
  private server!: TypedServer;

  constructor(private readonly gameService: GameService) {}

  /**
   * Set the Socket.IO server instance
   */
  setServer(server: TypedServer) {
    this.server = server;
  }

  /**
   * Normalize room code to uppercase and trimmed
   */
  private normalizeRoomCode(roomCode: string): string {
    return roomCode.trim().toUpperCase();
  }

  /**
   * Broadcast lobby update to all clients in a room
   */
  async broadcastLobbyUpdate(roomCode: string) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);
      this.server.to(normalizedRoomCode).emit('lobbyUpdate', lobby);
      this.logger.log(`Broadcasted lobby update to room ${normalizedRoomCode}`);
    } catch (error) {
      this.logger.error('Error broadcasting lobby update:', error);
    }
  }

  /**
   * Broadcast game started event to all clients in a room
   */
  async broadcastGameStarted(roomCode: string) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);
      this.server.to(normalizedRoomCode).emit('gameStarted', {
        roomCode: normalizedRoomCode,
        lobby,
      });
      this.logger.log(`Broadcasted game started to room ${normalizedRoomCode}`);
    } catch (error) {
      this.logger.error('Error broadcasting game started:', error);
    }
  }

  /**
   * Broadcast question asked event to all clients in a room
   */
  broadcastQuestionAsked(
    roomCode: string,
    question: QuestionResponse,
    gameState: GameStateResponse,
  ) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      this.server.to(normalizedRoomCode).emit('questionAsked', {
        roomCode: normalizedRoomCode,
        question,
        gameState,
      });
      this.logger.log(
        `Broadcasted question asked to room ${normalizedRoomCode}`,
      );
    } catch (error) {
      this.logger.error('Error broadcasting question asked:', error);
    }
  }

  /**
   * Broadcast answer submitted event to all clients in a room
   */
  broadcastAnswerSubmitted(
    roomCode: string,
    answer: AnswerResponse,
    gameState: GameStateResponse,
  ) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      this.server.to(normalizedRoomCode).emit('answerSubmitted', {
        roomCode: normalizedRoomCode,
        answer,
        gameState,
      });
      this.logger.log(
        `Broadcasted answer submitted to room ${normalizedRoomCode}`,
      );
    } catch (error) {
      this.logger.error('Error broadcasting answer submitted:', error);
    }
  }

  /**
   * Broadcast guess result event to all clients in a room
   */
  broadcastGuessResult(
    roomCode: string,
    guess: GuessResponse,
    gameState: GameStateResponse,
  ) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      this.server.to(normalizedRoomCode).emit('guessResult', {
        roomCode: normalizedRoomCode,
        guess,
        gameState,
      });
      this.logger.log(
        `Broadcasted guess result to room ${normalizedRoomCode} (correct: ${guess.isCorrect})`,
      );
    } catch (error) {
      this.logger.error('Error broadcasting guess result:', error);
    }
  }

  /**
   * Broadcast game over event to all clients in a room
   */
  async broadcastGameOver(roomCode: string) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      const result =
        await this.gameService.getGameOverResult(normalizedRoomCode);

      this.server.to(normalizedRoomCode).emit('gameOver', {
        roomCode: normalizedRoomCode,
        result,
      });

      this.logger.log(
        `Broadcasted game over to room ${normalizedRoomCode} (winner: ${result.winnerUsername ?? 'none'})`,
      );
    } catch (error) {
      this.logger.error('Error broadcasting game over:', error);
    }
  }
}
