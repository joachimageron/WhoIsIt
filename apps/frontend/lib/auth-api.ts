const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type RegisterData = {
  email: string;
  username: string;
  password: string;
};

export type LoginData = {
  emailOrUsername: string;
  password: string;
};

export type User = {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  isGuest?: boolean;
};

export type AuthResponse = {
  user: User;
};

export type VerifyEmailData = {
  token: string;
};

export type VerifyEmailResponse = {
  message: string;
};

export type UpdateProfileData = {
  username?: string;
  email?: string;
  avatarUrl?: string;
};

export type ChangePasswordData = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Register a new user
 */
export const register = async (data: RegisterData): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Registration failed" }));

    throw new Error(error.message || "Registration failed");
  }

  const { user }: AuthResponse = await response.json();

  return user;
};

/**
 * Login an existing user
 */
export const login = async (data: LoginData): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Login failed" }));

    throw new Error(error.message || "Login failed");
  }

  const { user }: AuthResponse = await response.json();

  return user;
};

/**
 * Get the current user's profile
 */
export const getProfile = async (): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  const user: User = await response.json();

  return user;
};

/**
 * Logout the current user
 */
export const logout = async (): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Logout failed");
  }
};

/**
 * Resend verification email to the user
 */
export const resendVerificationEmail = async (email: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to resend verification email" }));

    throw new Error(error.message || "Failed to resend verification email");
  }
};

/**
 * Verify user's email with the provided token
 */
export const verifyEmail = async (
  data: VerifyEmailData,
): Promise<VerifyEmailResponse> => {
  const response = await fetch(`${API_URL}/auth/verify-email`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Email verification failed" }));

    throw new Error(error.message || "Email verification failed");
  }

  const result: VerifyEmailResponse = await response.json();

  return result;
};

/**
 * Request a password reset email
 */
export const forgotPassword = async (email: string): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to request password reset" }));

    throw new Error(error.message || "Failed to request password reset");
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (
  token: string,
  password: string,
): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token, password }),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to reset password" }));

    throw new Error(error.message || "Failed to reset password");
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (data: UpdateProfileData): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/profile`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to update profile" }));

    throw new Error(error.message || "Failed to update profile");
  }

  const user: User = await response.json();

  return user;
};

/**
 * Change user password
 */
export const changePassword = async (
  data: ChangePasswordData,
): Promise<void> => {
  const response = await fetch(`${API_URL}/auth/change-password`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to change password" }));

    throw new Error(error.message || "Failed to change password");
  }
};
