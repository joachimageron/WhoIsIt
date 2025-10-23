# Manual Test Plan for Lobby Rejoin Fix

## Overview
This document outlines manual testing procedures to verify that the lobby rejoin logic works correctly for both authenticated users and guests.

## Prerequisites
1. PostgreSQL database running
2. Backend server running (`pnpm dev:backend`)
3. Frontend server running (`pnpm dev:frontend`)
4. At least one character set available in the database

## Test Scenarios

### Scenario 1: Authenticated User Rejoins After Leaving

**Steps:**
1. Log in as User A
2. Create a new game (note the room code)
3. Verify User A appears in the lobby as host
4. Click "Leave Lobby"
5. Verify User A is no longer shown in the lobby
6. Navigate back to join game page
7. Enter the same room code and join
8. **Expected:** User A should reappear in the lobby with the host role
9. **Expected:** No duplicate entries for User A

**Success Criteria:**
- ✅ User A appears only once in the player list
- ✅ User A has the same player ID as before
- ✅ User A's ready state is reset to false (if not host) or true (if host)
- ✅ leftAt timestamp is cleared in the database

### Scenario 2: Guest User Rejoins After Leaving

**Steps:**
1. Open an incognito/private browser window
2. Navigate to the join game page
3. Enter a valid room code
4. Enter username "GuestPlayer1"
5. Join the game
6. Verify "GuestPlayer1" appears in the lobby
7. Click "Leave Lobby"
8. Verify "GuestPlayer1" is no longer shown
9. Navigate back to join game page
10. Enter the same room code
11. Enter the SAME username "GuestPlayer1"
12. Join the game
13. **Expected:** "GuestPlayer1" should reappear in the lobby
14. **Expected:** No duplicate entries for "GuestPlayer1"

**Success Criteria:**
- ✅ GuestPlayer1 appears only once in the player list
- ✅ GuestPlayer1 has the same player ID as before
- ✅ GuestPlayer1's ready state is reset to false
- ✅ leftAt timestamp is cleared in the database

### Scenario 3: Different Guest with Same Username

**Steps:**
1. Open first incognito window (Window A)
2. Join game with username "CommonName"
3. Verify "CommonName" appears
4. Leave lobby in Window A
5. Open second incognito window (Window B)
6. Join the SAME game with username "CommonName"
7. **Expected:** The second guest should rejoin as the same player (reusing the left player record)

**Success Criteria:**
- ✅ Only one "CommonName" player exists
- ✅ No duplicate entries

### Scenario 4: Game Capacity with Left Players

**Setup:**
- Create a game with maxPlayers = 3

**Steps:**
1. Player 1 joins (host)
2. Player 2 joins
3. Player 3 joins
4. Verify game shows 3/3 players
5. Player 2 leaves
6. Verify game shows 2/3 active players (Player 2 should not appear in list)
7. Player 4 tries to join
8. **Expected:** Player 4 should be able to join successfully
9. Verify game now shows 3/3 players (Player 1, Player 3, Player 4)
10. Player 2 tries to rejoin
11. **Expected:** Player 2 should be able to rejoin (reactivating their slot)
12. Verify game now shows 4 total players but only 3 active (Player 1, Player 2, Player 3)
   - Wait, this doesn't make sense. Let me reconsider...

Actually: When Player 2 rejoins after Player 4 joined:
- If Player 2 rejoins and their leftAt gets cleared, they become active again
- The game would have Player 1, Player 2 (rejoined), Player 3, Player 4
- That's 4 active players but maxPlayers is 3
- So Player 4 should NOT have been able to join if we want to allow Player 2 to rejoin

Let me revise:

**Revised Steps:**
1. Player 1 joins (host)
2. Player 2 joins
3. Player 3 joins
4. Verify game shows 3/3 players
5. Player 2 leaves
6. Verify game shows 2/3 active players (Player 2 filtered from display)
7. Player 4 tries to join
8. **Expected:** Player 4 should be able to join (slot available from Player 2 leaving)
9. Player 2 tries to rejoin
10. **Expected:** Player 2 should get error "Game is full" because there are now 3 active players (Player 1, Player 3, Player 4)

**Success Criteria:**
- ✅ Only active players count toward maxPlayers limit
- ✅ Players who have left don't block new players from joining
- ✅ Players who have left can't rejoin if game is full with new players

### Scenario 5: Multiple Leave/Rejoin Cycles

**Steps:**
1. Authenticated user joins game
2. User leaves
3. User rejoins (1st rejoin)
4. User leaves again
5. User rejoins again (2nd rejoin)
6. **Expected:** User appears in lobby after 2nd rejoin
7. **Expected:** Only one player record exists for this user

**Success Criteria:**
- ✅ User can leave and rejoin multiple times
- ✅ No duplicate player records created
- ✅ Each rejoin clears the leftAt timestamp

### Scenario 6: Guest Create Game Flow

**Steps:**
1. Open incognito browser window
2. Navigate to create game page
3. Fill in form with:
   - Character set selection
   - Host username: "GuestHost"
   - Other game settings
4. Create game
5. **Expected:** Game is created successfully
6. **Expected:** "GuestHost" appears as host in the lobby
7. **Expected:** "GuestHost" can start the game when conditions are met

**Success Criteria:**
- ✅ Guests can create games without authentication
- ✅ Guest host appears correctly in lobby
- ✅ Guest host has host role and permissions

## Database Verification Queries

After running the scenarios, verify in the database:

```sql
-- Check for duplicate players in same game
SELECT game_id, username, user_id, COUNT(*) as count
FROM game_players
GROUP BY game_id, username, user_id
HAVING COUNT(*) > 1;

-- Should return no results

-- Check leftAt timestamps for active players
SELECT id, username, left_at, is_ready
FROM game_players
WHERE game_id = '<your-game-id>'
ORDER BY joined_at;

-- Players who rejoined should have left_at = NULL
-- Players who left and didn't rejoin should have left_at set
```

## Notes for Testers

- Use browser developer tools to monitor WebSocket events
- Check Network tab for API calls
- Look for any errors in browser console
- Check backend logs for any errors or warnings
- Test with different browsers (Chrome, Firefox, Safari)
- Test with different network conditions if possible

## Automated Test Coverage

The following test cases have been automated in `game.service.spec.ts`:
- ✅ Authenticated user rejoin after leaving
- ✅ Guest user rejoin after leaving (matched by username)
- ✅ Only active players counted when checking if game is full
- ✅ Existing player returns current state (no changes needed)
- ✅ Basic join scenarios for authenticated and guest users
