import type {
  GameLobbyResponse,
  GameStateResponse,
  QuestionResponse,
  CharacterResponseDto,
  AnswerResponse,
  PlayerCharacterResponse,
} from "@whois-it/contracts";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// Type for the serialized playState (with arrays instead of Sets/Maps)
type SerializedGamePlayState = {
  gameState: null;
  characters: [];
  questions: [];
  answers: [];
  eliminatedCharacterIds: string[];
  flippedCharacterIds: string[];
  myCharacter: null;
};

export interface GamePlayState {
  gameState: GameStateResponse | null;
  characters: CharacterResponseDto[];
  questions: QuestionResponse[];
  answers: Map<string, AnswerResponse>; // Maps questionId to answer
  eliminatedCharacterIds: Set<string>;
  flippedCharacterIds: Set<string>; // Characters that the player has manually flipped down
  myCharacter: PlayerCharacterResponse | null;
}

export interface GameState {
  lobby: GameLobbyResponse | null;
  isConnected: boolean;
  playState: GamePlayState | null;
  setLobby: (lobby: GameLobbyResponse | null) => void;
  setConnected: (connected: boolean) => void;
  setGameState: (gameState: GameStateResponse | null) => void;
  setCharacters: (characters: CharacterResponseDto[]) => void;
  setMyCharacter: (myCharacter: PlayerCharacterResponse | null) => void;
  addQuestion: (question: QuestionResponse) => void;
  addAnswer: (answer: AnswerResponse) => void;
  eliminateCharacter: (characterId: string) => void;
  toggleFlipCharacter: (characterId: string) => void;
  resetPlayState: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>()(
  persist(
    (set) => ({
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
                answers: new Map(),
                eliminatedCharacterIds: new Set(),
                flippedCharacterIds: new Set(),
                myCharacter: null,
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
                answers: new Map(),
                eliminatedCharacterIds: new Set(),
                flippedCharacterIds: new Set(),
                myCharacter: null,
              },
        })),
      setMyCharacter: (myCharacter) =>
        set((state) => ({
          playState: state.playState
            ? { ...state.playState, myCharacter }
            : {
                gameState: null,
                characters: [],
                questions: [],
                answers: new Map(),
                eliminatedCharacterIds: new Set(),
                flippedCharacterIds: new Set(),
                myCharacter,
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
                answers: new Map(),
                eliminatedCharacterIds: new Set(),
                flippedCharacterIds: new Set(),
                myCharacter: null,
              },
        })),
      addAnswer: (answer) =>
        set((state) => {
          if (!state.playState) return state;
          const newAnswers = new Map(state.playState.answers);

          newAnswers.set(answer.questionId, answer);

          return {
            playState: {
              ...state.playState,
              answers: newAnswers,
            },
          };
        }),
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
      toggleFlipCharacter: (characterId) =>
        set((state) => {
          if (!state.playState) return state;
          const newSet = new Set(state.playState.flippedCharacterIds);

          if (newSet.has(characterId)) {
            newSet.delete(characterId);
          } else {
            newSet.add(characterId);
          }

          return {
            playState: {
              ...state.playState,
              flippedCharacterIds: newSet,
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
    }),
    {
      name: "whoisit-game-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state): { playState: SerializedGamePlayState | null } => {
        // Only persist player's gameplay choices, not real-time state
        if (!state.playState) {
          return { playState: null };
        }

        // Convert Sets to arrays for JSON serialization
        return {
          playState: {
            gameState: null, // Don't persist - comes from server
            characters: [], // Don't persist - comes from server
            questions: [], // Don't persist - comes from server
            answers: [], // Don't persist - comes from server
            eliminatedCharacterIds: Array.from(
              state.playState.eliminatedCharacterIds,
            ),
            flippedCharacterIds: Array.from(
              state.playState.flippedCharacterIds,
            ),
            myCharacter: null, // Don't persist - comes from server
          },
        };
      },
      merge: (persistedState, currentState) => {
        // Custom merge function to convert arrays back to Sets
        const persisted = persistedState as {
          playState: SerializedGamePlayState | null;
        };

        if (!persisted.playState) {
          return currentState;
        }

        return {
          ...currentState,
          playState: {
            gameState: null,
            characters: [],
            questions: [],
            answers: new Map(),
            eliminatedCharacterIds: new Set(
              persisted.playState.eliminatedCharacterIds,
            ),
            flippedCharacterIds: new Set(
              persisted.playState.flippedCharacterIds,
            ),
            myCharacter: null,
          },
        };
      },
    },
  ),
);
