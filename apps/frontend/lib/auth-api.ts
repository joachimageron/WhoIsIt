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
  emailVerified?: boolean;
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

/**
 * Create a guest user session
 */
export const createGuest = async (): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/guest`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to create guest session" }));

    throw new Error(error.message || "Failed to create guest session");
  }

  const { user }: AuthResponse = await response.json();

  return user;
};

/**
 * Get player statistics
 */
export const getPlayerStats = async (): Promise<PlayerStats> => {
  const response = await fetch(`${API_URL}/auth/profile/stats`, {
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch player stats" }));

    throw new Error(error.message || "Failed to fetch player stats");
  }

  const stats: PlayerStats = await response.json();

  return stats;
};

/**
 * Get game history
 */
export const getGameHistory = async (
  limit: number = 10,
  offset: number = 0,
): Promise<GameHistoryResponse> => {
  const response = await fetch(
    `${API_URL}/auth/profile/game-history?limit=${limit}&offset=${offset}`,
    {
      credentials: "include",
    },
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ message: "Failed to fetch game history" }));

    throw new Error(error.message || "Failed to fetch game history");
  }

  const history: GameHistoryResponse = await response.json();

  return history;
};

export type PlayerStats = {
  gamesPlayed: number;
  gamesWon: number;
  totalQuestions: number;
  totalGuesses: number;
  fastestWinSeconds?: number;
  streak: number;
  winRate: number;
};

export type GameHistoryItem = {
  gameId: string;
  roomCode: string;
  characterSetName: string;
  isWinner: boolean;
  placement: number;
  score: number;
  questionsAsked: number;
  questionsAnswered: number;
  correctGuesses: number;
  incorrectGuesses: number;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  opponentUsername?: string;
};

export type GameHistoryResponse = {
  games: GameHistoryItem[];
  total: number;
};
