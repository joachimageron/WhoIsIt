# Socket.IO Game Integration

This document describes the Socket.IO implementation for real-time game functionality.

## Architecture

The game uses a hybrid approach:
- **REST API**: Initial game creation and joining
- **WebSocket (Socket.IO)**: Real-time updates for lobby state, player ready status, and game events

## Backend (NestJS)

### GameGateway

The `GameGateway` (`apps/backend/src/game/game.gateway.ts`) handles WebSocket connections and events:

**Events:**
- `joinRoom`: Join a game room
- `leaveRoom`: Leave a game room
- `updatePlayerReady`: Update player ready status
- `lobbyUpdate`: Broadcasted when lobby state changes
- `playerJoined`: Broadcasted when a player joins

### GameService

The `GameService` has been extended with:
- `updatePlayerReady(playerId, isReady)`: Update player ready status

## Frontend (Next.js)

### Socket Utilities

**`lib/socket.ts`**: Socket.IO client singleton
- `getSocket()`: Get or create typed Socket.IO client
- `disconnectSocket()`: Disconnect and cleanup socket

**`hooks/use-game-socket.ts`**: React hook for Socket.IO
- `joinRoom(data)`: Join a room
- `leaveRoom(data)`: Leave a room
- `updatePlayerReady(data)`: Update player ready state
- `onLobbyUpdate(callback)`: Listen for lobby updates
- `onPlayerJoined(callback)`: Listen for player join events

### Store

**`store/game-store.ts`**: Zustand store for game state
- Stores current lobby state
- Tracks connection status

## Usage Example

```tsx
"use client";

import { useEffect } from "react";
import { useGameSocket } from "@/hooks/use-game-socket";
import { useGameStore } from "@/store/game-store";

export default function GameLobby() {
  const { lobby, setLobby } = useGameStore();
  const { joinRoom, updatePlayerReady, onLobbyUpdate } = useGameSocket();

  useEffect(() => {
    // Listen for lobby updates
    const unsubscribe = onLobbyUpdate((updatedLobby) => {
      setLobby(updatedLobby);
    });

    return unsubscribe;
  }, [onLobbyUpdate, setLobby]);

  const handleJoinRoom = async (roomCode: string) => {
    const response = await joinRoom({ roomCode });
    if (response.success && response.lobby) {
      setLobby(response.lobby);
    }
  };

  const handleToggleReady = async (playerId: string, isReady: boolean) => {
    if (!lobby) return;
    
    await updatePlayerReady({
      roomCode: lobby.roomCode,
      playerId,
      isReady,
    });
  };

  // ... rest of component
}
```

## Testing

To test Socket.IO functionality, you can:

1. Start the backend: `cd apps/backend && pnpm run dev`
2. Start the frontend: `cd apps/frontend && pnpm run dev`
3. Use the provided hooks and stores in your own components
4. Create a game using the REST API (`POST /games`)
5. Use `useGameSocket` hook to test joining, ready status updates, and real-time synchronization

**Note**: The frontend game lobby pages are planned for Phase 2 of development and are not yet implemented.

## Environment Variables

**Backend** (`apps/backend/.env`):
```env
PORT=4000
FRONTEND_ORIGIN=http://localhost:3000
```

**Frontend** (`apps/frontend/.env.local`):
```env
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

## Type Safety

All Socket.IO events are fully typed using TypeScript definitions from `@whois-it/contracts`:
- `ServerToClientEvents`: Events sent from server to client
- `ClientToServerEvents`: Events sent from client to server
- Request/Response types for all events

This ensures type safety across the entire stack.
