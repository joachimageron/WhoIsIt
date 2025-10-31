import type {
  GameLobbyResponse,
  GameStateResponse,
  QuestionResponse,
  CharacterResponseDto,
} from "@whois-it/contracts";

import { create } from "zustand";

export interface GamePlayState {
  gameState: GameStateResponse | null;
  characters: CharacterResponseDto[];
  questions: QuestionResponse[];
  eliminatedCharacterIds: Set<string>;
}

export interface GameState {
  lobby: GameLobbyResponse | null;
  isConnected: boolean;
  playState: GamePlayState | null;
  setLobby: (lobby: GameLobbyResponse | null) => void;
  setConnected: (connected: boolean) => void;
  setGameState: (gameState: GameStateResponse | null) => void;
  setCharacters: (characters: CharacterResponseDto[]) => void;
  addQuestion: (question: QuestionResponse) => void;
  eliminateCharacter: (characterId: string) => void;
  resetPlayState: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  lobby: null,
  isConnected: false,
  playState: null,
  setLobby: (lobby) => set({ lobby }),
  setConnected: (isConnected) => set({ isConnected }),
  setGameState: (gameState) =>
    set((state) => ({
      playState: state.playState
        ? { ...state.playState, gameState }
        : {
            gameState,
            characters: [],
            questions: [],
            eliminatedCharacterIds: new Set(),
          },
    })),
  setCharacters: (characters) =>
    set((state) => ({
      playState: state.playState
        ? { ...state.playState, characters }
        : {
            gameState: null,
            characters,
            questions: [],
            eliminatedCharacterIds: new Set(),
          },
    })),
  addQuestion: (question) =>
    set((state) => ({
      playState: state.playState
        ? {
            ...state.playState,
            questions: [...state.playState.questions, question],
          }
        : {
            gameState: null,
            characters: [],
            questions: [question],
            eliminatedCharacterIds: new Set(),
          },
    })),
  eliminateCharacter: (characterId) =>
    set((state) => {
      if (!state.playState) return state;
      const newSet = new Set(state.playState.eliminatedCharacterIds);

      newSet.add(characterId);

      return {
        playState: {
          ...state.playState,
          eliminatedCharacterIds: newSet,
        },
      };
    }),
  resetPlayState: () =>
    set({
      playState: null,
    }),
  reset: () =>
    set({
      lobby: null,
      isConnected: false,
      playState: null,
    }),
}));
