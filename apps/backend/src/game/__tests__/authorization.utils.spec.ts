import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamePlayer, User } from '../../database/entities';
import { validatePlayerOwnership } from '../utils/authorization.utils';

describe('Authorization Utils', () => {
  let playerRepository: Repository<GamePlayer>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: getRepositoryToken(GamePlayer),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    playerRepository = module.get<Repository<GamePlayer>>(
      getRepositoryToken(GamePlayer),
    );
  });

  describe('validatePlayerOwnership', () => {
    it('should allow authenticated user to act as their own player', async () => {
      const authenticatedUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      } as User;

      const player = {
        id: 'player-1',
        username: 'testuser',
        user: authenticatedUser,
        game: { id: 'game-1' },
      } as GamePlayer;

      jest.spyOn(playerRepository, 'findOne').mockResolvedValue(player);

      const result = await validatePlayerOwnership(
        playerRepository,
        'player-1',
        authenticatedUser,
      );

      expect(result).toBe(player);
      expect(playerRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'player-1' },
        relations: { user: true, game: true },
      });
    });

    it('should allow guest user to act as guest player', async () => {
      const player = {
        id: 'player-1',
        username: 'guest123',
        user: null, // Guest player
        game: { id: 'game-1' },
      } as GamePlayer;

      jest.spyOn(playerRepository, 'findOne').mockResolvedValue(player);

      const result = await validatePlayerOwnership(
        playerRepository,
        'player-1',
        null, // No authenticated user (guest)
      );

      expect(result).toBe(player);
    });

    it('should throw NotFoundException if player does not exist', async () => {
      jest.spyOn(playerRepository, 'findOne').mockResolvedValue(null);

      await expect(
        validatePlayerOwnership(
          playerRepository,
          'nonexistent-player',
          null,
        ),
      ).rejects.toThrow(NotFoundException);
      await expect(
        validatePlayerOwnership(
          playerRepository,
          'nonexistent-player',
          null,
        ),
      ).rejects.toThrow('Player not found');
    });

    it('should throw ForbiddenException if authenticated user tries to act as another users player', async () => {
      const authenticatedUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      } as User;

      const otherUser = {
        id: 'user-2',
        username: 'otheruser',
        email: 'other@example.com',
      } as User;

      const player = {
        id: 'player-2',
        username: 'otheruser',
        user: otherUser,
        game: { id: 'game-1' },
      } as GamePlayer;

      jest.spyOn(playerRepository, 'findOne').mockResolvedValue(player);

      await expect(
        validatePlayerOwnership(
          playerRepository,
          'player-2',
          authenticatedUser,
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        validatePlayerOwnership(
          playerRepository,
          'player-2',
          authenticatedUser,
        ),
      ).rejects.toThrow(
        'You are not authorized to perform this action for this player',
      );
    });

    it('should throw ForbiddenException if unauthenticated user tries to act as authenticated players player', async () => {
      const authenticatedUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      } as User;

      const player = {
        id: 'player-1',
        username: 'testuser',
        user: authenticatedUser,
        game: { id: 'game-1' },
      } as GamePlayer;

      jest.spyOn(playerRepository, 'findOne').mockResolvedValue(player);

      await expect(
        validatePlayerOwnership(
          playerRepository,
          'player-1',
          null, // No authenticated user
        ),
      ).rejects.toThrow(ForbiddenException);
      await expect(
        validatePlayerOwnership(
          playerRepository,
          'player-1',
          null,
        ),
      ).rejects.toThrow('You must be authenticated to perform this action');
    });

    it('should throw ForbiddenException if undefined user tries to act as authenticated players player', async () => {
      const authenticatedUser = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
      } as User;

      const player = {
        id: 'player-1',
        username: 'testuser',
        user: authenticatedUser,
        game: { id: 'game-1' },
      } as GamePlayer;

      jest.spyOn(playerRepository, 'findOne').mockResolvedValue(player);

      await expect(
        validatePlayerOwnership(
          playerRepository,
          'player-1',
          undefined, // Undefined authenticated user
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
