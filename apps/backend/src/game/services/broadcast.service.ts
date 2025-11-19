import { Injectable, Logger } from '@nestjs/common';
import { GameService } from './game.service';
import { GamePlayService } from './game-play.service';
import { ConnectionManager } from '../gateway/connection.manager';
import type {
  QuestionResponse,
  GameStateResponse,
  AnswerResponse,
  GuessResponse,
  PlayerCharacterResponse,
} from '@whois-it/contracts';
import type { TypedServer } from '../gateway/types';

@Injectable()
export class BroadcastService {
  private readonly logger = new Logger(BroadcastService.name);
  private server!: TypedServer;

  constructor(
    private readonly gameService: GameService,
    private readonly gamePlayService: GamePlayService,
    private readonly connectionManager: ConnectionManager,
  ) {}

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
   * Also sends individual character assignments to each player
   */
  async broadcastGameStarted(roomCode: string) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      const lobby =
        await this.gameService.getLobbyByRoomCode(normalizedRoomCode);
      
      // Broadcast game started to all players in the room
      this.server.to(normalizedRoomCode).emit('gameStarted', {
        roomCode: normalizedRoomCode,
        lobby,
      });
      this.logger.log(`Broadcasted game started to room ${normalizedRoomCode}`);

      // Send character assignments individually to each player
      await this.sendCharacterAssignments(normalizedRoomCode, lobby.players);
    } catch (error) {
      this.logger.error('Error broadcasting game started:', error);
    }
  }

  /**
   * Send character assignments to all players in a room
   * Each player receives only their own character via private message
   */
  private async sendCharacterAssignments(
    roomCode: string,
    players: any[],
  ): Promise<void> {
    for (const player of players) {
      try {
        // Get the player's character assignment
        const characterData = await this.gamePlayService.getPlayerCharacter(
          roomCode,
          player.id,
        );

        // Find the socket for this player
        const connections = Array.from(
          this.connectionManager.getAllConnections().values(),
        );
        const playerConnection = connections.find(
          (conn) => conn.playerId === player.id && conn.roomCode === roomCode,
        );

        if (playerConnection) {
          // Send character assignment only to this specific player's socket
          this.sendCharacterAssignment(
            playerConnection.socketId,
            roomCode,
            characterData,
          );
        } else {
          this.logger.warn(
            `Could not find active socket for player ${player.id} to send character assignment`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Error sending character to player ${player.id}:`,
          error,
        );
      }
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
      this.logger.log(`Broadcasted guess result to room ${normalizedRoomCode}`);
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

      this.logger.log(`Broadcasted game over to room ${normalizedRoomCode}`);
    } catch (error) {
      this.logger.error('Error broadcasting game over:', error);
    }
  }

  /**
   * Send character assignment to a specific player (private, not broadcast)
   * This ensures only the player receives their own secret character
   */
  sendCharacterAssignment(
    socketId: string,
    roomCode: string,
    character: PlayerCharacterResponse,
  ) {
    try {
      const normalizedRoomCode = this.normalizeRoomCode(roomCode);
      this.server.to(socketId).emit('characterAssigned', {
        roomCode: normalizedRoomCode,
        character,
      });
      this.logger.log(
        `Sent character assignment to player ${character.playerId} via socket ${socketId}`,
      );
    } catch (error) {
      this.logger.error('Error sending character assignment:', error);
    }
  }
}
