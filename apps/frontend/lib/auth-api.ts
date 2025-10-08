const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export type RegisterData = {
  email: string;
  username: string;
  password: string;
  displayName: string;
};

export type LoginData = {
  emailOrUsername: string;
  password: string;
};

export type User = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isGuest?: boolean;
};

export type AuthResponse = {
  user: User;
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
