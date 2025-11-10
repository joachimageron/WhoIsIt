import { render, screen, fireEvent } from "@testing-library/react";

import { LanguageSwitcher } from "../language-switcher";

// Mock Next.js navigation hooks
const mockPush = jest.fn();
let mockPathname = "/en/test";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = "/en/test";
  });

  it("renders with current language selected", () => {
    render(<LanguageSwitcher currentLang="en" />);

    // Check that the select button is rendered
    const selectButton = screen.getByRole("button");

    expect(selectButton).toBeInTheDocument();
  });

  it("displays the current language value", () => {
    const { container } = render(<LanguageSwitcher currentLang="fr" />);

    // Check that fr is displayed in the value span (not the hidden select option)
    const valueSpan = container.querySelector('[data-slot="value"]');

    expect(valueSpan).toHaveTextContent("fr");
  });

  it("renders as a clickable button with proper attributes", async () => {
    render(<LanguageSwitcher currentLang="en" />);

    const selectButton = screen.getByRole("button");

    expect(selectButton).toBeInTheDocument();
    expect(selectButton).toHaveAttribute("type", "button");
    expect(selectButton).toHaveAttribute("aria-label", "Select Language");
  });

  it("handles locale switching when valid event is provided", () => {
    const { container } = render(<LanguageSwitcher currentLang="en" />);

    // Find the hidden select element
    const select = container.querySelector("select");

    expect(select).toBeInTheDocument();

    if (select) {
      // Simulate changing the select value
      fireEvent.change(select, { target: { value: "fr" } });

      // Verify router.push was called with updated path
      expect(mockPush).toHaveBeenCalledWith("/fr/test");
    }
  });

  it("does not navigate when pathname is not available", () => {
    mockPathname = "" as any;

    const { container } = render(<LanguageSwitcher currentLang="en" />);

    const select = container.querySelector("select");

    if (select) {
      fireEvent.change(select, { target: { value: "fr" } });

      // Should not call push when pathname is empty
      expect(mockPush).not.toHaveBeenCalled();
    }
  });

  it("handles event without valid event object", () => {
    const { container } = render(<LanguageSwitcher currentLang="en" />);

    const select = container.querySelector("select");

    if (select) {
      // Simulate an event that's not an object (edge case)
      const invalidHandler = select.onchange as any;

      if (invalidHandler) {
        // Call with null - this would be filtered by the check
        invalidHandler.call(select, null);
        expect(mockPush).not.toHaveBeenCalled();
      }
    }
  });

  it("correctly replaces language segment in path", () => {
    mockPathname = "/fr/game/lobby/TEST123";

    const { container } = render(<LanguageSwitcher currentLang="fr" />);

    const select = container.querySelector("select");

    if (select) {
      fireEvent.change(select, { target: { value: "en" } });

      // Should replace fr with en
      expect(mockPush).toHaveBeenCalledWith("/en/game/lobby/TEST123");
    }
  });

  it("renders locale options including current locale", () => {
    const { container } = render(<LanguageSwitcher currentLang="en" />);

    // Find the hidden select element and its options
    const select = container.querySelector("select");

    expect(select).toBeInTheDocument();

    if (select) {
      const options = select.querySelectorAll("option");

      // HeroUI may add extra options (placeholder, etc)
      expect(options.length).toBeGreaterThanOrEqual(2);

      // Check that both locales are present
      const values = Array.from(options).map((opt) => opt.value);

      expect(values).toContain("en");
      expect(values).toContain("fr");
    }
  });
});
