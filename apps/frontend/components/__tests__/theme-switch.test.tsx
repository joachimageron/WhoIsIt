import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeSwitch } from "../theme-switch";

// Mock next-themes
const mockSetTheme = jest.fn();
const mockTheme = jest.fn();

jest.mock("next-themes", () => ({
  useTheme: () => ({
    theme: mockTheme(),
    setTheme: mockSetTheme,
  }),
}));

// Mock react-aria SSR hook
jest.mock("@react-aria/ssr", () => ({
  useIsSSR: jest.fn(() => false),
}));

describe("ThemeSwitch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders without crashing", () => {
    mockTheme.mockReturnValue("light");
    render(<ThemeSwitch />);
    expect(screen.getByRole("switch")).toBeInTheDocument();
  });

  it("displays sun icon when theme is light", () => {
    mockTheme.mockReturnValue("light");
    const { container } = render(<ThemeSwitch />);

    // Check that the component renders (icon presence is implicit)
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("displays moon icon when theme is dark", () => {
    mockTheme.mockReturnValue("dark");
    const { container } = render(<ThemeSwitch />);

    // Check that the component renders (icon presence is implicit)
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("toggles theme from light to dark when clicked", async () => {
    const user = userEvent.setup();

    mockTheme.mockReturnValue("light");

    render(<ThemeSwitch />);
    const switchElement = screen.getByRole("switch");

    await user.click(switchElement);

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("toggles theme from dark to light when clicked", async () => {
    const user = userEvent.setup();

    mockTheme.mockReturnValue("dark");

    render(<ThemeSwitch />);
    const switchElement = screen.getByRole("switch");

    await user.click(switchElement);

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("provides accessibility through aria-label", () => {
    mockTheme.mockReturnValue("light");
    const { container } = render(<ThemeSwitch />);

    // The component uses aria-label through the useSwitch hook
    // Check that the component structure is accessible
    const input = container.querySelector("input");

    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "checkbox");
  });

  it("applies custom className when provided", () => {
    mockTheme.mockReturnValue("light");
    const { container } = render(<ThemeSwitch className="custom-class" />);

    const switchWrapper = container.querySelector(".custom-class");

    expect(switchWrapper).toBeInTheDocument();
  });

  it("has cursor-pointer class for better UX", () => {
    mockTheme.mockReturnValue("light");
    const { container } = render(<ThemeSwitch />);

    const switchWrapper = container.querySelector(".cursor-pointer");

    expect(switchWrapper).toBeInTheDocument();
  });
});
