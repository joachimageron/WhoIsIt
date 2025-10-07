import { create } from "zustand";

export type Player = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export interface GameState {
  players: Player[];
  roomCode?: string;
  isConnected: boolean;
  setPlayers: (players: Player[]) => void;
  setRoomCode: (code: string | undefined) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  players: [],
  roomCode: undefined,
  isConnected: false,
  setPlayers: (players) => set({ players }),
  setRoomCode: (roomCode) => set({ roomCode }),
  setConnected: (isConnected) => set({ isConnected }),
  reset: () =>
    set({
      players: [],
      roomCode: undefined,
      isConnected: false,
    }),
}));
