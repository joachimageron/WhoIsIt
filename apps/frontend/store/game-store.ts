import type { GameLobbyResponse } from "@whois-it/contracts";

import { create } from "zustand";

export interface GameState {
  lobby: GameLobbyResponse | null;
  isConnected: boolean;
  setLobby: (lobby: GameLobbyResponse | null) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  lobby: null,
  isConnected: false,
  setLobby: (lobby) => set({ lobby }),
  setConnected: (isConnected) => set({ isConnected }),
  reset: () =>
    set({
      lobby: null,
      isConnected: false,
    }),
}));
