# Socket.IO Data Flow

## Connection Flow

```
┌─────────────────┐                    ┌─────────────────┐
│                 │                    │                 │
│  Frontend       │                    │  Backend        │
│  (Next.js)      │                    │  (NestJS)       │
│                 │                    │                 │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  1. Connect Socket.IO                │
         ├─────────────────────────────────────>│
         │                                      │
         │  2. Connected (socket.id)            │
         │<─────────────────────────────────────┤
         │                                      │
```

## Join Room Flow

```
┌─────────────────┐                    ┌─────────────────┐
│  Frontend       │                    │  Backend        │
│  Client A       │                    │  GameGateway    │
└────────┬────────┘                    └────────┬────────┘
         │                                      │
         │  emit('joinRoom', {roomCode})        │
         ├─────────────────────────────────────>│
         │                                      │
         │                                      │ Join socket room
         │                                      │ Get lobby state
         │                                      │
         │  emit('lobbyUpdate', lobby) to A     │
         │<─────────────────────────────────────┤
         │                                      │
         │  callback({success, lobby})          │
         │<─────────────────────────────────────┤
         │                                      │
```

## Player Join Broadcast

```
┌─────────────┐  ┌─────────────┐       ┌─────────────────┐
│  Client A   │  │  Client B   │       │  GameGateway    │
│  (in room)  │  │  (joining)  │       │                 │
└──────┬──────┘  └──────┬──────┘       └────────┬────────┘
       │                │                       │
       │                │ emit('joinRoom')      │
       │                ├──────────────────────>│
       │                │                       │
       │                │                       │ Join room
       │                │                       │
       │                │ emit('lobbyUpdate')   │
       │                │<──────────────────────┤
       │                │                       │
       │ emit('playerJoined')                   │
       │<───────────────────────────────────────┤
       │                │                       │
```

## Update Player Ready Flow

```
┌─────────────┐  ┌─────────────┐       ┌─────────────────┐
│  Client A   │  │  Client B   │       │  GameGateway    │
│             │  │             │       │                 │
└──────┬──────┘  └──────┬──────┘       └────────┬────────┘
       │                │                       │
       │ emit('updatePlayerReady',              │
       │      {roomCode, playerId, isReady})    │
       ├──────────────────────────────────────>│
       │                │                       │
       │                │                       │ Update DB
       │                │                       │ Get new lobby
       │                │                       │
       │                │                       │ Broadcast to room
       │ emit('lobbyUpdate', lobby)             │
       │<───────────────────────────────────────┤
       │                │                       │
       │                │ emit('lobbyUpdate')   │
       │                │<──────────────────────┤
       │                │                       │
```

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────┐
│                       Frontend                           │
│                                                          │
│  ┌────────────────┐      ┌──────────────────┐          │
│  │  React         │      │  Zustand Store   │          │
│  │  Components    │─────>│  (Game State)    │          │
│  └────────┬───────┘      └──────────────────┘          │
│           │                                              │
│           │ useGameSocket()                              │
│           │                                              │
│  ┌────────▼───────────────────────────────┐            │
│  │  useGameSocket Hook                    │            │
│  │  - joinRoom()                          │            │
│  │  - leaveRoom()                         │            │
│  │  - updatePlayerReady()                 │            │
│  │  - onLobbyUpdate()                     │            │
│  │  - onPlayerJoined()                    │            │
│  └────────┬───────────────────────────────┘            │
│           │                                              │
│  ┌────────▼───────────────────────────────┐            │
│  │  Socket.IO Client (lib/socket.ts)      │            │
│  │  - Typed with ClientToServerEvents     │            │
│  │  - Typed with ServerToClientEvents     │            │
│  └────────┬───────────────────────────────┘            │
└───────────┼──────────────────────────────────────────────┘
            │
            │ WebSocket Connection
            │ (ws://localhost:4000)
            │
┌───────────▼──────────────────────────────────────────────┐
│                       Backend                            │
│                                                          │
│  ┌────────────────────────────────────────┐            │
│  │  GameGateway                           │            │
│  │  @WebSocketGateway()                   │            │
│  │                                        │            │
│  │  Events:                               │            │
│  │  - handleJoinRoom()                    │            │
│  │  - handleLeaveRoom()                   │            │
│  │  - handleUpdatePlayerReady()           │            │
│  │                                        │            │
│  │  Broadcasts:                           │            │
│  │  - lobbyUpdate (to room)               │            │
│  │  - playerJoined (to room)              │            │
│  └────────┬───────────────────────────────┘            │
│           │                                              │
│           │ Uses                                         │
│           │                                              │
│  ┌────────▼───────────────────────────────┐            │
│  │  GameService                           │            │
│  │  - createGame()                        │            │
│  │  - joinGame()                          │            │
│  │  - getLobbyByRoomCode()                │            │
│  │  - updatePlayerReady()                 │            │
│  └────────┬───────────────────────────────┘            │
│           │                                              │
│           │ TypeORM                                      │
│           │                                              │
│  ┌────────▼───────────────────────────────┐            │
│  │  PostgreSQL Database                   │            │
│  │  - games                               │            │
│  │  - game_players                        │            │
│  │  - users                               │            │
│  │  - character_sets                      │            │
│  └────────────────────────────────────────┘            │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│              Shared Contracts Package                    │
│                                                          │
│  Type Definitions:                                       │
│  - ServerToClientEvents                                  │
│  - ClientToServerEvents                                  │
│  - Socket Request/Response types                         │
│  - GameLobbyResponse                                     │
│  - GamePlayerResponse                                    │
└──────────────────────────────────────────────────────────┘
```

## Key Points

1. **Type Safety**: All events are typed using shared contracts
2. **Room-based Broadcasting**: Socket.IO rooms ensure efficient updates
3. **Hybrid Approach**: REST for initial actions, WebSocket for real-time sync
4. **Clean Architecture**: Clear separation between transport, business logic, and data layers
5. **Scalability**: Each game room is isolated, allowing horizontal scaling
