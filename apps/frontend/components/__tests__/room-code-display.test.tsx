import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { RoomCodeDisplay } from "../room-code-display";

// Mock the HeroUI toast
jest.mock("@heroui/toast", () => ({
  addToast: jest.fn(),
}));

// Mock the clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(),
  },
});

describe("RoomCodeDisplay", () => {
  const defaultProps = {
    roomCode: "ABC123",
    label: "Room Code:",
    copySuccessMessage: "Code copied!",
    copyErrorMessage: "Failed to copy",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the room code", () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    expect(screen.getByText("ABC123")).toBeInTheDocument();
  });

  it("renders the label when showLabel is true", () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    expect(screen.getByText("Room Code:")).toBeInTheDocument();
  });

  it("does not render the label when showLabel is false", () => {
    render(<RoomCodeDisplay {...defaultProps} showLabel={false} />);
    expect(screen.queryByText("Room Code:")).not.toBeInTheDocument();
  });

  it("renders as a button", () => {
    render(<RoomCodeDisplay {...defaultProps} />);
    const button = screen.getByRole("button");

    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent("ABC123");
  });

  it("copies room code to clipboard when clicked", async () => {
    const user = userEvent.setup();
    const mockWriteText = jest.fn().mockResolvedValue(undefined);

    Object.assign(navigator.clipboard, { writeText: mockWriteText });

    render(<RoomCodeDisplay {...defaultProps} />);

    const button = screen.getByRole("button");

    await user.click(button);

    expect(mockWriteText).toHaveBeenCalledWith("ABC123");
  });

  it("applies correct size classes for small size", () => {
    const { container } = render(
      <RoomCodeDisplay {...defaultProps} size="sm" />,
    );
    const label = container.querySelector(".text-xs");

    expect(label).toBeInTheDocument();
  });

  it("applies correct size classes for medium size", () => {
    const { container } = render(
      <RoomCodeDisplay {...defaultProps} size="md" />,
    );
    const label = container.querySelector(".text-small");

    expect(label).toBeInTheDocument();
  });

  it("applies correct size classes for large size", () => {
    const { container } = render(
      <RoomCodeDisplay {...defaultProps} size="lg" />,
    );
    const label = container.querySelector(".text-base");

    expect(label).toBeInTheDocument();
  });
});
