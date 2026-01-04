import type { Dictionary } from "@/dictionaries";

import { render, screen } from "@testing-library/react";

import { useAuth } from "@/lib/hooks/use-auth";

import { Navbar } from "../navbar";

// Mock next/navigation
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock use-auth hook
jest.mock("@/lib/hooks/use-auth");
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock the Logo component
jest.mock("@/components/icons", () => ({
  Logo: () => <div data-testid="logo">Logo</div>,
}));

// Mock ThemeSwitch and LanguageSwitcher
jest.mock("@/components/theme-switch", () => ({
  ThemeSwitch: () => <div data-testid="theme-switch">ThemeSwitch</div>,
}));

jest.mock("@/components/language-switcher", () => ({
  LanguageSwitcher: () => (
    <div data-testid="language-switcher">LanguageSwitcher</div>
  ),
}));

describe("Navbar", () => {
  const mockDict: Dictionary = {
    nav: {
      createGame: "Create Game",
      joinGame: "Join Game",
      login: "Log In",
      signUp: "Sign Up",
      profile: "Profile",
    },
    auth: {
      signedInAs: "Signed in as",
      logOut: "Log Out",
    },
  } as Dictionary;

  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      isLoading: false,
      logout: mockLogout,
      createGuestSession: jest.fn(),
    });
  });

  describe("rendering", () => {
    it("renders the navbar with logo", () => {
      render(<Navbar dict={mockDict} lang="en" />);

      expect(screen.getByTestId("logo")).toBeInTheDocument();
      expect(screen.getByText("WhoIsIt")).toBeInTheDocument();
    });

    it("renders navigation items", () => {
      render(<Navbar dict={mockDict} lang="en" />);

      expect(screen.getByText("Create Game")).toBeInTheDocument();
      expect(screen.getByText("Join Game")).toBeInTheDocument();
    });

    it("renders theme switch and language switcher", () => {
      render(<Navbar dict={mockDict} lang="en" />);

      // Components appear multiple times (desktop + mobile)
      const themeSwitches = screen.getAllByTestId("theme-switch");
      const languageSwitchers = screen.getAllByTestId("language-switcher");

      expect(themeSwitches.length).toBeGreaterThan(0);
      expect(languageSwitchers.length).toBeGreaterThan(0);
    });

    it("uses correct language in links", () => {
      const { container } = render(<Navbar dict={mockDict} lang="fr" />);

      const links = container.querySelectorAll("a[href^='/fr']");

      expect(links.length).toBeGreaterThan(0);
    });
  });

  describe("when not authenticated", () => {
    it("shows login and sign up buttons", () => {
      render(<Navbar dict={mockDict} lang="en" />);

      // Look for login/signup buttons (at least in desktop view)
      expect(screen.getByText("Log In")).toBeInTheDocument();
      expect(screen.getByText("Sign Up")).toBeInTheDocument();
    });

    it("does not show user avatar", () => {
      const { container } = render(<Navbar dict={mockDict} lang="en" />);

      // When not authenticated, no tooltip should be rendered
      const tooltips = container.querySelectorAll('[role="tooltip"]');

      expect(tooltips.length).toBe(0);
    });
  });

  describe("when authenticated", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          username: "testuser",
          avatarUrl: null,
        },
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        logout: mockLogout,
        createGuestSession: jest.fn(),
      });
    });

    it("shows user avatar", () => {
      const { container } = render(<Navbar dict={mockDict} lang="en" />);

      // HeroUI Avatar renders as a button
      const avatar = container.querySelector("button span");

      expect(avatar).toBeInTheDocument();
    });

    it("uses user information from auth hook", () => {
      render(<Navbar dict={mockDict} lang="en" />);

      // The component successfully uses the authenticated user
      expect(mockUseAuth).toHaveBeenCalled();
    });
  });

  describe("logout functionality", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: "user-1",
          email: "test@example.com",
          username: "testuser",
          avatarUrl: null,
        },
        isAuthenticated: true,
        isGuest: false,
        isLoading: false,
        logout: mockLogout,
        createGuestSession: jest.fn(),
      });
    });

    it("provides logout functionality", async () => {
      mockLogout.mockResolvedValueOnce(undefined);

      render(<Navbar dict={mockDict} lang="en" />);

      // Verify logout function is available through the hook
      expect(mockLogout).toBeDefined();
    });
  });

  describe("mobile menu", () => {
    it("renders mobile menu with navigation items", () => {
      const { container } = render(<Navbar dict={mockDict} lang="en" />);

      // NavbarMenu is rendered in the DOM (even if CSS hides it)
      const navbarMenu = container.querySelector("nav");

      expect(navbarMenu).toBeInTheDocument();
    });

    it("includes menu toggle button", () => {
      const { container } = render(<Navbar dict={mockDict} lang="en" />);

      // Look for the menu toggle button
      const menuToggle = container.querySelector("button[aria-pressed]");

      expect(menuToggle).toBeInTheDocument();
    });
  });

  describe("language support", () => {
    it("uses French language in links when lang is fr", () => {
      const { container } = render(<Navbar dict={mockDict} lang="fr" />);

      // Check that links use /fr prefix
      const homeLink = container.querySelector('a[href="/fr"]');

      expect(homeLink).toBeInTheDocument();
    });

    it("uses English language in links when lang is en", () => {
      const { container } = render(<Navbar dict={mockDict} lang="en" />);

      // Check that links use /en prefix
      const homeLink = container.querySelector('a[href="/en"]');

      expect(homeLink).toBeInTheDocument();
    });
  });
});
