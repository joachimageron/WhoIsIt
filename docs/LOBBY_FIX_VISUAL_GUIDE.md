# Lobby Rejoin Logic - Visual Flow

## Before the Fix ❌

```
Player joins lobby:
  ├─ Create new player record
  └─ Player appears in lobby ✓

Player leaves lobby:
  ├─ Set leftAt = <timestamp>
  └─ Player filtered from lobby view ✓

Player rejoins lobby:
  ├─ Check if player exists
  │  └─ User already joined → Return current state
  ├─ Create NEW player record (DUPLICATE!)
  └─ But leftAt is still set on old record
     └─ Both records filtered from view ❌
        └─ PROBLEM: Player doesn't appear!
```

## After the Fix ✅

```
Player joins lobby:
  ├─ Create new player record
  └─ Player appears in lobby ✓

Player leaves lobby:
  ├─ Set leftAt = <timestamp>
  └─ Player filtered from lobby view ✓

Player rejoins lobby:
  ├─ Check if player exists (including left players)
  │  ├─ Authenticated user: Match by userId
  │  └─ Guest user: Match by username (case-insensitive)
  │
  ├─ Found existing player?
  │  ├─ YES, and leftAt is set (player rejoining):
  │  │  ├─ Clear leftAt = null
  │  │  ├─ Reset isReady = false
  │  │  └─ Update player record (no duplicate) ✓
  │  │
  │  ├─ YES, and leftAt is null (already in lobby):
  │  │  └─ Return current state (no changes)
  │  │
  │  └─ NO:
  │     └─ Create new player record ✓
  │
  └─ Player appears in lobby ✓
```

## Game Capacity Check

### Before the Fix ❌
```
Game maxPlayers = 3

Players in database:
  ├─ Player 1 (active)
  ├─ Player 2 (active)
  ├─ Player 3 (leftAt set)
  └─ Total count: 3

New player tries to join:
  └─ Count ALL players (3) >= maxPlayers (3)
     └─ ERROR: Game is full ❌
        └─ PROBLEM: Player 3 left, slot should be available!
```

### After the Fix ✅
```
Game maxPlayers = 3

Players in database:
  ├─ Player 1 (active, leftAt = null)
  ├─ Player 2 (active, leftAt = null)
  ├─ Player 3 (leftAt = <timestamp>)
  └─ Total count: 3

New player tries to join:
  ├─ Count ACTIVE players only:
  │  └─ filter(p => !p.leftAt)
  │     └─ Active count: 2
  │
  └─ Active count (2) < maxPlayers (3)
     └─ SUCCESS: Player 4 can join ✓
```

## Matching Logic

### Authenticated Users
```
User logs in (userId = "abc123")
Joins game → Creates player record with userId = "abc123"

User leaves
  └─ Player record: { userId: "abc123", leftAt: <timestamp> }

User rejoins
  └─ Find player where userId === "abc123"
     └─ Found! Clear leftAt and reuse this record ✓
```

### Guest Users
```
Guest enters username "GuestPlayer"
Joins game → Creates player record with username = "GuestPlayer", userId = null

Guest leaves
  └─ Player record: { username: "GuestPlayer", userId: null, leftAt: <timestamp> }

Same guest rejoins with username "guestplayer" (different case)
  └─ Find player where:
     - userId is null (guest player)
     - username.toLowerCase() === "guestplayer".toLowerCase()
  └─ Found! Clear leftAt and reuse this record ✓
```

## Edge Cases Handled

### 1. Multiple Leave/Rejoin Cycles
```
User joins → leaves → rejoins → leaves → rejoins
  └─ Always uses same player record
  └─ leftAt is toggled between null and <timestamp>
  └─ No duplicates created ✓
```

### 2. Different Guests with Same Username
```
Guest A (Window 1) joins as "CommonName" → leaves
Guest B (Window 2) joins as "CommonName"
  └─ Reuses Guest A's player record
  └─ This is intentional - same username = same player slot ✓
```

### 3. Player Rejoins After Someone Else Took Their Slot
```
Game maxPlayers = 3

Timeline:
  1. Player 1, 2, 3 join (game full)
  2. Player 2 leaves (2 active)
  3. Player 4 joins (3 active, game full again)
  4. Player 2 tries to rejoin
     └─ Active players (1, 3, 4) >= maxPlayers (3)
     └─ ERROR: Game is full ✓
     └─ This is correct behavior!
```

## Database Schema Reference

```typescript
GamePlayer {
  id: string (UUID)
  user?: User | null        // null for guests
  username: string          // display name
  role: GamePlayerRole      // 'host' | 'player' | 'spectator'
  isReady: boolean
  joinedAt: Date
  leftAt?: Date | null      // null = active, set = left
}
```

## Filtering Logic for Display

```typescript
// In mapToLobbyResponse()
const players = game.players
  .filter(player => !player.leftAt)  // Only show active players
  .sort((a, b) => a.joinedAt - b.joinedAt);  // Oldest first
```
