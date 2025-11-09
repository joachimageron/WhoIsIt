# Debugging Guide

## Overview

This guide covers debugging strategies, tools, and techniques for troubleshooting issues in the WhoIsIt application across frontend, backend, database, and WebSocket connections.

## Frontend Debugging

### Browser DevTools

**Opening DevTools**:
- Chrome/Edge: F12 or Cmd+Option+I (Mac) / Ctrl+Shift+I (Windows)
- Firefox: F12 or Cmd+Option+K (Mac) / Ctrl+Shift+K (Windows)

**Key Tabs**:

**Console**:
```javascript
// Log variables
console.log('User:', user);
console.table(players);  // Table format
console.dir(object);      // Interactive object

// Conditional logging
if (DEBUG) console.log('Debug info:', data);

// Grouping
console.group('Game Logic');
console.log('Player:', player);
console.log('Score:', score);
console.groupEnd();

// Timing
console.time('fetchData');
await fetchData();
console.timeEnd('fetchData');  // fetchData: 142.3ms
```

**Network**:
- Monitor API calls
- Check request/response headers
- View payload data
- Check status codes
- Filter by type (XHR, WS, etc.)

**Sources/Debugger**:
- Set breakpoints
- Step through code
- Watch variables
- Call stack inspection

### React DevTools

**Installation**:
Chrome/Firefox extension: "React Developer Tools"

**Features**:
- Component tree inspection
- Props and state viewing
- Hooks inspection
- Performance profiling

**Usage**:
1. Open DevTools → Components tab
2. Click component in tree
3. View props, state, hooks
4. Edit values live

**Profiler**:
1. Open Profiler tab
2. Click Record (🔴)
3. Perform actions
4. Stop recording
5. Analyze render times

### Next.js Debugging

**Debug Mode**:
```bash
# Enable debug logging
NODE_OPTIONS='--inspect' pnpm dev

# Open chrome://inspect
# Click "Open dedicated DevTools for Node"
```

**VS Code Configuration**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    }
  ]
}
```

### Common Frontend Issues

**Issue**: Component not re-rendering

**Debug**:
```typescript
// Add console logs
useEffect(() => {
  console.log('Lobby changed:', lobby);
}, [lobby]);

// Check if dependency is correct
useEffect(() => {
  console.log('Effect ran');
}, [/* check dependencies */]);
```

**Issue**: State not updating

**Debug**:
```typescript
// Log before and after
console.log('Before:', state);
setState(newValue);
console.log('After:', state);  // ⚠️ May not show new value immediately

// Use callback to see new value
setState(newValue, () => {
  console.log('Updated:', state);
});

// Or in next effect
useEffect(() => {
  console.log('State updated:', state);
}, [state]);
```

**Issue**: WebSocket not connecting

**Debug**:
```typescript
const socket = getSocket();

socket.on('connect', () => {
  console.log('✅ Connected:', socket.id);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
  console.log('URL:', socket.io.uri);
  console.log('Transports:', socket.io.opts.transports);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

## Backend Debugging

### NestJS Debugging

**VS Code Launch Configuration**:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "pnpm",
  "runtimeArgs": ["--filter", "@whois-it/backend", "start:debug"],
  "console": "integratedTerminal",
  "restart": true,
  "protocol": "inspector",
  "skipFiles": ["<node_internals>/**"],
  "sourceMaps": true,
  "cwd": "${workspaceFolder}/apps/backend"
}
```

**Breakpoints**:
1. Open file in VS Code
2. Click left margin to add breakpoint
3. Start debugger (F5)
4. Trigger code path
5. Execution pauses at breakpoint

**Debug Console**:
- Evaluate expressions
- View variables
- Check stack trace

### Logging

**Logger Service**:
```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  async createGame(dto: CreateGameDto) {
    this.logger.log(`Creating game with character set: ${dto.characterSetId}`);
    
    try {
      const game = await this.gameRepository.save(data);
      this.logger.log(`Game created: ${game.id}`);
      return game;
    } catch (error) {
      this.logger.error(`Failed to create game:`, error.stack);
      throw error;
    }
  }
}
```

**Log Levels**:
```typescript
this.logger.log('Info message');       // INFO
this.logger.warn('Warning message');   // WARN
this.logger.error('Error message', stack);  // ERROR
this.logger.debug('Debug message');    // DEBUG
this.logger.verbose('Verbose message'); // VERBOSE
```

### Database Debugging

**Query Logging**:
```typescript
// ormconfig.ts
{
  type: 'postgres',
  logging: ['query', 'error'],  // Log all queries
  logger: 'advanced-console',
}

// Or specific queries
{
  logging: ['query'],  // Only SELECT/INSERT/UPDATE/DELETE
}
```

**Raw Queries**:
```typescript
// Check generated SQL
const query = this.gameRepository
  .createQueryBuilder('game')
  .where('game.roomCode = :roomCode', { roomCode })
  .getQuery();

console.log('SQL:', query);

// Execute and log
const result = await this.gameRepository
  .createQueryBuilder('game')
  .where('game.roomCode = :roomCode', { roomCode })
  .getOne();

console.log('Result:', result);
```

**Connection Issues**:
```bash
# Test database connection
psql -h localhost -U postgres -d whois_it

# Check if database exists
psql -U postgres -c "\l"

# Check if tables exist
psql -U postgres -d whois_it -c "\dt"
```

### WebSocket Debugging

**Gateway Logging**:
```typescript
@WebSocketGateway()
export class GameGateway {
  private readonly logger = new Logger(GameGateway.name);

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SocketJoinRoomRequest,
  ) {
    this.logger.log(`Client ${client.id} joining room ${data.roomCode}`);
    
    try {
      // ... logic
      this.logger.log(`Client ${client.id} joined room ${data.roomCode}`);
    } catch (error) {
      this.logger.error(`Failed to join room:`, error.stack);
    }
  }
}
```

**Connection Tracking**:
```typescript
handleConnection(client: Socket) {
  this.logger.log(`Client connected: ${client.id}`);
  this.logger.log(`User: ${client.user?.username || 'guest'}`);
  this.logger.log(`Total connections: ${this.connections.size}`);
}

handleDisconnect(client: Socket) {
  this.logger.log(`Client disconnected: ${client.id}`);
  this.logger.log(`Reason: ${client.disconnected}`);
}
```

## Database Debugging

### Query Performance

**EXPLAIN ANALYZE**:
```sql
EXPLAIN ANALYZE
SELECT * FROM games
WHERE room_code = 'ABC123';

-- Output shows:
-- - Query plan
-- - Execution time
-- - Rows scanned
-- - Indexes used
```

**Slow Query Log**:
```typescript
// Log slow queries (> 1000ms)
{
  logging: ['query'],
  maxQueryExecutionTime: 1000,
}
```

### Common Database Issues

**Issue**: Slow queries

**Debug**:
```sql
-- Check missing indexes
SELECT schemaname, tablename, attname, n_distinct, correlation
FROM pg_stats
WHERE tablename = 'games';

-- Add index
CREATE INDEX idx_games_room_code ON games(room_code);
```

**Issue**: Connection pool exhausted

**Debug**:
```typescript
// Check connection pool
const pool = this.dataSource.driver.master;
console.log('Total connections:', pool.totalCount);
console.log('Idle connections:', pool.idleCount);
console.log('Waiting connections:', pool.waitingCount);
```

**Issue**: Deadlocks

**Debug**:
```sql
-- Check for locks
SELECT * FROM pg_locks;

-- Check blocking queries
SELECT blocked_locks.pid AS blocked_pid,
       blocking_locks.pid AS blocking_pid
FROM pg_locks blocked_locks
JOIN pg_locks blocking_locks 
  ON blocked_locks.locktype = blocking_locks.locktype;
```

## Environment Issues

### Environment Variables

**Check Loaded Variables**:
```typescript
// Backend
console.log('Database:', {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Frontend
console.log('API URL:', process.env.NEXT_PUBLIC_API_URL);
```

**Common Issues**:

**Missing .env file**:
```bash
# Copy example
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

**Wrong environment**:
```bash
# Check NODE_ENV
echo $NODE_ENV

# Set for session
export NODE_ENV=development
```

## Debugging Tools

### Postman / Insomnia

**Test API Endpoints**:
```
POST http://localhost:4000/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### Socket.IO Client Tester

**Browser Console**:
```javascript
// Connect
const socket = io('http://localhost:4000', {
  withCredentials: true,
});

// Listen for events
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

// Emit events
socket.emit('joinRoom', { roomCode: 'ABC123' }, (response) => {
  console.log('Response:', response);
});

// Listen for broadcasts
socket.on('lobbyUpdate', (lobby) => {
  console.log('Lobby update:', lobby);
});
```

### Database Clients

**pgAdmin**: GUI for PostgreSQL
**DBeaver**: Universal database tool
**psql**: Command-line client

## Common Issues & Solutions

### Port Already in Use

```bash
# Find process
lsof -i :3000  # Frontend
lsof -i :4000  # Backend

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 pnpm dev
```

### Module Not Found

```bash
# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules
pnpm install

# Clear cache
rm -rf apps/frontend/.next
rm -rf apps/backend/dist
```

### CORS Errors

**Check backend CORS config**:
```typescript
// main.ts
app.enableCors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  credentials: true,
});
```

**Check frontend fetch**:
```typescript
fetch(url, {
  credentials: 'include',  // Required for cookies
});
```

### WebSocket Connection Failed

**Check URL**:
```typescript
console.log('Socket URL:', process.env.NEXT_PUBLIC_SOCKET_URL);
```

**Check CORS**:
```typescript
// Backend gateway
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_ORIGIN,
    credentials: true,
  },
})
```

**Check firewall**:
```bash
# Test connection
telnet localhost 4000
```

## Performance Debugging

### Frontend Performance

**React DevTools Profiler**:
1. Record interaction
2. Analyze render times
3. Identify slow components
4. Optimize with memo/useMemo/useCallback

**Lighthouse Audit**:
1. Chrome DevTools → Lighthouse
2. Run audit
3. Review metrics
4. Fix issues

### Backend Performance

**Memory Leaks**:
```bash
# Start with heap snapshot
node --inspect --heap-prof apps/backend/dist/main.js

# Take heap snapshots in Chrome DevTools
```

**CPU Profiling**:
```bash
# Start with profiler
node --inspect apps/backend/dist/main.js

# Generate CPU profile in Chrome DevTools
```

## Related Documentation

- [Development Workflow](./workflow.md)
- [Testing Guide](./testing.md)
- [Getting Started](./getting-started.md)

---

**Last Updated**: November 2024
