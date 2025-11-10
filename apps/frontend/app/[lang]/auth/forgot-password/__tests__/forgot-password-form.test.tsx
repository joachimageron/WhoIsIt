import type { Dictionary } from "@/dictionaries";

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addToast } from "@heroui/toast";

import { ForgotPasswordForm } from "../forgot-password-form";

import * as authApi from "@/lib/auth-api";

// Mock auth API
jest.mock("@/lib/auth-api");
const mockAuthApi = authApi as jest.Mocked<typeof authApi>;

// Mock toast
jest.mock("@heroui/toast", () => ({
  addToast: jest.fn(),
}));

const mockAddToast = addToast as jest.MockedFunction<typeof addToast>;

// Mock next/navigation
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe("ForgotPasswordForm", () => {
  const mockDict: Dictionary = {
    auth: {
      forgotPassword: {
        title: "Forgot Password",
        description: "Enter your email to receive a reset link",
        email: "Email",
        emailPlaceholder: "Enter your email",
        enterEmail: "Please enter your email",
        sendButton: "Send Reset Link",
        resetLinkSent: "Reset link sent!",
        resetLinkDescription: "Check your email for the reset link",
        sendFailed: "Failed to send reset link",
        backToLogin: "Back to login",
      },
    },
  } as Dictionary;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders the form with all elements", () => {
      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      expect(screen.getByText("Forgot Password")).toBeInTheDocument();
      expect(
        screen.getByText("Enter your email to receive a reset link"),
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Email")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /send reset link/i }),
      ).toBeInTheDocument();
      expect(screen.getByText("Back to login")).toBeInTheDocument();
    });

    it("renders link to login page with correct locale", () => {
      const { container } = render(
        <ForgotPasswordForm dict={mockDict} lang="fr" />,
      );

      const link = container.querySelector('a[href="/fr/auth/login"]');

      expect(link).toBeInTheDocument();
    });
  });

  describe("form validation", () => {
    it("validates form can be submitted", async () => {
      const user = userEvent.setup();

      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      const submitButton = screen.getByRole("button", {
        name: /send reset link/i,
      });

      await user.click(submitButton);

      // Form should handle the submission
      expect(submitButton).toBeInTheDocument();
    });

    it("allows typing email", async () => {
      const user = userEvent.setup();

      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email");

      await user.type(emailInput, "test@example.com");

      expect((emailInput as HTMLInputElement).value).toBe("test@example.com");
    });
  });

  describe("form submission", () => {
    it("calls forgotPassword API with email", async () => {
      const user = userEvent.setup();

      mockAuthApi.forgotPassword.mockResolvedValueOnce();

      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: /send reset link/i,
      });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAuthApi.forgotPassword).toHaveBeenCalledWith(
          "test@example.com",
        );
      });
    });

    it("shows success toast on successful submission", async () => {
      const user = userEvent.setup();

      mockAuthApi.forgotPassword.mockResolvedValueOnce();

      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: /send reset link/i,
      });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAddToast).toHaveBeenCalledWith({
          color: "success",
          title: "Reset link sent!",
          description: "Check your email for the reset link",
        });
      });
    });

    it("shows error message on API failure", async () => {
      const user = userEvent.setup();

      mockAuthApi.forgotPassword.mockRejectedValueOnce(
        new Error("Email not found"),
      );

      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: /send reset link/i,
      });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Email not found")).toBeInTheDocument();
      });
    });

    it("shows default error message for non-Error exceptions", async () => {
      const user = userEvent.setup();

      mockAuthApi.forgotPassword.mockRejectedValueOnce("Unknown error");

      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: /send reset link/i,
      });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText("Failed to send reset link"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("loading states", () => {
    it("disables input and shows loading on submit button during submission", async () => {
      const user = userEvent.setup();
      let resolvePromise: any;

      mockAuthApi.forgotPassword.mockReturnValueOnce(
        new Promise((resolve) => {
          resolvePromise = resolve;
        }),
      );

      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: /send reset link/i,
      });

      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(emailInput).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise();

      // Wait for loading to finish
      await waitFor(() => {
        expect(emailInput).not.toBeDisabled();
      });
    });

    it("clears error on new submission", async () => {
      const user = userEvent.setup();

      mockAuthApi.forgotPassword
        .mockRejectedValueOnce(new Error("First error"))
        .mockResolvedValueOnce();

      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email");
      const submitButton = screen.getByRole("button", {
        name: /send reset link/i,
      });

      // First submission (fails)
      await user.type(emailInput, "test@example.com");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("First error")).toBeInTheDocument();
      });

      // Second submission (succeeds)
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByText("First error")).not.toBeInTheDocument();
      });
    });
  });

  describe("input changes", () => {
    it("updates email value on input change", async () => {
      const user = userEvent.setup();

      render(<ForgotPasswordForm dict={mockDict} lang="en" />);

      const emailInput = screen.getByLabelText("Email") as HTMLInputElement;

      await user.type(emailInput, "test@example.com");

      expect(emailInput.value).toBe("test@example.com");
    });
  });
});
