import { render, screen, waitFor } from "@testing-library/react";

import { TurnTimer } from "../turn-timer";

// Mock Icon component
jest.mock("@iconify/react", () => ({
  Icon: ({ icon, className }: any) => (
    <span className={className} data-testid="icon">
      {icon}
    </span>
  ),
}));

describe("TurnTimer", () => {
  const mockDict = {
    game: {
      play: {
        timer: "Time Remaining",
      },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("renders with initial time", () => {
    render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={30}
      />,
    );

    expect(screen.getByText("Time Remaining")).toBeInTheDocument();
    expect(screen.getByText("30s")).toBeInTheDocument();
  });

  it("does not render when turnTimerSeconds is null", () => {
    const { container } = render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={null}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("does not render when turnTimerSeconds is undefined", () => {
    const { container } = render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={undefined as any}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("counts down every second", async () => {
    render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={30}
      />,
    );

    expect(screen.getByText("30s")).toBeInTheDocument();

    // Advance by 1 second
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText("29s")).toBeInTheDocument();
    });

    // Advance by another second
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText("28s")).toBeInTheDocument();
    });
  });

  it("stops at 0 and does not go negative", async () => {
    render(
      <TurnTimer dict={mockDict as any} isMyTurn={true} turnTimerSeconds={2} />,
    );

    expect(screen.getByText("2s")).toBeInTheDocument();

    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText("1s")).toBeInTheDocument();
    });

    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText("0s")).toBeInTheDocument();
    });

    // Advance more - should stay at 0
    jest.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(screen.getByText("0s")).toBeInTheDocument();
    });
  });

  it("applies warning color when time is low (<=10s)", () => {
    const { container } = render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={10}
      />,
    );

    const icon = container.querySelector('[data-testid="icon"]');

    expect(icon).toHaveClass("text-warning");
  });

  it("applies danger color when time is very low (<=5s)", () => {
    const { container } = render(
      <TurnTimer dict={mockDict as any} isMyTurn={true} turnTimerSeconds={5} />,
    );

    const icon = container.querySelector('[data-testid="icon"]');

    expect(icon).toHaveClass("text-danger");
  });

  it("applies default color when time is above 10s", () => {
    const { container } = render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={30}
      />,
    );

    const icon = container.querySelector('[data-testid="icon"]');

    expect(icon).toHaveClass("text-default-500");
  });

  it("resets timer when turnTimerSeconds changes", async () => {
    const { rerender } = render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={30}
      />,
    );

    expect(screen.getByText("30s")).toBeInTheDocument();

    // Advance timer
    jest.advanceTimersByTime(5000);
    await waitFor(() => {
      expect(screen.getByText("25s")).toBeInTheDocument();
    });

    // Change the turnTimerSeconds prop - should reset
    rerender(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={60}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("60s")).toBeInTheDocument();
    });
  });

  it("resets timer when isMyTurn changes", async () => {
    const { rerender } = render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={30}
      />,
    );

    expect(screen.getByText("30s")).toBeInTheDocument();

    // Advance timer
    jest.advanceTimersByTime(5000);
    await waitFor(() => {
      expect(screen.getByText("25s")).toBeInTheDocument();
    });

    // Change turn
    rerender(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={false}
        turnTimerSeconds={30}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("30s")).toBeInTheDocument();
    });
  });

  it("displays progress bar", () => {
    render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={30}
      />,
    );

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  it("calculates progress percentage correctly", () => {
    render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={60}
      />,
    );

    const progressBar = screen.getByRole("progressbar");

    // At start, should be at 100%
    expect(progressBar).toHaveAttribute("aria-valuenow", "100");
  });

  it("renders timer icon", () => {
    render(
      <TurnTimer
        dict={mockDict as any}
        isMyTurn={true}
        turnTimerSeconds={30}
      />,
    );

    const icon = screen.getByTestId("icon");

    expect(icon).toHaveTextContent("solar:clock-circle-bold");
  });
});
