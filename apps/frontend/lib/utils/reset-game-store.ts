import { useGameStore } from "@/store/game-store";

/**
 * Resets the entire game store to its initial state.
 * Use this when leaving a game, starting a new game, or when you need to clear all game-related state.
 */
export function resetGameStore() {
  const { reset } = useGameStore.getState();

  reset();
}
