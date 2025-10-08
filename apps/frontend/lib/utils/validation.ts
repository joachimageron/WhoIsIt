/**
 * Validates if a string is a valid email format
 * @param email - The email string to validate
 * @returns true if valid email format, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(email);
}

/**
 * Checks if a string could be an email (contains @)
 * @param value - The string to check
 * @returns true if the string contains @, false otherwise
 */
export function looksLikeEmail(value: string): boolean {
  return value.includes("@");
}
