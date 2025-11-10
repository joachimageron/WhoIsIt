import type { CharacterResponseDto } from "@whois-it/contracts";
import type { Dictionary } from "@/dictionaries";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CharacterGrid } from "../character-grid";

// Mock Next Image
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}));

describe("CharacterGrid", () => {
  const mockDict: Dictionary = {
    game: {
      play: {
        characters: {
          noCharactersYet: "No characters yet",
          characterGrid: "Character Grid",
          activeCharacters: "Active Characters",
        },
      },
    },
  } as Dictionary;

  const mockCharacters: CharacterResponseDto[] = [
    {
      id: "char-1",
      name: "Alice",
      imageUrl: "/images/alice.jpg",
    } as CharacterResponseDto,
    {
      id: "char-2",
      name: "Bob",
      imageUrl: "/images/bob.jpg",
    } as CharacterResponseDto,
    {
      id: "char-3",
      name: "Charlie",
      imageUrl: "/images/charlie.jpg",
    } as CharacterResponseDto,
  ];

  const mockOnFlipCharacter = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("shows empty state when no characters", () => {
      render(
        <CharacterGrid
          characters={[]}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      expect(screen.getByText("No characters yet")).toBeInTheDocument();
    });

    it("renders character grid with characters", () => {
      render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      expect(screen.getByText("Character Grid")).toBeInTheDocument();
      expect(screen.getByText("Active Characters (3)")).toBeInTheDocument();
    });

    it("renders all character cards", () => {
      render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      expect(screen.getByText("Alice")).toBeInTheDocument();
      expect(screen.getByText("Bob")).toBeInTheDocument();
      expect(screen.getByText("Charlie")).toBeInTheDocument();
    });

    it("renders character images", () => {
      const { container } = render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      const images = container.querySelectorAll("img");

      expect(images.length).toBe(3);
      expect(images[0]).toHaveAttribute("alt", "Alice");
      expect(images[1]).toHaveAttribute("alt", "Bob");
      expect(images[2]).toHaveAttribute("alt", "Charlie");
    });
  });

  describe("character states", () => {
    it("marks eliminated characters with disabled state", () => {
      const eliminatedIds = new Set(["char-1"]);

      render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={eliminatedIds}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      const buttons = screen.getAllByRole("button");

      // First button (Alice) should be disabled
      expect(buttons[0]).toBeDisabled();
      // Others should not be disabled
      expect(buttons[1]).not.toBeDisabled();
      expect(buttons[2]).not.toBeDisabled();
    });

    it("applies correct styles to eliminated characters", () => {
      const eliminatedIds = new Set(["char-2"]);

      const { container } = render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={eliminatedIds}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      const buttons = screen.getAllByRole("button");

      expect(buttons[1]).toHaveClass("cursor-not-allowed");
    });

    it("applies correct styles to flipped characters", () => {
      const flippedIds = new Set(["char-1"]);

      const { container } = render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={flippedIds}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      const buttons = screen.getAllByRole("button");

      expect(buttons[0]).toHaveClass("scale-95");
    });

    it("renders overlays for flipped and eliminated characters", () => {
      const eliminatedIds = new Set(["char-1"]);
      const flippedIds = new Set(["char-2"]);

      const { container } = render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={eliminatedIds}
          flippedIds={flippedIds}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      // Check that overlay divs are present
      const overlays = container.querySelectorAll(".absolute.inset-0");

      // Should have overlays for both eliminated and flipped characters
      expect(overlays.length).toBe(2);
    });
  });

  describe("interaction", () => {
    it("calls onFlipCharacter when clicking a character", async () => {
      const user = userEvent.setup();

      render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      const buttons = screen.getAllByRole("button");

      await user.click(buttons[0]);

      expect(mockOnFlipCharacter).toHaveBeenCalledWith("char-1");
    });

    it("calls onFlipCharacter with correct character id", async () => {
      const user = userEvent.setup();

      render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      const buttons = screen.getAllByRole("button");

      await user.click(buttons[1]);

      expect(mockOnFlipCharacter).toHaveBeenCalledWith("char-2");
    });

    it("does not call onFlipCharacter when clicking eliminated character", async () => {
      const user = userEvent.setup();
      const eliminatedIds = new Set(["char-1"]);

      render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={eliminatedIds}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      const buttons = screen.getAllByRole("button");

      // Try to click the eliminated character button (disabled)
      await user.click(buttons[0]);

      expect(mockOnFlipCharacter).not.toHaveBeenCalled();
    });

    it("allows clicking flipped but not eliminated characters", async () => {
      const user = userEvent.setup();
      const flippedIds = new Set(["char-1"]);

      render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={flippedIds}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      const buttons = screen.getAllByRole("button");

      await user.click(buttons[0]);

      // Should still call handler for flipped characters (can flip back)
      expect(mockOnFlipCharacter).toHaveBeenCalledWith("char-1");
    });
  });

  describe("character count", () => {
    it("displays correct character count", () => {
      render(
        <CharacterGrid
          characters={mockCharacters}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      expect(screen.getByText("Active Characters (3)")).toBeInTheDocument();
    });

    it("displays correct count with different number of characters", () => {
      const singleCharacter = [mockCharacters[0]];

      render(
        <CharacterGrid
          characters={singleCharacter}
          dict={mockDict}
          eliminatedIds={new Set()}
          flippedIds={new Set()}
          onFlipCharacter={mockOnFlipCharacter}
        />,
      );

      expect(screen.getByText("Active Characters (1)")).toBeInTheDocument();
    });
  });
});
