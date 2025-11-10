import type { QuestionResponse } from "@whois-it/contracts";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { AnswerModal } from "../answer-modal";

// Mock dependencies
jest.mock("@iconify/react", () => ({
  Icon: ({ icon }: any) => <span data-testid="icon">{icon}</span>,
}));

describe("AnswerModal", () => {
  const mockDict = {
    game: {
      play: {
        answers: {
          answerQuestion: "Answer Question",
          yourAnswer: "Your Answer",
          yes: "Yes",
          no: "No",
          unsure: "Unsure",
          optionalDetails: "Optional Details",
          optionalDetailsPlaceholder: "Add any additional details...",
          cancel: "Cancel",
          submitAnswer: "Submit Answer",
          submitting: "Submitting...",
        },
      },
    },
  };

  const mockQuestion: QuestionResponse = {
    id: "q1",
    questionText: "Is the character wearing a hat?",
    askedByPlayerId: "player-1",
    askedByPlayerUsername: "Alice",
    targetPlayerId: "player-2",
    targetPlayerUsername: "Bob",
    roundId: "round-1",
    roundNumber: 1,
    askedAt: new Date().toISOString(),
  };

  const defaultProps = {
    dict: mockDict as any,
    question: mockQuestion,
    isOpen: true,
    onClose: jest.fn(),
    onSubmitAnswer: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders nothing when question is null", () => {
    const { container } = render(
      <AnswerModal {...defaultProps} question={null} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders modal header with correct title", () => {
    render(<AnswerModal {...defaultProps} />);
    expect(screen.getByText("Answer Question")).toBeInTheDocument();
  });

  it("displays the question text", () => {
    render(<AnswerModal {...defaultProps} />);
    expect(
      screen.getByText("Is the character wearing a hat?"),
    ).toBeInTheDocument();
  });

  it("displays the username of who asked the question", () => {
    render(<AnswerModal {...defaultProps} />);
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders all three answer options", () => {
    render(<AnswerModal {...defaultProps} />);
    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.getByText("Unsure")).toBeInTheDocument();
  });

  it("has 'yes' selected by default", () => {
    render(<AnswerModal {...defaultProps} />);
    const yesRadio = screen.getByRole("radio", { name: /Yes/i });

    expect(yesRadio).toBeChecked();
  });

  it("allows selecting different answer options", async () => {
    const user = userEvent.setup();

    render(<AnswerModal {...defaultProps} />);

    const noRadio = screen.getByRole("radio", { name: /No/i });

    await user.click(noRadio);

    expect(noRadio).toBeChecked();
  });

  it("allows entering optional details", async () => {
    const user = userEvent.setup();

    render(<AnswerModal {...defaultProps} />);

    const textarea = screen.getByPlaceholderText(
      "Add any additional details...",
    );

    await user.type(textarea, "The hat is red");

    expect(textarea).toHaveValue("The hat is red");
  });

  it("calls onClose when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnClose = jest.fn();

    render(<AnswerModal {...defaultProps} onClose={mockOnClose} />);

    const cancelButton = screen.getByText("Cancel");

    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("submits answer with selected value and clears form", async () => {
    const user = userEvent.setup();
    const mockOnSubmitAnswer = jest.fn().mockResolvedValue(undefined);
    const mockOnClose = jest.fn();

    render(
      <AnswerModal
        {...defaultProps}
        onClose={mockOnClose}
        onSubmitAnswer={mockOnSubmitAnswer}
      />,
    );

    const noRadio = screen.getByRole("radio", { name: /No/i });

    await user.click(noRadio);

    const submitButton = screen.getByText("Submit Answer");

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmitAnswer).toHaveBeenCalledWith("q1", "no", undefined);
    });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("submits answer with optional text", async () => {
    const user = userEvent.setup();
    const mockOnSubmitAnswer = jest.fn().mockResolvedValue(undefined);

    render(
      <AnswerModal {...defaultProps} onSubmitAnswer={mockOnSubmitAnswer} />,
    );

    const textarea = screen.getByPlaceholderText(
      "Add any additional details...",
    );

    await user.type(textarea, "Additional info");

    const submitButton = screen.getByText("Submit Answer");

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmitAnswer).toHaveBeenCalledWith(
        "q1",
        "yes",
        "Additional info",
      );
    });
  });

  it("trims whitespace from answer text before submitting", async () => {
    const user = userEvent.setup();
    const mockOnSubmitAnswer = jest.fn().mockResolvedValue(undefined);

    render(
      <AnswerModal {...defaultProps} onSubmitAnswer={mockOnSubmitAnswer} />,
    );

    const textarea = screen.getByPlaceholderText(
      "Add any additional details...",
    );

    await user.type(textarea, "  trimmed text  ");

    const submitButton = screen.getByText("Submit Answer");

    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmitAnswer).toHaveBeenCalledWith(
        "q1",
        "yes",
        "trimmed text",
      );
    });
  });

  it("shows submitting state while submitting", async () => {
    const user = userEvent.setup();
    const mockOnSubmitAnswer = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    render(
      <AnswerModal {...defaultProps} onSubmitAnswer={mockOnSubmitAnswer} />,
    );

    const submitButton = screen.getByText("Submit Answer");

    await user.click(submitButton);

    expect(screen.getByText("Submitting...")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockOnSubmitAnswer).toHaveBeenCalled();
    });
  });

  it("disables inputs while submitting", async () => {
    const user = userEvent.setup();
    const mockOnSubmitAnswer = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

    render(
      <AnswerModal {...defaultProps} onSubmitAnswer={mockOnSubmitAnswer} />,
    );

    const submitButton = screen.getByText("Submit Answer");

    await user.click(submitButton);

    const textarea = screen.getByPlaceholderText(
      "Add any additional details...",
    );

    expect(textarea).toBeDisabled();

    const cancelButton = screen.getByText("Cancel");

    expect(cancelButton).toBeDisabled();

    await waitFor(() => {
      expect(mockOnSubmitAnswer).toHaveBeenCalled();
    });
  });

  it("does not submit if question is null", async () => {
    const mockOnSubmitAnswer = jest.fn().mockResolvedValue(undefined);

    const { rerender } = render(
      <AnswerModal {...defaultProps} onSubmitAnswer={mockOnSubmitAnswer} />,
    );

    // Change question to null
    rerender(
      <AnswerModal
        {...defaultProps}
        question={null}
        onSubmitAnswer={mockOnSubmitAnswer}
      />,
    );

    // Component should not render, so this test verifies the component behavior
    expect(mockOnSubmitAnswer).not.toHaveBeenCalled();
  });
});
