import { render, screen } from "@testing-library/react";

import { LanguageSwitcher } from "../language-switcher";

// Mock Next.js navigation hooks
const mockPush = jest.fn();
const mockPathname = "/en/test";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  usePathname: () => mockPathname,
}));

describe("LanguageSwitcher", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
});
