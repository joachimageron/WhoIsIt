/**
 * Example usage of RouteGuard component
 * This file demonstrates how to protect pages in the WhoIsIt application
 */

import { useState } from "react";

import { RouteGuard } from "./route-guard";

import { useGameAccess } from "@/lib/hooks/use-game-access";

// Example 1: Game route - allows both authenticated and guest users
export function GameLobbyPageExample() {
  return (
    <RouteGuard allowGuest={true} requireAuth={false}>
      <div>
        {/* Game lobby content */}
        <h1>Game Lobby</h1>
        <p>Both authenticated and guest users can access this page</p>
      </div>
    </RouteGuard>
  );
}

// Example 2: User profile - requires full authentication
export function UserProfilePageExample() {
  return (
    <RouteGuard allowGuest={false} requireAuth={true}>
      <div>
        {/* User profile content */}
        <h1>User Profile</h1>
        <p>Only authenticated users can access this page</p>
      </div>
    </RouteGuard>
  );
}

// Example 3: Game with custom redirect
export function PrivateGamePageExample() {
  return (
    <RouteGuard allowGuest={true} redirectTo="/game/join" requireAuth={false}>
      <div>
        {/* Private game content */}
        <h1>Private Game</h1>
        <p>Custom redirect to join page if unauthorized</p>
      </div>
    </RouteGuard>
  );
}

// Example 4: Using with useGameAccess hook
export function CreateGameFormExample() {
  const {
    canAccessGame,
    ensureGameAccess,
    getGameUsername,
    getGameUserId,
    requiresGuestSetup,
  } = useGameAccess();
  const [guestUsername, setGuestUsername] = useState("");

  const handleCreateGame = () => {
    // If user needs to set up guest access, show username input
    if (requiresGuestSetup) {
      if (!guestUsername) {
        alert("Please enter a username");

        return;
      }

      ensureGameAccess(guestUsername);
    }

    // Now proceed with game creation
    const username = getGameUsername();
    const userId = getGameUserId();

    // Example: Call API to create game
    void Promise.resolve({ username, userId });
  };

  return (
    <div>
      {requiresGuestSetup && (
        <div>
          <label htmlFor="guestUsername">Enter your username:</label>
          <input
            id="guestUsername"
            placeholder="Your username"
            type="text"
            value={guestUsername}
            onChange={(e) => setGuestUsername(e.target.value)}
          />
        </div>
      )}
      <button disabled={!canAccessGame} onClick={handleCreateGame}>
        Create Game
      </button>
    </div>
  );
}
