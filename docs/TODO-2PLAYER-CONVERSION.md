# TODO: Conversion to 2-Player Game

## Context
Currently, the project is designed to support more than 2 players, but this is unnecessary for "Qui est-ce" (Guess Who) which is strictly a 2-player game. This adds unnecessary complexity. This document outlines the phases to convert the project to a strict 2-player game.

## Phases

### Phase 1: Update Contracts
- Remove `maxPlayers` field from `CreateGameRequest` type in contracts
- Update related types to reflect 2-player constraint
- Keep `players` array in responses but document it's always 2

### Phase 2: Update Backend Database Schema
- Remove `maxPlayers` column from Game entity
- Create migration to drop the column
- Update entity definition

### Phase 3: Update Backend Logic
- Remove `maxPlayers` validation and logic from GameLobbyService
- Hardcode player limit to 2 in join game logic
- Update all tests that reference maxPlayers
- Remove maxPlayers from game creation

### Phase 4: Update Frontend UI
- Remove "Max Players" input field from game creation form
- Update lobby display to always show "2/2" or "1/2" format
- Update translations to remove maxPlayers references
- Update frontend tests

### Phase 5: Update Documentation
- Update API documentation to reflect 2-player constraint
- Update game mechanics documentation
- Update README and architecture docs if needed

## Notes
- This is a breaking change and should be deployed carefully
- All tests must pass after each phase
- Database migration must be tested thoroughly
