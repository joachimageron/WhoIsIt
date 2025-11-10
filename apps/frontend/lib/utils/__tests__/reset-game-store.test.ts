import { renderHook, act } from "@testing-library/react";

import { useGameStore } from "@/store/game-store";
import { resetGameStore } from "../reset-game-store";

describe("resetGameStore", () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useGameStore());

    act(() => {
      result.current.reset();
    });
  });

  it("resets all store state to initial values", () => {
    const { result } = renderHook(() => useGameStore());

    // Set up some state
    act(() => {
      result.current.setLobby({
        roomCode: "TEST123",
        players: [],
      } as any);
      result.current.setConnected(true);
      result.current.setGameState({
        id: "game-1",
        roomCode: "TEST123",
      } as any);
    });

    // Verify state is set
    expect(result.current.lobby).not.toBeNull();
    expect(result.current.isConnected).toBe(true);
    expect(result.current.playState).not.toBeNull();

    // Reset using utility function
    act(() => {
      resetGameStore();
    });

    // Verify state is reset
    const updatedResult = useGameStore.getState();

    expect(updatedResult.lobby).toBeNull();
    expect(updatedResult.isConnected).toBe(false);
    expect(updatedResult.playState).toBeNull();
  });

  it("can be called multiple times safely", () => {
    const { result } = renderHook(() => useGameStore());

    // Set up some state
    act(() => {
      result.current.setLobby({
        roomCode: "TEST123",
        players: [],
      } as any);
    });

    // Reset multiple times
    act(() => {
      resetGameStore();
      resetGameStore();
      resetGameStore();
    });

    // Verify state is reset
    const updatedResult = useGameStore.getState();

    expect(updatedResult.lobby).toBeNull();
    expect(updatedResult.isConnected).toBe(false);
    expect(updatedResult.playState).toBeNull();
  });
});
