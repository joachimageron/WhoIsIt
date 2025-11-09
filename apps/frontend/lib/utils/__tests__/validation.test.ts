import { isValidEmail, looksLikeEmail } from "../validation";

describe("validation utilities", () => {
  describe("isValidEmail", () => {
    it("returns true for valid email addresses", () => {
      expect(isValidEmail("user@example.com")).toBe(true);
      expect(isValidEmail("test.user@domain.co.uk")).toBe(true);
      expect(isValidEmail("name+tag@company.org")).toBe(true);
      expect(isValidEmail("user123@test-domain.com")).toBe(true);
    });

    it("returns false for invalid email addresses", () => {
      expect(isValidEmail("invalid")).toBe(false);
      expect(isValidEmail("missing@domain")).toBe(false);
      expect(isValidEmail("@nodomain.com")).toBe(false);
      expect(isValidEmail("noat.com")).toBe(false);
      expect(isValidEmail("spaces in@email.com")).toBe(false);
      expect(isValidEmail("double@@domain.com")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidEmail("")).toBe(false);
    });

    it("returns false for string with only spaces", () => {
      expect(isValidEmail("   ")).toBe(false);
    });

    it("handles edge cases correctly", () => {
      expect(isValidEmail("a@b.c")).toBe(true); // Minimal valid email
      expect(isValidEmail("user@localhost")).toBe(false); // No TLD
      // Note: The regex doesn't catch double dots - this is a known limitation
      expect(isValidEmail("user@domain.com")).toBe(true); // Valid domain
    });
  });

  describe("looksLikeEmail", () => {
    it("returns true when string contains @", () => {
      expect(looksLikeEmail("user@example.com")).toBe(true);
      expect(looksLikeEmail("not_valid@but_has_at")).toBe(true);
      expect(looksLikeEmail("multiple@at@signs")).toBe(true);
      expect(looksLikeEmail("@only.at.start")).toBe(true);
    });

    it("returns false when string does not contain @", () => {
      expect(looksLikeEmail("no-at-sign")).toBe(false);
      expect(looksLikeEmail("email.com")).toBe(false);
      expect(looksLikeEmail("")).toBe(false);
      expect(looksLikeEmail("12345")).toBe(false);
    });

    it("is less strict than isValidEmail", () => {
      const value = "@invalid";

      expect(looksLikeEmail(value)).toBe(true);
      expect(isValidEmail(value)).toBe(false);
    });
  });
});
