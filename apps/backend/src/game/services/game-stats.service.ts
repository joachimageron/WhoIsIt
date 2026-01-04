import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  GameStatus,
  RoundState,
  PlayerSecretStatus,
} from '../../database/enums';
import {
  Game,
  GamePlayer,
  Round,
  PlayerSecret,
  PlayerStats,
} from '../../database/entities';
import type { GameOverResult, PlayerGameResult } from '@whois-it/contracts';
import { GameLobbyService } from './game-lobby.service';

@Injectable()
export class GameStatsService {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepository: Repository<Game>,
    @InjectRepository(GamePlayer)
    private readonly playerRepository: Repository<GamePlayer>,
    @InjectRepository(Round)
    private readonly roundRepository: Repository<Round>,
    @InjectRepository(PlayerSecret)
    private readonly playerSecretRepository: Repository<PlayerSecret>,
    @InjectRepository(PlayerStats)
    private readonly playerStatsRepository: Repository<PlayerStats>,
    private readonly gameLobbyService: GameLobbyService,
  ) {}

  /**
   * Check if the game should end and handle the end if so
   * @param game The game to check
   * @param potentialWinner The player who may have won (e.g., by correct guess).
   *                        Pass null when checking after player elimination to auto-find winner.
   * @returns true if game ended, false otherwise
   */
  async checkAndHandleGameEnd(
    game: Game,
    potentialWinner: GamePlayer | null,
  ): Promise<boolean> {
    // Get count of unrevealed players
    const unrevealedPlayers = await this.playerSecretRepository
      .createQueryBuilder('secret')
      .innerJoin('secret.player', 'player')
      .where('player.game_id = :gameId', { gameId: game.id })
      .andWhere('player.leftAt IS NULL')
      .andWhere('secret.status = :status', {
        status: PlayerSecretStatus.HIDDEN,
      })
      .getCount();

    // Check if only one player has unrevealed secret (they are the winner)
    // or if the potential winner just made the winning guess
    if (
      unrevealedPlayers <= 1 ||
      (potentialWinner && unrevealedPlayers === 1)
    ) {
      // Find the winner if not provided
      let winner = potentialWinner;
      if (!winner) {
        // Find the last remaining player with unrevealed secret
        const lastPlayerSecret = await this.playerSecretRepository
          .createQueryBuilder('secret')
          .innerJoinAndSelect('secret.player', 'player')
          .leftJoinAndSelect('player.user', 'user')
          .where('player.game_id = :gameId', { gameId: game.id })
          .andWhere('player.leftAt IS NULL')
          .andWhere('secret.status = :status', {
            status: PlayerSecretStatus.HIDDEN,
          })
          .getOne();

        if (lastPlayerSecret?.player) {
          winner = lastPlayerSecret.player;
        }
      }

      if (winner) {
        await this.endGame(game, winner);
        return true;
      }
    }

    return false;
  }

  /**
   * End the game, calculate final scores, and save statistics
   */
  async endGame(game: Game, winner: GamePlayer): Promise<void> {
    // Mark game as completed
    game.status = GameStatus.COMPLETED;
    game.endedAt = new Date();
    game.winner = winner.user ?? null;
    await this.gameRepository.save(game);

    // Close the current round
    const currentRound = await this.roundRepository.findOne({
      where: { game: { id: game.id } },
      order: { roundNumber: 'DESC' },
    });
    if (currentRound) {
      currentRound.state = RoundState.CLOSED;
      currentRound.endedAt = new Date();
      if (currentRound.startedAt) {
        currentRound.durationMs =
          currentRound.endedAt.getTime() - currentRound.startedAt.getTime();
      }
      await this.roundRepository.save(currentRound);
    }

    // Calculate placements based on scores
    await this.calculatePlacements(game);

    // Update player statistics for all players
    await this.updatePlayerStatistics(game);
  }

  /**
   * Calculate and assign placements to all players based on their scores
   */
  private async calculatePlacements(game: Game): Promise<void> {
    const players = await this.playerRepository
      .createQueryBuilder('player')
      .where('player.game_id = :gameId', { gameId: game.id })
      .andWhere('player.leftAt IS NULL')
      .orderBy('player.score', 'DESC')
      .getMany();

    let currentPlacement = 1;
    let previousScore: number | null = null;
    let playersAtSameRank = 0;

    for (const player of players) {
      if (previousScore !== null && player.score < previousScore) {
        currentPlacement += playersAtSameRank;
        playersAtSameRank = 1;
      } else {
        playersAtSameRank++;
      }

      player.placement = currentPlacement;
      previousScore = player.score;
      await this.playerRepository.save(player);
    }
  }

  /**
   * Update player statistics after game ends
   */
  private async updatePlayerStatistics(game: Game): Promise<void> {
    // Load players with their relations
    const players = await this.playerRepository.find({
      where: { game: { id: game.id } },
      relations: {
        user: true,
        askedQuestions: true,
        answers: true,
        guesses: true,
      },
    });

    for (const player of players) {
      // Only update stats for registered users (not guests)
      if (!player.user) {
        continue;
      }

      // Get or create player stats
      let stats = await this.playerStatsRepository.findOne({
        where: { userId: player.user.id },
      });

      if (!stats) {
        stats = this.playerStatsRepository.create({
          userId: player.user.id,
          user: player.user,
          gamesPlayed: 0,
          gamesWon: 0,
          totalQuestions: 0,
          totalGuesses: 0,
          fastestWinSeconds: null,
          streak: 0,
        });
      }

      // Update statistics
      stats.gamesPlayed += 1;

      // Check if this player won
      const isWinner = game.winner?.id === player.user.id;
      if (isWinner) {
        stats.gamesWon += 1;

        // Calculate game duration for fastest win
        if (game.startedAt && game.endedAt) {
          const gameDurationSeconds = Math.floor(
            (game.endedAt.getTime() - game.startedAt.getTime()) / 1000,
          );
          if (
            stats.fastestWinSeconds === null ||
            stats.fastestWinSeconds === undefined ||
            gameDurationSeconds < stats.fastestWinSeconds
          ) {
            stats.fastestWinSeconds = gameDurationSeconds;
          }
        }

        // Update win streak
        stats.streak += 1;
      } else {
        // Reset streak on loss
        stats.streak = 0;
      }

      // Count questions and guesses
      const questionsAsked = player.askedQuestions?.length ?? 0;
      const guessesCount = player.guesses?.length ?? 0;

      stats.totalQuestions += questionsAsked;
      stats.totalGuesses += guessesCount;

      await this.playerStatsRepository.save(stats);
    }
  }

  /**
   * Get game over result with all player statistics
   */
  async getGameOverResult(roomCode: string): Promise<GameOverResult> {
    const normalizedRoomCode =
      this.gameLobbyService.normalizeRoomCode(roomCode);
    const game = await this.gameRepository.findOne({
      where: { roomCode: normalizedRoomCode },
      relations: {
        players: {
          user: true,
          askedQuestions: true,
          answers: true,
          guesses: true,
        },
        winner: true,
        rounds: true,
      },
    });

    if (!game) {
      throw new NotFoundException('Game not found');
    }

    if (game.status !== GameStatus.COMPLETED) {
      throw new BadRequestException('Game is not completed yet');
    }

    const gameDurationSeconds =
      game.startedAt && game.endedAt
        ? Math.floor((game.endedAt.getTime() - game.startedAt.getTime()) / 1000)
        : 0;

    const totalRounds = game.rounds?.length ?? 0;

    const playerResults: PlayerGameResult[] = (game.players ?? [])
      .filter((p) => !p.leftAt)
      .map((player) => {
        const questionsAsked = player.askedQuestions?.length ?? 0;
        const questionsAnswered = player.answers?.length ?? 0;
        const allGuesses = player.guesses ?? [];
        const correctGuesses = allGuesses.filter((g) => g.isCorrect).length;
        const incorrectGuesses = allGuesses.filter((g) => !g.isCorrect).length;

        const timePlayedSeconds =
          game.startedAt && player.joinedAt
            ? Math.floor(
                ((game.endedAt ?? new Date()).getTime() -
                  Math.max(
                    game.startedAt.getTime(),
                    player.joinedAt.getTime(),
                  )) /
                  1000,
              )
            : 0;

        const isWinner = game.winner?.id === player.user?.id;

        return {
          playerId: player.id,
          playerUsername: player.username,
          userId: player.user?.id,
          score: player.score,
          questionsAsked,
          questionsAnswered,
          correctGuesses,
          incorrectGuesses,
          timePlayedSeconds,
          isWinner,
          placement: player.placement ?? 999,
          leftAt: player.leftAt?.toISOString(),
        };
      })
      .sort((a, b) => a.placement - b.placement);

    return {
      gameId: game.id,
      roomCode: game.roomCode,
      winnerId: game.winner?.id,
      winnerUsername: playerResults.find((p) => p.isWinner)?.playerUsername,
      totalRounds,
      gameDurationSeconds,
      endReason: 'victory',
      players: playerResults,
    };
  }
}
