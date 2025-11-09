# Testing Guide

## Overview

WhoIsIt uses **Jest** as the testing framework for unit and integration tests. The backend has comprehensive test coverage (162/162 tests passing), while the frontend testing infrastructure is planned for future implementation.

## Testing Philosophy

### Test Pyramid

```text
        ┌─────────────┐
        │  E2E Tests  │  ← Few, slow, high confidence
        │   (Future)  │
        └─────────────┘
       ┌───────────────┐
       │ Integration   │  ← Some, medium speed
       │    Tests      │
       └───────────────┘
      ┌─────────────────┐
      │   Unit Tests    │  ← Many, fast, isolated
      └─────────────────┘
```

### Testing Principles

1. **Test Behavior, Not Implementation**: Focus on what code does, not how
2. **Isolation**: Mock external dependencies
3. **Readability**: Tests are documentation
4. **Fast**: Tests should run quickly
5. **Deterministic**: Same input = same output
6. **Comprehensive**: High coverage of critical paths

## Backend Testing

### Test Structure

**Location**: `apps/backend/src/**/*.spec.ts`

**Naming Convention**:

- `service-name.service.spec.ts` - Service tests
- `controller-name.controller.spec.ts` - Controller tests
- `dto-name.dto.spec.ts` - DTO validation tests

### Running Tests

```bash
# Run all tests
pnpm --filter @whois-it/backend test

# Watch mode (re-run on changes)
pnpm --filter @whois-it/backend test:watch

# Coverage report
pnpm --filter @whois-it/backend test:cov

# Debug mode
pnpm --filter @whois-it/backend test:debug

# Run specific test file
pnpm --filter @whois-it/backend test auth.service.spec.ts

# Run tests matching pattern
pnpm --filter @whois-it/backend test --testNamePattern="should register"
```

### Test Configuration

**`jest.config.js`**:

```javascript
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
```

## Unit Testing

### Testing Services

Services contain business logic and should have high test coverage.
**Example: AuthService**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { User } from '../../database/entities/user.entity';
import { EmailService } from '../../email/email.service';

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: any;
  let jwtService: any;
  let emailService: any;

  // Mock dependencies
  const mockUserRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    verify: jest.fn(),
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    // Create testing module
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get(getRepositoryToken(User));
    jwtService = module.get(JwtService);
    emailService = module.get(EmailService);

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password123',
      };

      const mockUser = {
        id: 'uuid-123',
        email: registerDto.email,
        username: registerDto.username,
        passwordHash: 'hashed-password',
        avatarUrl: '/avatar/avatar_5.jpg',
        isGuest: false,
      };

      mockUserRepository.findOne.mockResolvedValue(null); // No existing user
      mockUserRepository.create.mockReturnValue(mockUser);
      mockUserRepository.save.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);

      // Act
      const result = await service.register(registerDto);

      // Assert
      expect(result).toHaveProperty('accessToken', 'jwt-token');
      expect(result.user).toMatchObject({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: [
          { email: registerDto.email },
          { username: registerDto.username },
        ],
      });
      expect(mockUserRepository.save).toHaveBeenCalled();
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      // Arrange
      const registerDto = {
        email: 'existing@example.com',
        username: 'existing',
        password: 'password123',
      };

      mockUserRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      // Act & Assert
      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
      expect(mockUserRepository.save).not.toHaveBeenCalled();
    });

    it('should hash the password before saving', async () => {
      // Arrange
      const registerDto = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'plainPassword123',
      };

      let savedUser: any;
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockImplementation((data) => data);
      mockUserRepository.save.mockImplementation((user) => {
        savedUser = user;
        return Promise.resolve(user);
      });
      mockJwtService.sign.mockReturnValue('jwt-token');

      // Act
      await service.register(registerDto);

      // Assert
      expect(savedUser.passwordHash).toBeDefined();
      expect(savedUser.passwordHash).not.toBe(registerDto.password);
      // Verify it's a bcrypt hash
      expect(savedUser.passwordHash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      const mockUser = {
        id: 'uuid-123',
        email,
        username: 'testuser',
        passwordHash: hashedPassword,
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser(email, password);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      // Arrange
      mockUserRepository.findOne.mockResolvedValue(null);

      // Act
      const result = await service.validateUser('nonexistent@example.com', 'password');

      // Assert
      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      // Arrange
      const mockUser = {
        id: 'uuid-123',
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('correctPassword', 10),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.validateUser('test@example.com', 'wrongPassword');

      // Assert
      expect(result).toBeNull();
    });
  });
});
```

### Testing Controllers

Controllers are thin wrappers around services and should focus on testing HTTP-specific logic.
**Example: GameController**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './services/game.service';
import { BroadcastService } from './services/broadcast.service';

describe('GameController', () => {
  let controller: GameController;
  let gameService: any;

  const mockGameService = {
    createGame: jest.fn(),
    joinGame: jest.fn(),
    getLobbyByRoomCode: jest.fn(),
    startGame: jest.fn(),
  };

  const mockBroadcastService = {
    broadcastGameStarted: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GameController],
      providers: [
        {
          provide: GameService,
          useValue: mockGameService,
        },
        {
          provide: BroadcastService,
          useValue: mockBroadcastService,
        },
      ],
    }).compile();

    controller = module.get<GameController>(GameController);
    gameService = module.get(GameService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new game', async () => {
      // Arrange
      const createGameDto = {
        characterSetId: 'uuid-123',
        hostUsername: 'Player 1',
      };

      const mockGame = {
        id: 'game-uuid',
        roomCode: 'ABC123',
        status: 'lobby',
        players: [],
      };

      mockGameService.createGame.mockResolvedValue(mockGame);

      // Act
      const result = await controller.create(createGameDto);

      // Assert
      expect(result).toEqual(mockGame);
      expect(mockGameService.createGame).toHaveBeenCalledWith(createGameDto);
    });

    it('should throw BadRequestException if characterSetId is empty', async () => {
      // Arrange
      const invalidDto = {
        characterSetId: '',
        hostUsername: 'Player 1',
      };

      // Act & Assert
      await expect(controller.create(invalidDto)).rejects.toThrow(
        BadRequestException,
      );
      expect(mockGameService.createGame).not.toHaveBeenCalled();
    });
  });

  describe('join', () => {
    it('should join a game', async () => {
      // Arrange
      const roomCode = 'ABC123';
      const joinDto = {
        username: 'Player 2',
      };

      const mockLobby = {
        roomCode: 'ABC123',
        players: [
          { username: 'Player 1' },
          { username: 'Player 2' },
        ],
      };

      mockGameService.joinGame.mockResolvedValue(mockLobby);

      // Act
      const result = await controller.join(roomCode, joinDto);

      // Assert
      expect(result).toEqual(mockLobby);
      expect(mockGameService.joinGame).toHaveBeenCalledWith(roomCode, joinDto);
    });
  });
});
```

### Testing DTOs

DTOs use class-validator decorators and should be tested for validation.
**Example: RegisterDto**

```typescript
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('should pass validation with valid data', async () => {
    // Arrange
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.username = 'testuser';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(0);
  });

  it('should fail validation with invalid email', async () => {
    // Arrange
    const dto = new RegisterDto();
    dto.email = 'invalid-email';
    dto.username = 'testuser';
    dto.password = 'password123';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail validation with short password', async () => {
    // Arrange
    const dto = new RegisterDto();
    dto.email = 'test@example.com';
    dto.username = 'testuser';
    dto.password = 'short';

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('password');
    expect(errors[0].constraints).toHaveProperty('minLength');
  });

  it('should fail validation with missing required fields', async () => {
    // Arrange
    const dto = new RegisterDto();

    // Act
    const errors = await validate(dto);

    // Assert
    expect(errors.length).toBeGreaterThan(0);
    const properties = errors.map((e) => e.property);
    expect(properties).toContain('email');
    expect(properties).toContain('username');
    expect(properties).toContain('password');
  });
});
```

## Integration Testing

### Testing API Endpoints

Integration tests verify the entire request/response cycle.
**Example: E2E Auth Test**

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'password123',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.body.user).toHaveProperty('id');
          expect(res.body.user.email).toBe('newuser@example.com');
          expect(res.headers['set-cookie']).toBeDefined();
        });
    });

    it('should return 409 if user already exists', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          username: 'existing',
          password: 'password123',
        })
        .expect(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('user');
          expect(res.headers['set-cookie']).toBeDefined();
        });
    });

    it('should return 401 with invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('GET /auth/profile', () => {
    it('should return profile when authenticated', async () => {
      // First login to get cookie
      const loginResponse = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      const cookie = loginResponse.headers['set-cookie'];

      // Then get profile with cookie
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Cookie', cookie)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
          expect(res.body).toHaveProperty('username');
        });
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });
});
```

## Mocking Strategies

### Mocking TypeORM Repositories

```typescript
const mockRepository = {
  find: jest.fn(),
  findOne: jest.fn(),
  findOneBy: jest.fn(),
  create: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  createQueryBuilder: jest.fn(() => ({
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
  })),
};
```

### Mocking External Services

```typescript
const mockEmailService = {
  sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
};
```

### Mocking bcrypt

```typescript
jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => Promise.resolve(`hashed_${password}`)),
  compare: jest.fn((password, hash) => 
    Promise.resolve(hash === `hashed_${password}`)
  ),
}));
```

## Test Coverage

### Current Coverage

**Backend**: 162/162 tests passing

**Coverage Goals**:

- Services: 90%+
- Controllers: 100%
- DTOs: 100%
- Overall: 80%+

### Viewing Coverage

```bash
pnpm --filter @whois-it/backend test:cov
```

Opens coverage report in `coverage/lcov-report/index.html`.

### Coverage Reports

```text
File                | % Stmts | % Branch | % Funcs | % Lines
--------------------|---------|----------|---------|--------
All files           |   85.23 |    78.45 |   88.12 |   86.34
 auth/              |   92.15 |    85.32 |   91.23 |   93.45
  auth.service.ts   |   95.23 |    88.45 |   94.12 |   96.34
  auth.controller.ts|   89.12 |    82.34 |   88.45 |   90.23
```

## Best Practices

### Arrange-Act-Assert Pattern

```typescript
it('should do something', () => {
  // Arrange - Set up test data and mocks
  const input = { /* ... */ };
  mockService.method.mockResolvedValue(expected);

  // Act - Execute the code under test
  const result = await service.method(input);

  // Assert - Verify the outcome
  expect(result).toEqual(expected);
  expect(mockService.method).toHaveBeenCalledWith(input);
});
```

### Descriptive Test Names

```typescript
// ✅ Good - Describes behavior
it('should return 401 when token is expired')
it('should create user with hashed password')
it('should broadcast lobby update to all players')

// ❌ Bad - Not descriptive
it('should work')
it('test register')
it('checks validation')
```

### Test One Thing

```typescript
// ✅ Good - Tests one behavior
it('should hash password before saving', async () => {
  await service.register(dto);
  expect(savedUser.passwordHash).not.toBe(dto.password);
});

it('should send verification email after registration', async () => {
  await service.register(dto);
  expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
});

// ❌ Bad - Tests multiple behaviors
it('should register user correctly', async () => {
  await service.register(dto);
  expect(savedUser.passwordHash).not.toBe(dto.password);
  expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
  expect(mockJwtService.sign).toHaveBeenCalled();
});
```

### Clear Mocks Between Tests

```typescript
beforeEach(() => {
  jest.clearAllMocks();  // Reset mock call counts
});

// Or

afterEach(() => {
  jest.resetAllMocks();  // Reset mocks and implementations
});
```

### Avoid Test Interdependence

```typescript
// ✅ Good - Each test is independent
describe('UserService', () => {
  beforeEach(() => {
    // Fresh setup for each test
    user = createMockUser();
  });

  it('should update username', () => { /* ... */ });
  it('should update email', () => { /* ... */ });
});

// ❌ Bad - Tests depend on order
describe('UserService', () => {
  let user;

  it('should create user', () => {
    user = service.create();  // Test 2 depends on this
  });

  it('should update user', () => {
    service.update(user);  // Breaks if test 1 fails
  });
});
```

## Testing Asynchronous Code

### Promises

```typescript
// Using async/await (recommended)
it('should resolve with user', async () => {
  const user = await service.findUser('id');
  expect(user).toBeDefined();
});

// Using .resolves
it('should resolve with user', () => {
  return expect(service.findUser('id')).resolves.toBeDefined();
});

// Using done callback
it('should resolve with user', (done) => {
  service.findUser('id').then((user) => {
    expect(user).toBeDefined();
    done();
  });
});
```

### Error Handling

```typescript
// Using async/await
it('should throw error', async () => {
  await expect(service.invalidOperation()).rejects.toThrow(Error);
});

// Using .rejects
it('should throw error', () => {
  return expect(service.invalidOperation()).rejects.toThrow(Error);
});

// With specific error message
it('should throw error with message', async () => {
  await expect(service.invalidOperation()).rejects.toThrow('User not found');
});
```

## Debugging Tests

### Running Single Test

```bash
# Run only tests with "register" in the name
pnpm test --testNamePattern="register"

# Run only one file
pnpm test auth.service.spec.ts
```

### Debug Mode

```bash
# Start debugger
pnpm test:debug

# In Chrome, open: chrome://inspect
# Click "inspect" on the Node process
# Set breakpoints in DevTools
```

### VS Code Debugging

**`.vscode/launch.json`**:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": [
    "--runInBand",
    "--no-cache",
    "--watchAll=false"
  ],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Console Logging in Tests

```typescript
it('should do something', () => {
  console.log('Debug info:', value);
  expect(value).toBe(expected);
});
```

## Frontend Testing (Future)

### Planned Testing Stack

- **Jest**: Test runner
- **React Testing Library**: Component testing
- **Playwright**: E2E testing
- **MSW**: API mocking

### Example Component Test

```typescript
import { render, screen } from '@testing-library/react';
import { LobbyDisplay } from './LobbyDisplay';

describe('LobbyDisplay', () => {
  it('should display room code', () => {
    const lobby = {
      roomCode: 'ABC123',
      players: [],
    };

    render(<LobbyDisplay lobby={lobby} />);

    expect(screen.getByText('ABC123')).toBeInTheDocument();
  });
});
```

## Continuous Integration

### GitHub Actions

Tests run automatically on push/PR:

```yaml
# .github/workflows/ci.yml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test
```

### Pre-commit Hooks

Run tests before commit:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test"
    }
  }
}
```

## Test Data Management

### Test Fixtures

```typescript
// test/fixtures/users.ts
export const mockUser = {
  id: 'uuid-123',
  email: 'test@example.com',
  username: 'testuser',
  passwordHash: 'hashed',
};

export const createMockUser = (overrides = {}) => ({
  ...mockUser,
  ...overrides,
});
```

### Factory Pattern

```typescript
export class UserFactory {
  static create(data: Partial<User> = {}): User {
    return {
      id: data.id ?? 'uuid-123',
      email: data.email ?? 'test@example.com',
      username: data.username ?? 'testuser',
      // ... other fields
    };
  }
}

// Usage
const user = UserFactory.create({ email: 'custom@example.com' });
```

## Common Issues

### Test Timeout

```typescript
// Increase timeout for slow tests
it('should do something slow', async () => {
  // ...
}, 10000); // 10 second timeout

// Or globally in jest.config.js
module.exports = {
  testTimeout: 10000,
};
```

### Memory Leaks

```typescript
// Clean up after tests
afterEach(() => {
  jest.clearAllTimers();
  jest.restoreAllMocks();
});

afterAll(async () => {
  await app.close();
});
```

### Flaky Tests

Causes:

- Race conditions
- Shared state
- External dependencies
- Timing issues

Solutions:

- Use `beforeEach` for fresh state
- Mock external services
- Use `waitFor` for async updates
- Avoid `setTimeout` in tests

## Testing Coverage Strategy

For a comprehensive guide on which files require testing and which don't, see the [Testing Coverage Strategy](./testing-coverage-strategy.md) document. This includes:

- Files excluded from coverage requirements (config, types, migrations)
- Complex services better tested via integration/E2E tests
- Coverage goals by file type
- Testing decision tree

## Related Documentation

- [Testing Coverage Strategy](./testing-coverage-strategy.md) - Coverage requirements and exclusions
- [Development Workflow](./workflow.md)
- [Debugging Guide](./debugging.md)
- [Backend Documentation](../backend/README.md)
- [CI/CD Pipeline](../deployment/cicd.md)

---

**Last Updated**: November 2024
