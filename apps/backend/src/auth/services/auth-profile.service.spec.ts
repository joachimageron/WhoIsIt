import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { AuthProfileService } from './auth-profile.service';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from '../../database/entities/user.entity';
import { PlayerStats } from '../../database/entities/player-stats.entity';
import { Game } from '../../database/entities/game.entity';
import { GamePlayer } from '../../database/entities/game-player.entity';
import { EmailService } from '../../email/email.service';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ChangePasswordDto } from '../dto/change-password.dto';
import { GameStatus } from '../../database/enums';

// Mock bcrypt at the top level
jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
}));

const bcrypt = require('bcrypt');

describe('AuthProfileService', () => {
  let service: AuthProfileService;
  let userRepository: jest.Mocked<Repository<User>>;
  let playerStatsRepository: jest.Mocked<Repository<PlayerStats>>;
  let gamePlayerRepository: jest.Mocked<Repository<GamePlayer>>;
  let _gameRepository: jest.Mocked<Repository<Game>>;
  let emailService: jest.Mocked<EmailService>;

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: 'hashed-password',
    avatarUrl: null,
    emailVerified: true,
  };

  beforeEach(async () => {
    const mockUserRepository = {
      findOne: jest.fn(),
      save: jest.fn(),
    };

    const mockPlayerStatsRepository = {
      findOne: jest.fn(),
    };

    const mockGamePlayerRepository = {
      findAndCount: jest.fn(),
    };

    const mockGameRepository = {
      find: jest.fn(),
    };

    const mockEmailService = {
      sendVerificationEmail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthProfileService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(PlayerStats),
          useValue: mockPlayerStatsRepository,
        },
        {
          provide: getRepositoryToken(GamePlayer),
          useValue: mockGamePlayerRepository,
        },
        {
          provide: getRepositoryToken(Game),
          useValue: mockGameRepository,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthProfileService>(AuthProfileService);
    userRepository = module.get(getRepositoryToken(User));
    playerStatsRepository = module.get(getRepositoryToken(PlayerStats));
    gamePlayerRepository = module.get(getRepositoryToken(GamePlayer));
    _gameRepository = module.get(getRepositoryToken(Game));
    emailService = module.get(EmailService);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateProfile', () => {
    it('should update username', async () => {
      const user = { ...mockUser } as User;
      const updateDto: UpdateProfileDto = {
        username: 'newusername',
      };

      userRepository.findOne
        .mockResolvedValueOnce(user) // First call for finding the user
        .mockResolvedValueOnce(null); // Second call for checking username uniqueness
      userRepository.save.mockResolvedValue({ ...user, username: 'newusername' } as User);

      await service.updateProfile('user-123', updateDto);

      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'newusername' },
      });
      expect(userRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if username is taken', async () => {
      const user = { ...mockUser } as User;
      const existingUser = { id: 'other-user', username: 'newusername' } as User;
      const updateDto: UpdateProfileDto = {
        username: 'newusername',
      };

      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(existingUser);

      await expect(
        service.updateProfile('user-123', updateDto),
      ).rejects.toThrow(ConflictException);

      // Clear the mock before the second call
      userRepository.findOne.mockClear();
      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(existingUser);

      await expect(
        service.updateProfile('user-123', updateDto),
      ).rejects.toThrow('Username already taken');
    });

    it('should update email and require re-verification', async () => {
      const user = { ...mockUser } as User;
      const updateDto: UpdateProfileDto = {
        email: 'newemail@example.com',
      };

      userRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue(user);

      await service.updateProfile('user-123', updateDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'newemail@example.com',
          emailVerified: false,
          verificationToken: expect.any(String),
          verificationTokenExpiresAt: expect.any(Date),
        }),
      );
      expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(
        'newemail@example.com',
        'testuser',
        expect.any(String),
      );
    });

    it('should throw ConflictException if email is taken', async () => {
      const user = { ...mockUser } as User;
      const existingUser = {
        id: 'other-user',
        email: 'newemail@example.com',
      } as User;
      const updateDto: UpdateProfileDto = {
        email: 'newemail@example.com',
      };

      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(existingUser);

      await expect(
        service.updateProfile('user-123', updateDto),
      ).rejects.toThrow(ConflictException);

      // Clear the mock before the second call
      userRepository.findOne.mockClear();
      userRepository.findOne.mockResolvedValueOnce(user).mockResolvedValueOnce(existingUser);

      await expect(
        service.updateProfile('user-123', updateDto),
      ).rejects.toThrow('Email already in use');
    });

    it('should update avatar URL', async () => {
      const user = { ...mockUser } as User;
      const updateDto: UpdateProfileDto = {
        avatarUrl: 'https://example.com/new-avatar.jpg',
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);

      await service.updateProfile('user-123', updateDto);

      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          avatarUrl: 'https://example.com/new-avatar.jpg',
        }),
      );
    });

    it('should handle email verification failure gracefully', async () => {
      const user = { ...mockUser } as User;
      const updateDto: UpdateProfileDto = {
        email: 'newemail@example.com',
      };

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      userRepository.findOne
        .mockResolvedValueOnce(user)
        .mockResolvedValueOnce(null);
      userRepository.save.mockResolvedValue(user);
      emailService.sendVerificationEmail.mockRejectedValue(
        new Error('Email service error'),
      );

      await service.updateProfile('user-123', updateDto);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send verification email:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const updateDto: UpdateProfileDto = {
        username: 'newusername',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateProfile('nonexistent-user', updateDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('changePassword', () => {
    it('should change password with valid current password', async () => {
      const user = { ...mockUser } as User;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      userRepository.findOne.mockResolvedValue(user);
      userRepository.save.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(true);

      await service.changePassword('user-123', changePasswordDto);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        'oldPassword123',
        'hashed-password',
      );
      expect(bcrypt.hash).toHaveBeenCalledWith('newPassword456', 10);
      expect(userRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          passwordHash: expect.any(String),
        }),
      );
    });

    it('should throw BadRequestException if current password is incorrect', async () => {
      const user = { ...mockUser } as User;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword456',
      };

      userRepository.findOne.mockResolvedValue(user);
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should throw NotFoundException if user does not exist', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent-user', changePasswordDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user has no password', async () => {
      const userWithoutPassword = { ...mockUser, passwordHash: null } as User;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
      };

      userRepository.findOne.mockResolvedValue(userWithoutPassword);

      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.changePassword('user-123', changePasswordDto),
      ).rejects.toThrow('Cannot change password for this account');
    });
  });

  describe('getPlayerStats', () => {
    it('should return player stats when stats exist', async () => {
      const user = { ...mockUser } as User;
      const mockStats: Partial<PlayerStats> = {
        userId: 'user-123',
        gamesPlayed: 10,
        gamesWon: 7,
        totalQuestions: 50,
        totalGuesses: 20,
        fastestWinSeconds: 180,
        streak: 3,
      };

      userRepository.findOne.mockResolvedValue(user);
      playerStatsRepository.findOne.mockResolvedValue(mockStats as PlayerStats);

      const result = await service.getPlayerStats('user-123');

      expect(result).toEqual({
        gamesPlayed: 10,
        gamesWon: 7,
        totalQuestions: 50,
        totalGuesses: 20,
        fastestWinSeconds: 180,
        streak: 3,
        winRate: 70,
      });
    });

    it('should return default stats when no stats exist', async () => {
      const user = { ...mockUser } as User;

      userRepository.findOne.mockResolvedValue(user);
      playerStatsRepository.findOne.mockResolvedValue(null);

      const result = await service.getPlayerStats('user-123');

      expect(result).toEqual({
        gamesPlayed: 0,
        gamesWon: 0,
        totalQuestions: 0,
        totalGuesses: 0,
        fastestWinSeconds: undefined,
        streak: 0,
        winRate: 0,
      });
    });

    it('should calculate win rate correctly', async () => {
      const user = { ...mockUser } as User;
      const mockStats: Partial<PlayerStats> = {
        userId: 'user-123',
        gamesPlayed: 3,
        gamesWon: 2,
        totalQuestions: 15,
        totalGuesses: 6,
        fastestWinSeconds: null,
        streak: 0,
      };

      userRepository.findOne.mockResolvedValue(user);
      playerStatsRepository.findOne.mockResolvedValue(mockStats as PlayerStats);

      const result = await service.getPlayerStats('user-123');

      expect(result.winRate).toBe(67); // 2/3 * 100 rounded
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(service.getPlayerStats('nonexistent-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getGameHistory', () => {
    it('should return game history when games exist', async () => {
      const user = { ...mockUser } as User;
      const mockGame = {
        id: 'game-123',
        roomCode: 'ABC123',
        status: GameStatus.COMPLETED,
        characterSet: { id: 'set-1', name: 'Characters' },
        winner: { id: 'user-123' },
        players: [
          { id: 'player-1', user: { id: 'user-123' }, username: 'testuser' },
          { id: 'player-2', user: { id: 'user-456' }, username: 'opponent' },
        ],
        startedAt: new Date('2024-01-01T10:00:00Z'),
        endedAt: new Date('2024-01-01T10:10:00Z'),
        createdAt: new Date('2024-01-01T09:55:00Z'),
      } as any;

      const mockGamePlayer = {
        id: 'player-1',
        game: mockGame,
        user: { id: 'user-123' },
        username: 'testuser',
        score: 100,
        placement: 1,
        askedQuestions: [{}, {}],
        answers: [{}, {}, {}],
        guesses: [{ isCorrect: true }, { isCorrect: false }],
      } as any;

      userRepository.findOne.mockResolvedValue(user);
      gamePlayerRepository.findAndCount.mockResolvedValue([
        [mockGamePlayer],
        1,
      ]);

      const result = await service.getGameHistory('user-123', 10, 0);

      expect(result.total).toBe(1);
      expect(result.games).toHaveLength(1);
      expect(result.games[0]).toMatchObject({
        gameId: 'game-123',
        roomCode: 'ABC123',
        characterSetName: 'Characters',
        isWinner: true,
        placement: 1,
        score: 100,
        questionsAsked: 2,
        questionsAnswered: 3,
        correctGuesses: 1,
        incorrectGuesses: 1,
        durationSeconds: 600,
        opponentUsername: 'opponent',
      });
    });

    it('should return empty array when no games exist', async () => {
      const user = { ...mockUser } as User;

      userRepository.findOne.mockResolvedValue(user);
      gamePlayerRepository.findAndCount.mockResolvedValue([[], 0]);

      const result = await service.getGameHistory('user-123', 10, 0);

      expect(result.total).toBe(0);
      expect(result.games).toHaveLength(0);
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userRepository.findOne.mockResolvedValue(null);

      await expect(
        service.getGameHistory('nonexistent-user', 10, 0),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle pagination correctly', async () => {
      const user = { ...mockUser } as User;

      userRepository.findOne.mockResolvedValue(user);
      gamePlayerRepository.findAndCount.mockResolvedValue([[], 25]);

      const result = await service.getGameHistory('user-123', 10, 10);

      expect(gamePlayerRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
          skip: 10,
        }),
      );
      expect(result.total).toBe(25);
    });
  });
});
