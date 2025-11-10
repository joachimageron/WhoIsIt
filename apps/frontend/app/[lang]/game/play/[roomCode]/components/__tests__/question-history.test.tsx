import type { QuestionResponse, AnswerResponse } from "@whois-it/contracts";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { QuestionHistory } from "../question-history";

// Mock dependencies
jest.mock("@iconify/react", () => ({
  Icon: ({ icon }: any) => <span data-testid="icon">{icon}</span>,
}));

describe("QuestionHistory", () => {
  const mockDict = {
    game: {
      play: {
        questions: {
          history: "Question History",
          noQuestionsYet: "No questions yet",
        },
        answers: {
          answerButton: "Answer",
        },
      },
    },
  };

  const mockQuestions: QuestionResponse[] = [
    {
      id: "q1",
      questionText: "Does the character wear glasses?",
      askedByPlayerId: "player-1",
      askedByPlayerUsername: "Alice",
      targetPlayerId: "player-2",
      targetPlayerUsername: "Bob",
      roundId: "round-1",
      createdAt: new Date().toISOString(),
    },
    {
      id: "q2",
      questionText: "Is the character bald?",
      askedByPlayerId: "player-2",
      askedByPlayerUsername: "Bob",
      targetPlayerId: null,
      targetPlayerUsername: null,
      roundId: "round-1",
      createdAt: new Date().toISOString(),
    },
  ];

  const mockAnswers = new Map<string, AnswerResponse>([
    [
      "q1",
      {
        id: "a1",
        questionId: "q1",
        answerValue: "yes",
        answerText: null,
        answeredByPlayerId: "player-2",
        answeredByPlayerUsername: "Bob",
        createdAt: new Date().toISOString(),
      },
    ],
  ]);

  const defaultProps = {
    dict: mockDict as any,
    questions: mockQuestions,
    answers: mockAnswers,
    currentPlayerId: "player-1",
    onAnswerQuestion: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders header with correct title", () => {
    render(<QuestionHistory {...defaultProps} />);
    expect(screen.getByText("Question History")).toBeInTheDocument();
  });

  it("shows message when no questions exist", () => {
    render(<QuestionHistory {...defaultProps} questions={[]} />);
    expect(screen.getByText("No questions yet")).toBeInTheDocument();
  });

  it("displays all questions", () => {
    render(<QuestionHistory {...defaultProps} />);

    expect(screen.getByText("Does the character wear glasses?")).toBeInTheDocument();
    expect(screen.getByText("Is the character bald?")).toBeInTheDocument();
  });

  it("displays questions in reverse order (newest first)", () => {
    render(<QuestionHistory {...defaultProps} />);

    const questions = screen.getAllByText(/character/i);

    // Second question should appear first
    expect(questions[0]).toHaveTextContent("Is the character bald?");
    expect(questions[1]).toHaveTextContent("Does the character wear glasses?");
  });

  it("displays username of who asked the question", () => {
    render(<QuestionHistory {...defaultProps} />);

    const aliceNames = screen.getAllByText("Alice");
    const bobNames = screen.getAllByText("Bob");

    expect(aliceNames.length).toBeGreaterThan(0);
    expect(bobNames.length).toBeGreaterThan(0);
  });

  it("shows target player when question is directed at specific player", () => {
    render(<QuestionHistory {...defaultProps} />);

    // First question has target player Bob
    expect(screen.getByText("Does the character wear glasses?")).toBeInTheDocument();
  });

  it("displays answer when question has been answered", () => {
    render(<QuestionHistory {...defaultProps} />);

    expect(screen.getByText("YES")).toBeInTheDocument();
  });

  it("displays answer text when provided", () => {
    const answersWithText = new Map<string, AnswerResponse>([
      [
        "q1",
        {
          id: "a1",
          questionId: "q1",
          answerValue: "yes",
          answerText: "Thick black frames",
          answeredByPlayerId: "player-2",
          answeredByPlayerUsername: "Bob",
          createdAt: new Date().toISOString(),
        },
      ],
    ]);

    render(<QuestionHistory {...defaultProps} answers={answersWithText} />);

    expect(screen.getByText("Thick black frames")).toBeInTheDocument();
  });

  it("shows answer button for unanswered targeted questions to current player", () => {
    const unansweredQuestion: QuestionResponse = {
      id: "q3",
      questionText: "Has brown hair?",
      askedByPlayerId: "player-2",
      askedByPlayerUsername: "Bob",
      targetPlayerId: "player-1",
      targetPlayerUsername: "Alice",
      roundId: "round-1",
      createdAt: new Date().toISOString(),
    };

    render(
      <QuestionHistory
        {...defaultProps}
        questions={[unansweredQuestion]}
        answers={new Map()}
      />,
    );

    expect(screen.getByText("Answer")).toBeInTheDocument();
  });

  it("shows answer button for unanswered general questions not asked by current player", () => {
    const generalQuestion: QuestionResponse = {
      id: "q4",
      questionText: "Has blonde hair?",
      askedByPlayerId: "player-2",
      askedByPlayerUsername: "Bob",
      targetPlayerId: null,
      targetPlayerUsername: null,
      roundId: "round-1",
      createdAt: new Date().toISOString(),
    };

    render(
      <QuestionHistory
        {...defaultProps}
        questions={[generalQuestion]}
        answers={new Map()}
      />,
    );

    expect(screen.getByText("Answer")).toBeInTheDocument();
  });

  it("does not show answer button for questions asked by current player", () => {
    const myQuestion: QuestionResponse = {
      id: "q5",
      questionText: "Has red hair?",
      askedByPlayerId: "player-1",
      askedByPlayerUsername: "Alice",
      targetPlayerId: null,
      targetPlayerUsername: null,
      roundId: "round-1",
      createdAt: new Date().toISOString(),
    };

    render(
      <QuestionHistory
        {...defaultProps}
        questions={[myQuestion]}
        answers={new Map()}
      />,
    );

    expect(screen.queryByText("Answer")).not.toBeInTheDocument();
  });

  it("does not show answer button when currentPlayerId is null", () => {
    const unansweredQuestion: QuestionResponse = {
      id: "q6",
      questionText: "Wears a hat?",
      askedByPlayerId: "player-2",
      askedByPlayerUsername: "Bob",
      targetPlayerId: null,
      targetPlayerUsername: null,
      roundId: "round-1",
      createdAt: new Date().toISOString(),
    };

    render(
      <QuestionHistory
        {...defaultProps}
        currentPlayerId={null}
        questions={[unansweredQuestion]}
        answers={new Map()}
      />,
    );

    expect(screen.queryByText("Answer")).not.toBeInTheDocument();
  });

  it("calls onAnswerQuestion when answer button is clicked", async () => {
    const user = userEvent.setup();
    const mockOnAnswer = jest.fn();

    const unansweredQuestion: QuestionResponse = {
      id: "q7",
      questionText: "Has a beard?",
      askedByPlayerId: "player-2",
      askedByPlayerUsername: "Bob",
      targetPlayerId: "player-1",
      targetPlayerUsername: "Alice",
      roundId: "round-1",
      createdAt: new Date().toISOString(),
    };

    render(
      <QuestionHistory
        {...defaultProps}
        questions={[unansweredQuestion]}
        answers={new Map()}
        onAnswerQuestion={mockOnAnswer}
      />,
    );

    const answerButton = screen.getByText("Answer");

    await user.click(answerButton);

    expect(mockOnAnswer).toHaveBeenCalledWith(unansweredQuestion);
  });

  it("handles questions without target player correctly", () => {
    const generalQuestion: QuestionResponse = {
      id: "q8",
      questionText: "Is a male character?",
      askedByPlayerId: "player-1",
      askedByPlayerUsername: "Alice",
      targetPlayerId: null,
      targetPlayerUsername: null,
      roundId: "round-1",
      createdAt: new Date().toISOString(),
    };

    render(
      <QuestionHistory
        {...defaultProps}
        questions={[generalQuestion]}
        answers={new Map()}
      />,
    );

    expect(screen.getByText("Is a male character?")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("displays different answer colors for different values", () => {
    const questionsWithAnswers: QuestionResponse[] = [
      {
        id: "q9",
        questionText: "Question 1",
        askedByPlayerId: "player-1",
        askedByPlayerUsername: "Alice",
        targetPlayerId: null,
        targetPlayerUsername: null,
        roundId: "round-1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "q10",
        questionText: "Question 2",
        askedByPlayerId: "player-1",
        askedByPlayerUsername: "Alice",
        targetPlayerId: null,
        targetPlayerUsername: null,
        roundId: "round-1",
        createdAt: new Date().toISOString(),
      },
      {
        id: "q11",
        questionText: "Question 3",
        askedByPlayerId: "player-1",
        askedByPlayerUsername: "Alice",
        targetPlayerId: null,
        targetPlayerUsername: null,
        roundId: "round-1",
        createdAt: new Date().toISOString(),
      },
    ];

    const answersMap = new Map<string, AnswerResponse>([
      [
        "q9",
        {
          id: "a9",
          questionId: "q9",
          answerValue: "yes",
          answerText: null,
          answeredByPlayerId: "player-2",
          answeredByPlayerUsername: "Bob",
          createdAt: new Date().toISOString(),
        },
      ],
      [
        "q10",
        {
          id: "a10",
          questionId: "q10",
          answerValue: "no",
          answerText: null,
          answeredByPlayerId: "player-2",
          answeredByPlayerUsername: "Bob",
          createdAt: new Date().toISOString(),
        },
      ],
      [
        "q11",
        {
          id: "a11",
          questionId: "q11",
          answerValue: "unsure",
          answerText: null,
          answeredByPlayerId: "player-2",
          answeredByPlayerUsername: "Bob",
          createdAt: new Date().toISOString(),
        },
      ],
    ]);

    render(
      <QuestionHistory
        {...defaultProps}
        questions={questionsWithAnswers}
        answers={answersMap}
      />,
    );

    expect(screen.getByText("YES")).toBeInTheDocument();
    expect(screen.getByText("NO")).toBeInTheDocument();
    expect(screen.getByText("UNSURE")).toBeInTheDocument();
  });

  it("does not show answer button when onAnswerQuestion is not provided", () => {
    const unansweredQuestion: QuestionResponse = {
      id: "q12",
      questionText: "Has green eyes?",
      askedByPlayerId: "player-2",
      askedByPlayerUsername: "Bob",
      targetPlayerId: "player-1",
      targetPlayerUsername: "Alice",
      roundId: "round-1",
      createdAt: new Date().toISOString(),
    };

    render(
      <QuestionHistory
        {...defaultProps}
        questions={[unansweredQuestion]}
        answers={new Map()}
        onAnswerQuestion={undefined}
      />,
    );

    expect(screen.queryByText("Answer")).not.toBeInTheDocument();
  });
});
