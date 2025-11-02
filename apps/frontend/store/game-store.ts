import type {
  GameLobbyResponse,
  GameStateResponse,
  QuestionResponse,
  CharacterResponseDto,
  AnswerResponse,
  PlayerCharacterResponse,
} from "@whois-it/contracts";

import { create } from "zustand";

export interface GamePlayState {
  gameState: GameStateResponse | null;
  characters: CharacterResponseDto[];
  questions: QuestionResponse[];
  answers: Map<string, AnswerResponse>; // Maps questionId to answer
  eliminatedCharacterIds: Set<string>;
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
            answers: new Map(),
            eliminatedCharacterIds: new Set(),
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
