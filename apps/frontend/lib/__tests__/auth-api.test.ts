import type {
  RegisterData,
  LoginData,
  User,
  VerifyEmailData,
  UpdateProfileData,
  ChangePasswordData,
} from "../auth-api";

import * as authApi from "../auth-api";

// Mock fetch
global.fetch = jest.fn();

describe("auth-api", () => {
  const mockFetch = global.fetch as jest.MockedFunction<typeof fetch>;
  const API_URL = "http://localhost:4000";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("register", () => {
    const registerData: RegisterData = {
      email: "test@example.com",
      username: "testuser",
      password: "password123",
    };

    it("successfully registers a user", async () => {
      const mockUser: User = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response);

      const result = await authApi.register(registerData);

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerData),
      });
      expect(result).toEqual(mockUser);
    });

    it("throws error on failed registration", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Email already exists" }),
      } as Response);

      await expect(authApi.register(registerData)).rejects.toThrow(
        "Email already exists",
      );
    });

    it("throws default error when response has no message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(authApi.register(registerData)).rejects.toThrow(
        "Registration failed",
      );
    });

    it("handles json parse error gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as Response);

      await expect(authApi.register(registerData)).rejects.toThrow(
        "Registration failed",
      );
    });
  });

  describe("login", () => {
    const loginData: LoginData = {
      emailOrUsername: "testuser",
      password: "password123",
    };

    it("successfully logs in a user", async () => {
      const mockUser: User = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      } as Response);

      const result = await authApi.login(loginData);

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });
      expect(result).toEqual(mockUser);
    });

    it("throws error on failed login", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid credentials" }),
      } as Response);

      await expect(authApi.login(loginData)).rejects.toThrow(
        "Invalid credentials",
      );
    });

    it("throws default error when response has no message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(authApi.login(loginData)).rejects.toThrow("Login failed");
    });
  });

  describe("getProfile", () => {
    it("successfully fetches user profile", async () => {
      const mockUser: User = {
        id: "user-1",
        email: "test@example.com",
        username: "testuser",
        avatarUrl: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await authApi.getProfile();

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/profile`, {
        credentials: "include",
      });
      expect(result).toEqual(mockUser);
    });

    it("throws error when profile fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(authApi.getProfile()).rejects.toThrow(
        "Failed to fetch profile",
      );
    });
  });

  describe("logout", () => {
    it("successfully logs out", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await authApi.logout();

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    });

    it("throws error when logout fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
      } as Response);

      await expect(authApi.logout()).rejects.toThrow("Logout failed");
    });
  });

  describe("resendVerificationEmail", () => {
    it("successfully resends verification email", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await authApi.resendVerificationEmail("test@example.com");

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/auth/resend-verification`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );
    });

    it("throws error when resend fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Email not found" }),
      } as Response);

      await expect(
        authApi.resendVerificationEmail("test@example.com"),
      ).rejects.toThrow("Email not found");
    });

    it("handles json parse error gracefully", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      } as Response);

      await expect(
        authApi.resendVerificationEmail("test@example.com"),
      ).rejects.toThrow("Failed to resend verification email");
    });
  });

  describe("verifyEmail", () => {
    const verifyData: VerifyEmailData = {
      token: "verification-token",
    };

    it("successfully verifies email", async () => {
      const mockResponse = { message: "Email verified successfully" };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await authApi.verifyEmail(verifyData);

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/verify-email`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(verifyData),
      });
      expect(result).toEqual(mockResponse);
    });

    it("throws error when verification fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid token" }),
      } as Response);

      await expect(authApi.verifyEmail(verifyData)).rejects.toThrow(
        "Invalid token",
      );
    });

    it("throws default error when response has no message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(authApi.verifyEmail(verifyData)).rejects.toThrow(
        "Email verification failed",
      );
    });
  });

  describe("forgotPassword", () => {
    it("successfully sends password reset email", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await authApi.forgotPassword("test@example.com");

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/auth/forgot-password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email: "test@example.com" }),
        },
      );
    });

    it("throws error when request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Email not found" }),
      } as Response);

      await expect(authApi.forgotPassword("test@example.com")).rejects.toThrow(
        "Email not found",
      );
    });
  });

  describe("resetPassword", () => {
    it("successfully resets password", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await authApi.resetPassword("reset-token", "newPassword123");

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: "reset-token",
          password: "newPassword123",
        }),
      });
    });

    it("throws error when reset fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Invalid or expired token" }),
      } as Response);

      await expect(
        authApi.resetPassword("reset-token", "newPassword123"),
      ).rejects.toThrow("Invalid or expired token");
    });
  });

  describe("updateProfile", () => {
    const updateData: UpdateProfileData = {
      username: "newusername",
      email: "newemail@example.com",
    };

    it("successfully updates profile", async () => {
      const mockUser: User = {
        id: "user-1",
        email: "newemail@example.com",
        username: "newusername",
        avatarUrl: null,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser,
      } as Response);

      const result = await authApi.updateProfile(updateData);

      expect(mockFetch).toHaveBeenCalledWith(`${API_URL}/auth/profile`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      expect(result).toEqual(mockUser);
    });

    it("throws error when update fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Username already taken" }),
      } as Response);

      await expect(authApi.updateProfile(updateData)).rejects.toThrow(
        "Username already taken",
      );
    });
  });

  describe("changePassword", () => {
    const changeData: ChangePasswordData = {
      currentPassword: "oldPassword123",
      newPassword: "newPassword123",
    };

    it("successfully changes password", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
      } as Response);

      await authApi.changePassword(changeData);

      expect(mockFetch).toHaveBeenCalledWith(
        `${API_URL}/auth/change-password`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(changeData),
        },
      );
    });

    it("throws error when change fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: "Current password is incorrect" }),
      } as Response);

      await expect(authApi.changePassword(changeData)).rejects.toThrow(
        "Current password is incorrect",
      );
    });

    it("throws default error when response has no message", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      await expect(authApi.changePassword(changeData)).rejects.toThrow(
        "Failed to change password",
      );
    });
  });
});
