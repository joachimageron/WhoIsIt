import type { CharacterResponseDto } from "@whois-it/contracts";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GuessModal } from "../guess-modal";

// Mock dependencies
jest.mock("@iconify/react", () => ({
  Icon: ({ icon }: any) => <span data-testid="icon">{icon}</span>,
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ alt, src, ...props }: any) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} {...props} />
  ),
}));

describe("GuessModal", () => {
  const mockDict = {
    game: {
      play: {
        guess: {
          confirmGuess: "Confirm Your Guess",
          cancelGuess: "Cancel",
          confirmButton: "Confirm Guess",
          guessing: "Guessing...",
        },
        characters: {
          selectCharacterToGuess: "Select the character you want to guess:",
        },
      },
    },
  };

  const mockCharacters: CharacterResponseDto[] = [
    {
      id: "char-1",
      name: "Alice",
      slug: "alice",
      isActive: true,
      metadata: {},
      imageUrl: "https://example.com/alice.jpg",
    },
    {
      id: "char-2",
      name: "Bob",
      imageUrl: "https://example.com/bob.jpg",
      slug: "bob",
      isActive: true,
      metadata: {},
    },
    {
      id: "char-3",
      name: "Charlie",
      imageUrl: "https://example.com/charlie.jpg",
      slug: "charlie",
      isActive: true,
      metadata: {},
    },
  ];

  const defaultProps = {
    dict: mockDict as any,
    isOpen: true,
    characters: mockCharacters,
    eliminatedIds: new Set<string>(),
    flippedIds: new Set<string>(),
    isGuessing: false,
    onClose: jest.fn(),
    onConfirm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders modal header with correct title", () => {
    render(<GuessModal {...defaultProps} />);
    expect(screen.getByText("Confirm Your Guess")).toBeInTheDocument();
  });

  it("displays instruction text", () => {
    render(<GuessModal {...defaultProps} />);
    expect(
      screen.getByText("Select the character you want to guess:"),
    ).toBeInTheDocument();
  });

  it("displays all non-eliminated characters", () => {
    render(<GuessModal {...defaultProps} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
  });

  it("displays eliminated characters with visual indicator", () => {
    const eliminatedIds = new Set(["char-2"]);

    render(<GuessModal {...defaultProps} eliminatedIds={eliminatedIds} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();

    // Bob's button should be disabled
    const bobButton = screen.getByRole("button", { name: /Bob/i });

    expect(bobButton).toBeDisabled();
  });

  it("displays flipped characters with visual indicator", () => {
    const flippedIds = new Set(["char-3"]);

    render(<GuessModal {...defaultProps} flippedIds={flippedIds} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();

    // Charlie's button should be disabled
    const charlieButton = screen.getByRole("button", { name: /Charlie/i });

    expect(charlieButton).toBeDisabled();
  });

  it("displays both eliminated and flipped characters with visual indicators", () => {
    const eliminatedIds = new Set(["char-1"]);
    const flippedIds = new Set(["char-2"]);

    render(
      <GuessModal
        {...defaultProps}
        eliminatedIds={eliminatedIds}
        flippedIds={flippedIds}
      />,
    );

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();

    // Alice and Bob's buttons should be disabled
    const aliceButton = screen.getByRole("button", { name: /Alice/i });
    const bobButton = screen.getByRole("button", { name: /Bob/i });

    expect(aliceButton).toBeDisabled();
    expect(bobButton).toBeDisabled();
  });

  it("allows selecting a character", async () => {
    const user = userEvent.setup();

    render(<GuessModal {...defaultProps} />);

    const aliceButton = screen.getByRole("button", { name: /Alice/i });

    await user.click(aliceButton);

    // Confirm button should be enabled
    const confirmButton = screen.getByText("Confirm Guess");

    expect(confirmButton).not.toBeDisabled();
  });

  it("shows visual indicator for selected character", async () => {
    const user = userEvent.setup();

    render(<GuessModal {...defaultProps} />);

    const aliceButton = screen.getByRole("button", { name: /Alice/i });

    await user.click(aliceButton);

    // Should have success styling (check for class presence)
    expect(aliceButton).toHaveClass("border-success");
  });

  it("allows changing selection", async () => {
    const user = userEvent.setup();

    render(<GuessModal {...defaultProps} />);

    const aliceButton = screen.getByRole("button", { name: /Alice/i });
    const bobButton = screen.getByRole("button", { name: /Bob/i });

    await user.click(aliceButton);
    expect(aliceButton).toHaveClass("border-success");

    await user.click(bobButton);
    expect(bobButton).toHaveClass("border-success");
    expect(aliceButton).not.toHaveClass("border-success");
  });

  it("calls onConfirm with selected character ID", async () => {
    const user = userEvent.setup();
    const mockOnConfirm = jest.fn();

    render(<GuessModal {...defaultProps} onConfirm={mockOnConfirm} />);

    const aliceButton = screen.getByRole("button", { name: /Alice/i });

    await user.click(aliceButton);

    const confirmButton = screen.getByText("Confirm Guess");

    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalledWith("char-1");
  });

  it("clears selection after confirming", async () => {
    const user = userEvent.setup();
    const mockOnConfirm = jest.fn();

    render(<GuessModal {...defaultProps} onConfirm={mockOnConfirm} />);

    const aliceButton = screen.getByRole("button", { name: /Alice/i });

    await user.click(aliceButton);

    const confirmButton = screen.getByText("Confirm Guess");

    await user.click(confirmButton);

    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    render(<GuessModal {...defaultProps} onClose={mockOnClose} />);

    const cancelButton = screen.getByText("Cancel");

    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("clears selection when closing modal", async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    render(<GuessModal {...defaultProps} onClose={mockOnClose} />);

    const aliceButton = screen.getByRole("button", { name: /Alice/i });

    await user.click(aliceButton);

    const cancelButton = screen.getByText("Cancel");

    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("disables confirm button when no character is selected", () => {
    render(<GuessModal {...defaultProps} />);

    const confirmButton = screen.getByText("Confirm Guess");

    expect(confirmButton).toBeDisabled();
  });

  it("disables buttons when isGuessing is true", () => {
    render(<GuessModal {...defaultProps} isGuessing={true} />);

    const cancelButton = screen.getByText("Cancel");
    const confirmButton = screen.getByText("Guessing...");

    expect(cancelButton).toBeDisabled();
    expect(confirmButton).toBeDisabled();
  });

  it("shows guessing state in confirm button", () => {
    render(<GuessModal {...defaultProps} isGuessing={true} />);

    expect(screen.getByText("Guessing...")).toBeInTheDocument();
  });

  it("displays character images", () => {
    render(<GuessModal {...defaultProps} />);

    const images = screen.getAllByRole("img");

    expect(images).toHaveLength(3);
    expect(images[0]).toHaveAttribute("alt", "Alice");
    expect(images[1]).toHaveAttribute("alt", "Bob");
    expect(images[2]).toHaveAttribute("alt", "Charlie");
  });

  it("displays all characters even when all are eliminated", () => {
    const eliminatedIds = new Set(["char-1", "char-2", "char-3"]);

    render(<GuessModal {...defaultProps} eliminatedIds={eliminatedIds} />);

    // All characters should still be visible
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();

    // All buttons should be disabled
    const aliceButton = screen.getByRole("button", { name: /Alice/i });
    const bobButton = screen.getByRole("button", { name: /Bob/i });
    const charlieButton = screen.getByRole("button", { name: /Charlie/i });

    expect(aliceButton).toBeDisabled();
    expect(bobButton).toBeDisabled();
    expect(charlieButton).toBeDisabled();
  });

  it("prevents selecting eliminated characters", async () => {
    const user = userEvent.setup();
    const eliminatedIds = new Set(["char-1"]);

    render(<GuessModal {...defaultProps} eliminatedIds={eliminatedIds} />);

    const aliceButton = screen.getByRole("button", { name: /Alice/i });

    // Try to click the disabled button
    await user.click(aliceButton);

    // Confirm button should still be disabled (no selection made)
    const confirmButton = screen.getByText("Confirm Guess");

    expect(confirmButton).toBeDisabled();
  });

  it("prevents selecting flipped characters", async () => {
    const user = userEvent.setup();
    const flippedIds = new Set(["char-2"]);

    render(<GuessModal {...defaultProps} flippedIds={flippedIds} />);

    const bobButton = screen.getByRole("button", { name: /Bob/i });

    // Try to click the disabled button
    await user.click(bobButton);

    // Confirm button should still be disabled (no selection made)
    const confirmButton = screen.getByText("Confirm Guess");

    expect(confirmButton).toBeDisabled();
  });
});
