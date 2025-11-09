# Real-time Communication

## Overview

WhoIsIt implements real-time bidirectional communication between frontend and backend using **Socket.IO**. This enables instant lobby updates, live gameplay events, and synchronized game state across all players.

## Architecture

### Client-Server Communication Flow

```
┌──────────────────────────────────────────────────────────┐
│                    Frontend Client                        │
│  ┌────────────────────────────────────────────────────┐ │
│  │  React Component                                    │ │
│  │   ├─ useGameSocket()                               │ │
│  │   ├─ useGameStore()                                │ │
│  │   └─ Event Handlers                                │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
                          ▲ ▼
                    Socket.IO Protocol
                          ▲ ▼
┌──────────────────────────────────────────────────────────┐
│                    Backend Server                         │
│  ┌────────────────────────────────────────────────────┐ │
│  │  GameGateway                                        │ │
│  │   ├─ @SubscribeMessage handlers                    │ │
│  │   ├─ ConnectionManager                             │ │
│  │   ├─ BroadcastService                              │ │
│  │   └─ Room Management                               │ │
│  └────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

## Socket.IO Client

### Socket Instance

```typescript
// lib/socket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      autoConnect: false,          // Manual connection control
      transports: ['websocket'],   // Use WebSocket only (no polling)
      withCredentials: true,       // Include cookies for authentication
    });

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket connected:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

**Configuration**:
- `autoConnect: false` - Allows manual connection control
- `transports: ['websocket']` - Forces WebSocket protocol (faster, no polling)
- `withCredentials: true` - Sends authentication cookies with requests

## Custom Hook: useGameSocket

### Implementation

```typescript
// hooks/use-game-socket.ts
import { useEffect, useCallback, useRef } from 'react';
import { getSocket, disconnectSocket } from '@/lib/socket';
import type {
  GameLobbyResponse,
  SocketJoinRoomRequest,
  SocketJoinRoomResponse,
  // ... other types
} from '@whois-it/contracts';

export const useGameSocket = () => {
  const socketRef = useRef(getSocket());

  // Connect on mount, disconnect on unmount
  useEffect(() => {
    const socket = socketRef.current;

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      disconnectSocket();
    };
  }, []);

  // Client → Server events (with acknowledgements)
  const joinRoom = useCallback(
    (data: SocketJoinRoomRequest): Promise<SocketJoinRoomResponse> => {
      return new Promise((resolve) => {
        socketRef.current.emit('joinRoom', data, (response) => {
          resolve(response);
        });
      });
    },
    []
  );

  const leaveRoom = useCallback(
    (data: SocketLeaveRoomRequest) => {
      return new Promise((resolve) => {
        socketRef.current.emit('leaveRoom', data, (response) => {
          resolve(response);
        });
      });
    },
    []
  );

  const updatePlayerReady = useCallback(
    (data: SocketUpdatePlayerReadyRequest): Promise<SocketUpdatePlayerReadyResponse> => {
      return new Promise((resolve) => {
        socketRef.current.emit('updatePlayerReady', data, (response) => {
          resolve(response);
        });
      });
    },
    []
  );

  // Server → Client event listeners
  const onLobbyUpdate = useCallback(
    (callback: (lobby: GameLobbyResponse) => void) => {
      socketRef.current.on('lobbyUpdate', callback);

      // Return cleanup function
      return () => {
        socketRef.current.off('lobbyUpdate', callback);
      };
    },
    []
  );

  const onPlayerJoined = useCallback(
    (callback: (event: SocketPlayerJoinedEvent) => void) => {
      socketRef.current.on('playerJoined', callback);

      return () => {
        socketRef.current.off('playerJoined', callback);
      };
    },
    []
  );

  const onGameStarted = useCallback(
    (callback: (event: SocketGameStartedEvent) => void) => {
      socketRef.current.on('gameStarted', callback);

      return () => {
        socketRef.current.off('gameStarted', callback);
      };
    },
    []
  );

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    updatePlayerReady,
    onLobbyUpdate,
    onPlayerJoined,
    onGameStarted,
    // ... other event handlers
  };
};
```

### Key Features

1. **Singleton Socket**: One socket instance shared across components
2. **Auto-connect**: Connects on mount, disconnects on unmount
3. **Promise-based Emissions**: Clean async/await syntax
4. **Typed Events**: Full TypeScript support via contracts
5. **Cleanup Functions**: Automatic event listener cleanup

## Usage in Components

### Lobby Component Example

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useGameSocket } from '@/hooks/use-game-socket';
import { useGameStore } from '@/store/game-store';
import type { GameLobbyResponse } from '@whois-it/contracts';

export function LobbyClient({ roomCode }: { roomCode: string }) {
  const { joinRoom, leaveRoom, updatePlayerReady, onLobbyUpdate, onPlayerJoined, onGameStarted } =
    useGameSocket();
  
  const { lobby, setLobby, setConnected } = useGameStore();
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Join room on mount
  useEffect(() => {
    const join = async () => {
      const response = await joinRoom({ roomCode });
      
      if (response.success && response.lobby) {
        setLobby(response.lobby);
        setConnected(true);
        
        // Find my player ID
        const myPlayer = response.lobby.players[response.lobby.players.length - 1];
        setPlayerId(myPlayer?.id || null);
      }
    };

    join();

    // Leave room on unmount
    return () => {
      if (playerId) {
        leaveRoom({ roomCode, playerId });
      }
    };
  }, [roomCode, joinRoom, leaveRoom, setLobby, setConnected]);

  // Listen for lobby updates
  useEffect(() => {
    const cleanup = onLobbyUpdate((updatedLobby) => {
      setLobby(updatedLobby);
    });

    return cleanup;
  }, [onLobbyUpdate, setLobby]);

  // Listen for new players
  useEffect(() => {
    const cleanup = onPlayerJoined((event) => {
      console.log('Player joined:', event.lobby);
      setLobby(event.lobby);
    });

    return cleanup;
  }, [onPlayerJoined, setLobby]);

  // Listen for game start
  useEffect(() => {
    const cleanup = onGameStarted((event) => {
      console.log('Game started!', event);
      // Navigate to game page
      router.push(`/${lang}/game/play/${roomCode}`);
    });

    return cleanup;
  }, [onGameStarted, roomCode]);

  // Toggle ready status
  const handleToggleReady = async () => {
    if (!playerId) return;

    const myPlayer = lobby?.players.find((p) => p.id === playerId);
    if (!myPlayer) return;

    const response = await updatePlayerReady({
      roomCode,
      playerId,
      isReady: !myPlayer.isReady,
    });

    if (response.success && response.lobby) {
      setLobby(response.lobby);
    }
  };

  if (!lobby) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>Room: {lobby.roomCode}</h1>
      
      <div>
        {lobby.players.map((player) => (
          <div key={player.id}>
            {player.username}
            {player.isReady ? ' ✅' : ' ⏳'}
          </div>
        ))}
      </div>

      <button onClick={handleToggleReady}>
        Toggle Ready
      </button>
    </div>
  );
}
```

## Event Patterns

### Client → Server Events

Events with acknowledgement callbacks:

```typescript
// Pattern
socket.emit('eventName', data, (response) => {
  // Handle response
});

// Examples
const response = await joinRoom({ roomCode: 'ABC123' });
if (response.success) {
  console.log('Joined!', response.lobby);
} else {
  console.error('Failed:', response.error);
}

await updatePlayerReady({
  roomCode: 'ABC123',
  playerId: 'player-uuid',
  isReady: true,
});

await leaveRoom({
  roomCode: 'ABC123',
  playerId: 'player-uuid',
});
```

### Server → Client Events

Broadcast events from server:

```typescript
// Listen for events
socket.on('lobbyUpdate', (lobby: GameLobbyResponse) => {
  setLobby(lobby);
});

socket.on('playerJoined', (event: SocketPlayerJoinedEvent) => {
  toast.success(`${event.lobby.players[event.lobby.players.length - 1].username} joined!`);
  setLobby(event.lobby);
});

socket.on('playerLeft', (event: SocketPlayerLeftEvent) => {
  toast.info('A player left');
  setLobby(event.lobby);
});

socket.on('gameStarted', (event: SocketGameStartedEvent) => {
  router.push(`/game/play/${event.roomCode}`);
});
```

## Connection Management

### Connection States

Track socket connection status:

```typescript
const [isConnected, setIsConnected] = useState(false);

useEffect(() => {
  const socket = getSocket();

  const handleConnect = () => {
    setIsConnected(true);
    console.log('Connected');
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    console.log('Disconnected');
  };

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);

  return () => {
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
  };
}, []);

// UI indicator
{isConnected ? (
  <span className="text-success">🟢 Connected</span>
) : (
  <span className="text-danger">🔴 Disconnected</span>
)}
```

### Reconnection Handling

Socket.IO handles reconnection automatically:

```typescript
const socket = io(url, {
  reconnection: true,             // Enable reconnection
  reconnectionDelay: 1000,        // Wait 1s before reconnecting
  reconnectionDelayMax: 5000,     // Max wait 5s
  reconnectionAttempts: Infinity, // Try forever
});

// Listen for reconnection events
socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  // Re-join room if needed
  joinRoom({ roomCode });
});

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log('Reconnection attempt', attemptNumber);
});

socket.on('reconnect_error', (error) => {
  console.error('Reconnection error:', error);
});

socket.on('reconnect_failed', () => {
  console.error('Reconnection failed');
  // Show error to user
});
```

## State Synchronization

### Initial State + Updates Pattern

```typescript
useEffect(() => {
  // 1. Fetch initial state via REST
  const fetchInitialState = async () => {
    const response = await fetch(`${API_URL}/games/${roomCode}`);
    const lobby = await response.json();
    setLobby(lobby);
  };

  fetchInitialState();

  // 2. Join Socket.IO room for real-time updates
  joinRoom({ roomCode });

  // 3. Listen for updates
  const cleanup = onLobbyUpdate((updatedLobby) => {
    setLobby(updatedLobby);
  });

  return cleanup;
}, [roomCode]);
```

### Optimistic Updates

Update UI immediately, rollback on error:

```typescript
const handleToggleReady = async () => {
  const currentReady = myPlayer.isReady;
  
  // Optimistic update
  setLobby({
    ...lobby,
    players: lobby.players.map((p) =>
      p.id === playerId ? { ...p, isReady: !currentReady } : p
    ),
  });

  try {
    const response = await updatePlayerReady({
      roomCode,
      playerId,
      isReady: !currentReady,
    });

    if (!response.success) {
      // Revert on error
      setLobby({
        ...lobby,
        players: lobby.players.map((p) =>
          p.id === playerId ? { ...p, isReady: currentReady } : p
        ),
      });
      toast.error('Failed to update');
    }
  } catch (error) {
    // Revert on error
    setLobby({
      ...lobby,
      players: lobby.players.map((p) =>
        p.id === playerId ? { ...p, isReady: currentReady } : p
      ),
    });
  }
};
```

## Error Handling

### Connection Errors

```typescript
useEffect(() => {
  const socket = getSocket();

  socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
    toast.error('Failed to connect to server');
  });

  socket.on('connect_timeout', () => {
    console.error('Connection timeout');
    toast.error('Connection timed out');
  });

  socket.on('error', (error) => {
    console.error('Socket error:', error);
  });

  return () => {
    socket.off('connect_error');
    socket.off('connect_timeout');
    socket.off('error');
  };
}, []);
```

### Event Errors

Handle errors in acknowledgement callbacks:

```typescript
const joinRoom = async () => {
  const response = await joinRoom({ roomCode });

  if (!response.success) {
    console.error('Failed to join:', response.error);
    toast.error(response.error || 'Failed to join room');
    router.push('/game/join');
    return;
  }

  setLobby(response.lobby);
};
```

## Best Practices

### 1. Cleanup Event Listeners

Always remove listeners to prevent memory leaks:

```tsx
useEffect(() => {
  const handleUpdate = (lobby: GameLobbyResponse) => {
    setLobby(lobby);
  };

  socket.on('lobbyUpdate', handleUpdate);

  // Cleanup
  return () => {
    socket.off('lobbyUpdate', handleUpdate);
  };
}, [socket]);
```

### 2. Use useCallback for Stable References

```tsx
const handleLobbyUpdate = useCallback((lobby: GameLobbyResponse) => {
  setLobby(lobby);
}, [setLobby]);

useEffect(() => {
  socket.on('lobbyUpdate', handleLobbyUpdate);
  return () => socket.off('lobbyUpdate', handleLobbyUpdate);
}, [socket, handleLobbyUpdate]);
```

### 3. Handle Disconnections Gracefully

```tsx
const [isConnected, setIsConnected] = useState(false);

useEffect(() => {
  socket.on('connect', () => setIsConnected(true));
  socket.on('disconnect', () => setIsConnected(false));

  return () => {
    socket.off('connect');
    socket.off('disconnect');
  };
}, []);

// Show UI feedback
{!isConnected && (
  <Alert color="warning">
    Connection lost. Reconnecting...
  </Alert>
)}
```

### 4. Type All Events

Use shared types from `@whois-it/contracts`:

```typescript
import type {
  GameLobbyResponse,
  SocketJoinRoomRequest,
  SocketJoinRoomResponse,
} from '@whois-it/contracts';

socket.emit('joinRoom', data: SocketJoinRoomRequest, 
  (response: SocketJoinRoomResponse) => {
    // Fully typed
  }
);
```

### 5. Debounce Frequent Updates

```typescript
import { useDebounce } from '@/hooks/use-debounce';

const [search, setSearch] = useState('');
const debouncedSearch = useDebounce(search, 500);

useEffect(() => {
  socket.emit('search', { query: debouncedSearch });
}, [debouncedSearch]);
```

## Testing

### Mocking Socket.IO

```typescript
import { io } from 'socket.io-client';

jest.mock('socket.io-client');

const mockSocket = {
  connect: jest.fn(),
  disconnect: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  emit: jest.fn((event, data, callback) => {
    callback({ success: true, lobby: mockLobby });
  }),
};

(io as jest.Mock).mockReturnValue(mockSocket);
```

### Testing Components

```tsx
import { render, waitFor } from '@testing-library/react';
import { useGameSocket } from '@/hooks/use-game-socket';
import LobbyClient from './lobby-client';

jest.mock('@/hooks/use-game-socket');

describe('LobbyClient', () => {
  it('should join room on mount', async () => {
    const mockJoinRoom = jest.fn().mockResolvedValue({
      success: true,
      lobby: { roomCode: 'ABC123', players: [] },
    });

    (useGameSocket as jest.Mock).mockReturnValue({
      joinRoom: mockJoinRoom,
      onLobbyUpdate: jest.fn(() => () => {}),
    });

    render(<LobbyClient roomCode="ABC123" />);

    await waitFor(() => {
      expect(mockJoinRoom).toHaveBeenCalledWith({
        roomCode: 'ABC123',
      });
    });
  });
});
```

## Performance Tips

### 1. Minimize Re-renders

Use selectors to avoid unnecessary re-renders:

```tsx
// ❌ Bad - Re-renders on any store change
const store = useGameStore();

// ✅ Good - Only re-renders when lobby changes
const lobby = useGameStore((state) => state.lobby);
```

### 2. Batch State Updates

```tsx
// Update multiple store values at once
set({
  lobby: updatedLobby,
  isConnected: true,
  playState: newPlayState,
});
```

### 3. Avoid Emitting in Render

```tsx
// ❌ Bad - Emits on every render
function Component() {
  socket.emit('event', data);
  return <div>...</div>;
}

// ✅ Good - Emit in effect or event handler
function Component() {
  useEffect(() => {
    socket.emit('event', data);
  }, [data]);
  
  return <div>...</div>;
}
```

## Related Documentation

- [Socket.IO Events Reference](../api/socket-events.md)
- [Backend WebSocket Implementation](../backend/websockets.md)
- [State Management](./state-management.md)
- [Application Structure](./application-structure.md)

---

**Last Updated**: November 2024
