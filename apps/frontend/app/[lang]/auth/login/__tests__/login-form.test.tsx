import type { Dictionary } from "@/dictionaries";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import * as authApi from "@/lib/auth-api";
import { useAuthStore } from "@/store/auth-store";

import { LoginForm } from "../login-form";

// Mock auth API
jest.mock("@/lib/auth-api");
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

// Mock auth store
jest.mock("@/store/auth-store");
const mockUseAuthStore = useAuthStore as jest.MockedFunction<
  typeof useAuthStore
>;

// Mock toast
jest.mock("@heroui/toast", () => ({
  addToast: jest.fn(),
}));

// Mock next/navigation
const mockPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("LoginForm", () => {
  const mockDict: Dictionary = {
    auth: {
      login: {
        title: "Log In",
        emailOrUsername: "Email or Username",
        emailOrUsernamePlaceholder: "Enter your email or username",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        fillAllFields: "Please fill in all fields",
        invalidEmail: "Invalid email address",
        loginButton: "Log In",
        loginFailed: "Login failed",
        forgotPassword: "Forgot password?",
        noAccount: "Don't have an account? Sign up",
      },
    },
  } as Dictionary;

  const mockSetUser = jest.fn();
  const mockSetLoading = jest.fn();
  const mockSetError = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuthStore.mockReturnValue({
      setUser: mockSetUser,
      setLoading: mockSetLoading,
      setError: mockSetError,
      clearError: mockClearError,
      isLoading: false,
      error: null,
    } as any);
  });

  describe("rendering", () => {
    it("renders the form with all elements", () => {
      render(<LoginForm dict={mockDict} lang="en" />);

      expect(screen.getByLabelText("Email or Username")).toBeInTheDocument();
      expect(screen.getByLabelText("Password")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /log in/i }),
      ).toBeInTheDocument();
    });

    it("renders links with correct locale", () => {
      const { container } = render(<LoginForm dict={mockDict} lang="fr" />);

      const forgotPasswordLink = container.querySelector(
        'a[href="/fr/auth/forgot-password"]',
      );
      const registerLink = container.querySelector(
        'a[href="/fr/auth/register"]',
      );

      expect(forgotPasswordLink).toBeInTheDocument();
      expect(registerLink).toBeInTheDocument();
    });
  });

  describe("password visibility toggle", () => {
    it("toggles password visibility on icon click", async () => {
      const user = userEvent.setup();

      render(<LoginForm dict={mockDict} lang="en" />);

      const passwordInput = screen.getByLabelText("Password");
      const toggleButton = passwordInput.parentElement?.querySelector("button");

      expect(passwordInput).toHaveAttribute("type", "password");

      if (toggleButton) {
        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "text");

        await user.click(toggleButton);
        expect(passwordInput).toHaveAttribute("type", "password");
      }
    });
  });

  describe("form interaction", () => {
    it("allows typing in form fields", async () => {
      const user = userEvent.setup();

      render(<LoginForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email or Username");
      const passwordInput = screen.getByLabelText("Password");

      await user.type(emailInput, "testuser");
      await user.type(passwordInput, "password123");

      expect((emailInput as HTMLInputElement).value).toBe("testuser");
      expect((passwordInput as HTMLInputElement).value).toBe("password123");
    });

    it("calls login API with valid credentials", async () => {
      const user = userEvent.setup();

      mockAuthApi.login.mockResolvedValueOnce({
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      });

      render(<LoginForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email or Username");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await user.type(emailInput, "testuser");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthApi.login).toHaveBeenCalledWith({
          emailOrUsername: "testuser",
          password: "password123",
        });
      });
    });

    it("redirects to home on successful login", async () => {
      const user = userEvent.setup();
      const mockUser = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      mockAuthApi.login.mockResolvedValueOnce(mockUser);

      render(<LoginForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email or Username");
      const passwordInput = screen.getByLabelText("Password");
      const submitButton = screen.getByRole("button", { name: /log in/i });

      await user.type(emailInput, "testuser");
      await user.type(passwordInput, "password123");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSetUser).toHaveBeenCalledWith(mockUser);
        expect(mockPush).toHaveBeenCalledWith("/en");
      });
    });
  });
});
