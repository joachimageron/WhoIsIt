import type { GameStateResponse } from "@whois-it/contracts";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GameHeader } from "../game-header";

// Mock RoomCodeDisplay component
jest.mock("@/components/room-code-display", () => ({
  RoomCodeDisplay: ({ roomCode, label }: any) => (
    <div data-testid="room-code-display">
      {label} {roomCode}
    </div>
  ),
}));

// Mock Icon component
jest.mock("@iconify/react", () => ({
  Icon: ({ icon }: any) => <span data-testid="icon">{icon}</span>,
}));

describe("GameHeader", () => {
  const mockDict = {
    game: {
      play: {
        title: "Game Play",
        roomCode: "Room Code",
        round: "Round",
        turn: "Turn",
        yourTurn: "Your Turn",
        playerTurn: "{player}'s Turn",
        timer: "Timer",
        roomCodeCopied: "Code copied!",
        actions: {
          abandonGame: "Leave Game",
        },
        errors: {
          failedToCopyRoomCode: "Failed to copy",
        },
      },
      lobby: {
        connected: "Connected",
        disconnected: "Disconnected",
      },
    },
  };

  const mockGameState: GameStateResponse = {
    id: "1",
    roomCode: "ABC123",
    status: "in_progress",
    currentRoundNumber: 1,
    totalRounds: 5,
    activePlayerId: "2",
    activePlayerUsername: "PlayerTwo",
    players: [],
    rounds: [],
    characterSet: {
      id: "1",
      name: "Test Set",
      description: "",
      isDefault: false,
    },
    settings: { maxPlayers: 4, roundTimeLimit: null },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const defaultProps = {
    dict: mockDict as any,
    gameState: mockGameState,
    isConnected: true,
    isMyTurn: false,
    roomCode: "ABC123",
    questionCount: 3,
    onLeaveGame: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the game title", () => {
    render(<GameHeader {...defaultProps} />);
    expect(screen.getByText("Game Play")).toBeInTheDocument();
  });

  it("shows connected status when connected", () => {
    render(<GameHeader {...defaultProps} />);
    expect(screen.getByText("Connected")).toBeInTheDocument();
  });

  it("shows disconnected status when not connected", () => {
    render(<GameHeader {...defaultProps} isConnected={false} />);
    expect(screen.getByText("Disconnected")).toBeInTheDocument();
  });

  it("displays the room code", () => {
    render(<GameHeader {...defaultProps} />);
    expect(screen.getByTestId("room-code-display")).toHaveTextContent("ABC123");
  });

  it("displays the current turn/round number", () => {
    render(<GameHeader {...defaultProps} questionCount={3} />);
    expect(screen.getByText("4")).toBeInTheDocument(); // questionCount + 1
  });

  it('shows "Your Turn" chip when it is the player\'s turn', () => {
    render(<GameHeader {...defaultProps} isMyTurn={true} />);
    expect(screen.getByText("Your Turn")).toBeInTheDocument();
  });

  it("shows other player's turn when not player's turn", () => {
    render(<GameHeader {...defaultProps} isMyTurn={false} />);
    expect(screen.getByText("PlayerTwo's Turn")).toBeInTheDocument();
  });

  it("displays placeholder when active player username is not available", () => {
    const gameStateWithoutPlayer = {
      ...mockGameState,
      activePlayerUsername: undefined,
    };

    render(<GameHeader {...defaultProps} gameState={gameStateWithoutPlayer} />);
    expect(screen.getByText("...'s Turn")).toBeInTheDocument();
  });

  it("renders leave game button", () => {
    render(<GameHeader {...defaultProps} />);
    expect(screen.getByText("Leave Game")).toBeInTheDocument();
  });

  it("calls onLeaveGame when leave button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnLeave = jest.fn();

    render(<GameHeader {...defaultProps} onLeaveGame={mockOnLeave} />);

    const leaveButton = screen.getByText("Leave Game");

    await user.click(leaveButton);

    expect(mockOnLeave).toHaveBeenCalledTimes(1);
  });

  it("renders all required icons", () => {
    render(<GameHeader {...defaultProps} />);
    const icons = screen.getAllByTestId("icon");

    expect(icons.length).toBeGreaterThan(0);
  });
});
