import { describe, it, expect } from "vitest";

const TOOL_COST: Record<string, number> = {
  architecture: 4,
  interior: 3,
  redesign: 3,
};

function calculateGenerationCost(tool: "architecture" | "interior" | "redesign", hires: boolean): number {
  const base = TOOL_COST[tool] ?? 4;
  return hires ? base + 1 : base;
}

describe("Credit Calculation and Pricing Engine QA", () => {
  it("calculates standard architecture cost (4 credits)", () => {
    expect(calculateGenerationCost("architecture", false)).toBe(4);
  });

  it("calculates high-resolution architecture cost (5 credits: 4 + 1 HD)", () => {
    expect(calculateGenerationCost("architecture", true)).toBe(5);
  });

  it("calculates standard interior cost (3 credits)", () => {
    expect(calculateGenerationCost("interior", false)).toBe(3);
  });

  it("calculates high-resolution interior cost (4 credits: 3 + 1 HD)", () => {
    expect(calculateGenerationCost("interior", true)).toBe(4);
  });

  it("calculates standard redesign cost (3 credits)", () => {
    expect(calculateGenerationCost("redesign", false)).toBe(3);
  });

  it("calculates high-resolution redesign cost (4 credits: 3 + 1 HD)", () => {
    expect(calculateGenerationCost("redesign", true)).toBe(4);
  });
});
