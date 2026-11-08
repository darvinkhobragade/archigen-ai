import { describe, it, expect } from "vitest";
import { relativeTime } from "@/hooks/use-projects";

describe("relativeTime", () => {
  it("formats recent ISO timestamps with suffix", () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const result = relativeTime(fiveMinutesAgo);
    expect(result).toMatch(/ago/);
  });

  it("handles invalid date strings gracefully without throwing", () => {
    expect(relativeTime("not-a-date")).toBe("recently");
  });

  it("formats older dates correctly", () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const result = relativeTime(twoDaysAgo);
    expect(result).toMatch(/days? ago/);
  });
});
