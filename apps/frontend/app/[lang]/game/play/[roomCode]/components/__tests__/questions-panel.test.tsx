import type { GameStateResponse } from "@whois-it/contracts";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { QuestionsPanel } from "../questions-panel";

// Mock dependencies
jest.mock("@iconify/react", () => ({
  Icon: ({ icon }: any) => <span data-testid="icon">{icon}</span>,
}));

jest.mock("@heroui/toast", () => ({
  addToast: jest.fn(),
}));

jest.mock("@/lib/game-api", () => ({
  askQuestion: jest.fn(),
}));

const mockAddToast = require("@heroui/toast").addToast;

const mockGameApi = require("@/lib/game-api");

describe("QuestionsPanel", () => {
  const mockDict = {
    game: {
      play: {
        questions: {
          questionsPanel: "Questions Panel",
          selectPlayer: "Select Player",
          to: "To:",
          questionPlaceholder: "Ask a question...",
          askButton: "Ask Question",
          asking: "Asking...",
          enterQuestion: "Please enter a question",
        },
        waitingForTurn: "Waiting for your turn...",
        errors: {
          notYourTurn: "It's not your turn",
          failedToAskQuestion: "Failed to ask question",
        },
      },
    },
  };

  const mockGameState: GameStateResponse = {
    id: "game-1",
    roomCode: "ABC123",
    status: "in_progress",
    currentRoundNumber: 1,
    currentRoundState: "question",
    activePlayerId: "player-1",
    activePlayerUsername: "Alice",
    players: [
      {
        id: "player-1",
        username: "Alice",
        userId: "user-1",
        role: "host",
        isReady: true,
        joinedAt: new Date().toISOString(),
      },
      {
        id: "player-2",
        username: "Bob",
        userId: "user-2",
        role: "player",
        isReady: true,
        joinedAt: new Date().toISOString(),
      },
    ],
  };

  const defaultProps = {
    dict: mockDict as any,
    gameState: mockGameState,
    isMyTurn: true,
    roomCode: "ABC123",
    currentPlayerId: "player-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header with correct title", () => {
    render(<QuestionsPanel {...defaultProps} />);
    expect(
      screen.getByRole("heading", { name: "Questions Panel" }),
    ).toBeInTheDocument();
  });

  it("displays opponent player name", () => {
    render(<QuestionsPanel {...defaultProps} />);
    // In 2-player mode, the opponent's name should be displayed
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("displays question textarea", () => {
    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    expect(textarea).toBeInTheDocument();
  });

  it("displays ask button", () => {
    render(<QuestionsPanel {...defaultProps} />);
    expect(screen.getByText("Ask Question")).toBeInTheDocument();
  });

  it("allows typing in question textarea", async () => {
    const user = userEvent.setup();

    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "Does the character wear glasses?");

    expect(textarea).toHaveValue("Does the character wear glasses?");
  });

  it("submits question when ask button is clicked", async () => {
    const user = userEvent.setup();

    mockGameApi.askQuestion.mockResolvedValue(undefined);

    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "Test question");

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    await waitFor(() => {
      expect(mockGameApi.askQuestion).toHaveBeenCalledWith("ABC123", {
        playerId: "player-1",
        targetPlayerId: "player-2",
        questionText: "Test question",
      });
    });
  });

  it("clears question text after successful submission", async () => {
    const user = userEvent.setup();

    mockGameApi.askQuestion.mockResolvedValue(undefined);

    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "Test question");

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    await waitFor(() => {
      expect(textarea).toHaveValue("");
    });
  });

  it("shows success toast after successful submission", async () => {
    const user = userEvent.setup();

    mockGameApi.askQuestion.mockResolvedValue(undefined);

    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "Test question");

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith({
        color: "success",
        title: "Ask Question",
        description: "Question sent successfully",
      });
    });
  });

  it("shows warning toast when question is empty", async () => {
    const user = userEvent.setup();

    render(<QuestionsPanel {...defaultProps} />);

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    expect(mockAddToast).toHaveBeenCalledWith({
      color: "warning",
      title: "Please enter a question",
    });
  });

  it("shows warning toast when question is only whitespace", async () => {
    const user = userEvent.setup();

    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "   ");

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    expect(mockAddToast).toHaveBeenCalledWith({
      color: "warning",
      title: "Please enter a question",
    });
  });

  it("disables inputs when not player's turn", () => {
    render(<QuestionsPanel {...defaultProps} isMyTurn={false} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");
    const askButton = screen.getByText("Ask Question");

    expect(textarea).toBeDisabled();
    expect(askButton).toBeDisabled();
  });

  it("shows error toast when currentPlayerId is null", async () => {
    const user = userEvent.setup();

    render(<QuestionsPanel {...defaultProps} currentPlayerId={null} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "Test question");

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    expect(mockAddToast).toHaveBeenCalledWith({
      color: "danger",
      title: "Failed to ask question",
    });
  });

  it("shows error toast when API call fails", async () => {
    const user = userEvent.setup();

    mockGameApi.askQuestion.mockRejectedValue(new Error("Network error"));

    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "Test question");

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    await waitFor(() => {
      expect(mockAddToast).toHaveBeenCalledWith({
        color: "danger",
        title: "Failed to ask question",
        description: "Network error",
      });
    });
  });

  it("disables inputs when not player's turn", () => {
    render(<QuestionsPanel {...defaultProps} isMyTurn={false} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");
    const askButton = screen.getByText("Ask Question");

    expect(textarea).toBeDisabled();
    expect(askButton).toBeDisabled();
  });

  it("shows waiting message when not player's turn", () => {
    render(<QuestionsPanel {...defaultProps} isMyTurn={false} />);

    expect(screen.getByText("Waiting for your turn...")).toBeInTheDocument();
  });

  it("shows asking state while submitting", async () => {
    const user = userEvent.setup();

    mockGameApi.askQuestion.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "Test question");

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    expect(screen.getByText("Asking...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockGameApi.askQuestion).toHaveBeenCalled();
    });
  });

  it("disables inputs while submitting", async () => {
    const user = userEvent.setup();

    mockGameApi.askQuestion.mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    );

    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "Test question");

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    expect(textarea).toBeDisabled();

    await waitFor(() => {
      expect(mockGameApi.askQuestion).toHaveBeenCalled();
    });
  });

  it("automatically targets the opponent player in 2-player mode", () => {
    render(<QuestionsPanel {...defaultProps} />);

    // Should show the opponent player's name (Bob)
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("handles game with only one player", () => {
    const singlePlayerGameState: GameStateResponse = {
      ...mockGameState,
      players: [
        {
          id: "player-1",
          username: "Alice",
          userId: "user-1",
          role: "host",
          isReady: true,
          joinedAt: new Date().toISOString(),
        },
      ],
    };

    render(
      <QuestionsPanel {...defaultProps} gameState={singlePlayerGameState} />,
    );

    // When there's only one player, no opponent name should be shown
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
  });

  it("trims question text before submitting", async () => {
    const user = userEvent.setup();

    mockGameApi.askQuestion.mockResolvedValue(undefined);

    render(<QuestionsPanel {...defaultProps} />);

    const textarea = screen.getByPlaceholderText("Ask a question...");

    await user.type(textarea, "  Test question  ");

    const askButton = screen.getByText("Ask Question");

    await user.click(askButton);

    await waitFor(() => {
      expect(mockGameApi.askQuestion).toHaveBeenCalledWith("ABC123", {
        playerId: "player-1",
        targetPlayerId: "player-2",
        questionText: "Test question",
      });
    });
  });

  it("submits question with correct target player in 2-player mode", () => {
    render(<QuestionsPanel {...defaultProps} />);

    // In 2-player mode, the first other player (Bob) should be automatically targeted
    // This is verified in the question submission test above
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
