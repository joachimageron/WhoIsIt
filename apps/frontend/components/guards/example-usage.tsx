/**
 * Example usage of RouteGuard component
 * This file demonstrates how to protect pages in the WhoIsIt application
 */

import { RouteGuard } from "./route-guard";

// Example 1: Game route - allows both authenticated and guest users
export function GameLobbyPageExample() {
  return (
    <RouteGuard requireAuth={false} allowGuest={true}>
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
    <RouteGuard requireAuth={true} allowGuest={false}>
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
    <RouteGuard
      requireAuth={false}
      allowGuest={true}
      redirectTo="/game/join"
    >
      <div>
        {/* Private game content */}
        <h1>Private Game</h1>
        <p>Custom redirect to join page if unauthorized</p>
      </div>
    </RouteGuard>
  );
}

// Example 4: Using with useGameAccess hook
import { useGameAccess } from "@/lib/hooks/use-game-access";
import { useState } from "react";

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

    console.log("Creating game with:", { username, userId });
    // Call API to create game...
  };

  return (
    <div>
      {requiresGuestSetup && (
        <div>
          <label htmlFor="guestUsername">Enter your username:</label>
          <input
            id="guestUsername"
            type="text"
            value={guestUsername}
            onChange={(e) => setGuestUsername(e.target.value)}
            placeholder="Your username"
          />
        </div>
      )}
      <button onClick={handleCreateGame} disabled={!canAccessGame}>
        Create Game
      </button>
    </div>
  );
}
