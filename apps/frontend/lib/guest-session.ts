/**
 * Guest session management utilities
 * Handles temporary guest users for game access without full registration
 */

export type GuestSession = {
  id: string;
  username: string;
  createdAt: number;
  expiresAt: number;
};

const GUEST_SESSION_KEY = "whoisit_guest_session";
const GUEST_SESSION_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Generate a simple unique ID for guest sessions
 */
const generateGuestId = (): string => {
  return `guest_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Check if we're running on the client side
 */
const isClient = (): boolean => {
  return typeof window !== "undefined";
};

/**
 * Create a new guest session
 */
export const createGuestSession = (username: string): GuestSession => {
  if (!isClient()) {
    throw new Error("Guest sessions can only be created on the client");
  }

  const now = Date.now();
  const session: GuestSession = {
    id: generateGuestId(),
    username,
    createdAt: now,
    expiresAt: now + GUEST_SESSION_DURATION_MS,
  };

  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));

  return session;
};

/**
 * Get the current guest session if it exists and is valid
 */
export const getGuestSession = (): GuestSession | null => {
  if (!isClient()) {
    return null;
  }

  const sessionData = localStorage.getItem(GUEST_SESSION_KEY);

  if (!sessionData) {
    return null;
  }

  try {
    const session: GuestSession = JSON.parse(sessionData);
    const now = Date.now();

    // Check if session has expired
    if (session.expiresAt < now) {
      clearGuestSession();

      return null;
    }

    return session;
  } catch {
    // Invalid session data
    clearGuestSession();

    return null;
  }
};

/**
 * Clear the current guest session
 */
export const clearGuestSession = (): void => {
  if (!isClient()) {
    return;
  }

  localStorage.removeItem(GUEST_SESSION_KEY);
};

/**
 * Check if a valid guest session exists
 */
export const hasValidGuestSession = (): boolean => {
  return getGuestSession() !== null;
};

/**
 * Update the guest session username
 */
export const updateGuestUsername = (username: string): GuestSession | null => {
  const session = getGuestSession();

  if (!session) {
    return null;
  }

  session.username = username;
  localStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));

  return session;
};
