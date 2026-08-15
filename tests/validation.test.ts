import { describe, it, expect } from "vitest";

function validateFullName(name: string): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: "Full name cannot be empty" };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: "Full name must be at least 2 characters long" };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: "Full name is too long" };
  }
  return { valid: true };
}

describe("Profile Name Validation QA Rules", () => {
  it("rejects empty string", () => {
    const result = validateFullName("");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Full name cannot be empty");
  });

  it("rejects string with only whitespace or tabs", () => {
    const result = validateFullName("    \t   ");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Full name cannot be empty");
  });

  it("rejects single character name", () => {
    const result = validateFullName("A");
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Full name must be at least 2 characters long");
  });

  it("accepts valid standard full name", () => {
    const result = validateFullName("Darvin Khobragade");
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("accepts names with leading and trailing whitespace after trim", () => {
    const result = validateFullName("   Ar. Maya Lin   ");
    expect(result.valid).toBe(true);
  });

  it("rejects overly long names exceeding 100 characters", () => {
    const overlyLong = "A".repeat(101);
    const result = validateFullName(overlyLong);
    expect(result.valid).toBe(false);
    expect(result.error).toBe("Full name is too long");
  });
});
