import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Counter } from "../counter";

describe("Counter", () => {
  it("renders with initial count of 0", () => {
    render(<Counter />);
    expect(screen.getByRole("button")).toHaveTextContent("Count is 0");
  });

  it("increments count when button is clicked", async () => {
    const user = userEvent.setup();

    render(<Counter />);

    const button = screen.getByRole("button");

    expect(button).toHaveTextContent("Count is 0");

    await user.click(button);
    expect(button).toHaveTextContent("Count is 1");

    await user.click(button);
    expect(button).toHaveTextContent("Count is 2");
  });
});
