import type {
  CreateGameRequest,
  JoinGameRequest,
  AskQuestionRequest,
  SubmitAnswerRequest,
  SubmitGuessRequest,
} from "@whois-it/contracts";

import * as gameApi from "../game-api";

// Mock fetch
global.fetch = jest.fn();

describe("game-api", () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const API_URL = "http://localhost:4000";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getCharacterSets", () => {
    it("successfully fetches character sets", async () => {
      const mockSets = [
        { id: "set-1", name: "Classic Characters", characterCount: 24 },
        { id: "set-2", name: "Animals", characterCount: 20 },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSets,
      } as Response);

      const result = await gameApi.getCharacterSets();

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/character-sets`, {
        credentials: "include",
      });
      expect(result).toEqual(mockSets);
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Not found" }),
      } as Response);

      await expect(gameApi.getCharacterSets()).rejects.toThrow("Not found");
    });

    it("throws default error when response has no message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(gameApi.getCharacterSets()).rejects.toThrow(
        "Failed to get character sets",
      );
    });
  });

  describe("getCharacters", () => {
    it("successfully fetches characters for a set", async () => {
      const mockCharacters = [
        { id: "char-1", name: "Alice", imageUrl: "/images/alice.jpg" },
        { id: "char-2", name: "Bob", imageUrl: "/images/bob.jpg" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCharacters,
      } as Response);

      const result = await gameApi.getCharacters("set-1");

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/character-sets/set-1/characters`,
        {
          credentials: "include",
        },
      );
      expect(result).toEqual(mockCharacters);
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Character set not found" }),
      } as Response);

      await expect(gameApi.getCharacters("set-1")).rejects.toThrow(
        "Character set not found",
      );
    });
  });

  describe("createGame", () => {
    const createData: CreateGameRequest = {
      characterSetId: "set-1",
      turnTimerSeconds: 60,
    };

    it("successfully creates a game", async () => {
      const mockLobby = {
        id: "game-1",
        roomCode: "TEST123",
        status: "lobby",
        visibility: "private",
        hostUserId: "user-1",
        characterSetId: "set-1",
        turnTimerSeconds: 60,
        ruleConfig: {},
        createdAt: new Date().toISOString(),
        players: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLobby,
      } as Response);

      const result = await gameApi.createGame(createData);

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/games`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(createData),
      });
      expect(result).toEqual(mockLobby);
    });

    it("throws error when creation fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid character set" }),
      } as Response);

      await expect(gameApi.createGame(createData)).rejects.toThrow(
        "Invalid character set",
      );
    });
  });

  describe("joinGame", () => {
    const joinData: JoinGameRequest = {
      username: "player2",
    };

    it("successfully joins a game", async () => {
      const mockLobby = {
        id: "game-1",
        roomCode: "TEST123",
        status: "lobby",
        visibility: "private",
        hostUserId: "user-1",
        characterSetId: "set-1",
        ruleConfig: {},
        createdAt: new Date().toISOString(),
        players: [{ 
          id: "player-1", 
          username: "player2",
          role: "player",
          isReady: false,
          joinedAt: new Date().toISOString(),
        }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLobby,
      } as Response);

      const result = await gameApi.joinGame("TEST123", joinData);

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/games/TEST123/join`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(joinData),
      });
      expect(result).toEqual(mockLobby);
    });

    it("throws error when join fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Game is full" }),
      } as Response);

      await expect(gameApi.joinGame("TEST123", joinData)).rejects.toThrow(
        "Game is full",
      );
    });
  });

  describe("getLobby", () => {
    it("successfully fetches lobby details", async () => {
      const mockLobby = {
        id: "game-1",
        roomCode: "TEST123",
        status: "lobby",
        visibility: "private",
        hostUserId: "user-1",
        characterSetId: "set-1",
        ruleConfig: {},
        createdAt: new Date().toISOString(),
        players: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLobby,
      } as Response);

      const result = await gameApi.getLobby("TEST123");

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/games/TEST123`, {
        credentials: "include",
      });
      expect(result).toEqual(mockLobby);
    });

    it("throws error when lobby not found", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Game not found" }),
      } as Response);

      await expect(gameApi.getLobby("TEST123")).rejects.toThrow(
        "Game not found",
      );
    });
  });

  describe("startGame", () => {
    it("successfully starts a game", async () => {
      const mockLobby = {
        roomCode: "TEST123",
        hostId: "user-1",
        maxPlayers: 4,
        players: [],
        characterSetId: "set-1",
        isStarted: true,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockLobby,
      } as Response);

      const result = await gameApi.startGame("TEST123");

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/games/TEST123/start`, {
        method: "POST",
        credentials: "include",
      });
      expect(result).toEqual(mockLobby);
    });

    it("throws error when start fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Not enough players" }),
      } as Response);

      await expect(gameApi.startGame("TEST123")).rejects.toThrow(
        "Not enough players",
      );
    });
  });

  describe("getGameState", () => {
    it("successfully fetches game state", async () => {
      const mockState = {
        id: "game-1",
        roomCode: "TEST123",
        currentPlayerId: "player-1",
        roundNumber: 1,
        players: [],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockState,
      } as Response);

      const result = await gameApi.getGameState("TEST123");

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/games/TEST123/state`, {
        credentials: "include",
      });
      expect(result).toEqual(mockState);
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Game not started" }),
      } as Response);

      await expect(gameApi.getGameState("TEST123")).rejects.toThrow(
        "Game not started",
      );
    });
  });

  describe("getQuestions", () => {
    it("successfully fetches questions", async () => {
      const mockQuestions = [
        { id: "q1", text: "Is it a person?", askedByPlayerId: "player-1" },
        { id: "q2", text: "Does it fly?", askedByPlayerId: "player-2" },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestions,
      } as Response);

      const result = await gameApi.getQuestions("TEST123");

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/games/TEST123/questions`,
        {
          credentials: "include",
        },
      );
      expect(result).toEqual(mockQuestions);
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Game not found" }),
      } as Response);

      await expect(gameApi.getQuestions("TEST123")).rejects.toThrow(
        "Game not found",
      );
    });
  });

  describe("getAnswers", () => {
    it("successfully fetches answers", async () => {
      const mockAnswers = [
        { id: "a1", questionId: "q1", answerValue: true },
        { id: "a2", questionId: "q2", answerValue: false },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnswers,
      } as Response);

      const result = await gameApi.getAnswers("TEST123");

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/games/TEST123/answers`,
        {
          credentials: "include",
        },
      );
      expect(result).toEqual(mockAnswers);
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Game not found" }),
      } as Response);

      await expect(gameApi.getAnswers("TEST123")).rejects.toThrow(
        "Game not found",
      );
    });
  });

  describe("askQuestion", () => {
    const questionData: AskQuestionRequest = {
      playerId: "player-1",
      text: "Is it a person?",
    };

    it("successfully asks a question", async () => {
      const mockQuestion = {
        id: "q1",
        text: "Is it a person?",
        askedByPlayerId: "player-1",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockQuestion,
      } as Response);

      const result = await gameApi.askQuestion("TEST123", questionData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/games/TEST123/questions`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(questionData),
        },
      );
      expect(result).toEqual(mockQuestion);
    });

    it("throws error when question fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Not your turn" }),
      } as Response);

      await expect(
        gameApi.askQuestion("TEST123", questionData),
      ).rejects.toThrow("Not your turn");
    });
  });

  describe("submitAnswer", () => {
    const answerData: SubmitAnswerRequest = {
      playerId: "player-1",
      questionId: "q1",
      answerValue: true,
    };

    it("successfully submits an answer", async () => {
      const mockAnswer = {
        id: "a1",
        questionId: "q1",
        answerValue: true,
        answeredByPlayerId: "player-1",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockAnswer,
      } as Response);

      const result = await gameApi.submitAnswer("TEST123", answerData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/games/TEST123/answers`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(answerData),
        },
      );
      expect(result).toEqual(mockAnswer);
    });

    it("throws error when submit fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Question already answered" }),
      } as Response);

      await expect(gameApi.submitAnswer("TEST123", answerData)).rejects.toThrow(
        "Question already answered",
      );
    });
  });

  describe("submitGuess", () => {
    const guessData: SubmitGuessRequest = {
      playerId: "player-1",
      targetCharacterId: "char-1",
    };

    it("successfully submits a guess", async () => {
      const mockGuess = {
        isCorrect: true,
        targetCharacterId: "char-1",
        targetCharacterName: "Alice",
        guessedByPlayerId: "player-1",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGuess,
      } as Response);

      const result = await gameApi.submitGuess("TEST123", guessData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/games/TEST123/guesses`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(guessData),
        },
      );
      expect(result).toEqual(mockGuess);
    });

    it("throws error when guess fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Not your turn" }),
      } as Response);

      await expect(gameApi.submitGuess("TEST123", guessData)).rejects.toThrow(
        "Not your turn",
      );
    });
  });

  describe("getGameResults", () => {
    it("successfully fetches game results", async () => {
      const mockResults = {
        winnerId: "player-1",
        winnerUsername: "player1",
        endedAt: new Date().toISOString(),
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResults,
      } as Response);

      const result = await gameApi.getGameResults("TEST123");

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/games/TEST123/results`,
        {
          credentials: "include",
        },
      );
      expect(result).toEqual(mockResults);
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Game not finished" }),
      } as Response);

      await expect(gameApi.getGameResults("TEST123")).rejects.toThrow(
        "Game not finished",
      );
    });
  });

  describe("getPlayerCharacter", () => {
    it("successfully fetches player character", async () => {
      const mockCharacter = {
        id: "char-1",
        name: "Alice",
        imageUrl: "/images/alice.jpg",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockCharacter,
      } as Response);

      const result = await gameApi.getPlayerCharacter("TEST123", "player-1");

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/games/TEST123/players/player-1/character`,
        {
          credentials: "include",
        },
      );
      expect(result).toEqual(mockCharacter);
    });

    it("throws error when fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Character not assigned" }),
      } as Response);

      await expect(
        gameApi.getPlayerCharacter("TEST123", "player-1"),
      ).rejects.toThrow("Character not assigned");
    });
  });
});
