import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GamePlayer } from '../../database/entities/game-player.entity';
import { User } from '../../database/entities/user.entity';

/**
 * Validates that the authenticated user owns the player they're trying to act as.
 * Throws ForbiddenException if the user doesn't own the player.
 * Throws NotFoundException if the player doesn't exist.
 *
 * @param playerRepository - The GamePlayer repository
 * @param playerId - The ID of the player being acted upon
 * @param authenticatedUser - The authenticated user (from JWT) or null for guests
 * @returns The validated GamePlayer entity
 */
export async function validatePlayerOwnership(
  playerRepository: Repository<GamePlayer>,
  playerId: string,
  authenticatedUser: User | null | undefined,
): Promise<GamePlayer> {
  // Get the player with user relation
  const player = await playerRepository.findOne({
    where: { id: playerId },
    relations: { user: true, game: true },
  });

  if (!player) {
    throw new NotFoundException('Player not found');
  }

  // If the player has a userId, verify it matches the authenticated user
  if (player.user) {
    // Player is associated with a registered user
    if (!authenticatedUser) {
      throw new ForbiddenException(
        'You must be authenticated to perform this action',
      );
    }

    if (player.user.id !== authenticatedUser.id) {
      throw new ForbiddenException(
        'You are not authorized to perform this action for this player',
      );
    }
  } else {
    // Player is a guest - for now, we allow any action on guest players
    // In a future enhancement, we could validate guest session tokens
    // stored in the reconnectToken field or a separate session management system
  }

  return player;
}
