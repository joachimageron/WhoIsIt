# Game Lobby Page

This directory contains the game lobby page implementation for the WhoIsIt application.

## Overview

The lobby page allows players to:

- View the room code
- See all players in the lobby with their ready status
- Toggle their ready status (non-host players)
- Start the game when all players are ready (host only)
- See real-time updates when other players join or change their status
- Monitor Socket.IO connection status
- Leave the lobby

## Components

### `page.tsx`

Server-side page component that fetches the dictionary translations and passes them to the client component.

### `lobby-client.tsx`

Main client component that implements the lobby interface with:

- Socket.IO real-time connection via `useGameSocket` hook
- REST API calls via `game-api.ts` helper
- State management via `useGameStore` Zustand store
- User authentication via `useAuthStore` Zustand store

## Features

### Real-time Updates

The lobby uses Socket.IO to receive real-time updates:

- `lobbyUpdate` - When lobby state changes
- `playerJoined` - When a new player joins
- Connection status monitoring

### Player Ready Status

- Non-host players can toggle their ready status
- Host can see when all players are ready
- Visual indicators show ready/not ready status

### Starting the Game

- Only the host can start the game
- Start button is enabled only when:
  - All players are ready
  - At least 2 players are in the lobby

### Error Handling

- Failed to join lobby: Redirects to home page with error toast
- Failed to update ready status: Shows error toast
- Failed to start game: Shows error toast
- Disconnection: Shows disconnected status indicator

## Usage

Navigate to `/[lang]/game/lobby/[roomCode]` where:

- `[lang]` is the language code (e.g., `en`, `fr`)
- `[roomCode]` is the 5-character room code

Example: `/en/game/lobby/ABC12`

## Dependencies

- `@heroui/button` - Button components
- `@heroui/card` - Card components
- `@heroui/chip` - Chip/badge components
- `@heroui/divider` - Divider component
- `@heroui/toast` - Toast notifications
- `@iconify/react` - Icons
- `socket.io-client` - Socket.IO client
- `@whois-it/contracts` - Shared TypeScript types

## API Integration

### REST API Endpoints Used

- `GET /games/:roomCode` - Fetch initial lobby state
- `POST /games/:roomCode/start` - Start the game

### Socket.IO Events Used

- `joinRoom` - Join the lobby for real-time updates
- `leaveRoom` - Leave the lobby
- `updatePlayerReady` - Update player ready status
- `lobbyUpdate` (listen) - Receive lobby state updates
- `playerJoined` (listen) - Receive player joined notifications

## Translations

The lobby page uses internationalization with the following keys in the dictionary:

- `lobby.title` - Page title
- `lobby.roomCode` - Room code label
- `lobby.host` - Host badge
- `lobby.players` - Players section title
- `lobby.waitingForPlayers` - Waiting message
- `lobby.readyStatus` - Ready status label
- `lobby.notReadyStatus` - Not ready status label
- `lobby.toggleReady` - Toggle ready button
- `lobby.startGame` - Start game button
- `lobby.leaveLobby` - Leave lobby button
- `lobby.connected` - Connected status
- `lobby.disconnected` - Disconnected status
- `lobby.connecting` - Connecting message
- `lobby.allPlayersReady` - All players ready message
- `lobby.waitingForHost` - Waiting for host message
- `lobby.errors.*` - Error messages

## Future Enhancements

Potential improvements:

- Add player avatars
- Show character set information
- Add lobby chat
- Show game settings (timer, max players, etc.)
- Add spectator support
- Add invite link copying
- Add player kick/ban functionality (for host)
